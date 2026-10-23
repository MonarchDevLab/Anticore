<div align="center">

<p align="center">
  <img src="assets/banner.png?v=0.4.0-3d" alt="ANTICORE - Zero-Loss DPI Circumvention Suite" width="100%" style="max-width: 880px;" />
</p>

# ANTICORE

### Leistungsstarke Open-Source-Suite zur DPI-Umgehung und Netzwerkfreiheit für Windows, macOS und Android ohne Geschwindigkeitsverlust

[![Version](https://img.shields.io/github/v/release/MonarchDevLab/Anticore?style=for-the-badge&color=20ffa0&labelColor=08090D&logo=github)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/MonarchDevLab/Anticore/total?style=for-the-badge&color=20f2ff&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Plattform](https://img.shields.io/badge/Plattform-Windows%20%7C%20macOS%20%7C%20Android-20f2ff?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Kern](https://img.shields.io/badge/Kern-WinDivert%20%2B%20macOS%20UTUN-FF2A4D?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![UI](https://img.shields.io/badge/UI-Tauri%202.0%20%2B%20React%2019-FFE600?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Tests](https://img.shields.io/badge/Tests-72%20Bestanden-20ffa0?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Datenschutz](https://img.shields.io/badge/Schutz-Zero%20Leakage%20PASS-20f2ff?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Signatur](https://img.shields.io/badge/Signatur-Minisign%20Verifiziert-20ffa0?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Lizenz](https://img.shields.io/badge/Lizenz-MIT-FFFFFF?style=for-the-badge&labelColor=08090D)](LICENSE)

<br />

<p align="center">
  <a href="README.md"><img src="assets/languages/badge-tr.svg" alt="Türkçe" height="28" /></a>&nbsp;
  <a href="README.en.md"><img src="assets/languages/badge-en.svg" alt="English" height="28" /></a>&nbsp;
  <a href="README.ru.md"><img src="assets/languages/badge-ru.svg" alt="Русский" height="28" /></a>&nbsp;
  <a href="README.de.md"><img src="assets/languages/badge-de.svg" alt="Deutsch" height="28" /></a>&nbsp;
  <a href="README.fr.md"><img src="assets/languages/badge-fr.svg" alt="Français" height="28" /></a>
</p>

<br />

**Lokale Paketmanipulations-Engine der nächsten Generation zur Umgehung von Deep Packet Inspection (DPI)-Filtern und ISP-Zensur. Funktioniert vollständig lokal ohne Umleitung über Drittanbieter-VPN- oder Proxy-Server – 100 % Durchsatz und minimaler Ping bleiben erhalten.**

<br />

<table width="100%" align="center">
  <tr>
    <td width="25%" align="center">
      <a href="#download-optionen-v039"><img src="https://img.shields.io/badge/01-DOWNLOADS-20ffa0?style=for-the-badge&labelColor=08090D" alt="01 Downloads" /></a>
    </td>
    <td width="25%" align="center">
      <a href="#was-anticore-ist"><img src="https://img.shields.io/badge/02-ARCHITEKTUR-20f2ff?style=for-the-badge&labelColor=08090D" alt="02 Architektur" /></a>
    </td>
    <td width="25%" align="center">
      <a href="#hauptmerkmale"><img src="https://img.shields.io/badge/03-FUNKTIONEN-FFE600?style=for-the-badge&labelColor=08090D" alt="03 Funktionen" /></a>
    </td>
    <td width="25%" align="center">
      <a href="#funktionsweise"><img src="https://img.shields.io/badge/04-ABLAUF-FF7733?style=for-the-badge&labelColor=08090D" alt="04 Ablauf" /></a>
    </td>
  </tr>
</table>

</div>

---

## Download-Optionen (v0.4.0)

Alle Binärdateien wurden direkt aus dem Quellcode kompiliert, vollständig von Build-Pfaden bereinigt (Zero Leakage) und mit Minisign digital signiert.

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="33.3%" align="center">
        <img src="https://img.shields.io/badge/01-PORTABLE_EXE-20ffa0?style=for-the-badge&labelColor=08090D" alt="Portable" /><br /><br />
        <b>Portables Paket (EXE)</b><br />
        <small>Keine Installation erforderlich. Läuft direkt aus dem Ordner oder USB-Stick. Keine Registry-Einträge.</small>
      </th>
      <th width="33.3%" align="center">
        <img src="https://img.shields.io/badge/02-SETUP_EXE-20f2ff?style=for-the-badge&labelColor=08090D" alt="Setup EXE" /><br /><br />
        <b>Standard-Installer (EXE)</b><br />
        <small>Startmenü- und Desktop-Verknüpfung, nahtlose automatische Updates und saubere Deinstallation.</small>
      </th>
      <th width="33.3%" align="center">
        <img src="https://img.shields.io/badge/03-MSI_ENTERPRISE-FFE600?style=for-the-badge&labelColor=08090D" alt="MSI Enterprise" /><br /><br />
        <b>Enterprise-Paket (MSI)</b><br />
        <small>Für automatisierte Verteilung über Active Directory GPO, Microsoft Intune oder SCCM.</small>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.4.0/Anticore.exe"><img src="https://img.shields.io/badge/DOWNLOAD_.EXE-17.6_MB-20ffa0?style=for-the-badge&labelColor=08090D" alt="Download EXE" /></a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.4.0/Anticore_0.4.0_x64-setup.exe"><img src="https://img.shields.io/badge/DOWNLOAD_.EXE-4.79_MB-20f2ff?style=for-the-badge&labelColor=08090D" alt="Download EXE" /></a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.4.0/Anticore_0.4.0_x64_en-US.msi"><img src="https://img.shields.io/badge/DOWNLOAD_.MSI-6.88_MB-FFE600?style=for-the-badge&labelColor=08090D" alt="Download MSI" /></a>
      </td>
    </tr>
    <tr>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.4.0/Anticore.exe"><img src="https://img.shields.io/badge/STANDALONE-Anticore.exe_(17.6_MB)-20ffa0?style=flat-square&labelColor=08090D" alt="Anticore.exe" /></a>
      </td>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.4.0/Anticore_0.4.0_x64-setup.exe"><img src="https://img.shields.io/badge/SETUP_INSTALLER-Anticore__0.4.0__x64--setup.exe-20f2ff?style=flat-square&labelColor=08090D" alt="Setup" /></a>
      </td>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/latest"><img src="https://img.shields.io/badge/ARCHIV-Alle_Releases-FFFFFF?style=flat-square&labelColor=08090D" alt="Alle Releases" /></a>
      </td>
    </tr>
  </tbody>
</table>

### Android Mobil (v0.4.0)

Nativer DNS- & DPI-Umgehungsclient für Android (API 26 / Android 8.0+):

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="50%" align="center">
        <img src="https://img.shields.io/badge/01-ANDROID_APK-20ffa0?style=for-the-badge&labelColor=08090D" alt="Android APK" /><br /><br />
        <b>Universelles APK-Paket</b><br />
        <small>ARM64 (aarch64), ARMv7 und x86_64 Architekturen.</small>
      </th>
      <th width="50%" align="center">
        <img src="https://img.shields.io/badge/02-MOBILE_SICHERHEIT-20f2ff?style=for-the-badge&labelColor=08090D" alt="Mobile Sicherheit" /><br /><br />
        <b>Ohne Root & Lokale Verarbeitung</b><br />
        <small>Kein Root erforderlich; umgeht ISP-Zensur direkt auf dem Gerät über lokalen Tunnel.</small>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.4.0/Anticore-v0.4.0.apk"><img src="https://img.shields.io/badge/DOWNLOAD_.APK-Universal_(Android_8.0+)-20ffa0?style=for-the-badge&labelColor=08090D" alt="Download APK" /></a>
      </td>
      <td align="center" valign="middle">
        <img src="https://img.shields.io/badge/SICHERHEIT-KEIN_ROOT_%E2%80%A2_ZERO_LOG-20f2ff?style=flat-square&labelColor=08090D" alt="Kein Root" />
      </td>
    </tr>
  </tbody>
</table>

<br />

### macOS Pakete (Apple Silicon & Intel)

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="50%" align="center"><b>Apple Silicon (arm64)</b></th>
      <th width="50%" align="center"><b>Intel Mac (x64)</b></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.4.0/Anticore_0.4.0_arm64.pkg"><img src="https://img.shields.io/badge/INSTALLER_.PKG-arm64-20ffa0?style=for-the-badge&labelColor=08090D" alt="arm64 PKG" /></a>&nbsp;
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.4.0/Anticore_0.4.0_aarch64.dmg"><img src="https://img.shields.io/badge/DISK_IMAGE_.DMG-arm64-20f2ff?style=for-the-badge&labelColor=08090D" alt="arm64 DMG" /></a>
      </td>
      <td align="center">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.4.0/Anticore_0.4.0_x64.pkg"><img src="https://img.shields.io/badge/INSTALLER_.PKG-x64-20ffa0?style=for-the-badge&labelColor=08090D" alt="x64 PKG" /></a>&nbsp;
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.4.0/Anticore_0.4.0_x64.dmg"><img src="https://img.shields.io/badge/DISK_IMAGE_.DMG-x64-20f2ff?style=for-the-badge&labelColor=08090D" alt="x64 DMG" /></a>
      </td>
    </tr>
  </tbody>
</table>

#### macOS Schnellinstallation im Terminal (Einzeiler)
```bash
curl -fsSL https://raw.githubusercontent.com/MonarchDevLab/Anticore/main/scripts/macos-quick-install.sh | bash
```

---

## Prüfsummen-Tabelle (SHA-256)

| Datei | Größe | SHA-256 Prüfsumme |
|---|---|---|
| `Anticore_0.4.0_x64-setup.exe` | 4.71 MB | `4AD57922DA2002B410E083CD0EA8E9545D14A020FB37360A2CD2151528821A72` |
| `Anticore.exe` | 17.61 MB | `84D2F2B88887B209E3B122FEF8171C280722AC0B2274829A675346A95CE52A83` |
| `Anticore_0.4.0_x64_en-US.msi` | 6.74 MB | `32725BDC2AE266D9BA3AF14BFCDDA3BC8F18A8C0A9874D81BBA7C817DB168506` |
| `Anticore_0.4.0_x64-portable.zip` | 6.90 MB | `7AFD1C0F33EB8C4D5752AE48EC22EFFDDB459E40BDFBC450460FE349C1504816` |
| `Anticore-v0.4.0.apk` (Android) | 47.29 MB | `9F6478A01D2186EA45D9C91857016546A527EAD744138AED5135527DB0749C3F` |
| `Anticore_0.4.0_arm64.pkg` | 7.66 MB | `D4EF4117FCADD4BB1ED8711C2BBE747D409C6818F1EB32BAE63377C64303CD29` |
| `Anticore_0.4.0_aarch64.dmg` | 8.64 MB | `32DA99AD8531E7E7965F966BFF59FB989D57A3183CF7762F75FE58EABCC23B71` |
| `Anticore_0.4.0_x64.pkg` | 7.96 MB | `45B2765215F5A172C9CB8F1BE6B2851548A073CDEAADF1061F95D51018057716` |
| `Anticore_0.4.0_x64.dmg` | 8.88 MB | `7FFEEF68B0C5235ED9469B5EE512EAD98C41ACCFFB3ADFC8ADD8DCF2407D82A7` |

---

## Was ist Anticore?

Anticore ist eine moderne Softwarelösung zur DPI-Umgehung, entwickelt in **Rust** mit einer responsiven Benutzeroberfläche auf Basis von **Tauri 2.0 + React 19**. 
Sie modifiziert Pakete direkt im Betriebssystem-Netzwerkstack (WinDivert unter Windows, UTUN/pfctl unter macOS), sodass Zensursysteme (DPI) den angeforderten Hostnamen (SNI) nicht erkennen können.

---

## Hauptmerkmale

1. **Paketfragmentierung:** SNI Mid Split, HTTP-Header-Manipulation, OOB (Out-of-Band)-Bytes.
2. **Passive RST-Unterdrückung:** Verhindert TCP RST-Injektionen durch ISP-Middleboxes.
3. **QUIC-Blockierung (UDP 443):** Erzwingt stabiles TCP TLS 1.3 zur Beseitigung von Video-Wiedergabeproblemen.
4. **LAN-Freigabe & Proxy:** Port `10808` für Konsolen und Smartphones mit Fallback-DNS-Resolver (Cloudflare / Google) gegen DNS-Spoofing.
5. **Integriertes Support-Modul:** Fehler- und Feedback-Meldungen direkt in der App.
6. **5 Sprachen:** Deutsch, Englisch, Türkisch, Russisch, Französisch.

---

## Markenidentität & Visuelle Assets

Die Markenidentität von Anticore basiert auf einem taktischen cybernetischen Schild mit integriertem Quantenreaktorkern. Alle visuellen Ressourcen stehen im Repository in hoher Auflösung und als Vektordateien zur Verfügung:

<table width="100%" align="center">
  <tr>
    <td width="25%" align="center" bgcolor="#090E17">
      <img src="assets/anticore-3d-logo-transparent.png" width="130" alt="Anticore 3D Emblem" /><br /><br />
      <b>3D Taktischer Schild (PNG)</b><br />
      <small>Obsidian-Carbon, Titan &amp; Quantenkern (1024x1024).</small><br /><br />
      <a href="assets/anticore-3d-logo-transparent.png"><code>anticore-3d-logo-transparent.png</code></a>
    </td>
    <td width="25%" align="center" bgcolor="#090E17">
      <img src="assets/banner.png?v=0.4.0-3d" width="220" alt="Anticore Retina Banner" /><br /><br />
      <b>Ultra-HD Retina Banner</b><br />
      <small>1760x560 px, optimierter offizieller GitHub-Header für HiDPI-Displays.</small><br /><br />
      <a href="assets/banner.png"><code>assets/banner.png</code></a>
    </td>
    <td width="25%" align="center" bgcolor="#090E17">
      <img src="assets/social-preview.png" width="220" alt="Anticore Social Preview" /><br /><br />
      <b>Social Preview (OpenGraph)</b><br />
      <small>1280x640 px, Vorschaukarte für GitHub, X &amp; Discord.</small><br /><br />
      <a href="assets/social-preview.png"><code>assets/social-preview.png</code></a>
    </td>
    <td width="25%" align="center" bgcolor="#090E17">
      <img src="desktop/src-tauri/icons/icon-inactive.png" width="110" alt="Anticore Offline-Status" /><br /><br />
      <b>Inaktiver / Offline-Status</b><br />
      <small>Taktischer roter Warnkern im System-Tray bei gestoppter DPI-Engine.</small><br /><br />
      <a href="desktop/src-tauri/icons/icon-inactive.png"><code>icon-inactive.png</code></a>
    </td>
  </tr>
</table>

---

## Lizenz

Open-Source unter der MIT-Lizenz.
Alle Rechte liegen bei **Monolith Works**. Veröffentlichung über **MonarchDevLab**.
