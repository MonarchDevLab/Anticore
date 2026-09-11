import { useState, useMemo } from "react";
import {
  Sparkles,
  Wrench,
  ShieldCheck,
  Zap,
  ExternalLink,
  Search,
  Tag,
  Calendar,
  Layers,
} from "lucide-react";
import { useI18n } from "../lib/i18n";
import { api } from "../lib/tauri";

interface ChangeItem {
  type: "feature" | "fix" | "security" | "perf";
  textTr: string;
  textEn: string;
}

interface ReleaseEntry {
  version: string;
  titleTr: string;
  titleEn: string;
  date: string;
  isLatest?: boolean;
  highlightTr?: string;
  highlightEn?: string;
  changes: ChangeItem[];
}

const RELEASES: ReleaseEntry[] = [
  {
    version: "v0.3.1.2",
    titleTr: "Tek Dosya (Single-File) Portable Mimarisi & Başlık Çubuğu Dil Standardizasyonu",
    titleEn: "True Single-File Portable Architecture & Titlebar Language Standardization",
    date: "12 Eylül 2026",
    isLatest: true,
    highlightTr: "Harici dosya gerektirmeyen bağımsız tek EXE taşınabilir sürüm, sürücü otomatik sağlama ve tam iki dilli başlık çubuğu.",
    highlightEn: "Self-contained single-executable portable architecture with auto-provisioning drivers and fully bilingual titlebar.",
    changes: [
      {
        type: "feature",
        textTr: "Gömülü Sürücü & Bağımsız Tek Dosya (In-Binary Embedding): WinDivert çekirdek sürücüsü (WinDivert.dll, WinDivert64.sys) ve WebView2 kütüphanesi doğrudan Anticore.exe ikili dosyasının içine statik olarak derlendi. Uygulama harici hiçbir DLL/SYS dosyasına ihtiyaç duymadan tek bir EXE olarak her yerde bağımsız çalışır.",
        textEn: "In-Binary Driver Embedding & Single-File Portable: WinDivert kernel drivers (WinDivert.dll, WinDivert64.sys) and WebView2Loader are now statically embedded directly into Anticore.exe. The application runs anywhere as a single self-contained executable with zero loose files.",
      },
      {
        type: "feature",
        textTr: "Kendi Kendini Onarma & Çıkartma (Self-Extracting Auto-Heal): Uygulama boş bir dizinde tek başına çalıştırıldığında gerekli sürücüleri milisaniyeler içinde disk üzerine sessizce çıkartır ve Windows çekirdek imza gereksinimlerini eksiksiz karşılar.",
        textEn: "Self-Extracting Auto-Heal: When launched alone in any directory, Anticore automatically provisions runtime drivers to disk within milliseconds, satisfying Windows kernel code integrity requirements.",
      },
      {
        type: "fix",
        textTr: "Başlık Çubuğu Dil Standardizasyonu: Üst başlık çubuğunda Türkçe arayüzde görünen İngilizce durum rozeti giderildi; bekleme modu ETKİN DEĞİL · BEKLEMEDE / INACTIVE · STANDBY olarak dinamik bağlandı, pencere kontrolleri ve araç ipuçları iki dilli yapıldı.",
        textEn: "Titlebar Language Standardization: Fixed hardcoded English status badge in Turkish mode; standby status now displays INACTIVE · STANDBY / ETKİN DEĞİL · BEKLEMEDE dynamically with fully localized window controls.",
      },
      {
        type: "fix",
        textTr: "Sürücü Hata Ayrıştırması & Sahte Yönetici Uyarısı Çözümü: WinDivertOpen hata kodları ayrıştırıldı; yönetici yetkisi varken oluşan dosya eksikliklerinin sahte 'yönetici oturumu gerektirir' uyarısı üretmesi engellendi.",
        textEn: "Driver Error Classification & False Admin Prompt Resolution: WinDivertOpen error codes properly classified; file absences under active admin sessions no longer trigger misleading elevation prompts.",
      },
    ],
  },
  {
    version: "v0.3.1.1",
    titleTr: "Kalıntısız Sistem Temizliği (Purge), 10 Donanım Teması & Akıllı Bildirimler",
    titleEn: "Zero-Trace System Purge, 10 Hardware Themes & Intelligent Notifications",
    date: "11 Eylül 2026",
    isLatest: false,
    highlightTr: "Tek tıkla sıfır-iz sistem kaldırma, donanım temaları, çift platform kurulum sihirbazı ve kesintisiz güncelleme bildirimleri.",
    highlightEn: "1-click zero-trace system purge, hardware themes, cross-platform setup wizard, and seamless update notifications.",
    changes: [
      {
        type: "feature",
        textTr: "Sistemden Tamamen Kaldır (Zero-Trace Purge): Ayarlar ekranına tek tıkla Anticore ile ilişkili tüm servisleri, WinDivert çekirdek sürücüsünü, DNS/DoH kayıtlarını, başlangıç görevlerini, kısayolları ve uygulama verilerini arkada hiçbir iz bırakmadan temizleyen kaldırma motoru eklendi.",
        textEn: "Complete System Purge (Zero-Trace): One-click uninstallation engine in Settings that completely removes all services, WinDivert kernel drivers, DNS/DoH entries, startup tasks, shortcuts, and application data without leaving traces.",
      },
      {
        type: "feature",
        textTr: "10 Morfolojik Donanım Teması & Marka Renkleri: #020617 koyu zemin, #ff642b canlı köz birincil ve #00edff siber camgöbeği ikincil renkleriyle donatılan 10 bağımsız donanım karakteri entegre edildi.",
        textEn: "10 Morphological Hardware Themes & Brand Palette: 10 distinct hardware themes tuned with #020617 void background, #ff642b live ember primary, and #00edff cyan secondary accents.",
      },
      {
        type: "feature",
        textTr: "Çift Platform Kurulum & Bağımsız Çalıştırma: Hem Windows hem macOS için sistem servisi kurulumu veya tek seferlik taşınabilir (portable) çalıştırma seçenekleri netleştirildi.",
        textEn: "Cross-Platform Setup & Portable Execution: Streamlined persistent system service installation and single-run portable execution for both Windows and macOS.",
      },
      {
        type: "fix",
        textTr: "Gelişmiş Güncelleme Algılama & Bildirimleri: Çok parçalı sürüm numaraları ve OTA bildirimleri optimize edildi; açılışta ve arka planda yeni sürümler gecikmesiz bildirilir.",
        textEn: "Enhanced Update Detection & Notifications: Multi-part versioning and OTA notifications refined to ensure instant alerts both on startup and in the background.",
      },
      {
        type: "security",
        textTr: "Hukuki Dil & Dağıtım Standartlaştırması: Tüm kullanıcı dokümanları ve dağıtım paketleri ISS kaynaklı DPI kısıtlamalarına odaklı nötr ve teknik terminolojiyle güncellendi.",
        textEn: "Legal Terminology & Distribution Neutralization: All documentation and distribution packages standardized with neutral ISP DPI terminology.",
      },
    ],
  },
  {
    version: "v0.3.1",
    titleTr: "Çift Platform (Windows & macOS), 10 Donanım Teması & Canlı Telemetri",
    titleEn: "Cross-Platform (Windows & macOS), 10 Hardware Themes & Live Telemetry",
    date: "11 Eylül 2026",
    isLatest: false,
    highlightTr: "macOS/Windows tam uyumluluğu, 10 morfolojik tema, taktik sistem tepsisi ve sıfır-çakışmalı akıllı güncelleyici.",
    highlightEn: "macOS/Windows full parity, 10 morphological themes, tactical system tray and zero-conflict smart updater.",
    changes: [
      {
        type: "feature",
        textTr: "10 Morfolojik Donanım Teması: Yalnızca renk değil; kart sınırları, köşe kavisleri, gölge derinlikleri ve reaktif atmosfer parçacıklarıyla 10 bağımsız donanım karakteri (Obsidian Core, Cyberpunk Volt, Luxury Gold, Crimson Protocol, Cobalt Matrix, Amber CRT, Amethyst Void, Abyss Aqua, Solar Flare, Titanium Clean).",
        textEn: "10 Morphological Hardware Themes: Not just color shifts; distinct card radii, border depths, shadow layers, and reactive atmospheric particles defining 10 unique hardware characters.",
      },
      {
        type: "feature",
        textTr: "Gelişmiş Pencere ve Sistem Tepsisi Yönetimi: Sistem tepsisi simgesini gizleme/gösterme, pencereyi her zaman en üstte sabitleme ve kapatıldığında arka planda tepsiye küçültme kontrolleri Ayarlar ekranına eklendi.",
        textEn: "Advanced Window & Tray Controls: System tray icon visibility toggle, Always-on-Top window pinning, and Minimize-to-Tray on close added to Settings.",
      },
      {
        type: "feature",
        textTr: "5 Seçenekli Taktik Sistem Tepsisi Menüsü: Sağ tık menüsü Aç, Başlat, Durdur, Güncellemeleri Kontrol Et ve Kapat olmak üzere tam 5 fonksiyonla donatıldı; Menü Çubuğu Hızlı Paneline anlık güncelleme butonu entegre edildi.",
        textEn: "5-Item Tactical System Tray Menu: System tray menu standardized with Open, Start, Stop, Check for Updates, and Quit; added quick-update button to Tray Quick Panel.",
      },
      {
        type: "feature",
        textTr: "Sıfır-Çakışmalı Akıllı Güncelleyici: Güncelleme sırasında eski süreçlerin ve sürücülerin dosya kilidi oluşturmasını engelleyen yükleyici süreç sonlandırma kancası ve hazırlık motoru eklendi.",
        textEn: "Zero-Conflict Smart Updater: Automated process teardown hooks in installer ensuring seamless in-place updates without file locks or driver collisions.",
      },
      {
        type: "feature",
        textTr: "Çift Platform Yerel Sistem Bildirimleri: Yeni sürüm çıktığında Windows WinRT Toast ve macOS UserNotification üzerinden yerel sesli sistem uyarıları bağlandı.",
        textEn: "Cross-Platform Native Notifications: Audible desktop toast notifications via Windows WinRT and macOS Notification Center when new updates are detected.",
      },
      {
        type: "feature",
        textTr: "macOS Yerel Motoru (UTUN & PFCTL): KEXT uzantısı gerektirmeden Userspace TUN ve Paket Filtresi (PF) ile tam hat hızında DPI atlatma desteği eklendi.",
        textEn: "macOS Native Engine (UTUN & PFCTL): Driverless Userspace TUN and Packet Filter anchor redirection for native DPI evasion without kernel extensions.",
      },
      {
        type: "feature",
        textTr: "Ayrıştırılmış Apple Silicon (ARM64) & Intel (x64) Paketleri: Modern M serisi Mac'ler ve Intel Mac'ler için optimize edilmiş bağımsız DMG ve App kurulum kalıpları sunuldu.",
        textEn: "Dedicated Apple Silicon & Intel Packages: Separate, optimized DMG installers and App bundles for both ARM64 (M1-M5) and Intel (x86_64) Mac platforms.",
      },
      {
        type: "feature",
        textTr: "macOS Menü Çubuğu Paneli & LaunchDaemon: Üst menü çubuğuna kenetlenen taktik Hızlı Panel ve arayüzsüz sistem başlangıcı için LaunchDaemon servisi.",
        textEn: "macOS Menu Bar Quick Panel & LaunchDaemon: Compact tactical flyout docked to the menu bar and system LaunchDaemon configuration for headless startup.",
      },
      {
        type: "feature",
        textTr: "Uygulama İçi Otomatik Güncelleme: GitHub Releases entegrasyonu ile yeni sürümler anında açılışta algılanır ve tek tıkla güncellenir.",
        textEn: "In-App Auto Updater: Direct GitHub Releases integration silently detects new updates on startup with 1-click update.",
      },
      {
        type: "feature",
        textTr: "3D İzometrik Ağ Trafiği Görselleştirmesi: Anlık PPS ve ağ akışı, derinlikli izometrik 3D sütunlar ve dinamik aydınlatma ile görselleştirildi.",
        textEn: "3D Isometric Traffic Visualizer: Real-time PPS and network activity rendered via isometric 3D canvas bars with dynamic lighting.",
      },
      {
        type: "feature",
        textTr: "Canlı Durum Orbu: Konsol reaktöründe aktifken yeşil dönen çift uydu, 140 3D parçacık küresi ve nabız atan aura, durduğunda kırmızı durağan ışıma eklendi.",
        textEn: "Live Status Orb: Console reactor now features 140 3D z-sorted particles, gyroscopic dual orbital rings, and pulsing aura when active.",
      },
      {
        type: "feature",
        textTr: "Ağ & Cihaz Paylaşımı (LAN Proxy & Hotspot Transit): Wi-Fi üzerindeki telefon ve tabletler için SOCKS5, HTTP ve Hotspot şeffaf koruması eklendi.",
        textEn: "LAN Device Sharing: SOCKS5, HTTP PAC proxy and Hotspot transparent NAT transit capture for phones and tablets.",
      },
      {
        type: "feature",
        textTr: "Windows Ağ Yığını & Winsock Sıfırlama: Ağ Onarımı paneline Winsock, TCP/IP yığını sıfırlama ve bağdaştırıcı yenileme araçları eklendi.",
        textEn: "Network Stack & Winsock Reset: Integrated netsh winsock reset, TCP/IP stack reset and adapter release/renew tools in Network Repair.",
      },
      {
        type: "feature",
        textTr: "Hedef Siteler Izgara Düzeni & Kategori Hapları: Siteler ekranı modern 2 sütunlu kart ızgarasına ve yuvarlak kategori butonlarına kavuşturuldu.",
        textEn: "Target Sites Grid Layout & Category Pills: Transformed sites screen into a responsive 2-column card grid with refined category filter pills.",
      },
      {
        type: "fix",
        textTr: "Post-Quantum Kyber & MSS Parçalı TLS Çözümlemesi: MSS sınırını aşan (1500+ bayt) büyük ClientHello paketlerinde SNI kayıpsız ayrıştırılır.",
        textEn: "Post-Quantum Kyber & Segmented TLS Parsing: Reliably extracts SNI across TCP MSS boundaries for massive Kyber and ECH handshakes.",
      },
      {
        type: "fix",
        textTr: "Sentetik TLS El Sıkışma Kalibrasyonu: Test Merkezi'nde modern tarayıcı uzantıları (TLS 1.2/1.3, gruplar, algoritmalar) eklenerek yanlış engelleme alarmları önlendi.",
        textEn: "Synthetic TLS Handshake Calibration: Enhanced Blockcheck with full modern browser TLS extensions to prevent CDN/DPI false positive blocks.",
      },
      {
        type: "fix",
        textTr: "Tray Quick Panel Gerçek Sayaçları: Sahte 'Ölçülmedi' yazıları kaldırıldı; gerçek Anlık Hız (PPS), İşlenen Paket ve Çalışma Süresi (Uptime) bağlandı.",
        textEn: "Tray Quick Panel Real Telemetry: Removed unmeasured placeholders; connected real live PPS, processed packets and uptime timer.",
      },
      {
        type: "fix",
        textTr: "Dinamik Kara Liste: Çekirdek çalışırken eklenen/silinen siteler Çekirdeği yeniden başlatmadan anında belleğe aktarılır.",
        textEn: "Dynamic Blacklist: Adding/removing sites updates active memory instantly without restarting the engine.",
      },
      {
        type: "fix",
        textTr: "Topluluk Kara Listesi 404 Onarımı: Çalışan güncel Zapret Türkiye hostlist kaynağına geçildi; offline yerleşik yedek liste ve hata bildirim alanı sağlandı.",
        textEn: "Community Blacklist 404 Fix: Switched to live Zapret Turkey hostlist with built-in offline fallback database and dedicated error alerts.",
      },
      {
        type: "security",
        textTr: "Otomatik Yönetici (UAC) Başlatma: Uygulama manifestine requireAdministrator gömüldü; izin bildirim döngüleri engellendi.",
        textEn: "Automatic Administrator Elevation: Embedded requireAdministrator manifest to avoid runtime permission loop prompts.",
      },
      {
        type: "security",
        textTr: "GoodbyeDPI & Splitwire Süreç Kilitlerinin Çözülmesi: Eski araçların kilitlediği dosyalar ve WinDivert servisleri tek tıkla sonlandırılabilir.",
        textEn: "Legacy Process Lock Resolution: Forcefully terminates locked GoodbyeDPI/Splitwire processes and drivers for clean uninstallation.",
      },
      {
        type: "perf",
        textTr: "Superonline & Discord DPI Evasion: Sandvine/Procera donanımına karşı TTL=4 ve 2 bayt sabit parçalama dizilimi optimize edildi.",
        textEn: "Superonline & Discord DPI Evasion: Calibrated TTL=4 and 2-byte TLS fragmentation against Sandvine/Procera DPI hardware.",
      },
      {
        type: "perf",
        textTr: "Disk Alanı & Derleme Önbelleği Temizliği: Eski Rust derleme önbellekleri temizlenerek ikili dosya bütünlüğü bozulmadan 34.3 GB alan geri kazanıldı.",
        textEn: "Disk Footprint & Build Cache Cleanup: Purged stale compilation caches reclaiming 34.3 GB disk space while preserving full binary integrity.",
      },
    ],
  },
  {
    version: "v0.3.0",
    titleTr: "Kamuya Açık Kaynak Lansmanı & 8 Donanım Teması",
    titleEn: "Public Open-Source Release & 8 Hardware Themes",
    date: "9 Eylül 2026",
    highlightTr: "GitHub kamu yayını, çoklu pencere Tray Quick Panel ve 8 bağımsız morfolojik tema dünyası.",
    highlightEn: "GitHub public launch, multi-window Tray Quick Panel and 8 distinct atmospheric hardware themes.",
    changes: [
      {
        type: "feature",
        textTr: "10 Morfolojik Donanım Teması: Obsidian Core, Cyberpunk 2077, Quiet Luxury, Crimson Hazard, Cobalt Matrix, Amber CRT, Amethyst Nebula, Abyss Aqua, Solar Flare ve Titanium Lab.",
        textEn: "10 Morphological Hardware Themes: Obsidian Core, Cyberpunk 2077, Quiet Luxury, Crimson Hazard, Cobalt Matrix, Amber CRT, Amethyst Nebula, Abyss Aqua, Solar Flare and Titanium Lab.",
      },
      {
        type: "feature",
        textTr: "Sistem Tepsisi (Tray) Sol Tık Hızlı Erişim: Görev çubuğunda yüzen hafif, milimetrik hizalanan 340x460px mini kokpit paneli.",
        textEn: "System Tray Left-Click Quick Panel: Floating frameless 340x460px mini cockpit panel with auto-dismiss.",
      },
      {
        type: "feature",
        textTr: "Windows DoH ve DNS Manipülasyon Koruması: Operatörlerin hatalı IP yönlendirmelerine ve DNS zehirlenmesine karşı otomatik DoH ve Cloudflare 1.1.1.1 onarımı.",
        textEn: "Windows DoH & DNS Manipulation Protection: Automatic encrypted DNS (DoH) and Cloudflare 1.1.1.1 restoration against ISP redirection.",
      },
      {
        type: "security",
        textTr: "TCP Soket Teardown: Çekirdek kapatıldığında açık kalan Keep-Alive TLS oturumlarını anında sonlandıran Win32 TCB sıfırlayıcı.",
        textEn: "TCP Socket Teardown: Kernel-level Win32 TCB terminator to cut persistent Keep-Alive connections upon engine stop.",
      },
      {
        type: "perf",
        textTr: "ECH & Kyber 2048 Bayt Desteği: Post-Quantum Kyber ve Encrypted Client Hello taşıyan dev paketler için arabellek genişletildi.",
        textEn: "ECH & Kyber 2048-byte Support: Buffer enlarged for massive Post-Quantum Kyber and Encrypted Client Hello TLS packets.",
      },
    ],
  },
  {
    version: "v0.2.0",
    titleTr: "Masaüstü Kullanıcı Arayüzü & ISP Optimizasyonu",
    titleEn: "Desktop User Interface & ISP Calibration",
    date: "1 Eylül 2026",
    highlightTr: "Tauri v2 tabanlı yerel GUI, Türkiye ISP profilleri ve Test Merkezi.",
    highlightEn: "Tauri v2 native GUI, Turkey ISP profile presets and Test Center.",
    changes: [
      {
        type: "feature",
        textTr: "Modern Masaüstü Kokpiti: React 18, Vite ve Tailwind CSS ile inşa edilmiş tepkisel arayüz.",
        textEn: "Modern Desktop Cockpit: Responsive control center built with React 18, Vite and Tailwind CSS.",
      },
      {
        type: "feature",
        textTr: "Türkiye ISP Profilleri: Türk Telekom, Turkcell Superonline, Vodafone, Kablonet ve TurkNet için özel kurallar.",
        textEn: "Turkey ISP Profiles: Tailored evasion strategies for Türk Telekom, Turkcell Superonline, Vodafone and Kablonet.",
      },
      {
        type: "feature",
        textTr: "Test Merkezi (Blockcheck): Canlı TCP/TLS el sıkışması göndererek hedeflerin erişilebilirliğini test eden sonda Çekirdeği.",
        textEn: "Test Center (Blockcheck): Synthetic TLS handshake probing engine for validating target reachability.",
      },
    ],
  },
  {
    version: "v0.1.0",
    titleTr: "Çekirdek Çekirdek & WinDivert FFI Prototipi",
    titleEn: "Core Engine & WinDivert FFI Prototype",
    date: "15 Ağustos 2026",
    highlightTr: "Rust tabanlı L3/L4/L7 paket yakalama ve cerrahi manipülasyon çekirdeği.",
    highlightEn: "Rust-based L3/L4/L7 packet capture and surgical DPI manipulation core.",
    changes: [
      {
        type: "feature",
        textTr: "WinDivert 2.x Sürücü Entegrasyonu: Windows ağ yığınında paket yakalama ve sıfır gecikmeli enjeksiyon.",
        textEn: "WinDivert 2.x Driver Integration: In-kernel packet interception and zero-latency injection.",
      },
      {
        type: "feature",
        textTr: "TLS SNI Parçalama ve Sahte Paket Üretimi: Fixed, SNI-Mid ve Fake TTL manipülasyon adımları.",
        textEn: "TLS SNI Fragmentation & Fake Packets: Fixed offset, SNI-Mid and Fake TTL packet manipulation steps.",
      },
    ],
  },
];

export default function ChangelogView() {
  const { lang } = useI18n();
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredReleases = useMemo(() => {
    return RELEASES.map((rel) => {
      const filteredChanges = rel.changes.filter((c) => {
        const matchesType = filterType === "all" || c.type === filterType;
        const text = lang === "tr" ? c.textTr : c.textEn;
        const matchesSearch =
          searchQuery.trim() === "" ||
          text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rel.version.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
      });
      return { ...rel, changes: filteredChanges };
    }).filter((rel) => rel.changes.length > 0 || searchQuery.trim() === "");
  }, [filterType, searchQuery, lang]);

  const getTypeBadge = (type: ChangeItem["type"]) => {
    switch (type) {
      case "feature":
        return {
          label: lang === "tr" ? "YENİ" : "NEW",
          color: "bg-live/15 text-live border-live/30",
          icon: Sparkles,
        };
      case "fix":
        return {
          label: lang === "tr" ? "DÜZELTME" : "FIX",
          color: "bg-sky/15 text-sky border-sky/30",
          icon: Wrench,
        };
      case "security":
        return {
          label: lang === "tr" ? "GÜVENLİK" : "SECURITY",
          color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          icon: ShieldCheck,
        };
      case "perf":
        return {
          label: lang === "tr" ? "PERFORMANS" : "PERF",
          color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
          icon: Zap,
        };
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* ── Üst Başlık ── */}
      <header className="pb-4 border-b border-border-brutal flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight text-paper-bright">
              {lang === "tr" ? "Yama Notları & Sürüm Günlüğü" : "Changelog & Release Notes"}
            </h2>
            <span className="badge badge-live font-mono text-[10px] uppercase font-bold">
              SemVer 2.0
            </span>
          </div>
          <p className="mt-1 text-xs text-paper-muted">
            {lang === "tr"
              ? "Anticore çekirdeği ve masaüstü arayüzündeki tüm yenilikler, onarımlar ve teknik detaylar."
              : "All features, hotfixes and architectural updates across the Anticore engine and GUI."}
          </p>
        </div>

        <button
          onClick={() => void api.openBrowserUrl("https://github.com/MonarchDevLab/Anticore/releases")}
          className="btn btn-secondary text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <ExternalLink size={13} />
          <span>GitHub Releases</span>
        </button>
      </header>

      {/* ── Filtreleme ve Arama Çubuğu ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-surface-card border border-border-brutal">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === "tr" ? "Yama notlarında ara (örn. Discord, UAC, Tray)..." : "Search changelog (e.g. Discord, UAC, Tray)..."}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-subtle border border-border-brutal text-xs text-paper placeholder:text-paper-faint focus:outline-none focus:border-live transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "all", labelTr: "Tümü", labelEn: "All" },
            { id: "feature", labelTr: "Yeni", labelEn: "Features" },
            { id: "fix", labelTr: "Düzeltmeler", labelEn: "Fixes" },
            { id: "security", labelTr: "Güvenlik", labelEn: "Security" },
            { id: "perf", labelTr: "Performans", labelEn: "Performance" },
          ].map((tab) => {
            const active = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                  active
                    ? "bg-live/15 text-live border-live/30 shadow-sm"
                    : "bg-surface-subtle text-paper-muted border-border-brutal hover:text-paper hover:bg-surface-hover"
                }`}
              >
                {lang === "tr" ? tab.labelTr : tab.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Sürümler Zaman Çizelgesi ── */}
      <div className="space-y-6">
        {filteredReleases.map((rel) => (
          <article
            key={rel.version}
            className={`card p-5 lg:p-6 rounded-2xl border transition-all ${
              rel.isLatest
                ? "border-live/40 bg-surface-card shadow-[var(--shadow-brutal-live)]"
                : "border-border-brutal bg-surface-card"
            }`}
          >
            {/* Sürüm Başlık Satırı */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-border-brutal">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm border shadow-sm ${
                    rel.isLatest
                      ? "bg-live text-void border-live shadow-live/20 font-black"
                      : "bg-surface-elevated text-paper-bright border-border-brutal"
                  }`}
                >
                  <Tag size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black font-mono text-paper-bright">
                      {rel.version}
                    </h3>
                    {rel.isLatest && (
                      <span className="px-2 py-0.5 rounded-full bg-live/20 text-live border border-live/40 text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
                        {lang === "tr" ? "GÜNCEL SÜRÜM" : "LATEST"}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-paper mt-0.5">
                    {lang === "tr" ? rel.titleTr : rel.titleEn}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-paper-faint font-mono">
                <Calendar size={13} />
                <span>{rel.date}</span>
              </div>
            </div>

            {/* Vurgu / Özet Cümlesi */}
            {(rel.highlightTr || rel.highlightEn) && (
              <div className="mt-3.5 p-3 rounded-xl bg-surface-subtle/70 border border-border-brutal text-xs text-paper-muted flex items-start gap-2.5">
                <Layers size={14} className="text-live shrink-0 mt-0.5" />
                <span>{lang === "tr" ? rel.highlightTr : rel.highlightEn}</span>
              </div>
            )}

            {/* Değişiklik Maddeleri */}
            <div className="mt-4 space-y-2.5">
              {rel.changes.map((item, idx) => {
                const badge = getTypeBadge(item.type);
                const Icon = badge.icon;
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surface-subtle/40 border border-border-brutal hover:border-border-brutal-strong transition-colors flex items-start gap-3 text-xs"
                  >
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold tracking-wider uppercase shrink-0 mt-0.5 ${badge.color}`}
                    >
                      <Icon size={11} />
                      <span>{badge.label}</span>
                    </span>
                    <span className="text-paper leading-relaxed font-sans">
                      {lang === "tr" ? item.textTr : item.textEn}
                    </span>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
