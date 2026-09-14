<div align="center">

<p align="center">
  <img src="assets/banner.svg" alt="ANTICORE - Zero-Loss DPI Circumvention Suite" width="100%" style="max-width: 880px;" />
</p>

# ANTICORE

### Suite open-source haute performance de contournement DPI et de liberté réseau pour Windows et macOS sans perte de débit

[![Version](https://img.shields.io/github/v/release/MonarchDevLab/Anticore?style=for-the-badge&color=20ffa0&labelColor=08090D&logo=github)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Téléchargements](https://img.shields.io/github/downloads/MonarchDevLab/Anticore/total?style=for-the-badge&color=20f2ff&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Plateforme](https://img.shields.io/badge/Plateforme-Windows%20%7C%20macOS-20f2ff?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Noyau](https://img.shields.io/badge/Noyau-WinDivert%20%2B%20macOS%20UTUN-FF2A4D?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Interface](https://img.shields.io/badge/Interface-Tauri%202.0%20%2B%20React%2019-FFE600?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Tests](https://img.shields.io/badge/Tests-72%20Réussis-20ffa0?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Protection](https://img.shields.io/badge/Protection-Zero%20Leakage%20PASS-20f2ff?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Signature](https://img.shields.io/badge/Signature-Minisign%20Vérifié-20ffa0?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Licence](https://img.shields.io/badge/Licence-MIT-FFFFFF?style=for-the-badge&labelColor=08090D)](LICENSE)

<br />

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/Türkçe-00FF9D?style=for-the-badge&labelColor=0C1017" alt="Türkçe" /></a>&nbsp;
  <a href="README.en.md"><img src="https://img.shields.io/badge/English-00E5FF?style=for-the-badge&labelColor=0C1017" alt="English" /></a>&nbsp;
  <a href="README.ru.md"><img src="https://img.shields.io/badge/Русский-FFE600?style=for-the-badge&labelColor=0C1017" alt="Русский" /></a>&nbsp;
  <a href="README.de.md"><img src="https://img.shields.io/badge/Deutsch-FF7733?style=for-the-badge&labelColor=0C1017" alt="Deutsch" /></a>&nbsp;
  <a href="README.fr.md"><img src="https://img.shields.io/badge/Français-FF2A55?style=for-the-badge&labelColor=0C1017" alt="Français" /></a>
</p>

<p align="center">
  <b><a href="README.md">Türkçe</a></b> &bull;
  <b><a href="README.en.md">English</a></b> &bull;
  <b><a href="README.ru.md">Русский</a></b> &bull;
  <b><a href="README.de.md">Deutsch</a></b> &bull;
  <b><a href="README.fr.md">Français</a></b>
</p>

<br />

**Moteur de manipulation de paquets local de nouvelle génération conçu pour contourner la censure des FAI et les boîtes d'inspection approfondie des paquets (DPI). Fonctionne entièrement en local sans routage vers des serveurs VPN ou proxys tiers — préservant 100 % de votre débit et de votre latence.**

<br />

<table width="100%" align="center">
  <tr>
    <td width="25%" align="center">
      <a href="#options-de-téléchargement-v036"><img src="https://img.shields.io/badge/01-TÉLÉCHARGEMENTS-20ffa0?style=for-the-badge&labelColor=08090D" alt="01 Téléchargements" /></a>
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

## Options de téléchargement (v0.3.6)

Tous les exécutables sont directement compilés depuis les sources, exempts de chemins de construction (Zero Leakage) et signés avec Minisign.

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="33.3%" align="center">
        <img src="https://img.shields.io/badge/01-PORTABLE_ZIP-20ffa0?style=for-the-badge&labelColor=08090D" alt="Portable" /><br /><br />
        <b>Version Portable (ZIP)</b><br />
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
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.6/Anticore_0.3.6_x64-portable.zip"><img src="https://img.shields.io/badge/TÉLÉCHARGER_.ZIP-6.6_MB-20ffa0?style=for-the-badge&labelColor=08090D" alt="Télécharger ZIP" /></a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.6/Anticore_0.3.6_x64-setup.exe"><img src="https://img.shields.io/badge/TÉLÉCHARGER_.EXE-4.6_MB-20f2ff?style=for-the-badge&labelColor=08090D" alt="Télécharger EXE" /></a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.6/Anticore_0.3.6_x64_en-US.msi"><img src="https://img.shields.io/badge/TÉLÉCHARGER_.MSI-6.5_MB-FFE600?style=for-the-badge&labelColor=08090D" alt="Télécharger MSI" /></a>
      </td>
    </tr>
    <tr>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.6/Anticore.exe"><img src="https://img.shields.io/badge/STANDALONE-Anticore.exe_(16.2_MB)-20ffa0?style=flat-square&labelColor=08090D" alt="Anticore.exe" /></a>
      </td>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.6/anticore-cli.exe"><img src="https://img.shields.io/badge/CLI_MOTEUR-anticore--cli.exe_(385_KB)-20f2ff?style=flat-square&labelColor=08090D" alt="anticore-cli" /></a>
      </td>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/latest"><img src="https://img.shields.io/badge/ARCHIVE-Toutes_les_versions-FFFFFF?style=flat-square&labelColor=08090D" alt="Toutes les versions" /></a>
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
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.6/Anticore_0.3.6_arm64.pkg"><img src="https://img.shields.io/badge/INSTALLATEUR_.PKG-arm64-20ffa0?style=for-the-badge&labelColor=08090D" alt="arm64 PKG" /></a>&nbsp;
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.6/Anticore_0.3.6_aarch64.dmg"><img src="https://img.shields.io/badge/IMAGE_.DMG-arm64-20f2ff?style=for-the-badge&labelColor=08090D" alt="arm64 DMG" /></a>
      </td>
      <td align="center">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.6/Anticore_0.3.6_x64.pkg"><img src="https://img.shields.io/badge/INSTALLATEUR_.PKG-x64-20ffa0?style=for-the-badge&labelColor=08090D" alt="x64 PKG" /></a>&nbsp;
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.6/Anticore_0.3.6_x64.dmg"><img src="https://img.shields.io/badge/IMAGE_.DMG-x64-20f2ff?style=for-the-badge&labelColor=08090D" alt="x64 DMG" /></a>
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
| `Anticore_0.3.6_x64-setup.exe` | 4.6 MB | `D4EF2CCA302D4845B49F8F3ED80EFEA28C1F3C8547B9A7B5A317FC72C47CA143` |
| `Anticore_0.3.6_x64-portable.zip` | 6.6 MB | `0964590824FFF5ADFAE04A092F6A5DADA3B76BA1C88B2BF8D984FC98CD87D43A` |
| `Anticore_0.3.6_x64_en-US.msi` | 6.5 MB | `123D83C2A3BE387FE90165602B895B4B2B47E0754EB44F68D63FBF704EB9A9B0` |
| `Anticore.exe` | 16.2 MB | `1234215E55C61CAE9836D6EEF0CBE3725702B7BAB3A3FF050699BD70B3BBB676` |
| `anticore-cli.exe` | 385 KB | `D8D60AEA2FB5A0B2C4EF7FAC7C810A2C49471CE19FA6D4FD499C430E180E0163` |
| `Anticore_0.3.6_arm64.pkg` | 5.8 MB | `A2FB220E4F9C5ECD1109C977903E21FFA16DE5A24B098EF823A8C801B18F837C` |
| `Anticore_0.3.6_aarch64.dmg` | 6.2 MB | `B774324462FA35C9A1B3B2B76BFA2976CE705D174A3CB611C64343D4E2A4152F` |
| `Anticore_0.3.6_x64.pkg` | 6.4 MB | `2EA284E231E7FE4F3A665E40A0E45B2BB8CA534FF430229DC6BF8C1EC73CBBD0` |
| `Anticore_0.3.6_x64.dmg` | 6.8 MB | `2026542CB88BDB22CAE8A6FCC81F1BF38A6B1EA42C2ECF066979890AB7144946` |

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
