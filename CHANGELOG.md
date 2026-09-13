# Changelog

All notable changes to Anticore are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.4] - 2026-09-13

### Added
- **macOS Persistent Root Privileges (sudoers NOPASSWD):** Integrated `/etc/sudoers.d/com.monolithworks.anticore` rule and `main.rs` silent re-exec hook. Admin password prompt is required only once in lifetime; subsequent launches re-exec silently as root with zero OS elevation dialogs.
- **Build-Timestamp-Aware Revision Update Detection:** Embedded compilation timestamp (`ANTICORE_BUILD_TIME`) into the binary. Updates are now triggered based on remote asset build time even when the version number remains unchanged.
- **macOS Native Direct PKG Updater (`install_update_direct`):** Downloaded `.pkg` update packages are installed silently via `installer -pkg -target /` and automatically relaunched.
- **macOS LaunchAgent Autostart Engine:** Integrated native LaunchAgent (`~/Library/LaunchAgents/com.monolithworks.anticore.plist`) for background startup on login.
- **macOS HIG & Platform Parity:** Solved Apple design discrepancies with native top-left Traffic Lights, rounded hardware chassis, WebKit typography antialiasing, and macOS network stack repair parity.

## [0.3.3] - 2026-09-12

### Added
- **Tauri Native Notification Engine (`tauri-plugin-notification`):** Integrated Tauri v2 official notification plugin, connecting directly to Windows 10/11 WinRT Toast and macOS `UNUserNotificationCenter` via native Rust/C APIs. Completely eliminated fragile `powershell.exe` subprocess spawning and script execution.
- **Sticky In-App Update Banner (`UpdateBanner.tsx`):** Added a persistent, non-intrusive update notification banner directly below the titlebar. Displays when an update is detected, providing one-click access to release details and installation options without interrupting ongoing workflows.
- **Live Notification Test Simulation:** Added a dedicated "Test Notification System" action in Settings, allowing users and developers to test both native OS toast delivery and the in-app update banner with a single click.

### Fixed
- **Windows AUMID Silent Toast Drop:** Resolved an issue where Windows Notification Service dropped PowerShell toast notifications due to unregistered or unverified AppUserModelIDs in the Windows Registry.

## [0.3.2] - 2026-09-12

### Added
- **In-Binary Driver Embedding (True Single-File Portable):** Statically compiled `WinDivert.dll`, `WinDivert64.sys`, and `WebView2Loader.dll` directly into `Anticore.exe` using Rust's `include_bytes!` macro. The application now runs as a completely self-contained single executable requiring zero external DLLs or SYS files.
- **Auto-Extracting Driver Provisioning (Self-Heal):** On launch, if driver binaries are absent from the host directory, the executable silently provisions them from embedded memory to disk within milliseconds, satisfying Windows Authenticode/WHQL kernel integrity requirements.
- **Zero-Rate-Limit CDN Fallback Updater:** Integrated transparent secondary failover to GitHub CDN `latest.json` endpoint whenever GitHub REST API rate limits (HTTP 403) or network interruptions occur, guaranteeing 100% update availability.

### Fixed
- **Universal SemVer 2.0 Compliance:** Migrated versioning scheme back to strict 3-part SemVer (`0.3.2`), resolving an issue where legacy versions (`v0.3.0` / `v0.3.1`) failed to detect 4-part release tags. All historical clients now discover and prompt for updates automatically.
- **Titlebar Language Standardization:** Replaced hardcoded status pill string in `Titlebar.tsx` with dynamic i18n keys; standby mode properly displays `ETKİN DEĞİL · BEKLEMEDE` in Turkish and `INACTIVE · STANDBY` in English.
- **Bilingual Window Controls & Tooltips:** Standardized F1 guide, theme toggler, minimize, maximize/restore, and close tooltips to be fully bilingual.
- **Driver Error Discrimination:** Separated Windows OS error codes (`ERROR_ACCESS_DENIED`, `ERROR_FILE_NOT_FOUND`, `ERROR_DRIVER_BLOCKED`) during `WinDivertOpen` to eliminate false admin elevation prompts under valid elevated sessions.

## [0.3.1.1] - 2026-09-11

### Added
- **Complete System Purge (Zero-Trace):** Added a dedicated "Purge System Completely" uninstallation feature in Settings. Safely stops the engine, terminates CLI/daemon processes, cleanly removes Windows services (`sc delete`), unloads the WinDivert driver (`net stop WinDivert`), resets DNS/DoH configurations, deletes Task Scheduler and Registry startup entries, clears desktop/Start menu shortcuts, wipes local AppData runtime caches, and executes a zero-trace uninstaller without leaving residual files.
- **Brand Palette & Morphological Refinement:** Refined application identity with `#020617` void background, `#ff642b` live ember primary, and `#00edff` cyan secondary across all 10 morphological themes.
- **Cross-Platform Setup Wizard Parity:** Standardized wizard language for persistent system service installation and single-run portable execution across Windows and macOS.

### Fixed
- **Multi-Part Versioning & Update Notifications:** Enhanced updater version comparison logic to seamlessly parse and notify for multi-part patch revisions (e.g. `0.3.1.1`) across Windows WinRT Toast and macOS Notification Center.
- **Sanitized Distribution & Documentation:** Complete compliance review removing legacy blocking terminology across all documentation, metadata, and distribution artifacts.

## [0.3.1] - 2026-09-11

### Added
- **10 Morphological Hardware Themes:** 10 distinct, tactile hardware themes (Obsidian Core, Cyberpunk Volt, Luxury Gold, Crimson Protocol, Cobalt Matrix, Amber CRT, Amethyst Void, Abyss Aqua, Solar Flare, Titanium Clean) featuring unique corner radii, border depths, shadow treatments, and dynamic atmospheric glows. Default brand colors tuned to `#020617` void, `#ff642b` live ember, and `#00edff` cyan accent.
- **Advanced Window & System Tray Management:** Integrated fine-grained controls in Settings for system tray icon visibility toggle, Always-on-Top window pinning, and Minimize-to-Tray on window close.
- **5-Item Tactical System Tray Menu:** Standardized system tray context menu across platforms with Open, Start, Stop, Check for Updates, and Quit; added 1-click update check button to the Tray Quick Panel.
- **Zero-Conflict Smart Updater:** Built-in installer teardown hooks and graceful pre-update shutdown routines preventing file-lock collisions during in-place upgrades.
- **Cross-Platform Native Notifications:** Audible desktop toast alerts via Windows WinRT and macOS Notification Center when new releases are detected.
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
- **Discord DNS Poisoning Auto-Fix:** One-click automated DNS restoration (Cloudflare 1.1.1.1 + native Windows DoH + DNS cache flush) resolving ISP DNS redirection and poisoning.
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
