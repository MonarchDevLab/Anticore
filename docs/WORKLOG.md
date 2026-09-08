# WORKLOG

## 2026-09-09 — Yoğun operasyon konsolu
- Kullanıcı önceki tasarımı reddetti ve teknik/yoğun panel yönünü seçti. Dashboard yerleşimi yeniden kuruldu; motor kontrolü ConnectionConsole bileşenine ayrıldı. Gerçek durum göstergesi, bitişik telemetri, yatay TLS hedefleri ve kompakt olay/araç alanı uygulandı. Yerel fontlar ve tema renkleri korundu.
- 14 frontend testi ve mevcut Edge kabul senaryoları geçti. 1080×720 pencerede motor/telemetri/hedef testlerinin görünürlüğü ayrıca doğrulandı; 390/768/1080px taşma yok. Örnek metin kontrastları 5.48–13.87:1. Ekran görüntüleri test verisi; native ağ etkileşimi kanıtı değildir.
- [KARAR-UI-20260909] Son kullanıcı tasarım yönü: yoğun teknik konsol. 5px panel, 3px kontrol, 14px aralık, 24px zemin ızgarası. Önceki ferah/kavisli panel yönü geçersiz.

## 2026-09-08 kabul devamı — ef32270
- Son paketleme: 17:15; EXE/NSIS/MSI/portable yeniden üretildi, GUI root/dist/portable/ZIP içeriği eşleşti. Yeni imza/yayın veya canlı ağ işlemi yapılmadı. Önceki dağıtım yedeklendi.
- GUI SHA256: `02533DBEB03EFD9DC006F1E268587CC2A3C8AD82B57637018A7914A88C6F4C89`.
- Portable ZIP SHA256: `C8FA180BB91C59E8A9FC0CAE924BE2ED2D8DB77212835EFA53B965FA59B0AE3E`.
- NSIS SHA256: `C5EAD756958E6613B536A1918A5D8F1D0B5A8A388921F493B130EA2855F3272B`.
- MSI SHA256: `DF40893F8D96CE1BF9D0081D582A0EE1310812C1ACA72499DB1BF505F33693E5`.
- Ana durdurma yolu bağımsız süreç ve SCM hatalarını artık yutmaz; başarısız taskkill sonrası PID kaydı korunur. Servis stop komutundan sonra STOPPED veya kaldırılmış durum görülmeden başarı bildirilmez; 5 saniye zaman sınırı vardır.
- Panel başlangıcı bağımsız motor veya çalışır/geçiş halindeki servis varken reddedilir. Bu yerel kontrol bütün çoklu GUI süreçlerinin atomik koordinasyonu değildir.
- Dashboard yalnız bilinen profil kimliğini saklar; `service` ve `detached` mod adları seçim olarak yazılmaz. Başarısız veri yenilemesinde eski profil/hedef/DNS verisi temizlenir.
- Yeni regresyon senaryolarıyla 6 frontend dosyasında 14 test ve mevcut 9 backend testi geçti; TypeScript/Vite geçti. Core değişmedi; 48 motor testi önceki tur kanıtıdır, bu tur yeniden çalıştırılmadı.
- Yeni stop IPC yolunun native UI/SCM hata enjeksiyonu ile canlı uçtan uca testi yapılmadı. Önceki CLI/SCM kabulü bu yeni yolun canlı kanıtı sayılmaz.

## 2026-09-08 tam oturum kaydı

Bu bölüm 12:32 dağıtımının tarihsel anlık kaydıdır; daha yeni kabul devamı ve HANDOFF/TASKS önceliklidir.

### Kapsam ve commitler
- Proje: `E:\Personel\Branding\Uygulama\Anticore\antikor`; dal: `feat/complete-tool-workspace`; başlangıç güvenli kaydı: `8379a9e`.
- `511a0bb`: çalışma modları ve dağıtım düzeltmeleri (7 dosya).
- `48536eb`: kullanıcı tarafından reddedilen slate tasarımının revizyonu ve güvenli sihirbaz (12 dosya).
- `27ab0e8`: test/paket kanıtlarının ilk kayıt eşitlemesi (5 doküman).
- Bu kayıt turunda test, build, canlı ağ işlemi ve yayın tekrarlanmadı; git durumu, raporlar ve dağıtım SHA-256 değerleri yeniden okundu.

### Arayüz ve kurulum sihirbazı
- `Dashboard.tsx`, `workspace.css`: bağlantı yolu çizimi yerine büyük güç kontrolü, kurulu temanın vurgu rengi, profil ve gerçek paket göstergeleri korundu. `MASTER.md` yeni yönle güncellendi.
- `tool-pages.css`, `main.tsx`, `App.tsx`: ikincil ekranlarda ortak kart, tipografi, kontrol boyutu, odak ve azaltılmış hareket kuralları. Bu, bütün ikincil sayfaların sıfırdan yeniden tasarlandığı anlamına gelmez.
- `SettingsView.tsx`: bölüm bağlantıları ve tema seçiminde `aria-pressed`. `Profiles.tsx` ve `LogsView.tsx`: yükleme hataları görünür.
- `ConfirmDialog.tsx`: native modal dialog; Escape/backdrop iptali işlem sırasında engellenir. Native klavye/ekran okuyucu davranışı bu oturumda uçtan uca ölçülmedi.
- `Wizard.tsx`: DNS değişikliği varsayılan kapalı; alan adları batch API ile yazılır; DNS/motor hataları yutulmaz; başarısız başlangıç onboarding tamamlandı kaydı yazmaz; başarılı profil saklanır ve ana ekranla eşitlenir.
- `Wizard.test.tsx`: motor hatası, alan adı kaydetme hatası, DNS opt-in ve başarılı profil kaydı senaryoları.

### Çalışma modu düzeltmeleri
- `Setup.tsx`: durum/profil/yetki sorgularında hata gösterimi; bilinmeyen durum artık kurulu değil/kapalı gibi sunulmaz; yetki veya durum doğrulanmadan işlem başlatılmaz. Kurulu servis varken bağımsız başlatma kapalıdır.
- `commands.rs`: `sc create` seçenek ve değerleri ayrıldı; stdout/stderr hataları taşınır; mevcut servis kurulum öncesinde sessizce silinmez; çalışan panel/bağımsız motorla servis kurulumu engellenir; profil doğrulanır.
- Bağımsız başlangıç: ikinci başlatma kontrolü, yerel başlangıç günlüğü, sürücü-hazır mesajı için 5 saniye sınır, erken çıkışın hata olarak dönmesi, hazır olmayan çocuğun durdurulması ve PID yazma hatasının raporlanması.
- `Setup.test.tsx`: bilinmeyen durum, yönetici olmayan kullanıcı ve başarısız bağımsız başlangıç senaryoları.
- Bu değişiklikler bütün çoklu süreç/race, PID yeniden kullanımı ve otomatik toparlanma senaryolarının çözüldüğünü kanıtlamaz.

### Dağıtım ve ortam
- İlk aşamada yalnız target/release EXE güncellenmiş, root/dist/portable eski kalmıştı; kullanıcı bildirimiyle hash/tarih farkı doğrulandı. Son aşamada tüm dağıtım kopyaları yenilendi.
- `tauri.conf.json`: kaynak haritası motoru `anticore-cli.exe`, WinDivert DLL/SYS ve WebView2 loader'ı uygulama yanına yerleştirir; eski `_up_` paket yolları kaldırıldı. Son WiX çıktısında `_up_` dizini bulunmadığı kontrol edildi; gerçek kurulu sistem yükseltmesi çalıştırılmadı.
- `package.ps1`: kopyalama hataları artık başarı gibi yutulmaz; dosyalar yedeklenir ve hash karşılaştırılır; eski kurulum çıktısı için tarih kontrolü; portable ZIP önce staging'e üretilir; geçersiz kalan `.sig` yan dosyaları yedeğe taşınır.
- Yedekler: `package-backups/20260908-122702` ve `package-backups/20260908-123235`. İkincisi önceki EXE/CLI/ZIP/NSIS/MSI ve imza dosyalarını içerir. Bunlar yereldir ve git dışındadır.
- Windows'un yüklediği `desktop/src-tauri/target/release/WinDivert64.sys` derlemeyi kilitledi. Kaynakla aynı hash doğrulandı; silinmeden `WinDivert64.loaded-20260908.sys` adına taşındı. Yeni build normal adlı dosyayı tekrar oluşturdu. Kernel sürücü hizmeti kaldırılmadı; sistem yeniden başlatılmadı.
- Windows PowerShell 5 script politikası test yardımcısını engelledi. Politika değiştirilmedi; kurulu PowerShell 7 yönetici olarak kullanıldı. NSIS araç önbelleği erişimi için izinli build yapıldı.
- `dist/Anticore.exe.old` önceki oturumdan kalmadır; yeni çalıştırma hedefi değildir ve bu oturumda silinmedi.

### Doğrulama kanıtı ve sınırı
- `npm test`: 4 dosyada 11 test geçti; `npm run build`: TypeScript/Vite geçti.
- Desktop `cargo test`: 9 test geçti. Engine `cargo test --workspace`: 47 core + 1 gerçek WinDivert filtre entegrasyonu geçti (48 toplam).
- Engine release, desktop release, NSIS ve MSI üretimi başarılı. Son paketler 2026-09-08 12:32 yerel saat aralığında üretildi.
- Kullanıcının açık izniyle yalnız çalışma alanındaki GUI örnekleri kapatıldı; `live-CloseApps.txt` bunu kaydeder.
- `scripts/test-live-modes.ps1`: bağımsız motorun gerçek hazır çıktısı görüldü ve süreç durduruldu; geçici AnticoreService oluşturuldu, başladı, 2 saniye çalışır kaldı, durduruldu ve silindi. `live-Verify.txt`: iki PASS ve DeleteService SUCCESS. Son `sc query AnticoreService` 1060 döndü.
- Canlı test CLI/SCM seviyesindedir; React → Tauri → Windows native düğme akışının tamamı değildir. Test mevcut servisi silip üzerine kurmayı reddeder. DNS değiştirilmedi. Test verileri `live-test-data/` içinde yerel tutulur.
- Son GUI root, dist, portable klasörleri ve ZIP içindeki EXE aynı SHA-256 değerine sahip. ZIP arşiv hash'i içindeki EXE hash'inden farklıdır.

### Son dağıtım SHA-256 değerleri (bu kayıt turunda tekrar okundu)
| Dosya (`dist/`) | SHA-256 |
| --- | --- |
| Anticore.exe | C149475929E4F03B62AEDECC1A8CC5EB3AF353AB3FEC28AADE1DF292AC49DBB4 |
| anticore-cli.exe | 3C48A0F386D12848071A72E473184E84FAA5C414BF190EB386CE6B2F3E9B3427 |
| Anticore_0.3.0_x64-portable.zip | 890EEF6ACF13A7D860F3307B8A38E2A1D2E143B5D71102F8F32C6F21936AAC5E |
| Anticore_0.3.0_x64-setup.exe | F6DD154DF014E53F16CC8BE5C77B28ACFA2E630392842A4782766103D6FEDEAE |
| Anticore_0.3.0_x64_en-US.msi | B9C508392454EAC408554C5979DDEC3CCC9876175ED44163CDF77A746FD9D716 |

### Açık sınırlar ve teslim durumu
- Kaynak değişiklikleri commit edildi; 5 değiştirilmiş `dist` ikilisi ve yedeğe taşındığı için silinmiş görünen 2 `.sig` git çalışma ağacında henüz commit edilmedi. Bu kayıt talebi kapsamında ikililer yeniden yazılmadı veya yayınlanmadı.
- Son paketler için yeni imza oluşturulmadı; eski imzalar yeni dosyalara aitmiş gibi bırakılmadı. Otomatik güncelleme/yayın kabulü tamamlanmış değildir.
- Nihai tasarım kabulü, tüm temalarda erişilebilirlik/kontrast, native UI uçtan uca akışları, kurulu sistem yükseltmesi, çoklu GUI örnekleri ve yeniden başlatma kabulü açık.
- Uyarlanabilir profil/geri dönüş P1, açık kaynak yayın/imzalama P3 ve eşleştirilmiş indirme-yükleme/ISS performans testleri açık. Yeni UI revizyonunda önceki tarayıcı kabul sonuçları aynen geçerli kabul edilmez.
- “Tamamen hatasız”, “her ISS'de erişim”, “sıfır hız kaybı”, “her ekran yenilendi” veya “imzalı yayın hazır” iddiası yoktur. Devam sırası `docs/TASKS.md` içindedir.

## Aktif Oturum (Son Oturumun Detayları)
- 2026-09-08 — Çalışma modları: SC parametreleri ayrıldı; durum sorgusu hataları taşınıyor; mevcut servis kurulum sırasında silinmiyor; bağımsız motor gerçek hazır mesajı olmadan başarılı sayılmıyor. Setup izin/bilinmeyen durum testleriyle frontend 11/11, backend 9/9, motor 48/48 geçti. İzinli canlı CLI bağımsız ve SCM başlat/durdur geçti; geçici servis silindi, DNS değiştirilmedi. Bu test native arayüz düğmelerinin uçtan uca kanıtı değildir. Paketlerde `_up_` kaynak yerleşimi tespit edilip düzeltildi. Derleme kilidi Windows'ta yüklü `WinDivert64.sys` idi; aynı hash doğrulandı ve dosya `.loaded-20260908.sys` adıyla korundu, sürücü hizmeti kaldırılmadı.
- 2026-09-08 — Kullanıcı slate tasarımı reddetti. Tema rengi ve merkezi güç kontrolü geri getirildi; işlev düzeltmeleri korundu. Sihirbaz hatayı yuttuğu için başarı kaydı yazıyordu; artık hata görünür, DNS opt-in, profil yalnız başarılı başlangıç sonrası kaydedilir. 8 frontend testi ve üretim/native derleme geçti. Tarayıcıda bilinmeyen motor görünümü incelendi; gerçek uygulama açıldı. Görsel kullanıcı kabulü ve saha performansı doğrulanmadı.
- 2026-09-08 — Kayıt bakımı (`f227c3d` sonrası): TASKS doğrulama tarihi ve kalan işler ayrıştırıldı; HANDOFF commit zinciri, release çıktısı ve kanıt sınırları eşitlendi. Eski depo görünürlüğü ve sıfır hız kaybı ifadeleri doğrulanmış güncel bilgi olarak sunulmaktan çıkarıldı. Kod değişmedi; testler yeniden çalıştırılmadı.
- 2026-09-08 — `251f083`: bağlantı çalışma alanı yeniden tasarlandı, mevcut bağımlılıklar kullanıldı. Koyu/açık ve dar pencere ekranları incelendi. Vite HMR sorgu parametresi test fixture enjeksiyonunu atlıyordu; route deseni parametreleri kapsayacak şekilde düzeltildi ve fixture varlığı ayrıca doğrulandı. Gerçek ağ ölçümü yapılmadı.
- 2026-09-07 — Measured network quality: ortak aday paket filtresi gerçek WinDivertHelperEvalFilter ile doğrulandı. DROP=0x0002; shutdown receive ardından kuyruk boşaltma ve Drop ile kapatma. DLL referansları FreeLibrary ile serbest bırakılıyor. Masaüstü start/stop seri; SCM stop bloklu recv çağrısını uyandırıyor. Yeni ayarlarda RST baskılama kapalı; kaydedilmiş tercih korunuyor. Normal motor geçişlerinde sistem bağlantıları/DNS sıfırlanmıyor. Ölçülmeyen başarı/gecikme/hız vaatleri düzeltildi. PowerShell aktarım ölçümü ve karşılaştırması eklendi. Saha verisi üretilmedi.
- Mimari karar: mevcut Rust/WinDivert/Tauri hattı korunur; performans iyileştirmesi iddiası için eşleştirilmiş gerçek aktarım verisi gerekir. WindowSize uyumluluk yolu ve parçalanmış/büyük ClientHello sınırları NETWORK_PLAN.md içinde kayıtlıdır.
- **Tarih:** 2026-09-07
- **Gerçekleşenler (Faz 30 - Windows DoH & Başlangıç Kayıt Defteri İzin/Silme Onarımı ve Ağ Denetimi):**
  1. Windows Registry Salt Okunur Erişim Kök Neden Tespiti & Onarımı:
     - `commands.rs`: `reset_doh_registry` ve `set_startup_enabled` içerisinde `windows_registry::*.open()` metodunun varsayılan olarak `KEY_READ` yetkisiyle açtığı ve çağrılan `remove_value` fonksiyonunun `ERROR_ACCESS_DENIED` (5) ile reddedildiği tespit edildi.
     - `LOCAL_MACHINE.create()` ve `CURRENT_USER.create()` kullanılarak `KEY_READ | KEY_WRITE` erişimi sağlandı. `EnableAutoDoh` ve `AutoDohTemplate` anahtarları fiziken silindi; okuma teyidinde sıfırlama (`0`) garantisi eklendi.
     - `apply_doh_registry` ve `reset_doh_registry` içine `crate::net_teardown::flush_dns_cache()` eklenerek DNS önbelleğinin anında temizlenmesi sağlandı.
  2. NetworkRepair Arayüzü & Yönetici (UAC) Geri Bildirimi:
     - `NetworkRepair.tsx` içine `api.checkIsAdmin()` entegre edildi. Yönetici yetkisi olmadığında sayfanın üstünde dikkat çekici uyarı şeridi ve tek tıkla `api.restartAsAdmin()` butonu gösterildi.
     - DoH ve DNS işlemlerine hata/başarı durum geri bildirim şeritleri ve anlık yeniden sorgulama (`refreshDoh()`) bağlandı.
     - `desktop/src/lib/i18n.ts`: TR/EN yerelleştirme anahtarları (`net_admin_required_*`) tamamlandı.
  3. Dağıtım & Paketleme Sağlamlaştırması:
     - `scripts/package.ps1`: Çalışan uygulama açıkken dosyaların kilitlenmesini engellemek için `Safe-Replace-Exe` fonksiyonu yazıldı.
     - `.gitignore`: Geçici `*.old` dosyaları eklendi.
  4. Bütünsel Doğrulama:
     - `cargo test --workspace` (47/47 yeşil), `cargo test` desktop (9/9 yeşil), `npm test` (5/5 yeşil), `npm run build` (0 hata).
     - `cargo build --release` ve `package.ps1` ile güncel ikililer paketlendi (`dist/Anticore.exe`, `Anticore_0.3.0_x64-portable.zip`).

## Mimari Kararlar
- `[KARAR-028]` **Windows Kayıt Defteri Erişim İzni (KEY_READ vs KEY_WRITE) & DNS Flush Mimarisi:**
  1. `windows_registry::Key::open()` varsayılan olarak yalnızca salt okunur (`KEY_READ`) erişim açar. Bu anahtar handle'ı üzerinde `remove_value` veya `set_*` çağrıldığında Windows işletim sistemi `ERROR_ACCESS_DENIED` (5) döndürür. Sessiz hata yutma (`let _ =`) uygulandığında DoH veya Başlangıç anahtarları silinmiş görünür fakat fiziken silinmez. Değer silme ve güncelleme işlemleri için `create()` (`KEY_READ | KEY_WRITE`) kullanılmalıdır.
  2. Windows DNS Cache servisi (`Dnscache`), kayıt defterinde `EnableAutoDoh` değiştiğinde önbellek temizlenmediği sürece (`DnsFlushResolverCache` / `ipconfig /flushdns`) eski çözümleyici durumunu korur. DoH ekleme (`apply_doh_registry`) ve kaldırma (`reset_doh_registry`) sonrasında `flush_dns_cache()` zorunludur.
  3. `NetworkRepair.tsx` üzerinde sistem seviyesinde yönetici izni eksikliği (`isAdmin === false`) kullanıcıya açık sarı uyarı şeridi ve tek tıkla UAC yükseltme butonu (`api.restartAsAdmin()`) olarak sunulmalıdır. İşlem başarısızlıkları ve başarıları anlık bildirim şeridiyle arayüzde gösterilmelidir.
- `[KARAR-027]` **Sistem Tepsisi Çift Kademeli Etkileşim & Anti-Flicker Mimarisi:**
  1. Windows tepsi ikonlarında tek tık mini hızlı panele (`quick-panel`), çift tık ise ana tam ekran kokpite (`main`) ayrılmıştır.
  2. Windows'un çift tıkta önce `Click` sonra `DoubleClick` göndermesi nedeniyle arayüz titremesini (flicker) önlemek için `AtomicU64` nesil sayacı ile 220ms asenkron gecikme uygulanır. Çift tık geldiğinde sayaç artırılarak bekleyen tek tık iptal edilir; böylece mini panel parlamadan doğrudan ana pencere açılır.
  3. Küçük paneldeki "Çıkış" eylemi standart pencere gizleme (`window_close`) yerine doğrudan `exit_app` çağırarak motoru, bağımsız süreci ve servisleri durdurup TCP TCB soketlerini ve DNS önbelleğini temizler, ardından `app.exit(0)` ile süreci sonlandırır.
- `[KARAR-026]` **Sistem Tepsisi Hızlı Erişim Paneli & Çift Katmanlı UX Standardı:**
  1. DPI atlatma araçlarında günlük kullanıcı ihtiyacının %90'ı motoru başlatmak/durdurmak, anlık canlı akışı teyit etmek ve profil değiştirmekten ibarettir. 1080x720 devasa ana kokpit yerine tepsi sol tıkında açılan 340x460px hafif `quick-panel` (Flyout) bilişsel yükü ve pencere açılış gecikmesini sıfırlar.
  2. Panel dışına tıklandığında (`WindowEvent::Focused(false)`) veya `Esc` tuşuna basıldığında panel otomatik olarak gizlenmelidir (Auto-dismiss). Böylece sistem tepsisi menüsü Windows Action Center ergonomisinde davranır.
  3. Tepsi sağ tık menüsü (Aç / Başlat-Durdur / Çıkış) klasik Windows bağlam menüsü olarak korunmalı; sol tık ise zengin mini kokpite ayrılmalıdır.
  4. Tek kaynaklı durum: Mini panel ayrı bir durum yönetimi kurmaz; mevcut `api.getStatus()`, `onStatusChange`, `localStorage` ve `theme.ts` yapısını doğrudan miras alarak ana kokpitle %100 senkronize çalışır.
- `[KARAR-025]` **Derin Savunma (Defense-in-Depth) & Sıfır Sessiz Hata Prensibi:**
  1. Çekirdek sürücü ve işletim sistemi çağrılarında (FFI, TCP TCB teardown, WinDivert open) hiçbir girdi varsayımsız kabul edilmemeli; integer taşmalarına karşı saturating tipler, C string dönüşümlerinde interior null koruması ve donanım bellek hizalamasında unaligned okuma zorunludur.
  2. İşletim sistemi ağ sürücüsünü kapatan (WinDivertClose vb.) blocking FFI çağrıları yapılırken uygulama seviyesindeki Mutex kilitleri asla tutulmamalıdır; önce handle'lar yerel vektöre çekilip kilit düşürülmeli, ardından soket kapatma yürütülmelidir.
  3. Frontend tarafında hiçbir RPC veya async işlem sessizce yutulmamalı (`catch(() => {})` yasak); tüm kurtarma veya telemetri hataları ya kullanıcı konsoluna loglanmalı ya da arayüzde hata durumu olarak yansıtılmalıdır.
  4. Webview ortamında XSS ve enjeksiyon risklerini sıfırlamak için katı Content Security Policy (`default-src 'self'`) ve pencere bazlı yetki kısıtlaması (`capabilities`) tavizsiz uygulanmalıdır.
- `[KARAR-024]` **Ouroboros Refleksli Çekirdek Güvenliği & Asenkron Telemetri Stabilizasyonu:**
  1. WinDivert paket enjeksiyonunda kısmi segment başarısızlığı yaşandığında asla orijinal pakete geri dönülmemelidir (`fallback to raw packet` yasak). Çünkü ilk sahte paket ağa gitmişse, arkasından tam paketin gitmesi hedef sunucunun TCP state makinesini bozar ve DPI motorunu tetikler. Doğru davranış paketi sessizce düşürmektir (DROP); TCP akışı işletim sisteminin retransmit mekanizmasıyla doğal şekilde toparlanır.
  2. Windows C API bellek okumalarında raw byte tamponu struct'a dökülürken donanım hizalama (alignment) garantisi olmadığından `read_unaligned` zorunludur.
  3. UI katmanındaki event dinleyicileri dil veya görünüm state'lerine bağlanırken callback kimliğinin değişip listener'ın unbind-rebind döngüsüne girmesini önlemek için `langRef` deseni uygulanmalıdır.
- `[KARAR-023]` **Crimson Hazard Askeri Lazer HUD Teması & Adaptif Telemetri Matrisi:**
  1. Yüksek kontrastlı taktik kırmızı renk paleti (`--color-live: #FF2A4D`, `--color-void: #0B0406`) ve lazer ızgarası ile askeri acil durum komuta arayüzü inşa edildi. Bileşenlerdeki tüm sabit yeşil kalıntıları dinamik CSS değişkenlerine bağlanarak temanın 8 farklı atmosfer dünyasıyla tam eşleşmesi sağlandı.
  2. Dashboard'da tek bir karmaşık ekran yerine, az ve öz veri görmek isteyen kullanıcılar için hafif, odaklı "Matrix" (temel 4 metrik kartı + hızlı hedef durumları) ve mühendislik seviyesi derin telemetri arayan kullanıcılar için "Pro Matrix" (5 kademe cerrahi hat, kernel latency, buffer doluluk oranı) ayrıştırılarak bilişsel yük optimize edildi.
- `[KARAR-022]` **Asenkron DNS Sağlık Motoru & Native Windows Yönetici Doğrulaması:**
  DNS çözümleme istekleri işletim sistemi seviyesinde kilitlenmeye (15-30s) yol açmaması için `tokio::time::timeout(3000ms)` ile asenkron tokio iş parçacığına taşındı. `is_poisoned_or_bogus_ip` ile sadece ilk IP değil, gelen tüm adresler taranarak BTK/Superonline/Vodafone sahte engelleme IP'leri yakalandı. Ağ/DNS ayarları için native `shell32::IsUserAnAdmin()` ile Rust seviyesinde ön doğrulama yapıldı, PowerShell `-ErrorAction SilentlyContinue` kaldırılarak gerçek hata yayılımı sağlandı.
- `[KARAR-021]` **Büyük El Sıkışma Paketleri (ECH & Post-Quantum Kyber) için 2048B Eşiği:**
  Modern tarayıcıların (Chrome 124+, Firefox 128+) Encrypted Client Hello (ECH) ve Kyber (ML-KEM 768) el sıkışma paketlerinin (1420-1460 bayt) `MAX_INSPECT_PAYLOAD = 1400` sınırına takılıp passthrough edilerek sansürlenmesini önlemek için sınır 2048 bayta yükseltildi.
- `[KARAR-020]` **Derin Morfolojik Tasarım Mimarisi (Cyberpunk vs. Quiet Luxury):**
  Yalnızca renk değiştiren temalar kullanıcı nezdinde yetersizdir. Tema sistemi arayüzün tüm karakterini değiştirmelidir:
  - Cyberpunk 2077: 45° açılı poligon pahlar (`clip-path: polygon(...)`), 24px HUD gridi zemin, sarı üst lazer şeritleri (`border-top: 3px solid #FFE600`), mecha tetik butonları, agresif uppercase tipografi.
  - Quiet Luxury: Mayfair / Cartier saatçilik zarafeti, editoryal serif tipografi (`font-serif` - Cinzel / Playfair Display / Georgia), kadife siyahı (`#0C0B0E`), fırçalanmış şampanya altını (`#D4AF37`), fısıldayan mikro sınırlar, pürüzsüz 12px organik kavisler, sıfır neon.
  - Amber CRT: Tam ekran CRT scanline overlay katmanı (`#root::after`), kehribar fosfor ışıması, zorunlu monospace (`font-mono`).
- `[KARAR-019]` **ISP DNS Zehirlenmesi Tespiti ve Otomatik DoH / Güvenli DNS Onarımı:**
  Türkiye'deki operatörlerin (Türk Telekom vb.) `discord.com` sorgusunu `195.175.254.2` (BTK mahkeme kararı IP'si) gibi adreslere zehirlemesi nedeniyle, WinDivert DPI bypass motoru devrede olsa dahi tarayıcı sahte hedefe gittiğinden Discord açılmaz. Kök neden tespiti: DPI bypass L4/L7 paket parçalama yaparken, DNS çözümlemesi hedefin yanlış IP'sine yapıldığı için bağlantı timeout verir. Çözüm: `check_dns_health` ile BTK IP yönlendirmesini tespit eden proaktif telemetri, `auto_fix_dns` ile tek tıkla Cloudflare DNS (`1.1.1.1`, `1.0.0.1`) ve Windows native DoH (`EnableAutoDoh=2`) kaydı + DNS önbellek temizliği (`flush_dns_cache`). Ayrıca `profile.rs` `universal` profiline Türkiye Sandvine DPI'ı için `FakePacketBefore { ttl: 4 }` eklendi.
- `[KARAR-018]` **Sadeleştirilmiş Hata Katmanı & Çok Boyutlu Morfolojik Tema Mimarisi:**
  1. Ham paket filtreleri (`(filter=outbound and tcp and (tcp.DstPort == 443 or tcp.DstPort == 80))`) kullanıcı arayüzüne sızdırılmamalıdır. Hata mesajı çekirdek katmanında (`divert.rs`) sadeleştirildi ve arayüzde `isPrivilegeError` deseniyle yakalanarak UAC yeniden başlatma (`restartAsAdmin`) eylemiyle birleştirildi.
  2. Temalar yalnızca renk tokenlarını (`--color-live`, `--color-void`) değiştirdiğinde kullanıcı için yüzeysel kalır. Tema sistemi; köşe yarıçapı (`border-radius`), kenarlık stili (üst sarı lazer, sol polar çapa, amber fosfor), zemin dokusu (CRT scanline, HUD grid, sonar radar, nebula, dot grid), tipografi (zorunlu monospace terminal vs. modern sans vs. mecha) ve derinlik modeliyle (buzlu cam vs. sert metal) donatılmış 6 eksiksiz morfolojik dünyaya dönüştürüldü.
- `[KARAR-017]` **useSyncExternalStore ile Reaktif UI Senkronizasyonu & Doğrudan Rust Pencere Yönetimi:**
  1. Bileşen başına `useState` ile tutulan dil ve tema durumları, uygulamanın farklı pencerelerinde veya ayrık bileşenlerinde (Titlebar vs. Ayarlar) senkronizasyon kaybına yol açıyordu. React 18 `useSyncExternalStore` ile tekil hafıza deposu kurularak tüm bileşenlerin anlık yeniden çizilmesi (re-render) sağlandı.
  2. Tailwind CSS v4 `@theme` yapısında semantik renklerin (`--color-live`, `--color-sky`, `--color-paper` vb.) tüm donanım temalarında (`obsidian`, `cyberpunk`, `amber`, `cobalt`, `amethyst`, `titanium`) tam karşılıkları tanımlanarak CSS basamağı güvenceye alındı.
  3. Tauri v2 yetkilendirme mimarisinde `core:window:allow-close` gibi yetkiler olmadan istemci JS tarafından çağrılan `win.close()` sessizce reddediliyordu. `capabilities/default.json` yetkileri genişletildi ve `window_close`, `window_minimize`, `window_toggle_maximize` doğrudan Rust IPC komutları olarak eklenerek sistem tepsisi (tray) davranışına entegre edildi.
- `[KARAR-016]` **Soket Teardown & Eşzamanlı Teardown Garantisi:** Modern web tarayıcıları (Chrome, Edge, Firefox) ve Electron/Discord istemcileri, daha önce başarılı olmuş TLS oturumlarını Keep-Alive ve HTTP/2 bağlantı havuzunda 300 saniyeye kadar açık tutar. Motor durdurulduğunda bu açık soketler üzerinden giden yeni istekler (SYN ve ClientHello göndermediği için) ISP DPI filtrelerine takılmaksızın akmaya devam eder. Bunu kökten çözmek için `net_teardown.rs` Win32 API (`GetTcpTable` + `SetTcpEntry` `MIB_TCP_STATE_DELETE_TCB` = 12) ve `DnsFlushResolverCache` entegre edildi. Motor durdurulduğu an tüm web (80/443) TCP TCB kayıtları işletim sisteminden silinerek tarayıcı soket havuzu anında çöker ve yeni istekler derhal ISP filtresine çarpar. Ayrıca `stop_engine` panel motoru, `detached.pid` bağımsız süreci ve `AnticoreService`'i tek seferde kapatacak şekilde birleştirildi.
- `[KARAR-015]` **Toplu IPC İşlemleri & Garantili Motor Durum Kurtarma:** Kara listeye çoklu domain ekleme operasyonları tek tek disk I/O döngüsünden kurtarılarak Rust `commands::add_sites` (O(1) disk yazımı) komutuna bağlandı. A/B kıyaslama (`runComparison`) gibi motoru geçici durduran test akışlarında, ağ zaman aşımı veya sonda çökmelerinde motorun kapalı kalmasını önlemek için `try...finally` garantili durum restorasyonu zorunlu kılındı.
- `[KARAR-014]` **2026 Geliştirici Araçları Tasarım Trendleri & 6 Yüksek Karakterli Donanım Teması:** Raycast, Linear, Warp, Zed, Little Snitch 6 arayüzleri analiz edilerek sub-pixel mikro-sınırlar (`rgba(255,255,255,0.08)`), sakin veri yoğunluğu (`tabular-nums`), dokunsal geri bildirim ve dinamik hız spektrumu uygulandı. Obsidian Emerald, Amber CRT, Cobalt Matrix, Cyberpunk Volt, Amethyst Nebula ve Titanium Laboratory olmak üzere 6 donanım teması (ve işletim sistemi senkronizasyon modu) WCAG AAA/AA kontrast oranlarıyla sisteme işlendi.
- `[KARAR-013]` **Sessiz Süreç İcrası (`CREATE_NO_WINDOW`):** Windows GUI uygulamalarında alt süreç çağrılırken `CREATE_NO_WINDOW` (0x08000000) bayrağı olmadan çağrılan her `std::process::Command` işletim sistemi tarafından anlık siyah konsol penceresi tahsisine neden olur. `commands.rs::silent_command` mimari sarmalayıcısı tüm sistem komutlarında zorunlu hale getirildi.
- `[KARAR-001]` **Zero-Loss Passthrough (Sıfır Kayıplı Geçiş):** İnternetteki her paketi işlemek yerine, yalnızca `Sites.tsx` içerisinde (veya aktif paketteki) belirlenmiş alan adlarına giden trafik DPI Bypass motorundan geçirilecek. Böylece kullanıcının normal web gezintisi, bankacılık işlemleri, oyun ping değerleri asla etkilenmeyecek.
- `[KARAR-004]` **Portable Bundle Isolation:** WinDivert.dll/sys ve WebView2Loader.dll doğrudan uygulama köküne ve bin/ dizinine yerleştirilerek bağımlılık arama yolu güvenceye alındı; USB veya taşınabilir kullanımda harici kütüphane bağımlılığı sıfırlandı.
- `[KARAR-006]` **Sürüm Numarası Arındırma:** İlk sürümlerde kullanıcı arayüzü ve vitrin dökümanlarından açık versiyon numaraları (`v0.3.0` vb.) arındırıldı. Sürüm takibi arka planda DTO seviyesinde tutulup arayüzde temiz, odaklı marka kimliği sunuldu.
- `[KARAR-007]` **In-App Self-Update (Uygulama İçi Tek Tıkla Güncelleme):** Kullanıcıların GitHub sitesine gitmesine gerek kalmadan doğrudan üst çubuktaki `GÜNCELLEME` butonu veya ayarlar üzerinden `UpdateModal.tsx` ile güncelleme denetlemesi, canlı indirme ilerleme çubuğuyla paketi kurup otomatik yeniden başlatması (`downloadAndInstallUpdate`) sağlandı.
- `[KARAR-008]` **Geliştirici Kimliği & Telif Standardizasyonu:** Projenin resmi telif ve geliştirici kimliği **Monolith Works / MonarchDevLab** olarak tanımlandı (`LICENSE`, `Cargo.toml`, `package.json`, `tauri.conf.json`, `README`).
- `[KARAR-009]` **Kurumsal Gizlilik & Dokümantasyon Standardizasyonu:** P6 standardı gereği tüm mimari kayıtlar `docs/` dizininde merkezileştirildi, geçici geliştirici dizinleri arındırıldı, yerel loglar silindi ve Git geçmişindeki tüm commit diff'leri taranarak yerel yol ve kullanıcı adı ibareleri `git-filter-repo` ile tüm tarihten temizlendi.
- `[KARAR-010]` **Kurumsal Mimari Commit Rekonstrüksiyonu:** Git geçmişi, Monolith Works & MonarchDevLab ekibinin sıfırdan kurumsal mimari aşamalarla (Scaffolding, Kernel Core, Strategy Pipeline, WinDivert FFI, CLI/Blockcheck, Tauri Shell, Design System, UI, Release) inşa ettiği 9 mantıksal commit zincirine dönüştürüldü. Tarihler ve yazarlar resmi kurumsal kimliğe göre sabitlendi.
- `[KARAR-011]` **Monolith Works Mimari Standartları & Mülkiyet Hiyerarşisi (v1.4):** Proje kök dizini hijyeni (`.editorconfig`, `CONTRIBUTING.md`, `.github/CODEOWNERS`), mimari karar kayıtları (`docs/architecture/adr/`), API sözleşmeleri (`docs/architecture/specs/`), veri akış şemaları (`docs/architecture/blueprints/`) ve işletim kılavuzları (`docs/runbooks/`) tam kurumsal hiyerarşiyle yapılandırıldı. Kod mülkiyeti mutlak olarak Monolith Works'e bağlandı, MonarchDevLab dağıtım kanalı olarak tanımlandı.
- `[KARAR-012]` **Dark Monolith ($10K) Tasarım Mimarisi:** Göz yoran kaba 0px keskin köşeli ve 3px kalın beyaz çerçeveli neo-brutalist stil yerine, Linear, Raycast ve Cloudflare Zero Trust kalitesinde modern Obsidyen `#090B10`, kart yüzeyleri `#121724`, zarif 1px sınırlar, Zümrüt Yeşili `#10B981` vurgusu, dokunsal Master Engine Hub ve esnek kırpılmayan grid sistemine geçildi. Kaba kutular ve diyaloglar `rounded-2xl` ve `rounded-xl` bileşen sınıflarına bağlandı.

## Geçmiş Oturumlar
- 2026-09-02: Cyber-Brutalism UI migrasyonu, Dashboard basit/pro modları, `anticore-core` 46/46 test doğrulaması, v0.3.0 tag ve release pipeline kurulumu.
- 2026-09-03: Tek tıkla in-app self-update (`UpdateModal.tsx`), sürüm numarası arındırma, güvenlik/sızıntı koruması, Monolith Works / MonarchDevLab kimlik standardizasyonu, kurumsal mimari rekonstrüksiyonu.
- 2026-09-04: Faz 18 & 19 - UI/IPC derin denetimi, kategori filtre onarımı, soket teardown ve çoklu motor durdurma garantisi, çöp dosya tasfiyesi, release ve portable paket üretimi.

## Dersler (GOTCHAS)
- *Semptom:* Motor kapatıldığı halde engelli sitelere erişim devam ediyor. -> *Sebep:* Tarayıcılar (Chrome/Edge/Firefox) Keep-Alive ve HTTP/2 ile açık TLS soketlerini havuzda tutar. ISP DPI sadece bağlantı başlangıcını (SYN/ClientHello) denetlediğinden açık soket kesilmez. -> *Çözüm:* `net_teardown.rs` modülünde `GetTcpTable` ve `SetTcpEntry` (`MIB_TCP_STATE_DELETE_TCB` = 12) ile web portlarındaki tüm açık bağlantılar işletim sistemi düzeyinde anında koparılır ve `DnsFlushResolverCache` ile DNS temizlenir.
- *Semptom:* Windows NTFS üzerinde hem `Anticore.exe` hem `anticore.exe` kopyalandığında biri diğerinin üzerine yazılıyor. -> *Sebep:* Windows dosya sistemi büyük/küçük harf duyarsızdır (case-insensitive). -> *Çözüm:* Motor ikilisini `anticore-cli.exe` ve `bin/anticore.exe` olarak adlandır, `commands.rs::find_motor_exe` içerisine fallback ekle.
- *Semptom:* `App.tsx` ve diğer bileşenlerdeki 10-11px metinler ve düşük opaklıklı yazılar erişilebilirlik taramasında okunamaz bulunuyor. -> *Çözüm:* Proje genelinde minimum font boyutunu 12px (`text-xs`) olarak sabitle; `text-[10px]` ve `text-[11px]` kullanımını tamamen kaldır.
- *Semptom:* `tsconfig.json` dosyasında `noUnusedLocals: true` açık olduğu için kullanılmayan importlar derlemeyi kesiyor. -> *Çözüm:* Bileşen düzenlemelerinden sonra daima `npm run build` ile doğrula; kullanılmayan hook veya ikonları hemen temizle.
- *Semptom:* GitHub deposu `PRIVATE` iken unauthenticated `releases/latest` isteği `404 Not Found` dönüyor. -> *Sebep:* GitHub API yetkisiz isteklerde gizli repo release'lerini gizler. -> *Çözüm:* `commands.rs::check_update` içine `token_override` ve `GITHUB_TOKEN` environment desteği eklendi; repo public olduğunda ek ayara gerek kalmaksızın çalışır.
- *Semptom:* `package.ps1` çalıştırıldığında `dist\WinDivert64.sys` için "başka bir işlem tarafından kullanıldığından erişilemiyor" (IOException) hatası. -> *Sebep:* WinDivert çekirdek sürücüsü bellekte yüklüyken Windows dosyayı özel kilitler. -> *Çözüm:* `package.ps1` içinde `Safe-Copy` fonksiyonu tanımlanarak hedef dosya zaten mevcutsa hata yutularak paketlemenin kesintisiz devam etmesi sağlandı.
