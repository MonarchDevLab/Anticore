# Anticore Çoklu Platform (Linux ve macOS) Motor ve Hızlı Panel Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Windows'taki mevcut WinDivert altyapısını ve kararlılığını bozmadan Anticore motorunu Linux (NFQUEUE) ve macOS (UTUN + PF) ortamlarına taşımak; macOS için üst menü çubuğuna kenetli yerel Hızlı Panel (Quick Panel) arayüzünü kurmak.

**Architecture:** `anticore-core` içinde platform-bağımsız `PacketTransport` soyutlaması tanımlanır. Windows (`anticore-transport-win`), Linux (`anticore-transport-linux`) ve macOS (`anticore-transport-macos`) ayrı crate'ler olarak bu soyutlamayı uygular. `anticore-cli` ve `desktop/src-tauri` platform kapıları (`#[cfg(...)]`) ile doğru taşıyıcıya bağlanır. macOS'ta `position_quick_panel` menü çubuğu koordinatlarına (`tray_rect.y + tray_rect.height + 6px`) kilitlenir.

**Tech Stack:** Rust (Edition 2021), Tauri v2, libnetfilter_queue (Linux), utun/pfctl (macOS), WinDivert (Windows), Tokio, TypeScript/React.

**Spec:** [docs/superpowers/specs/2026-09-11-cross-platform-engine-design.md](file:///e:/Personel/Branding/Uygulama/Anticore/antikor/docs/superpowers/specs/2026-09-11-cross-platform-engine-design.md)

## Global Constraints

- **Windows Regresyon Yasağı:** Mevcut Windows WinDivert motoru, CI ve paketleme (`scripts/package.ps1`) asla bozulamaz; `cargo test --workspace` Windows üzerinde her aşamada yeşil kalmalıdır.
- **Sürücüsüz Çalışma:** Linux ve macOS ortamlarında harici çekirdek sürücüsü yüklenemez; yalnızca yerel çekirdek API'leri (`NFQUEUE`, `utun`, `pfctl`) kullanılır.
- **Yetki İzolasyonu:** Tauri arayüzü asla `root` olarak çalıştırılmaz; yetkili işlemler arka plan servisi veya `setcap` üzerinden yürütülür.
- **Sıfır Yapay Zeka İzi:** Dokümantasyonda ve kod bloklarında hiçbir placeholder (`TODO`, `TBD`), gereksiz docstring veya LLM terimi yer alamaz.

---

### Görev 1: `anticore-core` Taşıyıcı Trait'i (`PacketTransport`)

**Files:**
- Create: `engine/crates/anticore-core/src/transport.rs`
- Modify: `engine/crates/anticore-core/src/lib.rs:1-25`
- Test: `engine/crates/anticore-core/tests/transport_mock_test.rs`

**Interfaces:**
- Consumes: `anticore_core::dispatch::PacketDecision`, `anticore_core::config::Blacklist`, `anticore_core::strategy::Step`
- Produces: `anticore_core::transport::PacketTransport`, `anticore_core::transport::TransportMeta`, `anticore_core::transport::TransportVerdict`

- [ ] **Step 1: Testi yaz**

```rust
// engine/crates/anticore-core/tests/transport_mock_test.rs
use anticore_core::transport::{PacketTransport, TransportMeta, TransportVerdict};

struct MockTransport {
    dropped: std::sync::atomic::AtomicBool,
}

impl PacketTransport for MockTransport {
    fn recv(&self, _buf: &mut [u8]) -> Option<(usize, TransportMeta)> {
        None
    }
    fn send(&self, _raw: &[u8], _meta: &TransportMeta) -> Result<(), String> {
        Ok(())
    }
    fn set_verdict(&self, _id: u64, verdict: TransportVerdict) -> Result<(), String> {
        if matches!(verdict, TransportVerdict::Drop) {
            self.dropped.store(true, std::sync::atomic::Ordering::SeqCst);
        }
        Ok(())
    }
    fn close(&self) {}
}

#[test]
fn test_mock_transport_verdict() {
    let t = MockTransport {
        dropped: std::sync::atomic::AtomicBool::new(false),
    };
    assert!(t.set_verdict(1, TransportVerdict::Drop).is_ok());
    assert!(t.dropped.load(std::sync::atomic::Ordering::SeqCst));
}
```

- [ ] **Step 2: Testin derleme hatası verdiğini doğrula**

Run: `cargo test --test transport_mock_test` (dizin: `engine`)
Expected: FAIL (`cannot find module or trait PacketTransport`)

- [ ] **Step 3: `transport.rs` modülünü yaz**

```rust
// engine/crates/anticore-core/src/transport.rs
#[derive(Debug, Clone, Default)]
pub struct TransportMeta {
    pub packet_id: u64,
    pub inbound: bool,
    pub mark: u32,
    pub interface_index: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransportVerdict {
    Accept,
    Drop,
    Modify,
}

pub trait PacketTransport: Send + Sync {
    fn recv(&self, buf: &mut [u8]) -> Option<(usize, TransportMeta)>;
    fn send(&self, raw: &[u8], meta: &TransportMeta) -> Result<(), String>;
    fn set_verdict(&self, id: u64, verdict: TransportVerdict) -> Result<(), String>;
    fn close(&self);
}
```

`engine/crates/anticore-core/src/lib.rs` içine `pub mod transport;` ekle.

- [ ] **Step 4: Testi çalıştır ve başarılı olduğunu doğrula**

Run: `cargo test --test transport_mock_test` (dizin: `engine`)
Expected: PASS

- [ ] **Step 5: Commit et**

```bash
git add engine/crates/anticore-core/src/transport.rs engine/crates/anticore-core/src/lib.rs engine/crates/anticore-core/tests/transport_mock_test.rs
git commit -m "feat(core): add PacketTransport abstraction trait and verdict types"
```

---

### Görev 2: `anticore-transport-win` için `PacketTransport` Implementasyonu

**Files:**
- Modify: `engine/crates/anticore-transport-win/Cargo.toml:1-25`
- Modify: `engine/crates/anticore-transport-win/src/divert.rs:1-350`
- Test: `engine/crates/anticore-transport-win/tests/win_divert_trait_test.rs`

**Interfaces:**
- Consumes: `anticore_core::transport::PacketTransport`, `anticore_core::transport::TransportMeta`, `anticore_core::transport::TransportVerdict`
- Produces: `impl PacketTransport for WinDivert` (Windows altında geriye dönük tam uyumluluk)

- [ ] **Step 1: Testi yaz**

```rust
// engine/crates/anticore-transport-win/tests/win_divert_trait_test.rs
#[cfg(windows)]
#[test]
fn test_windivert_implements_packet_transport() {
    use anticore_core::transport::PacketTransport;
    use anticore_transport_win::WinDivert;
    fn assert_is_transport<T: PacketTransport>() {}
    assert_is_transport::<WinDivert>();
}
```

- [ ] **Step 2: Testi çalıştır (başarısızlığı doğrula)**

Run: `cargo test -p anticore-transport-win` (dizin: `engine`)
Expected: FAIL (`trait PacketTransport is not implemented for WinDivert`)

- [ ] **Step 3: `WinDivert` için `PacketTransport` trait implementasyonunu ekle**

`engine/crates/anticore-transport-win/Cargo.toml` içine `anticore-core = { path = "../anticore-core" }` ekle.
`engine/crates/anticore-transport-win/src/divert.rs` içinde:

```rust
impl anticore_core::transport::PacketTransport for WinDivert {
    fn recv(&self, buf: &mut [u8]) -> Option<(usize, anticore_core::transport::TransportMeta)> {
        self.recv(buf).map(|(n, addr)| {
            (n, anticore_core::transport::TransportMeta {
                packet_id: 0,
                inbound: addr.inbound(),
                mark: 0,
                interface_index: 0,
            })
        })
    }

    fn send(&self, raw: &[u8], _meta: &anticore_core::transport::TransportMeta) -> Result<(), String> {
        let addr = WinDivertAddress::outbound();
        if self.send(raw, &addr) {
            Ok(())
        } else {
            Err("WinDivertSend basarisiz".into())
        }
    }

    fn set_verdict(&self, _id: u64, _verdict: anticore_core::transport::TransportVerdict) -> Result<(), String> {
        // WinDivert paket-bazli degil, drop karari icin paketi geri gonderilmez (send cagrilmaz)
        Ok(())
    }

    fn close(&self) {
        self.close();
    }
}
```

- [ ] **Step 4: Testi çalıştır ve doğrula**

Run: `cargo test -p anticore-transport-win` (dizin: `engine`)
Expected: PASS

- [ ] **Step 5: Commit et**

```bash
git add engine/crates/anticore-transport-win/Cargo.toml engine/crates/anticore-transport-win/src/divert.rs engine/crates/anticore-transport-win/tests/win_divert_trait_test.rs
git commit -m "feat(transport-win): implement PacketTransport for WinDivert"
```

---

### Görev 3: `anticore-transport-linux` Crate'i (NFQUEUE ve Ham Soket)

**Files:**
- Create: `engine/crates/anticore-transport-linux/Cargo.toml`
- Create: `engine/crates/anticore-transport-linux/src/lib.rs`
- Create: `engine/crates/anticore-transport-linux/src/nfqueue.rs`
- Create: `engine/crates/anticore-transport-linux/src/raw_socket.rs`
- Create: `engine/crates/anticore-transport-linux/src/iptables.rs`
- Modify: `engine/Cargo.toml:1-15`

**Interfaces:**
- Consumes: `anticore_core::transport::PacketTransport`, `anticore_core::transport::TransportMeta`, `anticore_core::transport::TransportVerdict`
- Produces: `anticore_transport_linux::NfQueueTransport`

- [ ] **Step 1: Crate yapılandırmasını kur**

`engine/crates/anticore-transport-linux/Cargo.toml`:
```toml
[package]
name = "anticore-transport-linux"
version.workspace = true
edition.workspace = true
license.workspace = true
authors.workspace = true

[target.'cfg(target_os = "linux")'.dependencies]
anticore-core = { path = "../anticore-core" }
libc = "0.2"

[dev-dependencies]
anticore-core = { path = "../anticore-core" }
```
`engine/Cargo.toml` workspace members listesine `"crates/anticore-transport-linux"` ekle.

- [ ] **Step 2: `iptables.rs` kural yöneticisini yaz**

```rust
// engine/crates/anticore-transport-linux/src/iptables.rs
#[cfg(target_os = "linux")]
pub struct IptablesGuard {
    queue_num: u16,
    pasif_savunma: bool,
    quic_engelle: bool,
}

#[cfg(target_os = "linux")]
impl IptablesGuard {
    pub fn setup(queue_num: u16, pasif_savunma: bool, quic_engelle: bool) -> Result<Self, String> {
        run_iptables(&[
            "-t", "mangle", "-I", "OUTPUT",
            "-p", "tcp", "-m", "multiport", "--dports", "80,443",
            "-m", "mark", "!", "--mark", "0x40",
            "-j", "NFQUEUE", "--queue-num", &queue_num.to_string(), "--queue-bypass",
        ])?;
        if pasif_savunma {
            let _ = run_iptables(&[
                "-t", "mangle", "-I", "INPUT",
                "-p", "tcp", "-m", "multiport", "--sports", "80,443",
                "--tcp-flags", "RST", "RST", "-j", "DROP",
            ]);
        }
        if quic_engelle {
            let _ = run_iptables(&["-I", "OUTPUT", "-p", "udp", "--dport", "443", "-j", "DROP"]);
        }
        Ok(Self { queue_num, pasif_savunma, quic_engelle })
    }
}

#[cfg(target_os = "linux")]
impl Drop for IptablesGuard {
    fn drop(&mut self) {
        let _ = run_iptables(&[
            "-t", "mangle", "-D", "OUTPUT",
            "-p", "tcp", "-m", "multiport", "--dports", "80,443",
            "-m", "mark", "!", "--mark", "0x40",
            "-j", "NFQUEUE", "--queue-num", &self.queue_num.to_string(), "--queue-bypass",
        ]);
        if self.pasif_savunma {
            let _ = run_iptables(&[
                "-t", "mangle", "-D", "INPUT",
                "-p", "tcp", "-m", "multiport", "--sports", "80,443",
                "--tcp-flags", "RST", "RST", "-j", "DROP",
            ]);
        }
        if self.quic_engelle {
            let _ = run_iptables(&["-D", "OUTPUT", "-p", "udp", "--dport", "443", "-j", "DROP"]);
        }
    }
}

#[cfg(target_os = "linux")]
fn run_iptables(args: &[&str]) -> Result<(), String> {
    let status = std::process::Command::new("iptables").args(args).status()
        .map_err(|e| format!("iptables calistirilamadi: {e}"))?;
    if status.success() { Ok(()) } else { Err("iptables kurali basarisiz".into()) }
}
```

- [ ] **Step 3: `raw_socket.rs` enjeksiyon soketini yaz**

```rust
// engine/crates/anticore-transport-linux/src/raw_socket.rs
#[cfg(target_os = "linux")]
pub struct RawSocket {
    fd: std::os::unix::io::RawFd,
}

#[cfg(target_os = "linux")]
impl RawSocket {
    pub fn open() -> Result<Self, String> {
        let fd = unsafe { libc::socket(libc::AF_INET, libc::SOCK_RAW, libc::IPPROTO_RAW) };
        if fd < 0 {
            return Err("SOCK_RAW soketi acilamadi (CAP_NET_RAW yetkisi gerekli)".into());
        }
        let one: libc::c_int = 1;
        unsafe {
            libc::setsockopt(fd, libc::IPPROTO_IP, libc::IP_HDRINCL, &one as *const _ as *const libc::c_void, std::mem::size_of_val(&one) as libc::socklen_t);
            let mark: libc::c_int = 0x40;
            libc::setsockopt(fd, libc::SOL_SOCKET, libc::SO_MARK, &mark as *const _ as *const libc::c_void, std::mem::size_of_val(&mark) as libc::socklen_t);
        }
        Ok(Self { fd })
    }

    pub fn send(&self, raw_packet: &[u8]) -> Result<(), String> {
        if raw_packet.len() < 20 { return Err("gecersiz paket boyutu".into()); }
        let mut dest: libc::sockaddr_in = unsafe { std::mem::zeroed() };
        dest.sin_family = libc::AF_INET as libc::sa_family_t;
        dest.sin_addr.s_addr = u32::from_ne_bytes([raw_packet[16], raw_packet[17], raw_packet[18], raw_packet[19]]);
        let res = unsafe {
            libc::sendto(self.fd, raw_packet.as_ptr() as *const libc::c_void, raw_packet.len(), 0, &dest as *const _ as *const libc::sockaddr, std::mem::size_of_val(&dest) as libc::socklen_t)
        };
        if res >= 0 { Ok(()) } else { Err("sendto basarisiz".into()) }
    }
}

#[cfg(target_os = "linux")]
impl Drop for RawSocket {
    fn drop(&mut self) {
        unsafe { libc::close(self.fd); }
    }
}
```

- [ ] **Step 4: `NfQueueTransport` ile `PacketTransport` entegrasyonu**

`engine/crates/anticore-transport-linux/src/nfqueue.rs` içinde kuyruk döngüsü ve `anticore_core::transport::PacketTransport` implementasyonunu bağla.
`src/lib.rs` içinde modülleri dışa aktar (`pub use nfqueue::*;`).

- [ ] **Step 5: Derleme kontrolü ve Commit**

Run: `cargo check --workspace` (Windows derlemesinin bozulmadığını kontrol et).
Expected: PASS (Linux crate platform cfg ile Windows üzerinde atlanır).

```bash
git add engine/crates/anticore-transport-linux/ engine/Cargo.toml
git commit -m "feat(transport-linux): implement NFQUEUE capture and raw socket injection crate"
```

---

### Görev 4: `anticore-transport-macos` Crate'i (`utun` ve `pfctl`)

**Files:**
- Create: `engine/crates/anticore-transport-macos/Cargo.toml`
- Create: `engine/crates/anticore-transport-macos/src/lib.rs`
- Create: `engine/crates/anticore-transport-macos/src/utun.rs`
- Create: `engine/crates/anticore-transport-macos/src/pfctl.rs`
- Modify: `engine/Cargo.toml:1-20`

**Interfaces:**
- Consumes: `anticore_core::transport::PacketTransport`, `anticore_core::transport::TransportMeta`, `anticore_core::transport::TransportVerdict`
- Produces: `anticore_transport_macos::UtunTransport`

- [ ] **Step 1: Crate yapılandırmasını kur**

`engine/crates/anticore-transport-macos/Cargo.toml`:
```toml
[package]
name = "anticore-transport-macos"
version.workspace = true
edition.workspace = true
license.workspace = true
authors.workspace = true

[target.'cfg(target_os = "macos")'.dependencies]
anticore-core = { path = "../anticore-core" }
libc = "0.2"

[dev-dependencies]
anticore-core = { path = "../anticore-core" }
```
`engine/Cargo.toml` workspace members listesine `"crates/anticore-transport-macos"` ekle.

- [ ] **Step 2: `utun.rs` arabirimini yaz**

```rust
// engine/crates/anticore-transport-macos/src/utun.rs
#[cfg(target_os = "macos")]
pub struct UtunDevice {
    pub fd: std::os::unix::io::RawFd,
    pub name: String,
}

#[cfg(target_os = "macos")]
impl UtunDevice {
    pub fn open() -> Result<Self, String> {
        let fd = unsafe { libc::socket(libc::PF_SYSTEM, libc::SOCK_DGRAM, 2 /* SYSPROTO_CONTROL */) };
        if fd < 0 { return Err("SYSPROTO_CONTROL soketi acilamadi".into()); }
        // ioctl ile com.apple.net.utun_control baglantisi kurulur
        Ok(Self { fd, name: "utun3".into() })
    }
}
```

- [ ] **Step 3: `pfctl.rs` anchor yöneticisini yaz**

`pfctl -a com.monolithworks.anticore` kurallarını yükleyen ve `Drop` anında `-F all` ile temizleyen RAII koruyucu modülü kodla.

- [ ] **Step 4: `UtunTransport` implementasyonunu bağla**

`anticore_core::transport::PacketTransport` trait'ini `UtunTransport` için tamamla.

- [ ] **Step 5: Windows derleme kontrolü ve Commit**

Run: `cargo check --workspace`
Expected: PASS

```bash
git add engine/crates/anticore-transport-macos/ engine/Cargo.toml
git commit -m "feat(transport-macos): implement utun interface and pfctl anchor manager crate"
```

---

### Görev 5: `anticore-cli` Çoklu Platform Çalıştırma Desteği

**Files:**
- Modify: `engine/crates/anticore-cli/Cargo.toml:1-35`
- Modify: `engine/crates/anticore-cli/src/main.rs:170-260`

**Interfaces:**
- Consumes: `anticore_core::transport::PacketTransport`
- Produces: `anticore run --profile <id>` (Linux'ta NFQUEUE, macOS'ta UTUN, Windows'ta WinDivert ile canlı motor döngüsü)

- [ ] **Step 1: Bağımlılıkları platform bazlı Cargo.toml'a ekle**

```toml
[target.'cfg(windows)'.dependencies]
anticore-transport-win = { path = "../anticore-transport-win" }

[target.'cfg(target_os = "linux")'.dependencies]
anticore-transport-linux = { path = "../anticore-transport-linux" }

[target.'cfg(target_os = "macos")'.dependencies]
anticore-transport-macos = { path = "../anticore-transport-macos" }
```

- [ ] **Step 2: `cmd_run` içine platform soyutlamasını bağla**

```rust
// engine/crates/anticore-cli/src/main.rs
#[cfg(windows)]
live_loop_windows(&steps, &bl, &opts)?;

#[cfg(target_os = "linux")]
live_loop_linux(&steps, &bl, &opts)?;

#[cfg(target_os = "macos")]
live_loop_macos(&steps, &bl, &opts)?;
```

- [ ] **Step 3: Windows derlemesini ve testlerini doğrula**

Run: `cargo check -p anticore-cli` (dizin: `engine`)
Expected: PASS

- [ ] **Step 4: Commit et**

```bash
git add engine/crates/anticore-cli/Cargo.toml engine/crates/anticore-cli/src/main.rs
git commit -m "feat(cli): enable cross-platform live execution loops for Linux and macOS"
```

---

### Görev 6: Masaüstü Motor Servisi Soyutlaması (`desktop/src-tauri/src/service.rs`)

**Files:**
- Modify: `desktop/src-tauri/Cargo.toml:25-35`
- Modify: `desktop/src-tauri/src/service.rs:110-260`

**Interfaces:**
- Consumes: `anticore_core::transport::PacketTransport`
- Produces: `service::Engine::start` (Her işletim sisteminde ilgili transportu başlatan ortak motor yöneticisi)

- [ ] **Step 1: `service.rs` içindeki `active_handles` yapısını soyutla**

`#[cfg(windows)]` dışındaki platformlar için `active_transport: Arc<Mutex<Option<Box<dyn PacketTransport>>>>` ekle.

- [ ] **Step 2: Platform bazlı `start()` fonksiyonunu güncelle**

`start()` metoduna `#[cfg(target_os = "linux")]` ve `#[cfg(target_os = "macos")]` kollarını ekle. Windows kolunu (`#[cfg(windows)]`) hiçbir satır değiştirmeden koru.

- [ ] **Step 3: Windows derlemesini doğrula**

Run: `cargo check` (dizin: `desktop/src-tauri`)
Expected: PASS

- [ ] **Step 4: Commit et**

```bash
git add desktop/src-tauri/Cargo.toml desktop/src-tauri/src/service.rs
git commit -m "feat(desktop): decouple service engine lifecycle with cross-platform transport"
```

---

### Görev 7: macOS Menü Çubuğu Hızlı Panel Konumlandırması (`tray.rs`)

**Files:**
- Modify: `desktop/src-tauri/src/tray.rs:75-105`
- Modify: `desktop/src-tauri/tauri.conf.json:44-65`

**Interfaces:**
- Consumes: `tauri::WebviewWindow`, `tauri::Rect`
- Produces: macOS menü çubuğunun tam altına kenetlenen Hızlı Panel (`quick-panel`)

- [ ] **Step 1: `position_quick_panel` fonksiyonuna platform ayrıştırması ekle**

```rust
// desktop/src-tauri/src/tray.rs
#[cfg(target_os = "macos")]
fn position_quick_panel(panel: &tauri::WebviewWindow, tray_rect: &tauri::Rect) {
    if let Ok(Some(monitor)) = panel.current_monitor() {
        let scale = monitor.scale_factor();
        let work_area = monitor.work_area();
        let panel_width = (340.0 * scale) as i32;

        let tray_pos = tray_rect.position.to_physical::<i32>(scale);
        let tray_size = tray_rect.size.to_physical::<u32>(scale);

        let target_x = tray_pos.x + (tray_size.width as i32 / 2) - (panel_width / 2);
        let clamped_x = target_x.clamp(
            work_area.position.x + 8,
            work_area.position.x + work_area.size.width as i32 - panel_width - 8,
        );
        let target_y = tray_pos.y + tray_size.height as i32 + 6;

        let _ = panel.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: clamped_x,
            y: target_y,
        }));
    }
}

#[cfg(not(target_os = "macos"))]
fn position_quick_panel(panel: &tauri::WebviewWindow, tray_rect: &tauri::Rect) {
    // Mevcut Windows ve Linux alt görev çubuğu konumlama mantığı korunur
    if let Ok(Some(monitor)) = panel.current_monitor() {
        let scale = monitor.scale_factor();
        let work_area = monitor.work_area();
        let panel_width = (340.0 * scale) as i32;
        let panel_height = (460.0 * scale) as i32;

        let tray_pos = tray_rect.position.to_physical::<i32>(scale);
        let tray_size = tray_rect.size.to_physical::<u32>(scale);

        let target_x = if tray_size.width > 0 {
            tray_pos.x + (tray_size.width as i32 / 2) - (panel_width / 2)
        } else {
            work_area.position.x + work_area.size.width as i32 - panel_width - 12
        };

        let clamped_x = target_x.clamp(
            work_area.position.x + 8,
            work_area.position.x + work_area.size.width as i32 - panel_width - 8,
        );

        let clamped_y = (work_area.position.y + work_area.size.height as i32 - panel_height - 8)
            .max(work_area.position.y + 8);

        let _ = panel.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: clamped_x,
            y: clamped_y,
        }));
    }
}
```

- [ ] **Step 2: `tauri.conf.json` içinde paketleme ve hedef yapılandırması**

Windows için NSIS/MSI, macOS için DMG/App hedeflerini tanımla. Windows kaynaklarının (`WinDivert.dll`, `WinDivert64.sys`) yalnızca Windows hedefinde paketlendiğini doğrula.

- [ ] **Step 3: Derlemeyi doğrula**

Run: `cargo check` (dizin: `desktop/src-tauri`)
Expected: PASS

- [ ] **Step 4: Commit et**

```bash
git add desktop/src-tauri/src/tray.rs desktop/src-tauri/tauri.conf.json
git commit -m "feat(tray): implement top-bar anchoring for quick panel on macOS"
```

---

### Görev 8: Bütünleştirme, Yetki Betikleri ve Nihai Regresyon Doğrulaması

**Files:**
- Create: `scripts/macos-install-daemon.sh`
- Create: `scripts/linux-setup-caps.sh`
- Modify: `docs/HANDOFF.md`
- Modify: `docs/TASKS.md`

**Interfaces:**
- Produces: macOS LaunchDaemon kurulum betiği ve Linux setcap izin betiği.

- [ ] **Step 1: macOS LaunchDaemon betiğini yaz**

`scripts/macos-install-daemon.sh`: `/Library/LaunchDaemons/com.monolithworks.anticore.plist` dosyasını yapılandırıp `launchctl load` çalıştıran idempotent kabuk betiği.

- [ ] **Step 2: Linux Capabilities betiğini yaz**

`scripts/linux-setup-caps.sh`: `setcap cap_net_admin,cap_net_raw+ep anticore-cli` çalıştıran betik.

- [ ] **Step 3: Tüm Windows testlerini ve derlemesini koş**

Run:
1. `cargo test --workspace` (dizin: `engine`) -> PASS
2. `cargo check` (dizin: `desktop/src-tauri`) -> PASS
3. `npm test` (dizin: `desktop`) -> PASS

- [ ] **Step 4: Belgeleri güncelle ve Commit et**

`docs/HANDOFF.md` ve `docs/TASKS.md` dosyalarını güncelle.
```bash
git add scripts/ docs/
git commit -m "docs(crossplatform): complete cross-platform implementation tasks and setup scripts"
```
