<div align="center">

<p align="center">
  <img src="assets/banner.svg" alt="ANTICORE - Zero-Loss DPI Circumvention Suite" width="100%" style="max-width: 880px;" />
</p>

# ANTICORE

### Leistungsstarke Open-Source-Suite zur DPI-Umgehung und Netzwerkfreiheit für Windows und macOS ohne Geschwindigkeitsverlust

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
      <a href="#download-optionen-v038"><img src="https://img.shields.io/badge/01-DOWNLOADS-20ffa0?style=for-the-badge&labelColor=08090D" alt="01 Downloads" /></a>
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

## Download-Optionen (v0.3.8)

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
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.8/anticore-desktop.exe"><img src="https://img.shields.io/badge/DOWNLOAD_.EXE-16.8_MB-20ffa0?style=for-the-badge&labelColor=08090D" alt="Download EXE" /></a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.8/Anticore_0.3.8_x64-setup.exe"><img src="https://img.shields.io/badge/DOWNLOAD_.EXE-4.65_MB-20f2ff?style=for-the-badge&labelColor=08090D" alt="Download EXE" /></a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.8/Anticore_0.3.8_x64_en-US.msi"><img src="https://img.shields.io/badge/DOWNLOAD_.MSI-6.5_MB-FFE600?style=for-the-badge&labelColor=08090D" alt="Download MSI" /></a>
      </td>
    </tr>
    <tr>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.8/anticore-desktop.exe"><img src="https://img.shields.io/badge/STANDALONE-anticore--desktop.exe_(16.8_MB)-20ffa0?style=flat-square&labelColor=08090D" alt="anticore-desktop.exe" /></a>
      </td>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.8/Anticore_0.3.8_x64-setup.exe"><img src="https://img.shields.io/badge/SETUP_INSTALLER-Anticore__0.3.8__x64--setup.exe-20f2ff?style=flat-square&labelColor=08090D" alt="Setup" /></a>
      </td>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/latest"><img src="https://img.shields.io/badge/ARCHIV-Alle_Releases-FFFFFF?style=flat-square&labelColor=08090D" alt="Alle Releases" /></a>
      </td>
    </tr>
  </tbody>
</table>

### Android Mobil (v0.3.8)

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
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.8/Anticore-v0.3.8.apk"><img src="https://img.shields.io/badge/DOWNLOAD_.APK-Universal_(Android_8.0+)-20ffa0?style=for-the-badge&labelColor=08090D" alt="Download APK" /></a>
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
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.7/Anticore_0.3.7_arm64.pkg"><img src="https://img.shields.io/badge/INSTALLER_.PKG-arm64-20ffa0?style=for-the-badge&labelColor=08090D" alt="arm64 PKG" /></a>&nbsp;
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.7/Anticore_0.3.7_aarch64.dmg"><img src="https://img.shields.io/badge/DISK_IMAGE_.DMG-arm64-20f2ff?style=for-the-badge&labelColor=08090D" alt="arm64 DMG" /></a>
      </td>
      <td align="center">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.7/Anticore_0.3.7_x64.pkg"><img src="https://img.shields.io/badge/INSTALLER_.PKG-x64-20ffa0?style=for-the-badge&labelColor=08090D" alt="x64 PKG" /></a>&nbsp;
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.7/Anticore_0.3.7_x64.dmg"><img src="https://img.shields.io/badge/DISK_IMAGE_.DMG-x64-20f2ff?style=for-the-badge&labelColor=08090D" alt="x64 DMG" /></a>
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
| `Anticore_0.3.8_x64-setup.exe` | 4.5 MB | `7FB3D04DEBA95119F1D53D7485AD8A46D5473BE8DDDE286E1C9E25D4FC6CDE76` |
| `anticore-desktop.exe` | 16.8 MB | `FC805530210112B62A12CA9FCCE3AD91122F40C6C0426E44C86B4D1568F523AC` |
| `Anticore_0.3.8_x64_en-US.msi` | 6.5 MB | `AD11DD3157FAC530A8C0ED5F299CC9AA8EEC0B8843B8981DDA70226BAF58E9FB` |
| `Anticore-v0.3.8.apk` (Android) | 42.3 MB | `D036DCC5B434DA7C3EE3998A2DCEB9282FDC5363FB36B9BA933263E2B138EA68` |
| `Anticore_0.3.7_arm64.pkg` | 6.2 MB | `A2FB220E4F9C5ECD1109C977903E21FFA16DE5A24B098EF823A8C801B18F837C` |
| `Anticore_0.3.7_aarch64.dmg` | 6.7 MB | `B774324462FA35C9A1B3B2B76BFA2976CE705D174A3CB611C64343D4E2A4152F` |
| `Anticore_0.3.7_x64.pkg` | 6.4 MB | `2EA284E231E7FE4F3A665E40A0E45B2BB8CA534FF430229DC6BF8C1EC73CBBD0` |
| `Anticore_0.3.7_x64.dmg` | 6.9 MB | `2026542CB88BDB22CAE8A6FCC81F1BF38A6B1EA42C2ECF066979890AB7144946` |

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

## Lizenz

Open-Source unter der MIT-Lizenz.
Alle Rechte liegen bei **Monolith Works**. Veröffentlichung über **MonarchDevLab**.
