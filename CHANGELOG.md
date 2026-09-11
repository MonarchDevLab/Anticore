# Changelog

All notable changes to Anticore are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.1] - 2026-09-11

### Added
- **macOS Native Engine (UTUN + PFCTL):** Sürücüsüz Userspace TUN (`utun`) ve paket filtre (`pfctl`) anchor yönlendirme motoru (`anticore-transport-macos`), çekirdek uzantısı (KEXT) gerektirmeden tam hat hızında çalışır.
- **Separated Apple Silicon & Intel macOS Packages:** Apple Silicon (`aarch64-apple-darwin` — M1/M2/M3/M4/M5) ve Intel (`x86_64-apple-darwin` — Core i5/i7/i9/Xeon) için bağımsız derlenmiş disk kalıpları (`Anticore_0.3.1_aarch64.dmg` & `Anticore_0.3.1_x64.dmg`), `.app.tar.gz` paketleri ve bağımsız CLI daemon arşivleri.
- **macOS Menu Bar Quick Panel (Tray Flyout):** Üst menü çubuğuna kenetlenen, tek tıkla profil değişimi ve canlı telemetri sunan 340x460px taktik komuta paneli ve yeni sürüm uyarı şeridi.
- **macOS Background LaunchDaemon:** Sistem başlangıcında sıfır arayüzle çalışan bağımsız servis yapılandırması (`com.monolithworks.anticore.plist`) ve otomatik kurulum betiği (`scripts/macos-install-daemon.sh`).
- **macOS Update Notifications & Architecture Matching:** Yeni sürüm tespitinde yerel macOS Bildirim Merkezi (Notification Center) sesli uyarısı ve kullanıcının Mac çipine (ARM64 / Intel) göre otomatik DMG indirme eşleştirmesi.
- **Cross-Platform CI/CD Pipeline:** Windows x64, macOS Apple Silicon ve macOS Intel için 3'lü GitHub Actions derleme, test ve dağıtım matrisi.
- **In-App Auto Updater:** Direct GitHub Releases integration silently checking for new versions on startup, with 1-click update, download progress, and browser fallback.
- **3D Isometric Activity Visualizer:** Real-time network throughput and PPS (packets per second) visualized via custom Canvas-based isometric 3D bar chart (`ActivityChart3D`) featuring dynamic face shading, depth projection, and live reactor pulse.
- **Live Status Orb:** Interactive reactor state in the control console with rotating dual satellites, 140 3D z-sorted particles, gyroscopic orbital rings, and pulsing aura when running, and calm static crimson glow when stopped.
- **LAN Device Sharing (Proxy & Hotspot Transit):** Local SOCKS5, HTTP PAC proxy (`0.0.0.0:10808`), and transparent WinDivert NAT transit capture (`(outbound or forward) and tcp`) allowing mobile devices on the same network to bypass DPI.
- **Windows Network Stack & Winsock Remediation:** Native execution of `netsh winsock reset`, `netsh int ip reset`, and DNS cache flushing with adapter release/renewal (`ipconfig /flushdns`, `/release`, `/renew`) in Network Repair to fix corrupted adapter states.
- **Target Sites Responsive Grid & Category Pills:** Re-architected Target Sites screen into a 2-column responsive grid with domain badges, globe identifiers, quick-delete hover controls, and refined filter pill buttons.
- **In-App Changelog View:** Interactive patch notes and release history screen with category badges and search capabilities (`ChangelogView`).
- **Automatic Administrator Elevation:** Embedded `requireAdministrator` application manifest to prevent runtime UAC elevation loops.
- **Android Architecture Specification Blueprint:** Complete architectural blueprint (`docs/ANDROID_ARCHITECTURE.md`) defining `android.net.VpnService` integration, virtual TUN interface lifecycle, and Rust JNI FFI bindings for upcoming mobile builds.

### Fixed
- **Post-Quantum Kyber & Segmented TLS ClientHello Parsing:** Hardened `parse_client_hello` to seamlessly resolve SNIs across TCP MSS boundaries (e.g. 1500+ byte Post-Quantum Kyber / ML-KEM 768 and ECH payloads split across packets), eliminating false passthroughs on heavy cryptographic handshakes.
- **Synthetic TLS Handshake Probe Calibration:** Upgraded synthetic ClientHello generator in Tester/Blockcheck with full modern browser TLS extensions (Supported Groups x25519/secp256r1, EC Point Formats, Signature Algorithms, Supported Versions TLS 1.2/1.3) and expanded open port classification for TLS Alert & HTTP responses to prevent false negatives.
- **Tray Quick Panel Real Telemetry:** Removed all unmeasured placeholders; connected live PPS, processed packet count, and uptime clock from the running engine.
- **Dynamic Blacklist Synchronization:** Adding or removing sites from the target list now instantly updates active engine memory via `Arc<RwLock<Blacklist>>` without restarting the engine.
- **Community Blacklist 404 Resolution & Error Reporting:** Switched to a reliable live Zapret hostlist mirror with an offline embedded fallback database, and added dedicated error banner and localized failure reporting for synchronization issues.
- **Legacy Service & Process Locks:** Automated cleanup tool forcibly terminating locked GoodbyeDPI, Splitwire, WinWS processes and stopping WinDivert drivers.
- **Discord DNS Poisoning Auto-Fix:** One-click automated DNS restoration (Cloudflare 1.1.1.1 + native Windows DoH + DNS cache flush) resolving BTK ISP redirection.
- **Titlebar & Status HUD Polish:** Distinct standby/active state styling with dedicated red status indicators for inactive engines, animated pulse badges for available updates, and unified engine control labels.

### Performance & Security
- **Superonline & Turkish ISP Calibrated Rules:** Calibrated TTL=4 fake packets and 2-byte TLS ClientHello fragmentation (`FakePacketBefore { ttl: 4 }` + `FragmentTls { Fixed(2) }` + `FakeWrongSeq`) against Sandvine and Procera DPI hardware.
- **Socket Teardown:** Immediate closure of existing keep-alive TCP connections on engine stop.
- **Build Cache Optimization:** Reclaimed 34.3 GB of disk space by purging transient Rust compilation caches without affecting binary integrity.

---

## [0.3.0] - 2026-09-09

### Added
- **Public Open-Source Release:** Initial public repository launch on GitHub.
- **8 Hardware Themes:** Obsidian Emerald, Amber CRT, Cobalt Matrix, Cyberpunk 2077, Quiet Luxury, Amethyst Nebula, Titanium Laboratory, and Crimson Hazard.
- **Tray Quick Panel:** Sol-click system tray flyout panel (340x460px) with single-click profile selector, tactical controls, and auto-dismiss.
- **Encrypted DNS (DoH) Integration:** Windows registry DoH configuration for secure DNS resolution.

### Changed
- Refactored UI architecture to clean theme tokens and eliminated static hex styles.
- Hardened WinDivert filter strings with loopback and impostor exclusions.

---

## [0.2.0] - 2026-09-01

### Added
- **Native Desktop GUI:** Tauri v2 desktop application built with React 18, Vite, and Tailwind CSS.
- **ISP Profiles:** Built-in evasion strategy presets for Türk Telekom, Turkcell Superonline, Vodafone, and Kablonet.
- **Test Center (Blockcheck):** Real TCP/TLS handshake probing engine for ISP block analysis.
- **Network Repair View:** DNS server configuration and adapter inspection.

---

## [0.1.0] - 2026-08-15

### Added
- **Core Engine Prototype:** Rust-based L3/L4/L7 packet manipulation engine (`anticore-core`).
- **WinDivert 2.x FFI:** Native Windows packet interception and injection.
- **TCP/TLS Evasion Steps:** Fixed offset splitting, SNI-Mid fragmentation, and fake TTL injection.
