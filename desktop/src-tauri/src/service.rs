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
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct EngineConfig {
    /// Gelen sahte RST'leri (port 80/443) çekirdekte düşürür.
    pub pasif_savunma: bool,
    /// QUIC/HTTP3 trafiğini düşürür (tarayıcı TLS'e döner, denetlenebilir).
    pub quic_engelle: bool,
    /// Yerel ağ paylaşımı / Hotspot transit trafiğini de kapsama alır.
    pub lan_share: bool,
}

impl Default for EngineConfig {
    fn default() -> Self {
        Self {
            pasif_savunma: false,
            quic_engelle: false,
            lan_share: false,
        }
    }
}

pub struct Engine {
    pub running: Arc<AtomicBool>,
    pub stats: Arc<Stats>,
    pub profile_id: Mutex<String>,
    pub blacklist: Arc<std::sync::RwLock<anticore_core::config::Blacklist>>,
    /// Motorun başlatıldığı an — arayüz sekme değiştirse/yeniden monte
    /// olsa bile "Çalışma Süresi" burada, tek gerçek kaynakta durur
    /// (önceden yalnızca Dashboard bileşeninin local state'indeydi ve
    /// sekme değişince sıfırlanıyordu).
    started_at: Arc<Mutex<Option<Instant>>>,
    stop_flag: Arc<AtomicBool>,
    worker: Mutex<Option<std::thread::JoinHandle<()>>>,
    #[cfg(windows)]
    active_handles: Arc<Mutex<Vec<Arc<anticore_transport_win::WinDivert>>>>,
    #[cfg(target_os = "macos")]
    active_transport_macos: Arc<Mutex<Option<Arc<anticore_transport_macos::UtunTransport>>>>,
}

impl Engine {
    pub fn new() -> Self {
        Self {
            running: Arc::new(AtomicBool::new(false)),
            stats: Arc::new(Stats::default()),
            profile_id: Mutex::new("universal".into()),
            blacklist: Arc::new(std::sync::RwLock::new(anticore_core::config::Blacklist::default())),
            started_at: Arc::new(Mutex::new(None)),
            stop_flag: Arc::new(AtomicBool::new(false)),
            worker: Mutex::new(None),
            #[cfg(windows)]
            active_handles: Arc::new(Mutex::new(Vec::new())),
            #[cfg(target_os = "macos")]
            active_transport_macos: Arc::new(Mutex::new(None)),
        }
    }

    /// Çalışan motora anında yeni kara listeyi aktarır (motoru yeniden başlatmaya gerek kalmaz).
    pub fn update_blacklist(&self, bl: anticore_core::config::Blacklist) {
        if let Ok(mut lock) = self.blacklist.write() {
            *lock = bl;
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

        let mut worker = self.worker.lock().unwrap();
        if self.running.load(Ordering::SeqCst) {
            return Err("Motor zaten çalışıyor".into());
        }
        if let Some(previous) = worker.take() {
            previous.join().map_err(|_| "Önceki motor iş parçacığı başarısız oldu")?;
        }
        *self.profile_id.lock().unwrap() = profile_id.to_string();
        self.stop_flag.store(false, Ordering::SeqCst);
        self.stats.packets_seen.store(0, Ordering::Relaxed);
        self.stats.packets_touched.store(0, Ordering::Relaxed);
        self.stats.passthrough.store(0, Ordering::Relaxed);

        let running = self.running.clone();
        let stop = self.stop_flag.clone();
        let stats = self.stats.clone();
        let started_at = self.started_at.clone();
        let profile_id = profile_id.to_string();

        // Capture only candidates that the core can inspect (including transit/hotspot if lan_share is active).
        let divert = Arc::new(WinDivert::open(
            &anticore_core::dispatch::capture_filter_with_options(&steps, config.lan_share),
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

        if let Ok(mut lock) = self.blacklist.write() {
            *lock = blacklist;
        }
        let blacklist_ref = self.blacklist.clone();

        *self.active_handles.lock().unwrap() = handles;
        let active_handles = self.active_handles.clone();
        *self.started_at.lock().unwrap() = Some(Instant::now());
        self.running.store(true, Ordering::SeqCst);

        let handle = std::thread::Builder::new().name("anticore-packets".into()).spawn(move || {
            let initial_count = blacklist_ref.read().map(|b| b.len()).unwrap_or(0);
            on_log(format!(
                "[+] motor aktif | profil={profile_id} | {initial_count} hedef domain",
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
                let decision = {
                    let bl_guard = blacklist_ref.read().unwrap();
                    decide_packet(raw, &bl_guard, &steps)
                };
                match decision {
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
            active_handles.lock().unwrap().clear();
            *started_at.lock().unwrap() = None;
            running.store(false, Ordering::SeqCst);
            on_log("[*] motor durduruldu".into());
        });

        match handle {
            Ok(handle) => *worker = Some(handle),
            Err(error) => {
                self.active_handles.lock().unwrap().clear();
                *self.started_at.lock().unwrap() = None;
                self.running.store(false, Ordering::SeqCst);
                return Err(format!("Motor iş parçacığı başlatılamadı: {error}"));
            }
        }
        Ok(())
    }

    #[cfg(target_os = "macos")]
    pub fn start(
        &self,
        profile_id: &str,
        blacklist: anticore_core::config::Blacklist,
        steps: Vec<anticore_core::strategy::Step>,
        config: &EngineConfig,
        _dll_dir: Option<std::path::PathBuf>,
        on_log: impl Fn(String) + Send + 'static,
    ) -> Result<(), String> {
        use anticore_core::dispatch::{decide_packet, PacketDecision, PassthroughReason};
        use anticore_core::transport::PacketTransport;
        use anticore_transport_macos::UtunTransport;

        let mut worker = self.worker.lock().unwrap();
        if self.running.load(Ordering::SeqCst) {
            return Err("Motor zaten çalışıyor".into());
        }
        if let Some(previous) = worker.take() {
            previous.join().map_err(|_| "Önceki motor iş parçacığı başarısız oldu")?;
        }
        *self.profile_id.lock().unwrap() = profile_id.to_string();
        self.stop_flag.store(false, Ordering::SeqCst);
        self.stats.packets_seen.store(0, Ordering::Relaxed);
        self.stats.packets_touched.store(0, Ordering::Relaxed);
        self.stats.passthrough.store(0, Ordering::Relaxed);

        let running = self.running.clone();
        let stop = self.stop_flag.clone();
        let stats = self.stats.clone();
        let started_at = self.started_at.clone();
        let profile_id = profile_id.to_string();

        let transport = Arc::new(UtunTransport::open(config.pasif_savunma, config.quic_engelle)?);
        *self.active_transport_macos.lock().unwrap() = Some(transport.clone());
        let active_transport = self.active_transport_macos.clone();

        if let Ok(mut lock) = self.blacklist.write() {
            *lock = blacklist;
        }
        let blacklist_ref = self.blacklist.clone();

        *self.started_at.lock().unwrap() = Some(Instant::now());
        self.running.store(true, Ordering::SeqCst);

        let transport_for_thread = transport.clone();
        let handle = std::thread::Builder::new().name("anticore-packets-macos".into()).spawn(move || {
            let initial_count = blacklist_ref.read().map(|b| b.len()).unwrap_or(0);
            on_log(format!(
                "[+] macOS motoru aktif | profil={profile_id} | {initial_count} hedef domain",
            ));
            let mut buf = vec![0u8; 65_535];
            let mut consecutive_errors = 0u32;
            loop {
                if stop.load(Ordering::SeqCst) {
                    break;
                }
                let Some((n, meta)) = transport_for_thread.recv(&mut buf) else {
                    consecutive_errors += 1;
                    if consecutive_errors > 100 {
                        on_log("[!] utun arabirim bağlantısı koptu (ardışık 100 recv hatası)".into());
                        break;
                    }
                    std::thread::sleep(std::time::Duration::from_millis(50));
                    continue;
                };
                consecutive_errors = 0;
                stats.packets_seen.fetch_add(1, Ordering::Relaxed);

                let raw = &buf[..n];
                let decision = {
                    let bl_guard = blacklist_ref.read().unwrap();
                    decide_packet(raw, &bl_guard, &steps)
                };
                match decision {
                    PacketDecision::Passthrough(reason) => {
                        let _ = transport_for_thread.send(raw, &meta);
                        if matches!(reason, PassthroughReason::TooLarge | PassthroughReason::NotTargeted) {
                            stats.passthrough.fetch_add(1, Ordering::Relaxed);
                        }
                    }
                    PacketDecision::Rewrite(segments) => {
                        let mut ok = true;
                        for seg in &segments {
                            if transport_for_thread.send(seg, &meta).is_err() {
                                ok = false;
                                break;
                            }
                        }
                        if ok {
                            stats.packets_touched.fetch_add(1, Ordering::Relaxed);
                        }
                    }
                }
            }
            if let Some(t) = active_transport.lock().unwrap().take() {
                t.close();
            }
            *started_at.lock().unwrap() = None;
            running.store(false, Ordering::SeqCst);
            on_log("[*] macOS motoru durduruldu ve pfctl kuralları temizlendi".into());
        });

        match handle {
            Ok(handle) => *worker = Some(handle),
            Err(error) => {
                if let Some(t) = self.active_transport_macos.lock().unwrap().take() {
                    t.close();
                }
                *self.started_at.lock().unwrap() = None;
                self.running.store(false, Ordering::SeqCst);
                return Err(format!("Motor iş parçacığı başlatılamadı: {error}"));
            }
        }
        Ok(())
    }

    #[cfg(not(any(windows, target_os = "macos")))]
    pub fn start(
        &self,
        _p: &str,
        _b: anticore_core::config::Blacklist,
        _s: Vec<anticore_core::strategy::Step>,
        _c: &EngineConfig,
        _d: Option<std::path::PathBuf>,
        _l: impl Fn(String) + Send + 'static,
    ) -> Result<(), String> {
        Err("Canlı mod bu platformda desteklenmiyor".into())
    }

    /// Stop capture, drain the queue, join the worker, then release handles.
    #[cfg(windows)]
    pub fn stop(&self) -> Result<(), String> {
        let mut worker = self.worker.lock().unwrap();
        if worker.is_none() {
            return Err("Motor zaten durdurulmuş".into());
        }
        self.stop_flag.store(true, Ordering::SeqCst);
        {
            let handles = self.active_handles.lock().unwrap();
            if let Some(main) = handles.first() {
                main.shutdown()?;
            }
        }
        if let Some(h) = worker.take() {
            h.join().map_err(|_| "Motor iş parçacığı başarısız oldu")?;
        }
        Ok(())
    }

    #[cfg(target_os = "macos")]
    pub fn stop(&self) -> Result<(), String> {
        let mut worker = self.worker.lock().unwrap();
        if worker.is_none() {
            return Err("Motor zaten durdurulmuş".into());
        }
        self.stop_flag.store(true, Ordering::SeqCst);
        if let Some(t) = self.active_transport_macos.lock().unwrap().take() {
            t.close();
        }
        if let Some(h) = worker.take() {
            h.join().map_err(|_| "Motor iş parçacığı başarısız oldu")?;
        }
        Ok(())
    }

    #[cfg(not(any(windows, target_os = "macos")))]
    pub fn stop(&self) -> Result<(), String> {
        Err("Motor çalışmıyor".into())
    }
}
