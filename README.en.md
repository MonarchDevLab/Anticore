<div align="center">

```
   █████╗ ███╗   ██╗████████╗██╗ ██████╗ ██████╗ ██████╗ ███████╗
  ██╔══██╗████╗  ██║╚══██╔══╝██║██╔════╝██╔═══██╗██╔══██╗██╔════╝
  ███████║██╔██╗ ██║   ██║   ██║██║     ██║   ██║██████╔╝█████╗  
  ██╔══██║██║╚██╗██║   ██║   ██║██║     ██║   ██║██╔══██╗██╔════╝  
  ██║  ██║██║ ╚████║   ██║   ██║╚██████╗╚██████╔╝██║  ██║███████╗
  ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
```

### Zero-Latency, Transparent DPI Circumvention Suite for Windows
**An open source packet manipulation engine designed to bypass Turkish ISP DPI filtering without tunneling your internet traffic.**

[![Release](https://img.shields.io/github/v/release/MonarchDevLab/Anticore?style=flat-square&color=00FF9D&labelColor=000000)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011%20x64-00FFFF?style=flat-square&labelColor=000000)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Engine](https://img.shields.io/badge/Core-Rust%20%2B%20WinDivert-FF3366?style=flat-square&labelColor=000000)](https://github.com/MonarchDevLab/Anticore)
[![UI](https://img.shields.io/badge/UI-Tauri%202.0%20%2B%20React%2019-FFCC00?style=flat-square&labelColor=000000)](https://github.com/MonarchDevLab/Anticore)
[![License](https://img.shields.io/badge/License-MIT-FFFFFF?style=flat-square&labelColor=000000)](LICENSE)
[![Signature](https://img.shields.io/badge/Signed-Minisign%20Verified-00FF9D?style=flat-square&labelColor=000000)](https://github.com/MonarchDevLab/Anticore/releases/latest)

[Download Options](#download-options-v030) | [What Is Anticore?](#what-anticore-is-and-is-not) | [Comparison](#comparison-traditional-vpn-vs-goodbyedpi-vs-anticore) | [How It Works](#how-it-works) | [Build from Source](#build-from-source) | [Türkçe Kılavuz](README.md)

</div>

---

## Download Options

Choose the package that fits your setup. Both packages use the exact same compiled Rust engine and WinDivert packet driver.

| Package | Filename | Size | Link | Best Used For |
|---|---|---|:---:|---|
| **Portable (No-Install)** | `Anticore_x64-portable.zip` | 6.1 MB | [Download (.zip)](https://github.com/MonarchDevLab/Anticore/releases/latest/download/Anticore_0.3.0_x64-portable.zip) | Recommended if you do not want an installer, want to run off a USB drive, or want zero residual files in AppData or the registry. Extract and run `Anticore.exe` as Administrator. |
| **Installer (Setup EXE)** | `Anticore_x64-setup.exe` | 14.8 MB | [Download (.exe)](https://github.com/MonarchDevLab/Anticore/releases/latest/download/Anticore_0.3.0_x64-setup.exe) | Recommended if you want a desktop shortcut, Start Menu entry, and one-click in-app automatic updates via GitHub Releases. |
| **Enterprise (MSI)** | `Anticore_x64_en-US.msi` | 16.5 MB | [Download (.msi)](https://github.com/MonarchDevLab/Anticore/releases/latest/download/Anticore_0.3.0_x64_en-US.msi) | Standard Windows Installer package for system administrators deploying across fleets using Active Directory or GPO. |

> **Administrator Rights:** Filtering raw TCP/IP packets at the Windows kernel level requires Administrator privileges. If launched without elevation, the application will notify you and offer to self-elevate in one click.

---

## What Anticore Is and Is Not

When platforms like Discord or Roblox are restricted, people usually default to turning on a VPN. That works, but it causes well-known daily headaches:

- Your download and upload speeds drop by 50 to 80 percent because all traffic goes through an overseas tunnel.
- Game ping increases from 30ms to 120ms or more.
- Banking apps and local services flag your foreign IP address and lock accounts.
- All personal data traverses third-party VPN servers.

**Anticore is not a VPN and it never tunnels your connection.**

Instead, it addresses how Turkish ISPs actually inspect traffic. ISPs block domains by reading the plaintext Server Name Indication (SNI) inside the very first TLS ClientHello packet.

Anticore intercepts only that initial handshake:
1. It splits the handshake across TCP segment boundaries or injects a low-TTL decoy packet that satisfies the ISP filter without reaching the remote server.
2. The moment the handshake is accepted by the remote host, the filter steps out of the data path.
3. Every subsequent download, game stream, or voice packet flows directly between you and the destination at 100 percent wire speed. If you pay for a 1000 Mbps line, you get 1000 Mbps.

---

## Comparison: Traditional VPN vs GoodbyeDPI vs Anticore

| Feature | Traditional VPN | GoodbyeDPI | SplitWire | Anticore |
|---|:---:|:---:|:---:|:---:|
| **Bandwidth Loss** | 50 to 80 percent loss | 0 percent (full speed) | 0 percent (full speed) | **0 percent (full wire speed)** |
| **Ping Penalty** | +50ms to 200ms | 0 ms | 0 ms | **0 ms (direct connection)** |
| **User Interface** | Standard SaaS client | None (Command line batch) | Basic GUI | **Dual-Mode Cyber-Brutalist UI** |
| **Ease of Use** | Easy | Complex batch arguments | Simple | **One-click simple or pro matrix** |
| **Windows Service** | Partial | Manual `sc` commands | None | **Built-in Service Manager** |
| **Blockcheck Diagnostic** | None | Yes (CLI script) | None | **Visual Step-by-Step Diagnostic** |
| **Discord Repair** | None | None | None | **Voice drop & update loop fix** |
| **System Tray** | Yes | None | Partial | **Runs quietly in background** |
| **Auto Updates** | Yes | Manual file replacement | Manual | **Signed Tauri auto-updater** |
| **Memory Footprint** | 150 to 300 MB | ~10 MB | ~80 MB | **~25 MB (Rust + WebView2)** |

GoodbyeDPI proved the viability of these packet tricks years ago, but navigating terminal arguments, batch scripts, and driver service registration is tedious for most users. SplitWire took a step toward an interface but lacked service integration and network diagnostics.

Anticore combines both worlds: a memory-safe, lightweight Rust engine with a clean desktop control panel configured for Turkish ISP topologies out of the box.

---

## How It Works

```
[ Browser / Game ]
         │
         │ 1. TLS ClientHello (Host: discord.com)
         ▼
┌─────────────────────────────────────────────────────────────┐
│  ANTICORE ENGINE (Rust + WinDivert Kernel Driver)           │
│                                                             │
│  - Listens only on targeted domains (whitelist).            │
│  - Emits a low-TTL decoy packet (exhausts the DPI buffer).  │
│  - Splits the genuine ClientHello directly through the      │
│    SNI payload into separate TCP segments.                  │
└─────────────────────────────────────────────────────────────┘
         │
    ┌────┴──────────────────────────────┐
    │ 2. Decoy Packet (TTL=3)           │ 3. Split Genuine Segments
    ▼                                   ▼
[ ISP DPI Inspection Box ]      [ Destination Host (Discord) ]
(Gets confused by decoy)        (Reassembles TCP stream)
                                        │
                                        │ 4. Handshake Complete
                                        ▼
                      [ ALL rest of data flows at 100% full speed ]
```

1. **Decoy Packet with TTL:** A packet is generated with a low Time-to-Live value. It travels far enough to reach the ISP filtering equipment on the local loop, but expires in the transit hop before reaching the genuine server. The DPI box consumes the decoy, while the genuine packet behind it passes through unnoticed.
2. **SNI Splitting:** The domain name inside the TLS handshake is segmented into two TCP packets. Basic DPI engines cannot reassemble TCP streams in real time at line rate, rendering them blind to the requested domain.
3. **TCP RST Drop:** Decoy or reset packets injected by the ISP to force-terminate forbidden connections are captured and discarded before reaching the local Windows network stack.
4. **QUIC / HTTP3 Fallback:** UDP port 443 packets are dropped to encourage browsers to fall back to TLS over TCP, where packet splitting techniques are fully effective.

---

## Built-In Diagnostics

- **Discord Recovery:** Resolves infinite "Checking for updates" loops, voice channel RTC disconnections, and clears stale Discord caches.
- **Windows DoH Integration:** Registers secure DNS-over-HTTPS providers (Cloudflare, Google, Quad9, AdGuard) directly in the Windows network configuration to prevent ISP-level DNS spoofing.
- **DNS Leak Test:** Validates whether DNS lookups are leaking in plaintext to local telecommunication servers.

---

## Build from Source

```powershell
# 1. Clone repository
git clone https://github.com/MonarchDevLab/Anticore.git
cd Anticore/antikor

# 2. Run engine tests (46 test cases)
cargo test --workspace

# 3. Build standalone CLI engine
cargo build --release --workspace

# 4. Install desktop dependencies
cd desktop
npm install

# 5. Run in development mode
npm run tauri dev

# 6. Produce distribution binaries (EXE, MSI, Portable)
npm run tauri build
```

---

## Verification

Official release binaries are signed with Minisign. Public key:
```
dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDAzNkNDN0QyQzUzRDU1RTYKUldSUE9pWld3bXN5aGZ1N1N6T2I0SldhZEU2S2h2dDVlOGJld2Y3bEZoT0x4MGlpSEI1ZmdQdkIK
```

Verify signature:
```powershell
minisign -Vm Anticore_x64-setup.exe -p anticore.key.pub
```

---

## License

Distributed under the [MIT License](LICENSE).

<div align="center">
  <sub>Developed by Monolith Works / MonarchDevLab. Built for high-speed, unthrottled, and private internet connectivity.</sub>
</div>
