<div align="center">

<p align="center">
  <img src="assets/banner.svg" alt="ANTICORE - Zero-Loss DPI Circumvention Suite" width="100%" style="max-width: 880px;" />
</p>

# ANTICORE

### Zero-Loss, High-Performance Open Source DPI Circumvention Suite for Windows

[![Version](https://img.shields.io/github/v/release/MonarchDevLab/Anticore?style=for-the-badge&color=20ffa0&labelColor=08090D&logo=github)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/MonarchDevLab/Anticore/total?style=for-the-badge&color=20f2ff&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011%20x64-20f2ff?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Core](https://img.shields.io/badge/Core-Rust%20%2B%20WinDivert-FF2A4D?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![UI](https://img.shields.io/badge/UI-Tauri%202.0%20%2B%20React%2019-FFE600?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Tests](https://img.shields.io/badge/Tests-52%20Passed-20ffa0?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Zero Leakage](https://img.shields.io/badge/Guard-Zero%20Leakage%20PASS-20f2ff?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Verification](https://img.shields.io/badge/Signed-Minisign%20Verified-20ffa0?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![License](https://img.shields.io/badge/License-MIT-FFFFFF?style=for-the-badge&labelColor=08090D)](LICENSE)

<br />

**Next-generation local packet manipulation engine engineered to circumvent ISP censorship and Deep Packet Inspection (DPI) middleboxes. Operates completely locally without tunneling through third-party remote servers—preserving 100% of your network throughput and ping latency.**

<br />

<table width="100%" align="center">
  <tr>
    <td width="25%" align="center">
      <a href="#download-options-v031"><img src="https://img.shields.io/badge/01-DISTRIBUTION-20ffa0?style=for-the-badge&labelColor=08090D" alt="01 Distribution" /></a>
    </td>
    <td width="25%" align="center">
      <a href="#what-anticore-is-and-is-not"><img src="https://img.shields.io/badge/02-CORE_ARCH-20f2ff?style=for-the-badge&labelColor=08090D" alt="02 Core Architecture" /></a>
    </td>
    <td width="25%" align="center">
      <a href="#key-features"><img src="https://img.shields.io/badge/03-FEATURES-FFE600?style=for-the-badge&labelColor=08090D" alt="03 Features" /></a>
    </td>
    <td width="25%" align="center">
      <a href="#how-it-works"><img src="https://img.shields.io/badge/04-WORKFLOW-FF7733?style=for-the-badge&labelColor=08090D" alt="04 Workflow" /></a>
    </td>
  </tr>
  <tr>
    <td width="25%" align="center">
      <a href="#isp-compatibility--bypass-matrix"><img src="https://img.shields.io/badge/05-ISP_MATRIX-20ffa0?style=for-the-badge&labelColor=08090D" alt="05 ISP Matrix" /></a>
    </td>
    <td width="25%" align="center">
      <a href="#comprehensive-comparison-matrix"><img src="https://img.shields.io/badge/06-COMPARISON-20f2ff?style=for-the-badge&labelColor=08090D" alt="06 Comparison" /></a>
    </td>
    <td width="25%" align="center">
      <a href="#frequently-asked-questions-faq"><img src="https://img.shields.io/badge/07-FAQ_SECTION-FFE600?style=for-the-badge&labelColor=08090D" alt="07 FAQ" /></a>
    </td>
    <td width="25%" align="center">
      <a href="README.md"><img src="https://img.shields.io/badge/TR-TÜRKÇE_KILAVUZ-FFFFFF?style=for-the-badge&labelColor=08090D" alt="TR Guide" /></a>
    </td>
  </tr>
</table>

</div>

---

## Download Options (v0.3.1)

All distribution binaries are built cleanly, stripped of developer workstation paths (Zero Leakage), and verified via Minisign.

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="33.3%" align="center">
        <img src="https://img.shields.io/badge/01-PORTABLE_ZIP-20ffa0?style=for-the-badge&labelColor=08090D" alt="Portable" /><br /><br />
        <b>Portable Edition</b><br />
        <sub>Most Popular • Zero Traces</sub>
      </th>
      <th width="33.3%" align="center">
        <img src="https://img.shields.io/badge/02-SETUP_EXE-20f2ff?style=for-the-badge&labelColor=08090D" alt="Setup" /><br /><br />
        <b>Setup Installer</b><br />
        <sub>Standard Desktop • Automatic OTA</sub>
      </th>
      <th width="33.3%" align="center">
        <img src="https://img.shields.io/badge/03-ENTERPRISE_MSI-FFE600?style=for-the-badge&labelColor=08090D" alt="MSI" /><br /><br />
        <b>Enterprise MSI</b><br />
        <sub>System Admins • GPO &amp; Intune</sub>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center" valign="top">
        No installation required. Extract to any folder or USB drive and run directly. Leaves zero residue on the system.<br /><br />
        <code>✓ Zero Registry Footprint</code>
      </td>
      <td align="center" valign="top">
        Desktop shortcut, Start Menu integration, and silent in-app automatic background update engine support.<br /><br />
        <code>✓ Cryptographically Signed OTA</code>
      </td>
      <td align="center" valign="top">
        Windows Installer MSI package for silent, centralized deployment across fleet machines via Active Directory, Intune, or GPO.<br /><br />
        <code>✓ Silent /qn Unattended Deploy</code>
      </td>
    </tr>
    <tr>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/latest/download/Anticore_0.3.1_x64-portable.zip"><img src="https://img.shields.io/badge/DOWNLOAD_.ZIP-6.3_MB-20ffa0?style=for-the-badge&labelColor=08090D" alt="Download ZIP" /></a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/latest/download/Anticore_0.3.1_x64-setup.exe"><img src="https://img.shields.io/badge/DOWNLOAD_.EXE-4.4_MB-20f2ff?style=for-the-badge&labelColor=08090D" alt="Download EXE" /></a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/latest/download/Anticore_0.3.1_x64_en-US.msi"><img src="https://img.shields.io/badge/DOWNLOAD_.MSI-6.1_MB-FFE600?style=for-the-badge&labelColor=08090D" alt="Download MSI" /></a>
      </td>
    </tr>
    <tr>
      <td align="center" valign="middle">
        <img src="https://img.shields.io/badge/ARCH-x64_%E2%80%A2_ZERO_TRACES-20ffa0?style=flat-square&labelColor=08090D" alt="x64 Zero Traces" />
      </td>
      <td align="center" valign="middle">
        <img src="https://img.shields.io/badge/ARCH-x64_%E2%80%A2_AUTOMATIC_OTA-20f2ff?style=flat-square&labelColor=08090D" alt="x64 Automatic OTA" />
      </td>
      <td align="center" valign="middle">
        <img src="https://img.shields.io/badge/ARCH-x64_%E2%80%A2_GPO_INTUNE-FFE600?style=flat-square&labelColor=08090D" alt="x64 GPO Intune" />
      </td>
    </tr>
  </tbody>
</table>

<table width="100%" align="center">
  <tr>
    <td align="center" bgcolor="#161b22">
      <b>Standalone Core Binaries:</b> &nbsp;
      <a href="https://github.com/MonarchDevLab/Anticore/releases/latest/download/Anticore.exe"><img src="https://img.shields.io/badge/STANDALONE_GUI-Anticore.exe_(15.6_MB)-20ffa0?style=flat-square&labelColor=08090D" alt="Anticore.exe" /></a> &nbsp;
      <a href="https://github.com/MonarchDevLab/Anticore/releases/latest/download/anticore-cli.exe"><img src="https://img.shields.io/badge/CLI_CORE-anticore--cli.exe_(384_KB)-20f2ff?style=flat-square&labelColor=08090D" alt="anticore-cli" /></a> &nbsp;
      <a href="https://github.com/MonarchDevLab/Anticore/releases/latest"><img src="https://img.shields.io/badge/GITHUB_RELEASES-ALL_PACKAGES-FFFFFF?style=flat-square&labelColor=08090D" alt="Release Archive" /></a>
    </td>
  </tr>
</table>

<details>
<summary><b>SHA-256 Checksums & Package Integrity (Click to Expand)</b></summary>
<br />

| Package File | Size | SHA-256 Checksum |
|---|:---:|---|
| `Anticore_0.3.1_x64-portable.zip` | 6.3 MB | `40E92F9135E92586FD518AE4581E48D10A5FB365AC9593D02E396868354EF935` |
| `Anticore_0.3.1_x64-setup.exe` | 4.4 MB | `FB4F4C31E3B5B5F1FEA7D88F62ECE3267486DDDD75FEDEB0329980D40299631D` |
| `Anticore_0.3.1_x64_en-US.msi` | 6.1 MB | `7614447CF05BF3E8D7C312EC99D388999E5887CA0C2CEA7EAC42A63556335B85` |
| `Anticore.exe` | 15.6 MB | `057C65D8C6CD6A878C5472767D8A7CC6539386A1DD52B7D58F0DC229994817A6` |
| `anticore-cli.exe` | 384 KB | `16F6313E63250869267FC2BEF58AA99AACD6AAF56D52CE5AB1177DA8C9255E9D` |

```powershell
# Verify downloaded package via PowerShell:
Get-FileHash .\Anticore_0.3.1_x64-portable.zip -Algorithm SHA256
```
</details>

> [!IMPORTANT]
> **Technical Requirement — Administrator Privileges:**
> Intercepting and modifying raw IP packets at the kernel level requires the `WinDivert` driver. Running as **Administrator** is technically required. When launched by a standard user, Anticore alerts you and provides one-click self-elevation.

---

## What Anticore Is and Is Not

When online services like Discord or gaming servers are blocked, users typically resort to VPNs. However, conventional VPN routing severely degrades daily performance:

<table width="100%" align="center">
<tr>
  <th width="500" align="center">
    <h3>Traditional VPN Tunneling</h3>
    <sub>(Indirect, Slow &amp; Privacy Risks)</sub>
  </th>
  <th width="500" align="center">
    <h3>Anticore Surgical DPI Bypass</h3>
    <sub>(Direct, Full Line Speed &amp; Zero Latency)</sub>
  </th>
</tr>
<tr>
  <td width="500" align="center" valign="top">
    <br />
    <code>[Client Workstation]</code><br />
    &darr; <i>(Encrypted Tunnel Encapsulation)</i><br />
    <code>[Remote Overseas VPN Server]</code><br />
    &darr; <i>(Bottleneck &amp; Relayed Egress)</i><br />
    <code>[Target Service / Game Server]</code>
    <br /><br />
  </td>
  <td width="500" align="center" valign="top">
    <br />
    <code>[Client Workstation]</code><br />
    &darr; <i>(Only Initial TLS ClientHello Fragmented)</i><br />
    <code>[ISP DPI Filter Bypassed]</code><br />
    &darr; <i>(Direct Line via Local ISP Gateway)</i><br />
    <code>[Target Service / Game Server]</code>
    <br /><br />
  </td>
</tr>
<tr>
  <td width="500" align="left" valign="top">
    &bull; <b>Bandwidth:</b> <img src="https://img.shields.io/badge/Speed-50%25--80%25_Drop-ff4444?style=flat-square" alt="Speed Drop" align="right" /><br /><br />
    &bull; <b>Gaming Latency:</b> <img src="https://img.shields.io/badge/Ping-+100~250_ms-ff7733?style=flat-square" alt="Ping Increase" align="right" /><br /><br />
    &bull; <b>Data Route:</b> <img src="https://img.shields.io/badge/Traffic-Foreign_Relay-red?style=flat-square" alt="Foreign Relay" align="right" /><br /><br />
    &bull; <b>Banking / Local Services:</b> <img src="https://img.shields.io/badge/IP-Overseas_Blocked-grey?style=flat-square" alt="Blocked" align="right" /><br /><br />
    &bull; <b>Cost Model:</b> <img src="https://img.shields.io/badge/Model-Monthly_Subscription-lightgrey?style=flat-square" alt="Subscription" align="right" />
  </td>
  <td width="500" align="left" valign="top">
    &bull; <b>Bandwidth:</b> <img src="https://img.shields.io/badge/Speed-100%25_Full_Wire-20ffa0?style=flat-square&logoColor=08090D&labelColor=08090D" alt="Full Wire" align="right" /><br /><br />
    &bull; <b>Gaming Latency:</b> <img src="https://img.shields.io/badge/Ping-0_ms_Added-20f2ff?style=flat-square&logoColor=08090D&labelColor=08090D" alt="Zero Ping" align="right" /><br /><br />
    &bull; <b>Data Route:</b> <img src="https://img.shields.io/badge/Traffic-Direct_Local_Gateway-20ffa0?style=flat-square&logoColor=08090D&labelColor=08090D" alt="Direct" align="right" /><br /><br />
    &bull; <b>Banking / Local Services:</b> <img src="https://img.shields.io/badge/IP-Native_Local_IP-20f2ff?style=flat-square&logoColor=08090D&labelColor=08090D" alt="Local IP" align="right" /><br /><br />
    &bull; <b>Cost Model:</b> <img src="https://img.shields.io/badge/License-Free_&_Open_Source-FFE600?style=flat-square&logoColor=08090D&labelColor=08090D" alt="FOSS" align="right" />
  </td>
</tr>
</table>

### Key Differences
- **No Remote Tunnels:** Your internet traffic is never redirected through proxy servers or foreign IP nodes.
- **Zero Bandwidth Loss:** Only the initial handshake packet (**TLS ClientHello SNI**) is manipulated. Once established, all downloads, uploads, video streaming, and gaming flow directly through your ISP at full speed. **If you have a 1 Gbps line, you retain 1 Gbps.**
- **0 ms Ping Overhead:** Because traffic takes the shortest geographical route to game servers, your in-game latency remains unaffected.
- **Banking and Local Portal Safe:** Your real local public IP remains unchanged; banking portals, government sites, and streaming apps will not flag your session.

---

## Key Features

<table width="100%" align="center">
  <!-- ROW 1 HEADERS -->
  <tr>
    <th width="50%" align="left" valign="top">
      <img src="https://img.shields.io/badge/01-CORE_ENGINE-20ffa0?style=flat-square&labelColor=08090D" alt="01 Core Engine" /><br />
      <h3>Surgical Packet Manipulation</h3>
      <sub>Kernel-level DPI bypass powered by the open-source WinDivert driver.</sub>
    </th>
    <th width="50%" align="left" valign="top">
      <img src="https://img.shields.io/badge/02-VISUAL_TELEMETRY-20f2ff?style=flat-square&labelColor=08090D" alt="02 Visual Telemetry" /><br />
      <h3>3D Isometric Telemetry &amp; Reactor</h3>
      <sub>Hardware-accelerated 60 FPS live canvas visualization for network throughput.</sub>
    </th>
  </tr>
  <!-- ROW 1 CONTENT -->
  <tr>
    <td width="50%" valign="top">
      &bull; <b>SNI Fragmentation:</b> Splits TLS ClientHello packets into micro TCP segments to defeat DPI reassembly mechanisms.<br /><br />
      &bull; <b>TTL=4 Decoy Injection:</b> Sends low-TTL decoy packets that saturate inspection hardware without reaching destination.<br /><br />
      &bull; <b>Passive RST Mitigation:</b> Silently drops spoofed TCP RST packets injected by ISPs to preserve active gaming and web sessions.
    </td>
    <td width="50%" valign="top">
      &bull; <b>ActivityChart3D:</b> Renders live network speed and PPS flow with hardware-accelerated dynamic isometric depth.<br /><br />
      &bull; <b>Live Reactor Orb:</b> Dual orbital rings with 140 depth-sorted particles reflecting real-time engine processing state.<br /><br />
      &bull; <b>Pro Matrix Console:</b> Microsecond-precision error telemetry, raw socket events, and live terminal diagnostic logs.
    </td>
  </tr>

  <!-- ROW 2 HEADERS -->
  <tr>
    <th width="50%" align="left" valign="top">
      <img src="https://img.shields.io/badge/03-LAN_GATEWAY-FFE600?style=flat-square&labelColor=08090D" alt="03 LAN Gateway" /><br />
      <h3>Local Network (LAN) Device Sharing</h3>
      <sub>Transform your workstation into a centralized censorship bypass gateway.</sub>
    </th>
    <th width="50%" align="left" valign="top">
      <img src="https://img.shields.io/badge/04-SYSTEM_RECOVERY-FF7733?style=flat-square&labelColor=08090D" alt="04 System Recovery" /><br />
      <h3>Winsock &amp; Network Stack Repair</h3>
      <sub>First-aid diagnostics for corrupted network adapters and Discord update loops.</sub>
    </th>
  </tr>
  <!-- ROW 2 CONTENT -->
  <tr>
    <td width="50%" valign="top">
      &bull; <b>SOCKS5 / HTTP Proxy:</b> High-throughput local proxy listener on <code>0.0.0.0:10808</code> for mobile devices and consoles.<br /><br />
      &bull; <b>Transparent Hotspot Transit:</b> Direct zero-configuration protection for devices connected to Windows Mobile Hotspot.<br /><br />
      &bull; <b>PAC Automation:</b> Dynamic Proxy Auto-Config routing that selectively forwards only censored targets for maximum speed.
    </td>
    <td width="50%" valign="top">
      &bull; <b>One-Click Reset:</b> Execute <code>netsh winsock reset</code> and <code>netsh int ip reset</code> directly to recover corrupt adapters.<br /><br />
      &bull; <b>DNS Cache Purge:</b> Flush and renew resolver state with <code>ipconfig /flushdns</code>, <code>/release</code>, and <code>/renew</code>.<br /><br />
      &bull; <b>Secure DoH Templates:</b> Instant integration with Cloudflare 1.1.1.1 or Google 8.8.8.8 encrypted DNS resolvers.
    </td>
  </tr>

  <!-- ROW 3 HEADERS -->
  <tr>
    <th width="50%" align="left" valign="top">
      <img src="https://img.shields.io/badge/05-MEMORY_MANAGEMENT-20ffa0?style=flat-square&labelColor=08090D" alt="05 Memory Management" /><br />
      <h3>Dynamic In-Memory Blacklist</h3>
      <sub>Zero-downtime concurrent blacklist synchronization without engine restarts.</sub>
    </th>
    <th width="50%" align="left" valign="top">
      <img src="https://img.shields.io/badge/06-NEXT_GEN_TLS-20f2ff?style=flat-square&labelColor=08090D" alt="06 Next Gen TLS" /><br />
      <h3>Post-Quantum Kyber &amp; Modern TLS</h3>
      <sub>Full compatibility with cutting-edge cipher suites and massive packet handshakes.</sub>
    </th>
  </tr>
  <!-- ROW 3 CONTENT -->
  <tr>
    <td width="50%" valign="top">
      &bull; <b>Live Synchronization:</b> Seamless domain rule modifications via lock-free <code>Arc&lt;RwLock&lt;Blacklist&gt;&gt;</code> architecture.<br /><br />
      &bull; <b>Category Filter Pills:</b> Instant target filtering across TR Mega, Gaming, Media, and Social categories with one click.<br /><br />
      &bull; <b>Dual-Layered Mirrors:</b> Zapret Turkey hostlist community sync backed by an offline embedded fallback database.
    </td>
    <td width="50%" valign="top">
      &bull; <b>Kyber / ML-KEM 768 &amp; ECH:</b> Reassembles 1500+ byte quantum-resistant ClientHello frames across TCP MSS without loss.<br /><br />
      &bull; <b>Synthetic TLS Probes:</b> Browser-calibrated handshake tests guaranteeing zero false-negative bypass verification.<br /><br />
      &bull; <b>8 Cyber-Hardware Themes:</b> Full UI morphology customization from Obsidian Emerald to Cyberpunk Volt and Amethyst Nebula.
    </td>
  </tr>
</table>

---

## How It Works

The following architecture diagram demonstrates how Anticore inspects and alters packets with surgical precision:

```mermaid
flowchart TD
    subgraph Client["User Workstation"]
        App["Applications / Games / Browsers\n(Discord, Roblox, Steam, Web)"]
        TCPIP["Windows TCP/IP Network Stack"]
    end

    subgraph AnticoreEngine["ANTICORE v0.3.1 (Rust Engine)"]
        WD["WinDivert Kernel Driver"]
        Check{"Target Hostname in\nActive Blacklist?"}
        Manip["Surgical TLS SNI Split\n+ Low-TTL Decoy Injection (TTL=4)"]
        Bypass["Zero-Touch Direct Pass-through"]
    end

    subgraph Net["ISP & Public Internet Infrastructure"]
        ISP["ISP DPI Middlebox\n(Sandvine / Procera)"]
        Target["Destination Server\n(Discord, Roblox, Cloudflare Edge)"]
    end

    App --> TCPIP
    TCPIP --> WD
    WD --> Check
    Check -- "Match (Restricted Host)" --> Manip
    Check -- "Normal Unrestricted Traffic" --> Bypass
    Manip -- "1. Decoy Packet (Absorbed by DPI)" --> ISP
    Manip -- "2. Segmented Real Handshake" --> Target
    Bypass --> Target
    Target -->|"Direct Payload Flow: 100% Line Rate / 0 ms Ping Penalty"| App
```

### Four-Layered Defense Engine
1. **Decoy Packet Injection:** Injects a fake preliminary packet with a calibrated Time-To-Live (`TTL=3..4`) that reaches ISP filtering hardware (Sandvine, Procera, etc.) but drops before reaching the destination server. While the DPI middlebox processes the decoy, the real payload passes through unimpeded.
2. **Surgical SNI Splitting:** Breaks the initial ClientHello packet across the hostname (SNI) boundary into two distinct TCP segments. Basic state machines cannot reassemble these segments in real time.
3. **Spoofed RST Dropping:** Intercepts and discards unauthorized TCP RST packets sent by ISP deep packet inspection systems to abort your connection.
4. **QUIC / HTTP3 Downgrade:** Prevents UDP-based QUIC sessions from bypassing TLS filtering, ensuring consistent circumvention in modern browsers.

---

## ISP Compatibility & Bypass Matrix

Common ISP Deep Packet Inspection implementations and Anticore's calibrated mitigation profiles:

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="20%" align="left">Internet Service Provider</th>
      <th width="18%" align="left">Detected DPI Hardware</th>
      <th width="22%" align="left">Filtering & Restriction Method</th>
      <th width="19%" align="left">Recommended Profile</th>
      <th width="21%" align="center">Circumvention Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <img src="https://img.shields.io/badge/Turkcell-Superonline-002B49?style=flat-square" alt="Turkcell Superonline" /><br />
        <b>Turkcell Superonline</b>
      </td>
      <td>
        <code>Sandvine PTS</code><br />
        <sub>Policy Traffic Switch</sub>
      </td>
      <td>
        <code>SNI Inspection</code> <code>Spoofed RST</code><br />
        <sub>Low-TTL Packet Filter</sub>
      </td>
      <td>
        <b>Profile 3 (Aggressive)</b><br />
        <sub>Fake TTL=4 • 2-Byte Split</sub>
      </td>
      <td align="center">
        <img src="https://img.shields.io/badge/%E2%9C%93_BYPASS-ACTIVE-20ffa0?style=for-the-badge&labelColor=08090D" alt="Bypass Active" /><br />
        <b>100% Line Rate Access</b><br />
        <sub>Direct Transit • 0 ms Ping</sub>
      </td>
    </tr>
    <tr>
      <td>
        <img src="https://img.shields.io/badge/Türk_Telekom-TTNet-001E50?style=flat-square" alt="Türk Telekom TTNet" /><br />
        <b>Türk Telekom (TTNet)</b>
      </td>
      <td>
        <code>Procera / Huawei</code><br />
        <sub>PacketLogic Hardware</sub>
      </td>
      <td>
        <code>Standard SNI</code> <code>DNS Hijack</code><br />
        <sub>ISP DNS Poisoning Filter</sub>
      </td>
      <td>
        <b>Profile 1 (Standard)</b><br />
        <sub>SNI Splitting • DoH Resolver</sub>
      </td>
      <td align="center">
        <img src="https://img.shields.io/badge/%E2%9C%93_BYPASS-ACTIVE-20ffa0?style=for-the-badge&labelColor=08090D" alt="Bypass Active" /><br />
        <b>100% Line Rate Access</b><br />
        <sub>Direct Transit • 0 ms Ping</sub>
      </td>
    </tr>
    <tr>
      <td>
        <img src="https://img.shields.io/badge/Vodafone-Net-E60000?style=flat-square" alt="Vodafone Net" /><br />
        <b>Vodafone Net</b>
      </td>
      <td>
        <code>Allot / Sandvine</code><br />
        <sub>Traffic Management Platform</sub>
      </td>
      <td>
        <code>SNI Blocking</code> <code>HTTP 302</code><br />
        <sub>IP Redirect & Spoofed RST</sub>
      </td>
      <td>
        <b>Profile 2 (Fake + RST)</b><br />
        <sub>Decoy Packet • RST Dropping</sub>
      </td>
      <td align="center">
        <img src="https://img.shields.io/badge/%E2%9C%93_BYPASS-ACTIVE-20ffa0?style=for-the-badge&labelColor=08090D" alt="Bypass Active" /><br />
        <b>100% Line Rate Access</b><br />
        <sub>Direct Transit • 0 ms Ping</sub>
      </td>
    </tr>
    <tr>
      <td>
        <img src="https://img.shields.io/badge/Türksat-Kablonet-004F9E?style=flat-square" alt="Türksat Kablonet" /><br />
        <b>Türksat Kablonet</b>
      </td>
      <td>
        <code>Procera PacketLogic</code><br />
        <sub>Core Deep Inspection</sub>
      </td>
      <td>
        <code>SNI Filtering</code> <code>QUIC Block</code><br />
        <sub>UDP/443 Throttling</sub>
      </td>
      <td>
        <b>Profile 1 (Standard)</b><br />
        <sub>SNI Splitting • QUIC Downgrade</sub>
      </td>
      <td align="center">
        <img src="https://img.shields.io/badge/%E2%9C%93_BYPASS-ACTIVE-20ffa0?style=for-the-badge&labelColor=08090D" alt="Bypass Active" /><br />
        <b>100% Line Rate Access</b><br />
        <sub>Direct Transit • 0 ms Ping</sub>
      </td>
    </tr>
    <tr>
      <td>
        <img src="https://img.shields.io/badge/TurkNet-GigaFiber-00D084?style=flat-square" alt="TurkNet GigaFiber" /><br />
        <b>TurkNet</b>
      </td>
      <td>
        <code>Independent Core</code><br />
        <sub>Central Office Filtering</sub>
      </td>
      <td>
        <code>DNS Poisoning</code> <code>Partial SNI</code><br />
        <sub>Local Traffic Redirection</sub>
      </td>
      <td>
        <b>Profile 1 (Standard)</b><br />
        <sub>DoH Resolver • Standard Split</sub>
      </td>
      <td align="center">
        <img src="https://img.shields.io/badge/%E2%9C%93_BYPASS-ACTIVE-20ffa0?style=for-the-badge&labelColor=08090D" alt="Bypass Active" /><br />
        <b>100% Line Rate Access</b><br />
        <sub>Direct Transit • 0 ms Ping</sub>
      </td>
    </tr>
    <tr>
      <td>
        <img src="https://img.shields.io/badge/Regional-Wholesale_%2F_Other-30363D?style=flat-square" alt="Regional ISPs" /><br />
        <b>Regional Providers</b>
      </td>
      <td>
        <code>TT / Superonline</code><br />
        <sub>Carrier Transit Backbone</sub>
      </td>
      <td>
        <code>Backbone Dependent</code><br />
        <sub>Upstream Filtering Policy</sub>
      </td>
      <td>
        <b>Profile 1 or Profile 3</b><br />
        <sub>Adaptive to Transit Carrier</sub>
      </td>
      <td align="center">
        <img src="https://img.shields.io/badge/%E2%9C%93_BYPASS-ACTIVE-20ffa0?style=for-the-badge&labelColor=08090D" alt="Bypass Active" /><br />
        <b>100% Line Rate Access</b><br />
        <sub>Direct Transit • 0 ms Ping</sub>
      </td>
    </tr>
  </tbody>
</table>

---

## Comprehensive Comparison Matrix

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="24%" align="left">Technical Criteria</th>
      <th width="19%" align="center">Traditional VPN</th>
      <th width="19%" align="center">GoodbyeDPI</th>
      <th width="19%" align="center">SplitWire</th>
      <th width="19%" align="center">
        <img src="https://img.shields.io/badge/ANTICORE-v0.3.1-20ffa0?style=flat-square&labelColor=08090D" alt="Anticore v0.3.1" />
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>Download Speed &amp; Pipe</b></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%96%BC_50%25--80%25_Loss-DA3633?style=flat-square&labelColor=21262D" alt="Loss" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_Line_Rate-8B949E?style=flat-square&labelColor=21262D" alt="Line Rate" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_Line_Rate-8B949E?style=flat-square&labelColor=21262D" alt="Line Rate" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_100%25_Line_Rate-20ffa0?style=flat-square&labelColor=08090D" alt="Line Rate" /></td>
    </tr>
    <tr>
      <td><b>Gaming Ping &amp; Latency</b></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%96%B2_%2B100~250_ms-DA3633?style=flat-square&labelColor=21262D" alt="High Ping" /></td>
      <td align="center"><img src="https://img.shields.io/badge/0_ms_Penalty-8B949E?style=flat-square&labelColor=21262D" alt="0 ms" /></td>
      <td align="center"><img src="https://img.shields.io/badge/0_ms_Penalty-8B949E?style=flat-square&labelColor=21262D" alt="0 ms" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_0_ms_Penalty-20ffa0?style=flat-square&labelColor=08090D" alt="0 ms" /></td>
    </tr>
    <tr>
      <td><b>Graphical Interface (GUI)</b></td>
      <td align="center"><code>Standard SaaS UI</code></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_None_(Console_Only)-30363D?style=flat-square&labelColor=161B22" alt="Console" /></td>
      <td align="center"><code>Basic WinForms</code></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_Cyber--Hardware_3D-20ffa0?style=flat-square&labelColor=08090D" alt="Cyber GUI" /></td>
    </tr>
    <tr>
      <td><b>Live 3D Telemetry</b></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_None-30363D?style=flat-square&labelColor=161B22" alt="None" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_None-30363D?style=flat-square&labelColor=161B22" alt="None" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_None-30363D?style=flat-square&labelColor=161B22" alt="None" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_60_FPS_Reactor_Orb-20ffa0?style=flat-square&labelColor=08090D" alt="Reactor" /></td>
    </tr>
    <tr>
      <td><b>LAN / SOCKS5 Gateway</b></td>
      <td align="center"><code>Virtual Adapter Sharing</code></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_None-30363D?style=flat-square&labelColor=161B22" alt="None" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_None-30363D?style=flat-square&labelColor=161B22" alt="None" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_SOCKS5_%2B_Hotspot-20ffa0?style=flat-square&labelColor=08090D" alt="SOCKS5" /></td>
    </tr>
    <tr>
      <td><b>Winsock &amp; DNS Recovery</b></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_None-30363D?style=flat-square&labelColor=161B22" alt="None" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_None-30363D?style=flat-square&labelColor=161B22" alt="None" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_None-30363D?style=flat-square&labelColor=161B22" alt="None" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_1--Click_Network_Fix-20ffa0?style=flat-square&labelColor=08090D" alt="Recovery" /></td>
    </tr>
    <tr>
      <td><b>In-Memory Blacklist</b></td>
      <td align="center"><code>Tunnel Restart Req</code></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9A%A0_Service_Reset-30363D?style=flat-square&labelColor=161B22" alt="Reset" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9A%A0_Service_Reset-30363D?style=flat-square&labelColor=161B22" alt="Reset" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_Arc_RwLock_Live-20ffa0?style=flat-square&labelColor=08090D" alt="Arc" /></td>
    </tr>
    <tr>
      <td><b>System Tray Cockpit Flyout</b></td>
      <td align="center"><code>Basic Context Menu</code></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_None-30363D?style=flat-square&labelColor=161B22" alt="None" /></td>
      <td align="center"><code>Basic Context Menu</code></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_340x460px_Cockpit-20ffa0?style=flat-square&labelColor=08090D" alt="Tray" /></td>
    </tr>
    <tr>
      <td><b>Windows Service (Daemon)</b></td>
      <td align="center"><code>Partial Driver</code></td>
      <td align="center"><code>Manual sc.exe</code></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_None-30363D?style=flat-square&labelColor=161B22" alt="None" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_Integrated_Daemon-20ffa0?style=flat-square&labelColor=08090D" alt="Daemon" /></td>
    </tr>
    <tr>
      <td><b>Discord DNS &amp; RTC Repair</b></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_None-30363D?style=flat-square&labelColor=161B22" alt="None" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_None-30363D?style=flat-square&labelColor=161B22" alt="None" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_None-30363D?style=flat-square&labelColor=161B22" alt="None" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_Built--in_RTC_Fix-20ffa0?style=flat-square&labelColor=08090D" alt="Discord" /></td>
    </tr>
    <tr>
      <td><b>Memory Footprint (RAM)</b></td>
      <td align="center"><img src="https://img.shields.io/badge/150--350_MB-DA3633?style=flat-square&labelColor=21262D" alt="150-350 MB" /></td>
      <td align="center"><img src="https://img.shields.io/badge/~10_MB-8B949E?style=flat-square&labelColor=21262D" alt="~10 MB" /></td>
      <td align="center"><img src="https://img.shields.io/badge/~80_MB-8B949E?style=flat-square&labelColor=21262D" alt="~80 MB" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_~25_MB_(Rust)-20ffa0?style=flat-square&labelColor=08090D" alt="~25 MB" /></td>
    </tr>
    <tr>
      <td><b>Auto-Updater (OTA)</b></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_Supported-8B949E?style=flat-square&labelColor=21262D" alt="Supported" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_Manual_Zip-30363D?style=flat-square&labelColor=161B22" alt="Manual" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_Manual_Tracking-30363D?style=flat-square&labelColor=161B22" alt="Manual" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_Signed_GitHub_OTA-20ffa0?style=flat-square&labelColor=08090D" alt="OTA" /></td>
    </tr>
    <tr>
      <td><b>Hardware Cyber Themes</b></td>
      <td align="center"><code>Light / Dark</code></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_None-30363D?style=flat-square&labelColor=161B22" alt="None" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_None-30363D?style=flat-square&labelColor=161B22" alt="None" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_8_Custom_Themes-20ffa0?style=flat-square&labelColor=08090D" alt="Themes" /></td>
    </tr>
  </tbody>
</table>

---

## System Tray Quick Panel

Control your network protection instantly without opening the main workspace window:

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="60%" align="left">
        <img src="https://img.shields.io/badge/TRAY_COCKPIT-ANTICORE_v0.3.1_COMMAND_CONSOLE-161b22?style=flat-square" alt="Tray Cockpit" />
      </th>
      <th width="40%" align="right">
        <img src="https://img.shields.io/badge/ENGINE_STATUS-●_ACTIVE_RUNNING-20ffa0?style=flat-square&labelColor=08090D" alt="Status Active" />
        <img src="https://img.shields.io/badge/DRIVER-WinDivert_Attached-20f2ff?style=flat-square&labelColor=08090D" alt="Driver" />
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="50%" valign="top">
        <b>Active Bypass Profile:</b><br />
        <img src="https://img.shields.io/badge/PROFILE_3-Superonline_Aggressive-20f2ff?style=flat-square&labelColor=08090D" alt="Profile 3" />
        <br /><br />
        <b>Active Surgical Rule:</b><br />
        <code>Fake TTL=4 + 2-Byte SNI Segmentation</code>
        <br /><br />
        <b>Rapid Actions:</b><br />
        <kbd>⏹ Stop Engine</kbd> &nbsp;
        <kbd>⚡ Network Repair</kbd> &nbsp;
        <kbd>⚙ Main Cockpit</kbd>
      </td>
      <td width="50%" valign="top">
        <b>Live Throughput (PPS):</b><br />
        <img src="https://img.shields.io/badge/1,480_p/s-Live_Reactor_Pulse-20ffa0?style=flat-square&labelColor=08090D" alt="1480 PPS" />
        <br /><br />
        <b>IPC Latency &amp; Uptime:</b><br />
        <code>0.12 ms IPC</code> &bull; <code>02:45:12 Continuous Uptime</code>
        <br /><br />
        <b>Session Packet Counter:</b><br />
        <code>24,190 pkts processed</code> &bull; <code>100% Accuracy</code>
      </td>
    </tr>
    <tr>
      <td colspan="2" align="center">
        <img src="https://img.shields.io/badge/WINDOW-340x460px_Borderless-161b22?style=flat-square" alt="340x460" />
        <img src="https://img.shields.io/badge/IPC_LATENCY-0_ms_Zero_Overhead-20ffa0?style=flat-square&labelColor=08090D" alt="0 ms" />
        <img src="https://img.shields.io/badge/SHELL_API-Win32_Shell_NotifyIconW-20f2ff?style=flat-square&labelColor=08090D" alt="Win32" />
        <img src="https://img.shields.io/badge/GUARD-Anti--Flicker_Debounced-FFE600?style=flat-square&labelColor=08090D" alt="Anti-Flicker" />
      </td>
    </tr>
  </tbody>
</table>

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="33.3%" align="left">
        <img src="https://img.shields.io/badge/01-RAPID_FLYOUT-20ffa0?style=flat-square&labelColor=08090D" alt="01 Rapid Flyout" /><br />
        <h3>Single-Click Tactical HUD</h3>
        <sub>340x460px Borderless Hardware Window</sub>
      </th>
      <th width="33.3%" align="left">
        <img src="https://img.shields.io/badge/02-LIVE_TELEMETRY-20f2ff?style=flat-square&labelColor=08090D" alt="02 Live Telemetry" /><br />
        <h3>0 ms IPC &amp; Reactor Pulse</h3>
        <sub>Rust Core Engine &bull; WinDivert Kernel Bridge</sub>
      </th>
      <th width="33.3%" align="left">
        <img src="https://img.shields.io/badge/03-SHELL_GUARD-FFE600?style=flat-square&labelColor=08090D" alt="03 Shell Guard" /><br />
        <h3>Anti-Flicker &amp; Rapid Action</h3>
        <sub>Debounced Win32 State Coordinator</sub>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td valign="top">
        &bull; <b>Single-Click Elevation:</b> Hardware-accelerated compact flyout immediately rises above the taskbar notification area.<br /><br />
        &bull; <b>Seamless Blur Dismiss:</b> Automatically dismisses without delay when clicking outside or pressing <kbd>Esc</kbd>.<br /><br />
        &bull; <b>Zero RAM Overhead:</b> Sleeps in low-power idle with 0 MB CPU overhead; awakes in microseconds upon click.
      </td>
      <td valign="top">
        &bull; <b>Real-Time Throughput:</b> Instantaneous packet rate (PPS) and <code>0.12 ms</code> IPC latency telemetry stream.<br /><br />
        &bull; <b>Profile &amp; Rule Beacon:</b> Direct visibility into which bypass profile and SNI rule is currently engaged.<br /><br />
        &bull; <b>Zero Egress Penalty:</b> Kernel driver and UI communicate over shared memory ring buffer for zero-lag updates.
      </td>
      <td valign="top">
        &bull; <b>Anti-Flicker Guard:</b> Debounced event coordinator eliminates window flickering during rapid successive clicks.<br /><br />
        &bull; <b>Double-Click Maximize:</b> Double-clicking the notification tray icon directly foregrounds the primary cockpit.<br /><br />
        &bull; <b>One-Touch Intervention:</b> Stop/start engine protection or execute <i>Network Repair</i> with a single touch.
      </td>
    </tr>
  </tbody>
</table>

---

## Frequently Asked Questions (FAQ)

<details>
<summary><b>1. Can Anticore cause bans in anti-cheat protected games (Valorant, CS2, LoL)?</b></summary>
<br />
<b>Strictly no.</b> Anticore never touches game files, process memory, or game server communication. It exclusively manipulates the initial handshake of domains explicitly listed in your target blacklist. UDP and TCP gaming traffic pass through your network stack directly without alteration.
</details>

<details>
<summary><b>2. Why do some antivirus engines trigger alerts?</b></summary>
<br />
Anticore uses the open-source, industry-standard <code>WinDivert</code> driver to capture packets at the network layer. Like other legitimate network diagnostic software (Wireshark, Fiddler, GoodbyeDPI), heuristic scanners may flag kernel driver installations. All Anticore source code is publicly inspectable, GitHub builds are transparent, and binaries are digitally signed.
</details>

<details>
<summary><b>3. Why are Administrator privileges mandatory?</b></summary>
<br />
Under Windows security architecture, loading kernel drivers and binding raw network packet filters is strictly restricted to elevated processes. This is a technical operating system requirement.
</details>

<details>
<summary><b>4. How do I protect mobile devices (iOS / Android) on my Wi-Fi?</b></summary>
<br />
You can choose between two methods:<br />
1. <b>SOCKS5 / PAC Proxy:</b> On your mobile device, enter your PC's local IP address (e.g. <code>192.168.1.50</code>) and port <code>10808</code> in your Wi-Fi HTTP proxy settings.<br />
2. <b>Windows Mobile Hotspot:</b> Enable Hotspot on your PC and connect your mobile device. Anticore automatically intercepts forward transit packets without requiring any configuration on the phone.
</details>

<details>
<summary><b>5. How do I fix Discord stuck at "Starting..."?</b></summary>
<br />
This issue is caused by ISP DNS poisoning directing Discord CDN domains to warning landing pages. Open Anticore's <b>Network Repair</b> tab, click <b>"Apply Secure DNS"</b> and <b>"Reset Network Stack"</b> to flush poisoned resolver caches.
</details>

---

## Security and Integrity Verification

Official distribution binaries can be verified using Minisign and the project public key:

```text
dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDE1QTRFREEwMDFGNDFFNTMKUldSVEh2UUJvTzJrRmE3UGFDdG81YWtnYUdYSkhFdWQxVGJ0V2VVdHFKNDJvaGZRWS90TWx3ejMK
```

Verification command:
```powershell
minisign -Vm Anticore_0.3.1_x64-setup.exe -p anticore.key.pub
```

Read our [SECURITY.md](SECURITY.md) for vulnerability disclosure procedures and guidelines.

---

## Building from Source

To compile the binaries from source:

### Prerequisites
- Rust 1.80+ (`rustup toolchain install stable`)
- Node.js 20+ LTS (`npm`)
- Visual Studio 2022 C++ Build Tools (MSVC x64)

```powershell
# 1. Clone the repository
git clone https://github.com/MonarchDevLab/Anticore.git
cd Anticore/antikor

# 2. Run Rust unit and integration tests (52 tests)
cd engine
cargo test --workspace

# 3. Build the release engine binary
cargo build --release --workspace

# 4. Install desktop dependencies and build
cd ../desktop
npm install
npm test
npm run tauri build
```

---

## License & Intellectual Property

This project is licensed under the [MIT License](LICENSE).

- **WinDivert:** Independent open-source network capture driver licensed under [LGPLv3](https://reqrypt.org/windivert.html); dynamically loaded without source modifications.
- **WebView2:** Copyright Microsoft Corporation.
- **Legal Notice:** Anticore is developed for network performance analysis, digital privacy, and unrestricted information access. Users remain responsible for complying with local regulations.

<div align="center">
  <br />
  <sub>Architectural design and copyright strictly held by <b>Monolith Works</b>. Published via official open-source channel <b>MonarchDevLab</b>.</sub>
  <br />
  <br />
</div>
