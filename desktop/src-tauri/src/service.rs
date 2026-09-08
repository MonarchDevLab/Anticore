//! Motor yaşam döngüsü: paket döngüsünü ayrı thread'de yönetir,
//! log/istatistik akışını arayüze event olarak iletir.

use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use std::path::Path;

const MAX_LOG_SIZE: u64 = 5 * 1024 * 1024; // 5 MB

/// ISO-8601 UTC zaman damgası üretir (harici crate olmadan).
pub fn format_iso8601_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let total_secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let secs = total_secs % 60;
    let total_mins = total_secs / 60;
    let mins = total_mins % 60;
    let total_hours = total_mins / 60;
    let hours = total_hours % 24;
    let mut days = (total_hours / 24) as i64;

    let mut year = 1970;
    loop {
        let leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
        let days_in_year = if leap { 366 } else { 365 };
        if days >= days_in_year {
            days -= days_in_year;
            year += 1;
        } else {
            break;
        }
    }

    let leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
    let month_days = [
        31,
        if leap { 29 } else { 28 },
        31, 30, 31, 30, 31, 31, 30, 31, 30, 31, 30, 31,
    ];
    let mut month = 1;
    for &d in &month_days {
        if days >= d {
            days -= d;
            month += 1;
        } else {
            break;
        }
    }
    let day = days + 1;

    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        year, month, day, hours, mins, secs
    )
}

/// 5 MB rotasyonlu log dosyası yazıcı.
pub fn write_rotated_log(log_path: &Path, line: &str) {
    use std::io::Write;
    let formatted_line = format!("[{}] {}\n", format_iso8601_now(), line);

    if let Ok(metadata) = std::fs::metadata(log_path) {
        if metadata.len() >= MAX_LOG_SIZE {
            let backup_path = log_path.with_extension("log.1");
            let _ = std::fs::remove_file(&backup_path);
            let _ = std::fs::rename(log_path, &backup_path);
        }
    }

    if let Ok(mut f) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path)
    {
        let _ = f.write_all(formatted_line.as_bytes());
    }
}

#[derive(Debug, Default)]
pub struct Stats {
    pub packets_seen: AtomicU64,
    pub packets_touched: AtomicU64,
    pub passthrough: AtomicU64,
}

/// Motor çalışma yapılandırması.
#[derive(Debug, Clone)]
pub struct EngineConfig {
    /// Gelen sahte RST'leri (port 80/443) çekirdekte düşürür.
    pub pasif_savunma: bool,
    /// QUIC/HTTP3 trafiğini düşürür (tarayıcı TLS'e döner, denetlenebilir).
    pub quic_engelle: bool,
}

impl Default for EngineConfig {
    fn default() -> Self {
        Self {
            pasif_savunma: true,
            quic_engelle: false,
        }
    }
}

pub struct Engine {
    pub running: Arc<AtomicBool>,
    pub stats: Arc<Stats>,
    pub profile_id: Mutex<String>,
    /// Motorun başlatıldığı an — arayüz sekme değiştirse/yeniden monte
    /// olsa bile "Çalışma Süresi" burada, tek gerçek kaynakta durur
    /// (önceden yalnızca Dashboard bileşeninin local state'indeydi ve
    /// sekme değişince sıfırlanıyordu).
    started_at: Arc<Mutex<Option<Instant>>>,
    stop_flag: Arc<AtomicBool>,
    worker: Mutex<Option<std::thread::JoinHandle<()>>>,
    #[cfg(windows)]
    active_handles: Mutex<Vec<Arc<anticore_transport_win::WinDivert>>>,
}

impl Engine {
    pub fn new() -> Self {
        Self {
            running: Arc::new(AtomicBool::new(false)),
            stats: Arc::new(Stats::default()),
            profile_id: Mutex::new("universal".into()),
            started_at: Arc::new(Mutex::new(None)),
            stop_flag: Arc::new(AtomicBool::new(false)),
            worker: Mutex::new(None),
            #[cfg(windows)]
            active_handles: Mutex::new(Vec::new()),
        }
    }

    /// Motor çalışıyorsa geçen saniye sayısı; durmuşsa 0.
    pub fn uptime_sec(&self) -> u64 {
        self.started_at
            .lock()
            .unwrap()
            .map(|t| t.elapsed().as_secs())
            .unwrap_or(0)
    }

    /// Motoru verilen profil ile başlatır. Zaten çalışıyorsa hata döner.
    #[cfg(windows)]
    pub fn start(
        &self,
        profile_id: &str,
        blacklist: anticore_core::config::Blacklist,
        steps: Vec<anticore_core::strategy::Step>,
        config: &EngineConfig,
        dll_dir: Option<std::path::PathBuf>,
        on_log: impl Fn(String) + Send + 'static,
    ) -> Result<(), String> {
        use anticore_transport_win::WinDivert;

        if self.running.load(Ordering::SeqCst) {
            return Err("Motor zaten çalışıyor".into());
        }
        *self.profile_id.lock().unwrap() = profile_id.to_string();
        self.stop_flag.store(false, Ordering::SeqCst);
        self.stats.packets_seen.store(0, Ordering::Relaxed);
        self.stats.packets_touched.store(0, Ordering::Relaxed);
        self.stats.passthrough.store(0, Ordering::Relaxed);
        *self.started_at.lock().unwrap() = Some(Instant::now());

        let running = self.running.clone();
        let stop = self.stop_flag.clone();
        let stats = self.stats.clone();
        let started_at = self.started_at.clone();
        let profile_id = profile_id.to_string();

        // Ana handle: outbound 80/443 trafiğini userspace'e taşır
        let divert = Arc::new(WinDivert::open(
            "outbound and tcp and !loopback and !impostor and (tcp.DstPort == 443 or tcp.DstPort == 80)",
            dll_dir.as_deref(),
        )?);

        let mut handles = vec![divert.clone()];

        // Pasif savunma: sahte RST'ler (port 80/443) çekirdekte düşer.
        // DROP handle'ı recv gerektirmez; açık kaldığı sürece filtre etkindir.
        if config.pasif_savunma {
            match WinDivert::open_with_flags(
                "inbound and tcp and !loopback and (tcp.SrcPort == 443 or tcp.SrcPort == 80) and tcp.Rst",
                dll_dir.as_deref(),
                anticore_transport_win::WINDIVERT_FLAG_DROP,
            ) {
                Ok(h) => {
                    handles.push(Arc::new(h));
                    on_log("[+] pasif savunma etkin: sahte RST'ler düşürülüyor".into());
                }
                Err(e) => on_log(format!("[!] pasif savunma açılamadı: {e}")),
            }
        }

        // QUIC engelleme: HTTP/3'ü düşürür → tarayıcı TLS'e döner.
        if config.quic_engelle {
            match WinDivert::open_with_flags(
                "outbound and udp and udp.DstPort == 443 and udp.PayloadLength >= 1200",
                dll_dir.as_deref(),
                anticore_transport_win::WINDIVERT_FLAG_DROP,
            ) {
                Ok(h) => {
                    handles.push(Arc::new(h));
                    on_log("[+] QUIC engelleme etkin: UDP/443 düşürülüyor".into());
                }
                Err(e) => on_log(format!("[!] QUIC engelleme açılamadı: {e}")),
            }
        }

        *self.active_handles.lock().unwrap() = handles;

        let handle = std::thread::spawn(move || {
            on_log(format!(
                "[+] motor aktif | profil={profile_id} | {} hedef domain",
                blacklist.len()
            ));
            let mut buf = vec![0u8; 65_535];
            let mut consecutive_recv_errors = 0u32;
            loop {
                let Some((n, addr)) = divert.recv(&mut buf) else {
                    if stop.load(Ordering::SeqCst) {
                        break;
                    }
                    consecutive_recv_errors += 1;
                    if consecutive_recv_errors > 100 {
                        on_log("[!] WinDivert sürücü bağlantısı kesildi (ardışık 100 recv hatası)".into());
                        break;
                    }
                    std::thread::sleep(std::time::Duration::from_millis(50));
                    continue;
                };
                consecutive_recv_errors = 0;
                stats.packets_seen.fetch_add(1, Ordering::Relaxed);

                let raw = &buf[..n];
                use anticore_core::dispatch::{decide_packet, PacketDecision, PassthroughReason};
                match decide_packet(raw, &blacklist, &steps) {
                    PacketDecision::Passthrough(reason) => {
                        let _ = divert.send(raw, &addr);
                        if matches!(reason, PassthroughReason::TooLarge | PassthroughReason::NotTargeted) {
                            stats.passthrough.fetch_add(1, Ordering::Relaxed);
                        }
                    }
                    PacketDecision::Rewrite(segments) => {
                        let mut ok = true;
                        for seg in &segments {
                            if !divert.send(seg, &addr) {
                                ok = false;
                                break;
                            }
                        }
                        if ok {
                            stats.packets_touched.fetch_add(1, Ordering::Relaxed);
                        }
                        // ponytail: enjeksiyon yarıda kaldıysa orijinali yollama —
                        // TCP state bozulur, DPI uyanır. Paket drop edilir; TCP
                        // yeniden deneme mekanizması bağlantıyı kurtarır.
                    }
                }
            }
            running.store(false, Ordering::SeqCst);
            *started_at.lock().unwrap() = None;
            on_log("[*] motor durduruldu".into());
        });

        *self.worker.lock().unwrap() = Some(handle);
        self.running.store(true, Ordering::SeqCst);
        Ok(())
    }

    #[cfg(not(windows))]
    pub fn start(
        &self,
        _p: &str,
        _b: anticore_core::config::Blacklist,
        _s: Vec<anticore_core::strategy::Step>,
        _c: &EngineConfig,
        _d: Option<std::path::PathBuf>,
        _l: impl Fn(String) + Send + 'static,
    ) -> Result<(), String> {
        Err("Canlı mod bu platformda henüz desteklenmiyor (Faz 4)".into())
    }

    /// Motoru durdurur: tüm handle'lar kapatılarak bloklu recv kırılır.
    #[cfg(windows)]
    pub fn stop(&self) -> Result<(), String> {
        if !self.running.load(Ordering::SeqCst) {
            return Err("Motor zaten durdurulmuş".into());
        }
        self.stop_flag.store(true, Ordering::SeqCst);
        let handles: Vec<_> = self.active_handles.lock().unwrap().drain(..).collect();
        for h in handles {
            h.shutdown(); // recv anında false döner → thread çıkar
        }
        if let Some(h) = self.worker.lock().unwrap().take() {
            let _ = h.join();
        }
        Ok(())
    }

    #[cfg(not(windows))]
    pub fn stop(&self) -> Result<(), String> {
        Err("Motor çalışmıyor".into())
    }
}
