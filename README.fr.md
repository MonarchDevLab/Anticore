<div align="center">

<p align="center">
  <img src="assets/banner.png?v=0.4.0-3d" alt="ANTICORE - Zero-Loss DPI Circumvention Suite" width="100%" style="max-width: 880px;" />
</p>

# ANTICORE

### Suite open-source haute performance de contournement DPI et de liberté réseau pour Windows, macOS et Android sans perte de débit

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

## Options de téléchargement (v0.4.0)

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
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.4.0/Anticore.exe"><img src="https://img.shields.io/badge/TÉLÉCHARGER_.EXE-17.6_MB-20ffa0?style=for-the-badge&labelColor=08090D" alt="Télécharger EXE" /></a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.4.0/Anticore_0.4.0_x64-setup.exe"><img src="https://img.shields.io/badge/TÉLÉCHARGER_.EXE-4.79_MB-20f2ff?style=for-the-badge&labelColor=08090D" alt="Télécharger EXE" /></a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.4.0/Anticore_0.4.0_x64_en-US.msi"><img src="https://img.shields.io/badge/TÉLÉCHARGER_.MSI-6.88_MB-FFE600?style=for-the-badge&labelColor=08090D" alt="Télécharger MSI" /></a>
      </td>
    </tr>
    <tr>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.4.0/Anticore.exe"><img src="https://img.shields.io/badge/STANDALONE-Anticore.exe_(17.6_MB)-20ffa0?style=flat-square&labelColor=08090D" alt="Anticore.exe" /></a>
      </td>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.4.0/Anticore_0.4.0_x64-setup.exe"><img src="https://img.shields.io/badge/SETUP_INSTALLATEUR-Anticore__0.4.0__x64--setup.exe-20f2ff?style=flat-square&labelColor=08090D" alt="Setup" /></a>
      </td>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/latest"><img src="https://img.shields.io/badge/ARCHIVE-Toutes_les_versions-FFFFFF?style=flat-square&labelColor=08090D" alt="Toutes les versions" /></a>
      </td>
    </tr>
  </tbody>
</table>

### Station Mobile Android (v0.4.0)

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
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.4.0/Anticore-v0.4.0.apk"><img src="https://img.shields.io/badge/TÉLÉCHARGER_.APK-Universal_(Android_8.0+)-20ffa0?style=for-the-badge&labelColor=08090D" alt="Télécharger APK" /></a>
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
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.4.0/Anticore_0.4.0_arm64.pkg"><img src="https://img.shields.io/badge/INSTALLATEUR_.PKG-arm64-20ffa0?style=for-the-badge&labelColor=08090D" alt="arm64 PKG" /></a>&nbsp;
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.4.0/Anticore_0.4.0_aarch64.dmg"><img src="https://img.shields.io/badge/IMAGE_.DMG-arm64-20f2ff?style=for-the-badge&labelColor=08090D" alt="arm64 DMG" /></a>
      </td>
      <td align="center">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.4.0/Anticore_0.4.0_x64.pkg"><img src="https://img.shields.io/badge/INSTALLATEUR_.PKG-x64-20ffa0?style=for-the-badge&labelColor=08090D" alt="x64 PKG" /></a>&nbsp;
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.4.0/Anticore_0.4.0_x64.dmg"><img src="https://img.shields.io/badge/IMAGE_.DMG-x64-20f2ff?style=for-the-badge&labelColor=08090D" alt="x64 DMG" /></a>
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

## Identité visuelle et ressources de marque

L'identité de marque d'Anticore est articulée autour d'un bouclier cybernétique tactique doté d'un cœur de réacteur quantique. L'ensemble des ressources visuelles est disponible dans le dépôt en haute résolution et au format vectoriel :

<table width="100%" align="center">
  <tr>
    <td width="25%" align="center" bgcolor="#090E17">
      <img src="assets/anticore-3d-logo-transparent.png" width="130" alt="Emblème 3D Anticore" /><br /><br />
      <b>Bouclier tactique 3D (PNG)</b><br />
      <small>Composite carbone obsidienne, titane &amp; cœur quantique (1024x1024).</small><br /><br />
      <a href="assets/anticore-3d-logo-transparent.png"><code>anticore-3d-logo-transparent.png</code></a>
    </td>
    <td width="25%" align="center" bgcolor="#090E17">
      <img src="assets/banner.png?v=0.4.0-3d" width="220" alt="Bannière Retina Anticore" /><br /><br />
      <b>Bannière Ultra-HD Retina</b><br />
      <small>1760x560 px, en-tête GitHub officielle optimisée pour les écrans haute densité.</small><br /><br />
      <a href="assets/banner.png"><code>assets/banner.png</code></a>
    </td>
    <td width="25%" align="center" bgcolor="#090E17">
      <img src="assets/social-preview.png" width="220" alt="Aperçu social Anticore" /><br /><br />
      <b>Aperçu social (OpenGraph)</b><br />
      <small>1280x640 px, carte d'aperçu pour GitHub, X (Twitter) &amp; Discord.</small><br /><br />
      <a href="assets/social-preview.png"><code>assets/social-preview.png</code></a>
    </td>
    <td width="25%" align="center" bgcolor="#090E17">
      <img src="desktop/src-tauri/icons/icon-inactive.png" width="110" alt="État inactif Anticore" /><br /><br />
      <b>État inactif / Hors ligne</b><br />
      <small>Cœur rouge d'alerte tactique dans la zone de notification lors de l'arrêt du moteur DPI.</small><br /><br />
      <a href="desktop/src-tauri/icons/icon-inactive.png"><code>icon-inactive.png</code></a>
    </td>
  </tr>
</table>

---

## Licence

Sous licence open-source MIT.
Tous les droits sont réservés à **Monolith Works**. Publication via **MonarchDevLab**.
