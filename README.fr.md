<div align="center">

<p align="center">
  <img src="assets/banner.svg?v=0.3.9" alt="ANTICORE - Zero-Loss DPI Circumvention Suite" width="100%" style="max-width: 880px;" />
</p>

<p align="center">
  <img src="assets/anticore-3d-logo-transparent.png" alt="ANTICORE 3D Tactical Shield Emblem" width="150" />
</p>

# ANTICORE

### Suite open-source haute performance de contournement DPI et de liberté réseau pour Windows et macOS sans perte de débit

[![Version](https://img.shields.io/github/v/release/MonarchDevLab/Anticore?style=for-the-badge&color=20ffa0&labelColor=08090D&logo=github)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Téléchargements](https://img.shields.io/github/downloads/MonarchDevLab/Anticore/total?style=for-the-badge&color=20f2ff&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Plateforme](https://img.shields.io/badge/Plateforme-Windows%20%7C%20macOS%20%7C%20Android-20f2ff?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Noyau](https://img.shields.io/badge/Noyau-WinDivert%20%2B%20macOS%20UTUN-FF2A4D?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Interface](https://img.shields.io/badge/Interface-Tauri%202.0%20%2B%20React%2019-FFE600?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Tests](https://img.shields.io/badge/Tests-72%20Réussis-20ffa0?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Protection](https://img.shields.io/badge/Protection-Zero%20Leakage%20PASS-20f2ff?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Signature](https://img.shields.io/badge/Signature-Minisign%20Vérifié-20ffa0?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Licence](https://img.shields.io/badge/Licence-MIT-FFFFFF?style=for-the-badge&labelColor=08090D)](LICENSE)

<br />

<p align="center">
  <a href="README.md"><img src="assets/languages/badge-tr.svg" alt="Türkçe" height="28" /></a>&nbsp;
  <a href="README.en.md"><img src="assets/languages/badge-en.svg" alt="English" height="28" /></a>&nbsp;
  <a href="README.ru.md"><img src="assets/languages/badge-ru.svg" alt="Русский" height="28" /></a>&nbsp;
  <a href="README.de.md"><img src="assets/languages/badge-de.svg" alt="Deutsch" height="28" /></a>&nbsp;
  <a href="README.fr.md"><img src="assets/languages/badge-fr.svg" alt="Français" height="28" /></a>
</p>

<br />

**Moteur de manipulation de paquets local de nouvelle génération conçu pour contourner la censure des FAI et les boîtes d'inspection approfondie des paquets (DPI). Fonctionne entièrement en local sans routage vers des serveurs VPN ou proxys tiers — préservant 100 % de votre débit et de votre latence.**

<br />

<table width="100%" align="center">
  <tr>
    <td width="25%" align="center">
      <a href="#options-de-téléchargement-v039"><img src="https://img.shields.io/badge/01-TÉLÉCHARGEMENTS-20ffa0?style=for-the-badge&labelColor=08090D" alt="01 Téléchargements" /></a>
    </td>
    <td width="25%" align="center">
      <a href="#quest-ce-que-anticore"><img src="https://img.shields.io/badge/02-ARCHITECTURE-20f2ff?style=for-the-badge&labelColor=08090D" alt="02 Architecture" /></a>
    </td>
    <td width="25%" align="center">
      <a href="#fonctionnalités-clés"><img src="https://img.shields.io/badge/03-FONCTIONS-FFE600?style=for-the-badge&labelColor=08090D" alt="03 Fonctions" /></a>
    </td>
    <td width="25%" align="center">
      <a href="#fonctionnement"><img src="https://img.shields.io/badge/04-FLUX-FF7733?style=for-the-badge&labelColor=08090D" alt="04 Flux" /></a>
    </td>
  </tr>
</table>

</div>

---

## Options de téléchargement (v0.3.9)

Tous les exécutables sont directement compilés depuis les sources, exempts de chemins de construction (Zero Leakage) et signés avec Minisign.

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="33.3%" align="center">
        <img src="https://img.shields.io/badge/01-PORTABLE_EXE-20ffa0?style=for-the-badge&labelColor=08090D" alt="Portable" /><br /><br />
        <b>Version Portable (EXE)</b><br />
        <small>Sans installation. Prêt à l'emploi depuis un dossier ou une clé USB. Ne modifie pas le registre.</small>
      </th>
      <th width="33.3%" align="center">
        <img src="https://img.shields.io/badge/02-SETUP_EXE-20f2ff?style=for-the-badge&labelColor=08090D" alt="Setup EXE" /><br /><br />
        <b>Installateur Standard (EXE)</b><br />
        <small>Raccourcis bureau et menu démarrer, mises à jour automatiques et désinstallation propre.</small>
      </th>
      <th width="33.3%" align="center">
        <img src="https://img.shields.io/badge/03-MSI_ENTERPRISE-FFE600?style=for-the-badge&labelColor=08090D" alt="MSI Enterprise" /><br /><br />
        <b>Package Entreprise (MSI)</b><br />
        <small>Pour déploiements via Active Directory GPO, Microsoft Intune ou SCCM.</small>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore.exe"><img src="https://img.shields.io/badge/TÉLÉCHARGER_.EXE-17.6_MB-20ffa0?style=for-the-badge&labelColor=08090D" alt="Télécharger EXE" /></a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore_0.3.9_x64-setup.exe"><img src="https://img.shields.io/badge/TÉLÉCHARGER_.EXE-4.79_MB-20f2ff?style=for-the-badge&labelColor=08090D" alt="Télécharger EXE" /></a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore_0.3.9_x64_en-US.msi"><img src="https://img.shields.io/badge/TÉLÉCHARGER_.MSI-6.88_MB-FFE600?style=for-the-badge&labelColor=08090D" alt="Télécharger MSI" /></a>
      </td>
    </tr>
    <tr>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore.exe"><img src="https://img.shields.io/badge/STANDALONE-Anticore.exe_(17.6_MB)-20ffa0?style=flat-square&labelColor=08090D" alt="Anticore.exe" /></a>
      </td>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore_0.3.9_x64-setup.exe"><img src="https://img.shields.io/badge/SETUP_INSTALLATEUR-Anticore__0.3.9__x64--setup.exe-20f2ff?style=flat-square&labelColor=08090D" alt="Setup" /></a>
      </td>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/latest"><img src="https://img.shields.io/badge/ARCHIVE-Toutes_les_versions-FFFFFF?style=flat-square&labelColor=08090D" alt="Toutes les versions" /></a>
      </td>
    </tr>
  </tbody>
</table>

### Station Mobile Android (v0.3.9)

Client natif de contournement DNS & DPI pour Android (API 26 / Android 8.0+) :

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="50%" align="center">
        <img src="https://img.shields.io/badge/01-ANDROID_APK-20ffa0?style=for-the-badge&labelColor=08090D" alt="Android APK" /><br /><br />
        <b>Paquet APK Universel</b><br />
        <small>Architectures ARM64 (aarch64), ARMv7 et x86_64 prises en charge.</small>
      </th>
      <th width="50%" align="center">
        <img src="https://img.shields.io/badge/02-SÉCURITÉ_MOBILE-20f2ff?style=for-the-badge&labelColor=08090D" alt="Sécurité Mobile" /><br /><br />
        <b>Sans Root & Traitement Local</b><br />
        <small>Aucun privilège root requis ; contourne la censure directement sur l'appareil via tunnel local.</small>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore-v0.3.9.apk"><img src="https://img.shields.io/badge/TÉLÉCHARGER_.APK-Universal_(Android_8.0+)-20ffa0?style=for-the-badge&labelColor=08090D" alt="Télécharger APK" /></a>
      </td>
      <td align="center" valign="middle">
        <img src="https://img.shields.io/badge/SÉCURITÉ-SANS_ROOT_%E2%80%A2_ZERO_LOG-20f2ff?style=flat-square&labelColor=08090D" alt="Sans Root" />
      </td>
    </tr>
  </tbody>
</table>

<br />

### Packages macOS (Apple Silicon & Intel)

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
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore_0.3.9_arm64.pkg"><img src="https://img.shields.io/badge/INSTALLATEUR_.PKG-arm64-20ffa0?style=for-the-badge&labelColor=08090D" alt="arm64 PKG" /></a>&nbsp;
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore_0.3.9_aarch64.dmg"><img src="https://img.shields.io/badge/IMAGE_.DMG-arm64-20f2ff?style=for-the-badge&labelColor=08090D" alt="arm64 DMG" /></a>
      </td>
      <td align="center">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore_0.3.9_x64.pkg"><img src="https://img.shields.io/badge/INSTALLATEUR_.PKG-x64-20ffa0?style=for-the-badge&labelColor=08090D" alt="x64 PKG" /></a>&nbsp;
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore_0.3.9_x64.dmg"><img src="https://img.shields.io/badge/IMAGE_.DMG-x64-20f2ff?style=for-the-badge&labelColor=08090D" alt="x64 DMG" /></a>
      </td>
    </tr>
  </tbody>
</table>

#### Installation rapide macOS en une seule ligne (Terminal)
```bash
curl -fsSL https://raw.githubusercontent.com/MonarchDevLab/Anticore/main/scripts/macos-quick-install.sh | bash
```

---

## Tableau des sommes de contrôle SHA-256

| Fichier | Taille | Somme de contrôle SHA-256 |
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

## Qu'est-ce qu'Anticore ?

Anticore est un logiciel open-source de contournement DPI développé en **Rust** avec une interface utilisateur moderne en **Tauri 2.0 + React 19**.
Il manipule les paquets réseau directement dans la pile IP du système (WinDivert sous Windows, UTUN/pfctl sous macOS) pour empêcher les équipements de censure (DPI) de détecter les domaines consultés (SNI).

---

## Fonctionnalités clés

1. **Fragmentation avancée des paquets :** Découpage SNI (SNI Mid Split), manipulation d'en-têtes HTTP, octets OOB (Out-of-Band).
2. **Défense passive contre les RST :** Neutralisation des paquets TCP RST falsifiés émis par les FAI.
3. **Blocage QUIC (UDP 443) :** Bascule vers TLS 1.3 sur TCP pour éliminer les écrans noirs sur les flux vidéo.
4. **Partage réseau local (LAN Share & Proxy) :** Port `10808` pour consoles (PS5, Xbox, Switch) et mobiles (iOS, Android) avec résolveur DNS de secours (Cloudflare / Google) contre l'empoisonnement DNS.
5. **Module d'assistance intégré :** Envoi simplifié de rapports d'incident et de suggestions depuis l'application.
6. **Support multilingue :** Français, Anglais, Turc, Russe, Allemand.

---

## Licence

Sous licence open-source MIT.
Tous les droits sont réservés à **Monolith Works**. Publication via **MonarchDevLab**.
