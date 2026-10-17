<div align="center">

<p align="center">
  <img src="assets/banner.svg?v=0.3.9" alt="ANTICORE - Zero-Loss DPI Circumvention Suite" width="100%" style="max-width: 880px;" />
</p>

<p align="center">
  <img src="assets/anticore-3d-logo-transparent.png" alt="ANTICORE 3D Tactical Shield Emblem" width="150" />
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

## Download-Optionen (v0.3.9)

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
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore.exe"><img src="https://img.shields.io/badge/DOWNLOAD_.EXE-17.6_MB-20ffa0?style=for-the-badge&labelColor=08090D" alt="Download EXE" /></a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore_0.3.9_x64-setup.exe"><img src="https://img.shields.io/badge/DOWNLOAD_.EXE-4.79_MB-20f2ff?style=for-the-badge&labelColor=08090D" alt="Download EXE" /></a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore_0.3.9_x64_en-US.msi"><img src="https://img.shields.io/badge/DOWNLOAD_.MSI-6.88_MB-FFE600?style=for-the-badge&labelColor=08090D" alt="Download MSI" /></a>
      </td>
    </tr>
    <tr>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore.exe"><img src="https://img.shields.io/badge/STANDALONE-Anticore.exe_(17.6_MB)-20ffa0?style=flat-square&labelColor=08090D" alt="Anticore.exe" /></a>
      </td>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore_0.3.9_x64-setup.exe"><img src="https://img.shields.io/badge/SETUP_INSTALLER-Anticore__0.3.9__x64--setup.exe-20f2ff?style=flat-square&labelColor=08090D" alt="Setup" /></a>
      </td>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/latest"><img src="https://img.shields.io/badge/ARCHIV-Alle_Releases-FFFFFF?style=flat-square&labelColor=08090D" alt="Alle Releases" /></a>
      </td>
    </tr>
  </tbody>
</table>

### Android Mobil (v0.3.9)

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
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore-v0.3.9.apk"><img src="https://img.shields.io/badge/DOWNLOAD_.APK-Universal_(Android_8.0+)-20ffa0?style=for-the-badge&labelColor=08090D" alt="Download APK" /></a>
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
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore_0.3.9_arm64.pkg"><img src="https://img.shields.io/badge/INSTALLER_.PKG-arm64-20ffa0?style=for-the-badge&labelColor=08090D" alt="arm64 PKG" /></a>&nbsp;
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore_0.3.9_aarch64.dmg"><img src="https://img.shields.io/badge/DISK_IMAGE_.DMG-arm64-20f2ff?style=for-the-badge&labelColor=08090D" alt="arm64 DMG" /></a>
      </td>
      <td align="center">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore_0.3.9_x64.pkg"><img src="https://img.shields.io/badge/INSTALLER_.PKG-x64-20ffa0?style=for-the-badge&labelColor=08090D" alt="x64 PKG" /></a>&nbsp;
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore_0.3.9_x64.dmg"><img src="https://img.shields.io/badge/DISK_IMAGE_.DMG-x64-20f2ff?style=for-the-badge&labelColor=08090D" alt="x64 DMG" /></a>
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
| `Anticore_0.3.9_x64-setup.exe` | 4.79 MB | `81F1B82E5D7111FD02AE0E5B3B7824A1CE8CB597BB6A918A712A5023DCCE4560` |
| `Anticore.exe` | 17.58 MB | `2C0086DE67D725687B26CE946BE90B5CDA4D622B1690FC6FDAA4B620B63A512B` |
| `Anticore_0.3.9_x64_en-US.msi` | 6.88 MB | `1E712FDF07CCE6D9F412B206B7C41E3388A51F20F4170A51A3C3045EA47BDB8C` |
| `Anticore_0.3.9_x64-portable.zip` | 6.77 MB | `9E42DCD01342E75399F051EFDF9F013DCF8E3027AEE91F409608E20C79F25517` |
| `Anticore-v0.3.9.apk` (Android) | 47.40 MB | `8FC1775A54B7F0632ABC0B30C4133C62FB6CD6A6732D299BDE4C9703EC93E278` |
| `Anticore_0.3.9_arm64.pkg` | 6.69 MB | `752645914DA7DB08CCA4C3FA278C9269FD4CC8E75DF61FAB8B31D7A7CFC4A67E` |
| `Anticore_0.3.9_aarch64.dmg` | 6.67 MB | `3718950D281A3ADB3338E2B6D6B6C37BCFBA400C73BBB22C7D3E01A04855E0CA` |
| `Anticore_0.3.9_x64.pkg` | 6.99 MB | `BB3E7ED3B1CEC5F875B23D2369820BB3C43269FF9AEC19707E4794197205F4D3` |
| `Anticore_0.3.9_x64.dmg` | 6.93 MB | `EF6FE6B305AAA66ECEADF362B65B89F77F62BBF0D5A4616A473548774CE3E60E` |

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
