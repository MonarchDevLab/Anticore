<div align="center">

<p align="center">
  <img src="assets/banner.svg" alt="ANTICORE - Zero-Loss DPI Circumvention Suite" width="100%" style="max-width: 880px;" />
</p>

# ANTICORE

### Windows İçin Sıfır Hız Kayıplı Açık Kaynak DPI Aşma ve Ağ Özgürlüğü Motoru

[![Sürüm](https://img.shields.io/github/v/release/MonarchDevLab/Anticore?style=for-the-badge&color=20ffa0&labelColor=08090D&logo=github)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![İndirmeler](https://img.shields.io/github/downloads/MonarchDevLab/Anticore/total?style=for-the-badge&color=20f2ff&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011%20x64-20f2ff?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Çekirdek](https://img.shields.io/badge/Çekirdek-Rust%20%2B%20WinDivert-FF2A4D?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Arayüz](https://img.shields.io/badge/Arayüz-Tauri%202.0%20%2B%20React%2019-FFE600?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Testler](https://img.shields.io/badge/Testler-52%20Geçti-20ffa0?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Sıfır Sızıntı](https://img.shields.io/badge/Muhafız-Sıfır%20Sızıntı%20PASS-20f2ff?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Doğrulama](https://img.shields.io/badge/İmza-Minisign%20Doğrulamalı-20ffa0?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Lisans](https://img.shields.io/badge/Lisans-MIT-FFFFFF?style=for-the-badge&labelColor=08090D)](LICENSE)

<br />

**Türkiye internet servis sağlayıcılarının sansür ve derin paket inceleme (DPI) altyapılarına karşı geliştirilmiş; trafiği üçüncü taraf uzak sunuculara yönlendirmeden, internet hızınızı ve ping değerinizi %100 koruyarak çalışan yeni nesil yerel paket manipülasyon yazılımı.**

<br />

<table width="100%" align="center">
  <tr>
    <td width="25%" align="center">
      <a href="#indirme-seçenekleri-v031"><img src="https://img.shields.io/badge/01-DAĞITIM_PAKETLERİ-20ffa0?style=for-the-badge&labelColor=08090D" alt="01 Dağıtım Paketleri" /></a>
    </td>
    <td width="25%" align="center">
      <a href="#anticore-nedir-ve-ne-değildir"><img src="https://img.shields.io/badge/02-TEMEL_MİMARİ-20f2ff?style=for-the-badge&labelColor=08090D" alt="02 Temel Mimari" /></a>
    </td>
    <td width="25%" align="center">
      <a href="#öne-çıkan-yetenekler"><img src="https://img.shields.io/badge/03-YETENEKLER-FFE600?style=for-the-badge&labelColor=08090D" alt="03 Yetenekler" /></a>
    </td>
    <td width="25%" align="center">
      <a href="#nasıl-çalışır"><img src="https://img.shields.io/badge/04-ÇALIŞMA_PRENSİBİ-FF7733?style=for-the-badge&labelColor=08090D" alt="04 Çalışma Prensibi" /></a>
    </td>
  </tr>
  <tr>
    <td width="25%" align="center">
      <a href="#türkiye-iss-uyumluluk-ve-atlatma-matrisi"><img src="https://img.shields.io/badge/05-İSS_MATRİSİ-20ffa0?style=for-the-badge&labelColor=08090D" alt="05 İSS Matrisi" /></a>
    </td>
    <td width="25%" align="center">
      <a href="#kapsamlı-karşılaştırma-tablosu"><img src="https://img.shields.io/badge/06-KARŞILAŞTIRMA-20f2ff?style=for-the-badge&labelColor=08090D" alt="06 Karşılaştırma" /></a>
    </td>
    <td width="25%" align="center">
      <a href="#sıkça-sorulan-sorular-sss"><img src="https://img.shields.io/badge/07-SORU_&_YANIT-FFE600?style=for-the-badge&labelColor=08090D" alt="07 Soru &amp; Yanıt" /></a>
    </td>
    <td width="25%" align="center">
      <a href="README.en.md"><img src="https://img.shields.io/badge/EN-ENGLISH_DOCS-FFFFFF?style=for-the-badge&labelColor=08090D" alt="EN Documentation" /></a>
    </td>
  </tr>
</table>

</div>

---

## İndirme Seçenekleri (v0.3.1)

Tüm ikili paketler doğrudan derlenmiş, yerel geliştirici yollarından arındırılmış (Zero Leakage) ve Minisign ile doğrulanmıştır.

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="33.3%" align="center">
        <img src="https://img.shields.io/badge/01-PORTABLE_ZIP-20ffa0?style=for-the-badge&labelColor=08090D" alt="Portable" /><br /><br />
        <b>Taşınabilir Sürüm</b><br />
        <sub>En Çok Tercih Edilen • Kayıtsız</sub>
      </th>
      <th width="33.3%" align="center">
        <img src="https://img.shields.io/badge/02-SETUP_EXE-20f2ff?style=for-the-badge&labelColor=08090D" alt="Setup" /><br /><br />
        <b>Kurulum Paketi</b><br />
        <sub>Standart Kullanıcı • Otomatik OTA</sub>
      </th>
      <th width="33.3%" align="center">
        <img src="https://img.shields.io/badge/03-ENTERPRISE_MSI-FFE600?style=for-the-badge&labelColor=08090D" alt="MSI" /><br /><br />
        <b>Kurumsal Dağıtım</b><br />
        <sub>Sistem Yöneticileri • GPO &amp; Intune</sub>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center" valign="top">
        Kurulum gerektirmez. Arşivi yerel klasöre veya USB diske çıkartıp doğrudan çalıştırın. Sistemde hiçbir kayıt bırakmaz.
      </td>
      <td align="center" valign="top">
        Masaüstü kısayolu, Başlat menüsü entegrasyonu ve arka planda çalışan dahili otomatik güncelleme desteği sunar.
      </td>
      <td align="center" valign="top">
        Active Directory, Microsoft Intune veya GPO üzerinden çoklu bilgisayara sessiz ve merkezi kurumsal kurulum paketi.
      </td>
    </tr>
    <tr>
      <td align="center" valign="middle">
        <code>✓ Sıfır Kayıt Defteri İzi</code>
      </td>
      <td align="center" valign="middle">
        <code>✓ İmzalı GitHub OTA Motoru</code>
      </td>
      <td align="center" valign="middle">
        <code>✓ Sessiz /qn Kurulum Desteği</code>
      </td>
    </tr>
    <tr>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/latest/download/Anticore_0.3.1_x64-portable.zip"><img src="https://img.shields.io/badge/INDIR_.ZIP-6.3_MB-20ffa0?style=for-the-badge&labelColor=08090D" alt="İndir ZIP" /></a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/latest/download/Anticore_0.3.1_x64-setup.exe"><img src="https://img.shields.io/badge/INDIR_.EXE-4.4_MB-20f2ff?style=for-the-badge&labelColor=08090D" alt="İndir EXE" /></a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/latest/download/Anticore_0.3.1_x64_en-US.msi"><img src="https://img.shields.io/badge/INDIR_.MSI-6.1_MB-FFE600?style=for-the-badge&labelColor=08090D" alt="İndir MSI" /></a>
      </td>
    </tr>
    <tr>
      <td align="center" valign="middle">
        <img src="https://img.shields.io/badge/M%C4%B0MAR%C4%B0-x64_%E2%80%A2_SIFIR_KALINTI-20ffa0?style=flat-square&labelColor=08090D" alt="x64 Sıfır Kalıntı" />
      </td>
      <td align="center" valign="middle">
        <img src="https://img.shields.io/badge/M%C4%B0MAR%C4%B0-x64_%E2%80%A2_OTOMAT%C4%B0K_OTA-20f2ff?style=flat-square&labelColor=08090D" alt="x64 Otomatik OTA" />
      </td>
      <td align="center" valign="middle">
        <img src="https://img.shields.io/badge/M%C4%B0MAR%C4%B0-x64_%E2%80%A2_GPO_INTUNE-FFE600?style=flat-square&labelColor=08090D" alt="x64 GPO Intune" />
      </td>
    </tr>
    <tr>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/latest/download/Anticore.exe"><img src="https://img.shields.io/badge/STANDALONE-Anticore.exe_(15.6_MB)-20ffa0?style=flat-square&labelColor=08090D" alt="Anticore.exe" /></a>
      </td>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/latest/download/anticore-cli.exe"><img src="https://img.shields.io/badge/CLI_MOTOR-anticore--cli.exe_(384_KB)-20f2ff?style=flat-square&labelColor=08090D" alt="anticore-cli" /></a>
      </td>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/latest"><img src="https://img.shields.io/badge/AR%C5%9E%C4%B0V-GitHub_T%C3%BCm_S%C3%BCr%C3%BCmler-FFFFFF?style=flat-square&labelColor=08090D" alt="Tüm Sürümler" /></a>
      </td>
    </tr>
  </tbody>
</table>

<details>
<summary><b>SHA-256 Paket Bütünlük Özetleri (Tıklayıp Genişletin)</b></summary>
<br />

| Paket Dosyası | Boyut | SHA-256 Kriptografik Özeti |
|---|:---:|---|
| `Anticore_0.3.1_x64-portable.zip` | 6.3 MB | `40E92F9135E92586FD518AE4581E48D10A5FB365AC9593D02E396868354EF935` |
| `Anticore_0.3.1_x64-setup.exe` | 4.4 MB | `FB4F4C31E3B5B5F1FEA7D88F62ECE3267486DDDD75FEDEB0329980D40299631D` |
| `Anticore_0.3.1_x64_en-US.msi` | 6.1 MB | `7614447CF05BF3E8D7C312EC99D388999E5887CA0C2CEA7EAC42A63556335B85` |
| `Anticore.exe` | 15.6 MB | `057C65D8C6CD6A878C5472767D8A7CC6539386A1DD52B7D58F0DC229994817A6` |
| `anticore-cli.exe` | 384 KB | `16F6313E63250869267FC2BEF58AA99AACD6AAF56D52CE5AB1177DA8C9255E9D` |

```powershell
# İndirdiğiniz paketi PowerShell ile doğrulamak için:
Get-FileHash .\Anticore_0.3.1_x64-portable.zip -Algorithm SHA256
```
</details>

> [!IMPORTANT]
> **Teknik Zorunluluk — Yönetici İzni (Administrator Privilege):**
> Windows ağ kartından geçen ham ağ paketlerini çekirdek katmanında dinlemek ve manipüle etmek için açık kaynaklı `WinDivert` çekirdek sürücüsü kullanılır. Bu nedenle uygulamanın **Yönetici Olarak Çalıştırılması** gereklidir. Standart kullanıcı olarak başlatıldığında Anticore sizi uyarır ve tek tıkla kendini yetkili modda yeniden başlatabilir.

---

## Anticore Nedir ve Ne Değildir?

Discord kapatıldığında, Roblox engellendiğinde veya bilgiye erişim kısıtlandığında kullanıcıların başvurduğu klasik çözüm VPN tünelleridir. Ancak VPN protokolleri modern internet kullanımını aksatır:

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="50%" align="center">
        <img src="https://img.shields.io/badge/GELENEKSEL-VPN_T%C3%9CNELLEME-ff4444?style=for-the-badge&labelColor=08090D" alt="VPN" /><br /><br />
        <b>Geleneksel VPN Tünelleme</b><br />
        <sub>Dolaylı &bull; Yavaş &bull; Veri Güvenliği Riskli</sub>
      </th>
      <th width="50%" align="center">
        <img src="https://img.shields.io/badge/ANTICORE-CERRAH%C4%B0_DPI_BYPASS-20ffa0?style=for-the-badge&labelColor=08090D" alt="Anticore" /><br /><br />
        <b>Anticore Cerrahi DPI Bypass</b><br />
        <sub>Doğrudan &bull; Tam Hat Hızı &bull; Sıfır Gecikme</sub>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="50%" align="center" bgcolor="#0b0e14">
        <br />
        <img src="https://img.shields.io/badge/01_%C4%B0STEMC%C4%B0-Yerel_PC_(Windows)-161b22?style=flat-square" alt="PC" /><br />
        &darr; <sub><i>Şifreli Tünel Kapsülleme (Tüm Trafik)</i></sub><br />
        <img src="https://img.shields.io/badge/02_ARA_SUNUCU-Yurtd%C4%B1%C5%9F%C4%B1_VPN_D%C3%BC%C4%9F%C3%BCm%C3%BC-ff4444?style=flat-square&labelColor=08090D" alt="VPN Node" /><br />
        &darr; <sub><i>Uzak Çıkış & Ağ Darboğazı (+150ms)</i></sub><br />
        <img src="https://img.shields.io/badge/03_VARI%C5%9E-Hedef_Servis_/_Oyun-30363D?style=flat-square" alt="Hedef" />
        <br /><br />
      </td>
      <td width="50%" align="center" bgcolor="#0b0e14">
        <br />
        <img src="https://img.shields.io/badge/01_%C4%B0STEMC%C4%B0-Yerel_PC_(Windows)-161b22?style=flat-square" alt="PC" /><br />
        &darr; <sub><i>Yalnızca İlk TLS ClientHello Parçalanır</i></sub><br />
        <img src="https://img.shields.io/badge/02_DPI_ATLATMA-%C4%B0SS_Sans%C3%BCr%C3%BC_Etkisiz-20ffa0?style=flat-square&labelColor=08090D" alt="Bypass" /><br />
        &darr; <sub><i>Doğrudan Kendi Fiber Santraliniz (0ms)</i></sub><br />
        <img src="https://img.shields.io/badge/03_VARI%C5%9E-Hedef_Servis_/_Oyun-20f2ff?style=flat-square&labelColor=08090D" alt="Hedef" />
        <br /><br />
      </td>
    </tr>
    <tr>
      <td>
        &bull; <b>Hat Hızı:</b>
        <img src="https://img.shields.io/badge/H%C4%B1z-%2550--%2580_D%C3%BC%C5%9F%C3%BC%C5%9F-ff4444?style=flat-square" alt="Hız Düşüşü" align="right" />
      </td>
      <td>
        &bull; <b>Hat Hızı:</b>
        <img src="https://img.shields.io/badge/H%C4%B1z-%25100_Tam_Hat-20ffa0?style=flat-square&labelColor=08090D" alt="Tam Hat" align="right" />
      </td>
    </tr>
    <tr>
      <td>
        &bull; <b>Oyun Gecikmesi:</b>
        <img src="https://img.shields.io/badge/Ping-+100~250_ms-ff7733?style=flat-square" alt="Ping Artışı" align="right" />
      </td>
      <td>
        &bull; <b>Oyun Gecikmesi:</b>
        <img src="https://img.shields.io/badge/Ping-0_ms_Art%C4%B1%C5%9F-20f2ff?style=flat-square&labelColor=08090D" alt="Sıfır Ping" align="right" />
      </td>
    </tr>
    <tr>
      <td>
        &bull; <b>Veri Rotası:</b>
        <img src="https://img.shields.io/badge/Trafik-Yabanc%C4%B1_Sunucu-red?style=flat-square" alt="Yabancı Sunucu" align="right" />
      </td>
      <td>
        &bull; <b>Veri Rotası:</b>
        <img src="https://img.shields.io/badge/Trafik-Do%C4%9Frudan_Kendi_Hatt%C4%B1n%C4%B1z-20ffa0?style=flat-square&labelColor=08090D" alt="Doğrudan" align="right" />
      </td>
    </tr>
    <tr>
      <td>
        &bull; <b>Banka / e-Devlet:</b>
        <img src="https://img.shields.io/badge/IP-Yurtd%C4%B1%C5%9F%C4%B1_Blokeli-grey?style=flat-square" alt="Banka Engeli" align="right" />
      </td>
      <td>
        &bull; <b>Banka / e-Devlet:</b>
        <img src="https://img.shields.io/badge/IP-Orijinal_TR_IP-20f2ff?style=flat-square&labelColor=08090D" alt="TR IP" align="right" />
      </td>
    </tr>
    <tr>
      <td>
        &bull; <b>Maliyet:</b>
        <img src="https://img.shields.io/badge/Model-Ayl%C4%B1k_Abonelik-lightgrey?style=flat-square" alt="Abonelik" align="right" />
      </td>
      <td>
        &bull; <b>Maliyet:</b>
        <img src="https://img.shields.io/badge/Lisans-%C3%9Ccretsiz_&_A%C3%A7%C4%B1k_Kaynak-FFE600?style=flat-square&labelColor=08090D" alt="Açık Kaynak" align="right" />
      </td>
    </tr>
  </tbody>
</table>

### Anticore'un Temel Farkları
- **Tünelleme Yok:** Trafiğinizi asla üçüncü taraf bir ara sunucuya veya yurt dışı IP adresine yönlendirmez.
- **Sıfır Hız Kaybı:** Yalnızca engelli hedefe yönelik ilk bağlantı el sıkışmasını (**TLS ClientHello SNI**) manipüle eder. Bağlantı kurulduğu andan itibaren dosya indirme, oyun paketleri ve video akışı doğrudan kendi internet servis sağlayıcınız üzerinden akar. **1000 Mbps bağlantınız varsa, 1000 Mbps almaya devam edersiniz.**
- **Oyunlarda 0 ms Ping Artışı:** Doğrudan santral çıkışınızı kullandığı için oyun sunucularına olan gecikme değeriniz 1 milisaniye dahi yükselmez.
- **Banka ve e-Devlet Uyumlu:** Gerçek Türkiye IP adresiniz değişmediği için bankacılık uygulamaları, e-Devlet veya yerli yayın platformları güvenlik doğrulaması istemez ya da hesabınızı kilitlemez.

---

## Öne Çıkan Yetenekler

<table width="100%" align="center">
  <!-- ROW 1 HEADERS -->
  <tr>
    <th width="50%" align="left" valign="top">
      <img src="https://img.shields.io/badge/01-ÇEKİRDEK_MOTOR-20ffa0?style=flat-square&labelColor=08090D" alt="01 Çekirdek Motor" /><br />
      <h3>Cerrahi Paket Manipülasyonu</h3>
      <sub>Kernel düzeyinde WinDivert sürücüsü ile ISS sansür donanımlarını atlatma.</sub>
    </th>
    <th width="50%" align="left" valign="top">
      <img src="https://img.shields.io/badge/02-GÖRSEL_TELEMETRİ-20f2ff?style=flat-square&labelColor=08090D" alt="02 Görsel Telemetri" /><br />
      <h3>3D İzometrik Telemetri &amp; Reaktör</h3>
      <sub>Donanım hızlandırmalı Canvas mimarisiyle saniyede 60 FPS canlı ağ izleme.</sub>
    </th>
  </tr>
  <!-- ROW 1 CONTENT -->
  <tr>
    <td width="50%" valign="top">
      &bull; <b>SNI Parçalama:</b> TLS ClientHello paketlerini mikroskobik TCP segmentlerine bölerek DPI kutularının paketleri birleştirmesini engeller.<br /><br />
      &bull; <b>TTL=4 Sahte Paket:</b> Filtreleme donanımını doyuma ulaştırıp gerçek veri akışını gizleyen düşük ömürlü paket enjeksiyonu.<br /><br />
      &bull; <b>RST Düşürme &amp; QUIC:</b> ISS kaynaklı sahte TCP RST bağlantı koparma paketlerini sessizce filtreler ve UDP akışını korur.
    </td>
    <td width="50%" valign="top">
      &bull; <b>ActivityChart3D:</b> Ağ verimi ve PPS (paket/sn) akışını donanım hızlandırmalı dinamik izometrik derinlikle çizer.<br /><br />
      &bull; <b>Canlı Reaktör Küresi:</b> Çift uydulu, 140 derinlik parçacıklı jiroskopik küre ile çekirdek durumunu görselleştirir.<br /><br />
      &bull; <b>Pro Matrix Konsolu:</b> Mikrosaniye hassasiyetinde hata telemetrisi, soket olayları ve canlı terminal teşhis logları.
    </td>
  </tr>

  <!-- ROW 2 HEADERS -->
  <tr>
    <th width="50%" align="left" valign="top">
      <img src="https://img.shields.io/badge/03-AĞ_GEÇİDİ-FFE600?style=flat-square&labelColor=08090D" alt="03 Ağ Geçidi" /><br />
      <h3>Yerel Ağ (LAN) Cihaz Paylaşımı</h3>
      <sub>Bilgisayarınızı tüm ev ve ofis için merkezi sansür atlatma ağ geçidine çevirin.</sub>
    </th>
    <th width="50%" align="left" valign="top">
      <img src="https://img.shields.io/badge/04-SİSTEM_ONARIMI-FF7733?style=flat-square&labelColor=08090D" alt="04 Sistem Onarımı" /><br />
      <h3>Winsock &amp; Ağ Yığını Onarımı</h3>
      <sub>Çöken ağ adaptörleri ve kilitlenen Discord güncellemeleri için cerrahi ilk yardım.</sub>
    </th>
  </tr>
  <!-- ROW 2 CONTENT -->
  <tr>
    <td width="50%" valign="top">
      &bull; <b>SOCKS5 / HTTP Proxy:</b> Mobil cihazlar, tabletler ve akıllı TV'ler için yerel ağda <code>0.0.0.0:10808</code> vekil sunucu servisi.<br /><br />
      &bull; <b>Şeffaf Hotspot Transit:</b> Windows Mobil Etkin Noktası üzerinden bağlı tüm cihazlara ek ayar gerektirmeden tam koruma.<br /><br />
      &bull; <b>PAC Otomasyonu:</b> Yalnızca yasaklı hedefleri yönlendiren dinamik Proxy Auto-Config desteği ile optimum hat kullanımı.
    </td>
    <td width="50%" valign="top">
      &bull; <b>Tek Tıkla Sıfırlama:</b> Bozulan ağ yığınını <code>netsh winsock reset</code> ve <code>netsh int ip reset</code> ile anında onarma.<br /><br />
      &bull; <b>DNS Önbellek Boşaltma:</b> <code>ipconfig /flushdns</code>, <code>/release</code> ve <code>/renew</code> komutlarıyla DNS zehirlenmesini temizleme.<br /><br />
      &bull; <b>Güvenli DoH Aktivasyonu:</b> Cloudflare 1.1.1.1 veya Google 8.8.8.8 şifreli DNS motoruyla sansürsüz çözümleme.
    </td>
  </tr>

  <!-- ROW 3 HEADERS -->
  <tr>
    <th width="50%" align="left" valign="top">
      <img src="https://img.shields.io/badge/05-BELLEK_YÖNETİMİ-20ffa0?style=flat-square&labelColor=08090D" alt="05 Bellek Yönetimi" /><br />
      <h3>Dinamik Bellek Kara Listesi</h3>
      <sub>Motoru yeniden başlatmadan anında güncellenen eşzamanlı bellek mimarisi.</sub>
    </th>
    <th width="50%" align="left" valign="top">
      <img src="https://img.shields.io/badge/06-GELECEK_UYUMU-20f2ff?style=flat-square&labelColor=08090D" alt="06 Gelecek Uyumu" /><br />
      <h3>Post-Quantum Kyber &amp; Modern TLS</h3>
      <sub>En yeni nesil şifreleme standartları ve devasa paket yapılarıyla tam uyumluluk.</sub>
    </th>
  </tr>
  <!-- ROW 3 CONTENT -->
  <tr>
    <td width="50%" valign="top">
      &bull; <b>Canlı Senkronizasyon:</b> <code>Arc&lt;RwLock&lt;Blacklist&gt;&gt;</code> mimarisiyle motor durdurulmadan sıfır kesintiyle alan adı yönetimi.<br /><br />
      &bull; <b>Kategori Filtre Hapları:</b> TR Mega, Oyun, Medya ve Sosyal kategorilerine göre tek tıkla anında filtreleme.<br /><br />
      &bull; <b>Yedekli Topluluk Aynası:</b> Zapret Türkiye hostlist aynası ve yerleşik çevrimdışı yedek veritabanı desteği.
    </td>
    <td width="50%" valign="top">
      &bull; <b>Kyber / ML-KEM 768 &amp; ECH:</b> Chrome/Firefox 1500+ baytlık kuantum sonrası el sıkışma paketlerini kusursuz işler.<br /><br />
      &bull; <b>Sentetik Test Sondaları:</b> Modern tarayıcı uzantılarıyla birebir uyumlu testlerle sıfır sahte negatif sonuç garantisi.<br /><br />
      &bull; <b>8 Özel Donanım Teması:</b> Obsidian Emerald'dan Cyberpunk Volt ve Amethyst Nebula'ya tam arayüz kişiselleştirme.
    </td>
  </tr>
</table>

---

## Nasıl Çalışır?

Aşağıdaki mimari akış şeması, kullanıcının başlattığı bir istekte Anticore motorunun paketleri nasıl cerrahi bir hassasiyetle işlediğini özetler:

```mermaid
flowchart TD
    subgraph Client["Kullanıcı Cihazı"]
        App["Uygulama / Oyun / Tarayıcı\n(Discord, Roblox, Steam, Web)"]
        TCPIP["Windows Ağ Yığını (TCP/IP)"]
    end

    subgraph AnticoreEngine["ANTICORE v0.3.1 (Rust Çekirdeği)"]
        WD["WinDivert Çekirdek Sürücüsü"]
        Check{"Hedef Alan Adı\nKara Listede mi?"}
        Manip["Cerrahi TLS SNI Bölme\n+ Düşük TTL Sahte Paket (TTL=4)"]
        Bypass["Filtresiz Doğrudan Geçiş"]
    end

    subgraph Net["İnternet Altyapısı & Servis Sağlayıcı"]
        ISP["ISS DPI Sansür Donanımı\n(Sandvine / Procera)"]
        Target["Hedef Sunucu\n(Discord, Roblox, Cloudflare Edge)"]
    end

    App --> TCPIP
    TCPIP --> WD
    WD --> Check
    Check -- "Eşleşti (Sansürlü)" --> Manip
    Check -- "Normal Trafik" --> Bypass
    Manip -- "1. Düşük TTL Sahte Paket (DPI Filtresi Yutar)" --> ISP
    Manip -- "2. Bölünmüş Gerçek El Sıkışma" --> Target
    Bypass --> Target
    Target -->|"Doğrudan Akış: %100 Hat Hızı / 0 ms Ping Kaybı"| App
```

### Dört Kademeli Savunma Mimarisi
1. **Sahte Paket Enjeksiyonu (Fake Decoy Packet):** ISS omurgasındaki filtre donanımına (Sandvine, Procera vb.) ulaşacak kadar yaşam süresine (TTL=3..4) sahip, fakat hedef sunucuya asla ulaşamayacak bir öncü paket fırlatılır. Filtre cihazı bu sahte veriyi analiz ederken arkadan gelen gerçek paketi denetlemeden geçirir.
2. **Cerrahi SNI Parçalama (SNI Splitting):** Gerçek ClientHello paketi, alan adı etiketinin (SNI) tam ortasından iki bağımsız TCP segmentine bölünür. Basit denetleyiciler paketleri bellekte birleştiremediği için hedefi tespit edemez.
3. **Sahte RST Düşürme (RST Mitigation):** Servis sağlayıcının bağlantıyı sabote etmek amacıyla enjekte ettiği yetkisiz TCP RST paketleri çekirdek sürücüsü düzeyinde yakalanıp yok edilir.
4. **QUIC / HTTP3 TLS Düşürme:** UDP tabanlı QUIC el sıkışmaları standart TLS'e düşürülerek paket kurallarının tarayıcılarda kesintisiz devrede kalması sağlanır.

---

## Türkiye İSS Uyumluluk ve Atlatma Matrisi

Türkiye'deki ana internet servis sağlayıcılarının kullandığı derin paket inceleme (DPI) donanımları ve Anticore'un optimize edilmiş çözüm stratejileri:

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="20%" align="left">İnternet Servis Sağlayıcı</th>
      <th width="18%" align="left">Tespit Edilen DPI Donanımı</th>
      <th width="22%" align="left">Sansür & Filtreleme Yöntemi</th>
      <th width="19%" align="left">Varsayılan Uyumlu Profil</th>
      <th width="21%" align="center">Başarı Durumu</th>
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
        <code>SNI İnceleme</code> <code>Sahte RST</code><br />
        <sub>Düşük TTL Paket Filtresi</sub>
      </td>
      <td>
        <b>Profil 3 (Agresif)</b><br />
        <sub>Fake TTL=4 • 2-Bayt Split</sub>
      </td>
      <td align="center">
        <img src="https://img.shields.io/badge/%E2%9C%93_BYPASS-AKT%C4%B0F-20ffa0?style=for-the-badge&labelColor=08090D" alt="Bypass Aktif" /><br />
        <b>%100 Tam Hat Erişimi</b><br />
        <sub>Doğrudan Çıkış • 0 ms Ping</sub>
      </td>
    </tr>
    <tr>
      <td>
        <img src="https://img.shields.io/badge/Türk_Telekom-TTNet-001E50?style=flat-square" alt="Türk Telekom TTNet" /><br />
        <b>Türk Telekom (TTNet)</b>
      </td>
      <td>
        <code>Procera / Huawei</code><br />
        <sub>PacketLogic Donanımı</sub>
      </td>
      <td>
        <code>Standart SNI</code> <code>DNS Hijack</code><br />
        <sub>ISP DNS Zehirleme Filtresi</sub>
      </td>
      <td>
        <b>Profil 1 (Standart)</b><br />
        <sub>SNI Parçalama • DoH Çözümleyici</sub>
      </td>
      <td align="center">
        <img src="https://img.shields.io/badge/%E2%9C%93_BYPASS-AKT%C4%B0F-20ffa0?style=for-the-badge&labelColor=08090D" alt="Bypass Aktif" /><br />
        <b>%100 Tam Hat Erişimi</b><br />
        <sub>Doğrudan Çıkış • 0 ms Ping</sub>
      </td>
    </tr>
    <tr>
      <td>
        <img src="https://img.shields.io/badge/Vodafone-Net-E60000?style=flat-square" alt="Vodafone Net" /><br />
        <b>Vodafone Net</b>
      </td>
      <td>
        <code>Allot / Sandvine</code><br />
        <sub>Trafik Yönetim Platformu</sub>
      </td>
      <td>
        <code>SNI Blokajı</code> <code>HTTP 302</code><br />
        <sub>IP Yönlendirme & Sahte RST</sub>
      </td>
      <td>
        <b>Profil 2 (Fake + RST)</b><br />
        <sub>Sahte Paket • RST Düşürme</sub>
      </td>
      <td align="center">
        <img src="https://img.shields.io/badge/%E2%9C%93_BYPASS-AKT%C4%B0F-20ffa0?style=for-the-badge&labelColor=08090D" alt="Bypass Aktif" /><br />
        <b>%100 Tam Hat Erişimi</b><br />
        <sub>Doğrudan Çıkış • 0 ms Ping</sub>
      </td>
    </tr>
    <tr>
      <td>
        <img src="https://img.shields.io/badge/Türksat-Kablonet-004F9E?style=flat-square" alt="Türksat Kablonet" /><br />
        <b>Türksat Kablonet</b>
      </td>
      <td>
        <code>Procera PacketLogic</code><br />
        <sub>Omurga Denetim Sistemi</sub>
      </td>
      <td>
        <code>SNI Filtreleme</code> <code>QUIC Engeli</code><br />
        <sub>UDP/443 Kısıtlaması</sub>
      </td>
      <td>
        <b>Profil 1 (Standart)</b><br />
        <sub>SNI Parçalama • QUIC Düşürme</sub>
      </td>
      <td align="center">
        <img src="https://img.shields.io/badge/%E2%9C%93_BYPASS-AKT%C4%B0F-20ffa0?style=for-the-badge&labelColor=08090D" alt="Bypass Aktif" /><br />
        <b>%100 Tam Hat Erişimi</b><br />
        <sub>Doğrudan Çıkış • 0 ms Ping</sub>
      </td>
    </tr>
    <tr>
      <td>
        <img src="https://img.shields.io/badge/TurkNet-GigaFiber-00D084?style=flat-square" alt="TurkNet GigaFiber" /><br />
        <b>TurkNet</b>
      </td>
      <td>
        <code>Bağımsız Omurga</code><br />
        <sub>Santral Düzeyi Filtreleme</sub>
      </td>
      <td>
        <code>DNS Zehirleme</code> <code>Kısmi SNI</code><br />
        <sub>Yerel Yönlendirme</sub>
      </td>
      <td>
        <b>Profil 1 (Standart)</b><br />
        <sub>DoH Entegrasyonu • Standart Split</sub>
      </td>
      <td align="center">
        <img src="https://img.shields.io/badge/%E2%9C%93_BYPASS-AKT%C4%B0F-20ffa0?style=for-the-badge&labelColor=08090D" alt="Bypass Aktif" /><br />
        <b>%100 Tam Hat Erişimi</b><br />
        <sub>Doğrudan Çıkış • 0 ms Ping</sub>
      </td>
    </tr>
    <tr>
      <td>
        <img src="https://img.shields.io/badge/Bölgesel-Millenicom_%2F_Diğer-30363D?style=flat-square" alt="Bölgesel Sağlayıcılar" /><br />
        <b>Millenicom & Diğerleri</b>
      </td>
      <td>
        <code>TT / Superonline</code><br />
        <sub>Taşıyıcı Altyapı Omurgası</sub>
      </td>
      <td>
        <code>Omurga Bağımlı</code><br />
        <sub>Ana Taşıyıcı Filtreleme Kuralları</sub>
      </td>
      <td>
        <b>Profil 1 veya Profil 3</b><br />
        <sub>Altyapı Tipine Göre Seçim</sub>
      </td>
      <td align="center">
        <img src="https://img.shields.io/badge/%E2%9C%93_BYPASS-AKT%C4%B0F-20ffa0?style=for-the-badge&labelColor=08090D" alt="Bypass Aktif" /><br />
        <b>%100 Tam Hat Erişimi</b><br />
        <sub>Doğrudan Çıkış • 0 ms Ping</sub>
      </td>
    </tr>
  </tbody>
</table>

---

## Kapsamlı Karşılaştırma Tablosu

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="24%" align="left">Teknik Kriter</th>
      <th width="19%" align="center">Geleneksel VPN</th>
      <th width="19%" align="center">GoodbyeDPI</th>
      <th width="19%" align="center">SplitWire</th>
      <th width="19%" align="center">
        <img src="https://img.shields.io/badge/ANTICORE-v0.3.1-20ffa0?style=flat-square&labelColor=08090D" alt="Anticore v0.3.1" />
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>İndirme Hızı &amp; Hat</b></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%96%BC_%2550--80_Düşüş-DA3633?style=flat-square&labelColor=21262D" alt="Kayıp" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_Tam_Hat-8B949E?style=flat-square&labelColor=21262D" alt="Tam Hat" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_Tam_Hat-8B949E?style=flat-square&labelColor=21262D" alt="Tam Hat" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_%25100_Tam_Hat-20ffa0?style=flat-square&labelColor=08090D" alt="Tam Hat" /></td>
    </tr>
    <tr>
      <td><b>Oyun Pingi &amp; Gecikme</b></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%96%B2_%2B100~250_ms-DA3633?style=flat-square&labelColor=21262D" alt="Yüksek Ping" /></td>
      <td align="center"><img src="https://img.shields.io/badge/0_ms_Artış-8B949E?style=flat-square&labelColor=21262D" alt="0 ms" /></td>
      <td align="center"><img src="https://img.shields.io/badge/0_ms_Artış-8B949E?style=flat-square&labelColor=21262D" alt="0 ms" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_0_ms_Artış-20ffa0?style=flat-square&labelColor=08090D" alt="0 ms" /></td>
    </tr>
    <tr>
      <td><b>Kullanıcı Arayüzü (GUI)</b></td>
      <td align="center"><code>Standart SaaS UI</code></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_Yok_(Salt_Konsol)-30363D?style=flat-square&labelColor=161B22" alt="Konsol" /></td>
      <td align="center"><code>Temel WinForms</code></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_Cyber--Hardware_3D-20ffa0?style=flat-square&labelColor=08090D" alt="Cyber GUI" /></td>
    </tr>
    <tr>
      <td><b>Canlı 3D Telemetri</b></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_Yok-30363D?style=flat-square&labelColor=161B22" alt="Yok" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_Yok-30363D?style=flat-square&labelColor=161B22" alt="Yok" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_Yok-30363D?style=flat-square&labelColor=161B22" alt="Yok" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_60_FPS_Reaktör_Orbu-20ffa0?style=flat-square&labelColor=08090D" alt="Reaktör" /></td>
    </tr>
    <tr>
      <td><b>LAN / SOCKS5 Ağ Geçidi</b></td>
      <td align="center"><code>Sanal Adaptör Paylaşımı</code></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_Yok-30363D?style=flat-square&labelColor=161B22" alt="Yok" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_Yok-30363D?style=flat-square&labelColor=161B22" alt="Yok" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_SOCKS5_%2B_Hotspot-20ffa0?style=flat-square&labelColor=08090D" alt="SOCKS5" /></td>
    </tr>
    <tr>
      <td><b>Winsock &amp; DNS Onarımı</b></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_Yok-30363D?style=flat-square&labelColor=161B22" alt="Yok" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_Yok-30363D?style=flat-square&labelColor=161B22" alt="Yok" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_Yok-30363D?style=flat-square&labelColor=161B22" alt="Yok" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_1--Tıkla_Ağ_Onarımı-20ffa0?style=flat-square&labelColor=08090D" alt="Onarım" /></td>
    </tr>
    <tr>
      <td><b>Dinamik Bellek Kara Listesi</b></td>
      <td align="center"><code>Tünel Yeniden Başlatma</code></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9A%A0_Servis_Reset-30363D?style=flat-square&labelColor=161B22" alt="Reset" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9A%A0_Servis_Reset-30363D?style=flat-square&labelColor=161B22" alt="Reset" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_Arc_RwLock_Canlı-20ffa0?style=flat-square&labelColor=08090D" alt="Arc" /></td>
    </tr>
    <tr>
      <td><b>Sistem Tepsisi (Tray Flyout)</b></td>
      <td align="center"><code>Basit Sağ Tık</code></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_Yok-30363D?style=flat-square&labelColor=161B22" alt="Yok" /></td>
      <td align="center"><code>Temel Sağ Tık</code></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_340x460px_Kokpit-20ffa0?style=flat-square&labelColor=08090D" alt="Tray" /></td>
    </tr>
    <tr>
      <td><b>Windows Servis (Daemon)</b></td>
      <td align="center"><code>Kısmi Servis</code></td>
      <td align="center"><code>Manuel sc.exe</code></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_Yok-30363D?style=flat-square&labelColor=161B22" alt="Yok" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_Entegre_Daemon-20ffa0?style=flat-square&labelColor=08090D" alt="Daemon" /></td>
    </tr>
    <tr>
      <td><b>Discord DNS &amp; RTC Çözümü</b></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_Yok-30363D?style=flat-square&labelColor=161B22" alt="Yok" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_Yok-30363D?style=flat-square&labelColor=161B22" alt="Yok" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_Yok-30363D?style=flat-square&labelColor=161B22" alt="Yok" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_Entegre_RTC_Onarımı-20ffa0?style=flat-square&labelColor=08090D" alt="Discord" /></td>
    </tr>
    <tr>
      <td><b>Bellek Tüketimi (RAM)</b></td>
      <td align="center"><img src="https://img.shields.io/badge/150--350_MB-DA3633?style=flat-square&labelColor=21262D" alt="150-350 MB" /></td>
      <td align="center"><img src="https://img.shields.io/badge/~10_MB-8B949E?style=flat-square&labelColor=21262D" alt="~10 MB" /></td>
      <td align="center"><img src="https://img.shields.io/badge/~80_MB-8B949E?style=flat-square&labelColor=21262D" alt="~80 MB" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_~25_MB_(Rust)-20ffa0?style=flat-square&labelColor=08090D" alt="~25 MB" /></td>
    </tr>
    <tr>
      <td><b>Otomatik Güncelleyici</b></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_Var-8B949E?style=flat-square&labelColor=21262D" alt="Var" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_Manuel_Zip-30363D?style=flat-square&labelColor=161B22" alt="Manuel" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_Manuel_Takip-30363D?style=flat-square&labelColor=161B22" alt="Manuel" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_İmzalı_GitHub_OTA-20ffa0?style=flat-square&labelColor=08090D" alt="OTA" /></td>
    </tr>
    <tr>
      <td><b>Donanım Temaları</b></td>
      <td align="center"><code>Açık / Koyu</code></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_Yok-30363D?style=flat-square&labelColor=161B22" alt="Yok" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%97_Yok-30363D?style=flat-square&labelColor=161B22" alt="Yok" /></td>
      <td align="center"><img src="https://img.shields.io/badge/%E2%9C%93_8_Özel_Cyber_Tema-20ffa0?style=flat-square&labelColor=08090D" alt="Temalar" /></td>
    </tr>
  </tbody>
</table>

---

## Sistem Tepsisi (Tray Quick Panel)

Ana uygulama penceresini açmadan, Windows görev çubuğunun sağ alt köşesinden tek tıklamayla tam operasyonel kontrol sağlayabilirsiniz:

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="50%" align="left">
        <img src="https://img.shields.io/badge/TRAY_KOKP%C4%B0T-ANTICORE_v0.3.1_CANLI_KOMUTA-161b22?style=flat-square" alt="Tray Cockpit" />
      </th>
      <th width="50%" align="right">
        <img src="https://img.shields.io/badge/MOTOR-KORUMA_AKT%C4%B0F-20ffa0?style=flat-square&labelColor=08090D" alt="Durum Aktif" /> &nbsp;
        <img src="https://img.shields.io/badge/S%C3%9CR%C3%9CC%C3%9C-WinDivert_Attached-20f2ff?style=flat-square&labelColor=08090D" alt="Sürücü" />
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="50%">
        <b>Aktif Profil:</b> &nbsp;
        <img src="https://img.shields.io/badge/PROF%C4%B0L_3-Superonline_Agresif-20f2ff?style=flat-square&labelColor=08090D" alt="Profil 3" />
      </td>
      <td width="50%">
        <b>Ağ Verimi:</b> &nbsp;
        <img src="https://img.shields.io/badge/1,480_PPS-Reakt%C3%B6r_Nabz%C4%B1-20ffa0?style=flat-square&labelColor=08090D" alt="1480 PPS" />
      </td>
    </tr>
    <tr>
      <td width="50%">
        <b>Cerrahi Kural:</b> &nbsp;
        <code>Fake TTL=4 + 2-Byte SNI</code>
      </td>
      <td width="50%">
        <b>IPC &amp; Çalışma:</b> &nbsp;
        <code>0.12 ms IPC</code> &bull; <code>02:45:12 Aktif</code>
      </td>
    </tr>
    <tr>
      <td width="50%">
        <b>Hızlı Müdahale:</b> &nbsp;
        <kbd>⏹ Durdur</kbd> &nbsp;
        <kbd>⚡ Onarım</kbd> &nbsp;
        <kbd>⚙ Kokpit</kbd>
      </td>
      <td width="50%">
        <b>Paket Sayacı:</b> &nbsp;
        <code>24,190 paket</code> &bull; <code>%100 Doğruluk</code>
      </td>
    </tr>
    <tr>
      <td width="50%" align="center" bgcolor="#161b22">
        <img src="https://img.shields.io/badge/PENCERE-340x460px_Kenarl%C4%B1ks%C4%B1z-161b22?style=flat-square" alt="340x460" /> &nbsp;
        <img src="https://img.shields.io/badge/IPC-0_ms_S%C4%B1f%C4%B1r_Y%C3%BCk-20ffa0?style=flat-square&labelColor=08090D" alt="0 ms" />
      </td>
      <td width="50%" align="center" bgcolor="#161b22">
        <img src="https://img.shields.io/badge/SHELL_API-Win32_NotifyIcon-20f2ff?style=flat-square&labelColor=08090D" alt="Win32" /> &nbsp;
        <img src="https://img.shields.io/badge/KORUMA-Anti--Flicker-FFE600?style=flat-square&labelColor=08090D" alt="Anti-Flicker" />
      </td>
    </tr>
  </tbody>
</table>

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="33.3%" align="left">
        <img src="https://img.shields.io/badge/01-HIZLI_FLYOUT-20ffa0?style=for-the-badge&labelColor=08090D" alt="01 Hızlı Flyout" /><br /><br />
        <b>Tek Tıkla Komuta Paneli</b><br />
        <sub>340x460px Kenarlıksız Donanım UI</sub>
      </th>
      <th width="33.3%" align="left">
        <img src="https://img.shields.io/badge/02-CANLI_TELEMETR%C4%B0-20f2ff?style=for-the-badge&labelColor=08090D" alt="02 Canlı Telemetri" /><br /><br />
        <b>0 ms IPC &amp; Reaktör Nabzı</b><br />
        <sub>Rust Motoru &bull; WinDivert Köprüsü</sub>
      </th>
      <th width="33.3%" align="left">
        <img src="https://img.shields.io/badge/03-KABUK_KORUMASI-FFE600?style=for-the-badge&labelColor=08090D" alt="03 Kabuk Koruması" /><br /><br />
        <b>Anti-Flicker &amp; Hızlı Eylem</b><br />
        <sub>Debounced Win32 Durum Yönetimi</sub>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td valign="top">
        &bull; <b>Tek Tıkla Açılış:</b> Görev çubuğundan anında yükselen donanım hızlandırmalı kompakt flyout.<br /><br />
        &bull; <b>Pürüzsüz Odak:</b> Boşluğa tıklandığında veya <kbd>Esc</kbd> ile kendiliğinden pürüzsüzce kapanır.<br /><br />
        &bull; <b>Sıfır Bellek Yükü:</b> Arka planda 0 MB ek CPU/RAM; tıklandığı an mikrosaniyede uyanır.
      </td>
      <td valign="top">
        &bull; <b>Gerçek Zamanlı Verim:</b> Saniyelik PPS akışı ve <code>0.12 ms</code> ağ gecikme telemetrisi.<br /><br />
        &bull; <b>Profil &amp; Kural Monitörü:</b> Aktif bypass profilini ve cerrahi SNI kuralını doğrudan yansıtır.<br /><br />
        &bull; <b>Çekirdek Paylaşımı:</b> WinDivert çekirdek kanalı üzerinden sıfır gecikmeli veri aktarımı.
      </td>
      <td valign="top">
        &bull; <b>Anti-Flicker Debounce:</b> Windows kabuğunun seri tıklamalarındaki titremeyi engeller.<br /><br />
        &bull; <b>Çift Tıkla Büyüt:</b> Tepsi simgesine çift tıklandığında doğrudan ana kontrol kokpitini açar.<br /><br />
        &bull; <b>Tek Dokunuş Müdahale:</b> Paneli açar açmaz tek tıkla motoru durdurma veya <i>Ağ Onarımı</i>.
      </td>
    </tr>
  </tbody>
</table>

---

## Sıkça Sorulan Sorular (SSS)

<details>
<summary><b>1. Anticore çevrimiçi oyunlarda (Valorant, CS2, LoL) ban sebebi midir?</b></summary>
<br />
<b>Kesinlikle hayır.</b> Anticore oyun dosyalarına, oyun süreçlerinin belleğine (RAM) veya sunucu paketlerine müdahale etmez. Yalnızca kara listenizde bulunan engelli web adreslerinin ilk TLS el sıkışmasını parçalar. Oyun sunucuları ile aranızdaki UDP/TCP trafiği hiçbir filtreye uğramadan doğrudan akar.
</details>

<details>
<summary><b>2. Antivirüs yazılımları neden uyarı verebilir?</b></summary>
<br />
Anticore, paketleri ağ kartı seviyesinde yakalayabilmek için açık kaynaklı ve dünyaca kabul görmüş <code>WinDivert</code> sürücüsünü kullanır. Çekirdek düzeyinde paket yönlendiren tüm meşru güvenlik araçları (Wireshark, GoodbyeDPI vb.) gibi, bazı antivirüs motorları bu sürücüyü "Heuristic" olarak işaretleyebilir. Anticore'un tüm kaynak kodları açıktır, GitHub Actions derlemeleri şeffaftır ve ikili dosyalar dijital olarak imzalanmıştır.
</details>

<details>
<summary><b>3. Neden Yönetici (Administrator) izni gerekiyor?</b></summary>
<br />
Windows işletim sisteminde ağ sürücüsü başlatmak (Kernel Driver Load) ve ham soket paketlerini manipüle etmek Microsoft tarafından yalnızca Yönetici yetkisine sahip süreçlere izin verilen bir güvenlik kuralıdır. Bu durum teknik bir zorunluluktur.
</details>

<details>
<summary><b>4. Mobil cihazımı (iOS / Android) nasıl korumaya alabilirim?</b></summary>
<br />
İki pratik yöntem mevcuttur:<br />
1. <b>SOCKS5 / PAC Proxy:</b> Bilgisayarınızda Anticore çalışırken telefonunuzun Wi-Fi ayarlarından HTTP Vekil Sunucu kısmına bilgisayarınızın yerel IP adresini (örn: <code>192.168.1.50</code>) ve port olarak <code>10808</code> yazın.<br />
2. <b>Windows Mobil Etkin Nokta (Hotspot):</b> Bilgisayarınızdan interneti paylaşıp telefonunuzla bu ağa bağlandığınızda, Anticore transit geçişi otomatik devreye girer ve telefonda ek hiçbir ayar yapmadan engeller aşılır.
</details>

<details>
<summary><b>5. Discord "Starting..." döngüsünde kalıyor, ne yapmalıyım?</b></summary>
<br />
Servis sağlayıcınızın Discord CDN alan adlarını yanlış IP'ye (BTK uyarı sayfası) yönlendirmesinden (DNS zehirlemesi) kaynaklanır. Anticore içerisindeki <b>Ağ Onarımı</b> sekmesine gidin; <b>"Güvenli DNS Uygula"</b> ve <b>"Ağ Yığınını Sıfırla"</b> butonlarına basarak DNS önbelleğinizi temizleyin.
</details>

---

## Güvenlik ve Bütünlük Doğrulama

Resmi GitHub Releases sayfasından indirdiğiniz kurulum ve taşınabilir paketleri aşağıdaki açık anahtar ile Minisign kullanarak doğrulayabilirsiniz:

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="70%" align="left">
        <img src="https://img.shields.io/badge/G%C3%9CVENL%C4%B0K-MINISIGN_ED25519_DO%C4%9ERULAMA-161b22?style=flat-square" alt="Minisign" /> &nbsp;
        <img src="https://img.shields.io/badge/%C4%B0MZA-%C5%9E%C4%B0FRELENM%C4%B0%C5%9E_B%C3%9CT%C3%9CNL%C3%9CK-20ffa0?style=flat-square&labelColor=08090D" alt="Bütünlük" />
      </th>
      <th width="30%" align="right">
        <a href="SECURITY.md"><img src="https://img.shields.io/badge/POL%C4%B0T%C4%B0KA-SECURITY.md-20f2ff?style=flat-square&labelColor=08090D" alt="Security Policy" /></a>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td colspan="2">
        <b>Resmi Minisign Açık Anahtarı (Public Key):</b><br />
        <code>dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDE1QTRFREEwMDFGNDFFNTMKUldSVEh2UUJvTzJrRmE3UGFDdG81YWtnYUdYSkhFdWQxVGJ0V2VVdHFKNDJvaGZRWS90TWx3ejMK</code>
      </td>
    </tr>
    <tr>
      <td colspan="2">
        <b>Doğrulama Komutu (PowerShell / Bash):</b><br />
        <code>minisign -Vm Anticore_0.3.1_x64-setup.exe -p anticore.key.pub</code>
      </td>
    </tr>
  </tbody>
</table>

---

## Kaynak Koddan Derleme

Kendi ikili dosyalarınızı temiz bir ortamda derlemek isterseniz aşağıdaki derleme altyapısını kurabilirsiniz:

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="33.3%" align="center">
        <img src="https://img.shields.io/badge/01_DERLEY%C4%B0C%C4%B0-RUST_1.80+-20ffa0?style=for-the-badge&labelColor=08090D" alt="Rust" /><br /><br />
        <b>Rust Toolchain</b><br />
        <code>rustup toolchain install stable</code>
      </th>
      <th width="33.3%" align="center">
        <img src="https://img.shields.io/badge/02_ARAY%C3%9CZ-NODE.JS_20+_LTS-20f2ff?style=for-the-badge&labelColor=08090D" alt="Node" /><br /><br />
        <b>Masaüstü UI Motoru</b><br />
        <code>Node.js 20+ &bull; npm &bull; Vite</code>
      </th>
      <th width="33.3%" align="center">
        <img src="https://img.shields.io/badge/03_%C3%87EK%C4%B0RDEK-MSVC_C++_2022-FFE600?style=for-the-badge&labelColor=08090D" alt="MSVC" /><br /><br />
        <b>C++ Derleme Araçları</b><br />
        <code>Visual Studio 2022 (MSVC x64)</code>
      </th>
    </tr>
  </thead>
</table>

```powershell
# 1. Depoyu klonlayın
git clone https://github.com/MonarchDevLab/Anticore.git
cd Anticore/antikor

# 2. Rust çekirdek birim ve entegrasyon testlerini çalıştırın
cd engine
cargo test --workspace

# 3. Bağımsız motor ikilisini derleyin
cargo build --release --workspace

# 4. Masaüstü arayüzünü test edin ve paketleyin
cd ../desktop
npm install
npm test
npm run tauri build
```

---

## Lisans ve Yasal Bildirim

Bu proje [MIT Lisansı](LICENSE) altında açık kaynak olarak sunulmaktadır.

- **WinDivert:** [LGPLv3](https://reqrypt.org/windivert.html) lisansına sahip bağımsız ağ filtreleme sürücüsüdür; dinamik bağlantı ile harici olarak yüklenir.
- **WebView2:** Microsoft Corporation mülkiyetindedir.
- **Yasal Sorumluluk:** Anticore; ağ performansı analizi, kişisel veri mahremiyeti ve sansürsüz bilgiye erişim ilkeleri doğrultusunda geliştirilmiştir. Kullanıcıların yerel yasal düzenlemelere uygun hareket etmesi kendi sorumluluğundadır.

<div align="center">
  <br />
  <sub>Kod mimarisi ve fikri haklar istisnasız <b>Monolith Works</b>'e aittir. Resmi açık kaynak dağıtım kanalı <b>MonarchDevLab</b>'dir.</sub>
  <br />
  <br />
</div>
