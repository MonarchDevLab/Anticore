<div align="center">

<p align="center">
  <img src="assets/banner.svg" alt="ANTICORE - Zero-Loss DPI Circumvention Suite" width="100%" style="max-width: 880px;" />
</p>

# ANTICORE

### Zero-Loss, High-Performance Open Source DPI Circumvention Suite for Windows

[![Version](https://img.shields.io/github/v/release/MonarchDevLab/Anticore?style=for-the-badge&color=00FF9D&labelColor=08090D&logo=github)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011%20x64-00E5FF?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Core](https://img.shields.io/badge/Core-Rust%20%2B%20WinDivert-FF2A4D?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![UI](https://img.shields.io/badge/UI-Tauri%202.0%20%2B%20React%2019-FFE600?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![License](https://img.shields.io/badge/License-MIT-FFFFFF?style=for-the-badge&labelColor=08090D)](LICENSE)
[![Verification](https://img.shields.io/badge/Signed-Minisign%20Verified-00FF9D?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)

**Next-generation packet manipulation software engineered against ISP censorship and filtering topologies. Runs completely on your local machine without routing traffic through third-party remote servers—preserving 100% of your network speed and ping latency.**

[Downloads](#download-options-v031) • [What Is Anticore?](#what-anticore-is-and-is-not) • [Key Features](#key-features) • [How It Works](#how-it-works) • [Comparison](#comparison-traditional-vpn-vs-goodbyedpi-vs-splitwire-vs-anticore) • [Security & Verification](#security-and-integrity-verification) • [Türkçe Kılavuz](README.md)

</div>

---

## Download Options (v0.3.1)

All distribution binaries are stripped of developer workstation paths during compilation and digitally signed.

| Package Type | Filename | Size | Download | Intended Use |
|---|---|:---:|:---:|---|
| **Portable** | `Anticore_0.3.1_x64-portable.zip` | ~6.4 MB | [Download (.zip)](https://github.com/MonarchDevLab/Anticore/releases/latest/download/Anticore_0.3.1_x64-portable.zip) | **No installation.** Extract to any folder or USB stick and run `Anticore.exe` as Administrator. Leaves zero registry or AppData residue. |
| **Installer (Setup EXE)** | `Anticore_0.3.1_x64-setup.exe` | ~4.4 MB | [Download (.exe)](https://github.com/MonarchDevLab/Anticore/releases/latest/download/Anticore_0.3.1_x64-setup.exe) | For desktop users requiring Start Menu integration, desktop shortcuts, and built-in automatic updates. |
| **Enterprise (MSI)** | `Anticore_0.3.1_x64_en-US.msi` | ~6.1 MB | [Download (.msi)](https://github.com/MonarchDevLab/Anticore/releases/latest/download/Anticore_0.3.1_x64_en-US.msi) | Windows Installer MSI for system administrators automating deployment via Active Directory, Intune, or GPO. |

> **System Requirements & Administrator Privileges:** Intercepting and manipulating raw network packets at the Windows kernel level requires the `WinDivert` driver. Running as **Administrator** is technically mandatory. When launched by a standard user, Anticore alerts you and offers a one-click self-elevation restart.

---

## What Anticore Is and Is Not

When services like Discord or Roblox are restricted, people commonly default to enabling a VPN. However, conventional VPNs compromise the daily experience:

- All traffic is funneled through an overseas node, cutting download and upload speeds by **50% to 80%**.
- Online gaming and voice latency spikes from **30 ms to 120+ ms**.
- Banking apps and government portals reject foreign IPs or demand two-factor verification loops.
- Private personal traffic passes unencrypted or inspected through third-party servers.

### Anticore Is Not a VPN or Proxy

Anticore never tunnels your connection. Internet Service Providers generally enforce blocks by reading the plaintext domain tag inside the initial connection handshake (**TLS ClientHello SNI**).

Anticore intervenes strictly during this initial handshake:
1. It splits the handshake into small TCP segments or injects a low-TTL decoy packet that satisfies the ISP's Deep Packet Inspection (DPI) device without reaching the actual server.
2. As soon as the handshake completes with the destination host, the inspection mechanism is bypassed.
3. All subsequent downloads, uploads, streaming, and gaming traffic flow directly through your ISP at full line rate. **If you have a 1 Gbps fiber line, you retain 1 Gbps.**

---

## Key Features

### 1. Dual-Mode Interface & 3D Telemetry Visualization
- **Simple Mode (Casual Users):** One-click toggle powered by a live 3D reactor orb (140 z-sorted particles, gyroscopic orbital rings, and dynamic aura state) for effortless protection.
- **Pro Matrix & 3D Activity Visualizer:** Inspect real-time network throughput and packet rates (PPS) through an isometric 3D Canvas bar chart with depth shading, microsecond latency metrics, and terminal event logs.

### 2. Local Network (LAN) Device Sharing & Hotspot Transit
- **Protect Mobile & IoT Devices:** Turn your Windows PC into a local anti-censorship gateway.
- **SOCKS5 & HTTP PAC Proxy:** Built-in proxy service on `0.0.0.0:10808` allowing iPhones, Android phones, tablets, and smart TVs on the same Wi-Fi network to bypass DPI blocks.
- **Transparent Hotspot NAT Transit:** Intercepts forward/outbound traffic when Windows Mobile Hotspot is active, giving connected devices transparent DPI bypass without requiring root or third-party client apps.

### 3. Windows Network Stack & Winsock Remediation
- **One-Click Network Recovery:** Built-in diagnostic repair suite for corrupted network adapters, DNS poisoning, and stuck Discord updater loops.
- **Winsock & IP Reset:** Execute `netsh winsock reset`, `netsh int ip reset`, and `ipconfig /flushdns`, `/release`, `/renew` directly from the UI to restore TCP/IP stacks to factory health.

### 4. Dynamic Blacklist & Community Sync
- **Zero-Restart Live Sync:** Adding or removing domains updates active kernel memory instantly via `Arc<RwLock<Blacklist>>` without restarting the engine or terminating open connections.
- **2-Column Responsive Card Grid:** Domain tags, globe icons, hover quick-deletion controls, and category filter pills (TR Mega, Gaming, Media, Social).
- **Redundant Community Feed:** Live Zapret Turkey hostlist mirror with an offline embedded fallback database.

### 5. Post-Quantum TLS (Kyber) & Surgical Evasion
- **Kyber / ML-KEM 768 & ECH Support:** Seamlessly parses SNI across TCP MSS boundaries for massive (1500+ bytes) Post-Quantum TLS ClientHello handshakes used in Chrome 124+ and Firefox 128+.
- **Calibrated ISP Profiles:** Calibrated for Sandvine and Procera DPI hardware with `TTL=4` decoys, 2-byte TLS ClientHello segmentation (`Fixed(2)`), and active TCP TCB socket teardown.

### 6. System Tray Quick Access Cockpit
- Single click on the taskbar icon reveals a floating, compact (340x460px) cockpit in the corner of your screen.
- Track real live telemetry (PPS, touched packets, uptime) and trigger profile shifts or update checks without restoring the main window.

### 7. 8 Morphological Hardware Themes
More than simple palette swaps; distinct card geometries, CRT scanlines, and custom typography:
- **Obsidian Emerald:** Cyber-hardware chassis with neon emerald telemetry (Default).
- **Amber CRT:** Amber phosphor glow, full-screen scanline overlay, and monospace typography.
- **Cobalt Matrix:** Tactical submarine combat console in deep ocean blue.
- **Cyberpunk Volt:** Industrial HUD grid, 45-degree chamfers, and high-voltage yellow.
- **Quiet Luxury:** Editorial serif typography, obsidian velvet, and champagne gold.
- **Crimson Hazard:** Tactical military emergency red laser command console.
- **Amethyst Nebula:** Translucent frosted glass and deep violet nebula backdrop.
- **Titanium Laboratory:** Clinical light mode, CNC-machined surgical aluminum.

### 8. Built-In Auto-Updater & Changelog
- Automated GitHub Releases check on launch with silent detection, 1-click update, and browser download fallback.
- In-app searchable **Changelog & Patch Notes** viewer categorized by features, hotfixes, security, and performance.

---

## How It Works

```text
[ Browser / Game ]
           │
           │ 1. TLS ClientHello (Target: discord.com)
           ▼
┌─────────────────────────────────────────────────────────────┐
│  ANTICORE ENGINE (Rust + WinDivert Driver)                  │
│                                                             │
│  - Captures only packets matching targeted domains.         │
│  - Injects a low-TTL decoy packet.                          │
│  - Splits genuine ClientHello directly through the SNI tag  │
│    into separate TCP segments.                              │
└─────────────────────────────────────────────────────────────┘
           │
     ┌─────┴──────────────────────────────┐
     │ 2. Decoy Packet (TTL=3..4)         │ 3. Split Genuine Segments
     ▼                                    ▼
[ ISP DPI Inspection Box ]        [ Destination Server (Discord) ]
(Consumed by decoy)               (Reassembles TCP segments)
                                          │
                                          │ 4. Handshake Established
                                          ▼
                      [ ALL remaining traffic flows at 100% full wire speed ]
```

1. **Decoy Packet Injection (Low TTL):** A packet is emitted with a Time-to-Live value sufficient to reach the ISP inline DPI box, but expiring before reaching internet peering backbones. The DPI equipment processes the decoy while letting the following genuine packet slip past.
2. **SNI Segmentation:** The domain name within the TLS handshake is split across TCP segment boundaries. Standard DPI appliances cannot reassemble segments on the fly at line rate.
3. **Passive TCP RST Drop:** ISP-injected spoofed TCP RST packets meant to disrupt connections are intercepted and dropped before reaching Windows.
4. **QUIC / HTTP3 Fallback:** Blocks UDP port 443 packets to smoothly guide browsers back to TCP/TLS, where packet segmentation operates reliably.

---

## Comparison: Traditional VPN vs GoodbyeDPI vs SplitWire vs ANTICORE

| Metric | Traditional VPN | GoodbyeDPI | SplitWire | ANTICORE |
|---|:---:|:---:|:---:|:---:|
| **Bandwidth Loss** | 50% to 80% loss | Zero loss | Zero loss | **Zero loss (Full Wire Speed)** |
| **Ping Penalty** | +50 ms to 200 ms | 0 ms | 0 ms | **0 ms (Direct Route)** |
| **User Interface** | SaaS Client | None (.cmd / CLI) | Basic GUI | **Dual-Mode Cyber-Hardware Panel** |
| **3D Telemetry & Isometric Graphs** | None | None | None | **Yes (Isometric PPS + 3D Reactor Orb)** |
| **LAN Sharing (Mobile/Tablet)** | Manual Routing | None | None | **Yes (SOCKS5 + PAC + Hotspot Transit)** |
| **Network Stack & Winsock Repair** | None | None | None | **One-Click Winsock / TCP-IP / DNS Reset** |
| **Dynamic Memory Synchronization** | Restart Required | Restart Required | Restart Required | **Instant Memory Sync (Zero Interruption)** |
| **System Tray** | Yes | None | Partial | **Flyout Quick Cockpit & Background Mode** |
| **Windows Service** | Partial | Manual `sc` script | None | **Integrated Windows Service Manager** |
| **Auto DNS & Discord Repair** | None | None | None | **One-Click Poisoning & RTC Fix** |
| **Memory Footprint** | 150 - 300 MB | ~10 MB | ~80 MB | **~25 MB (Rust + WebView2)** |
| **Auto Updates** | Yes | Manual | Manual | **Signed Tauri Auto-Updater** |

---

## Security and Integrity Verification

Official binaries published on GitHub Releases can be verified using Minisign with the following public key:

```text
dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDE1QTRFREEwMDFGNDFFNTMKUldSVEh2UUJvTzJrRmE3UGFDdG81YWtnYUdYSkhFdWQxVGJ0V2VVdHFKNDJvaGZRWS90TWx3ejMK
```

Verification command:
```powershell
minisign -Vm Anticore_0.3.1_x64-setup.exe -p anticore.key.pub
```

For security policies and vulnerability reporting, see [SECURITY.md](SECURITY.md).

---

## Build from Source

To compile binaries independently from source:

### Prerequisites
- Rust 1.80+ (`rustup`)
- Node.js 20+ (`npm`)
- Visual Studio 2022 C++ Build Tools (MSVC x64)

```powershell
# 1. Clone repository
git clone https://github.com/MonarchDevLab/Anticore.git
cd Anticore/antikor

# 2. Run engine tests (48 unit & integration tests)
cd engine
cargo test --workspace

# 3. Build standalone CLI engine
cargo build --release --workspace

# 4. Install desktop dependencies and compile
cd ../desktop
npm install
npm test
npm run tauri build
```

---

## License & Attribution

Distributed under the [MIT License](LICENSE).

- **WinDivert:** Distributed under [LGPLv3](https://reqrypt.org/windivert.html). Loaded dynamically without modification.
- **WebView2:** Microsoft Corporation.
- **Legal Disclaimer:** Anticore is built for network research, personal privacy, and uncensored communication. Compliance with local regulations remains the sole responsibility of the user.

<div align="center">
  <sub>Engineered by <b>Monolith Works</b>; published via <b>MonarchDevLab</b>.</sub>
</div>
