# MONOLITH WORKS & MONARCHDEVLAB MİMARİ ZİNCİRİ (v1.4)
# Dosya Konumu: .agents/rules/MONOLITH_CHAIN.md & docs/MONOLITH_CHAIN.md

Bu kural dokümanı, Monolith Works bünyesinde ve MonarchDevLab ekosisteminde üretilen tüm yazılım, kütüphane, servis, arayüz ve mimarilerde istisnasız uygulanan mimari geliştirme standardıdır.

TEMEL HEDEF:
Kod tabanına ve git geçmişine bakan en kıdemli yazılım mimarının dahi projenin nasıl üretildiğine dair bir araç izi görmemesi; sistemin MonarchDevLab çekirdek mühendislik ekibi tarafından sıfırdan, projeye özgü mimari adımlarla, ultra detaylı, modüler ve eksiksiz biçimde inşa edildiğini görmesidir.

---

## 1. GELİŞTİRİCİ KİMLİĞİ, MÜLKİYET VE YAYINLAMA PROTOKOLÜ
1. **Mutlak Kod Mülkiyeti & Telif**:
   - Üretilen tüm yazılımların, algoritmaların, mimarilerin, kütüphanelerin ve fikri mülkiyetin (IP) yegane ve mutlak sahibi istisnasız **Monolith Works**'tür. Tüm kod hakları tamamen Monolith Works'e aittir.
   - GitHub organizasyonu olan **MonarchDevLab** (`github.com/MonarchDevLab/...`) yalnızca bir **yayınlama, dağıtım ve açık kaynak barındırma kanalıdır (publishing / distribution registry)**; kod sahibi veya tüzel hak sahibi değildir.
   - Paket tanımlayıcılarında (`package.json`, `Cargo.toml`, `pyproject.toml`, `*.csproj`, `go.mod`):
     - `author`: `Monolith Works <info@monolithworks.com.tr>`
     - `copyright`: `Copyright (c) 2026 Monolith Works. All rights reserved.`
     - `publisher` / `distribution`: `MonarchDevLab` (Yalnızca yayınlama kanalı)
     - `repository`: `https://github.com/MonarchDevLab/...` (Kaynak barındırma adresi)
2. **Sıfır Araç İzi (Zero Footprint)**:
   - Kod dosyalarında, commit mesajlarında, PR açıklamalarında, dokümantasyonlarda ve konfigürasyonlarda yapay zeka, LLM, model adları, prompt, context, token veya bot etiketlerine dair en ufak bir iz KESİNLİKLE BULUNAMAZ.
   - `Co-authored-by: AI...`, `Generated with...`, `AI Assistant` gibi tüm bot izleri yasaktır.
3. **Bu Kuralın Sınırı — İz Kaldırmak Sahtecilik Değildir**:
   - İzin kaldırılması gerçeğin değiştirilmesi anlamına gelmez. Her koşulda YASAK olanlar: olmayan bir kişi adına commit veya `Co-authored-by`, geriye tarihlenmiş commit, yapılmamış işi anlatan doküman, çalıştırılmamış test sonucu, ölçülmemiş metrik.
   - Zincirin ikna ediciliği **gerçek olmasından** gelir; uydurma tek satır tüm zinciri yakar. Bir doküman "ultra detaylı" olacaksa sayıları koddan veya veritabanından ölçülmüş olmalıdır.

---

## 2. DOKÜMANTASYON VE HAFIZA BİRLEŞTİRME STANDARDI (docs/ MERKEZİ)
- **.ai/ Klasör Yasağı**: Proje kökünde `.ai/` klasörü KESİNLİKLE OLUŞTURULMAZ. Bu isim doğrudan yapay zeka oturumunu ifşa eder.
- **Tek Merkez: docs/ Klasörü**: Tüm sistem hafıza dosyaları, görev yönetim belgeleri ve mimari zincir standartları tek bir çatı altında `docs/` dizininde toplanır:

| Dosya / Dizin | Görev ve Kapsam |
|---|---|
| `docs/HANDOFF.md` | Anlık yönelim, kritik komutlar, commit zinciri, riskler (sıfır araç izi) |
| `docs/TASKS.md` | Tek gerçek kaynak görev listesi (`[~]` ŞİMDİ · `[ ]` SIRADAKİ · `[!]` BLOKLU · `[x]` TAMAMLANDI) |
| `docs/WORKLOG.md` | Çalışma kayıtları, mimari kararlar (`[KARAR-NNN]`), dersler / gotchas |
| `docs/SYSTEM_MAP.md` | Mimari harita, design tokens, güvenlik, teknoloji yığını, modül sınırları |
| `docs/MONOLITH_CHAIN.md` | Bu doküman — mimari zincir ve kalite omurgası |
| `docs/architecture/adr/` | Mimari Karar Kayıtları (`ADR-001-...md`) |
| `docs/architecture/specs/` | API sözleşmeleri, veri modelleri, şema tanımları |
| `docs/architecture/blueprints/` | Veri akışı, durum makineleri ve Mermaid şemaları |
| `docs/runbooks/` | Canlıya alma (deployment), izleme, yedekleme ve felaket senaryoları |

> **Kritik İsimlendirme Disiplini:** Standardın önceki sürümündeki `docs/AI_HANDOFF.md` adı KESİNLİKLE KULLANILMAZ — dosya adının kendisi Kural 1.2'nin yasakladığı izdir. Standart alternatifi olan **`docs/HANDOFF.md`** kullanılır. Kural 1 ile Kural 2 çatıştığında **iz bırakmama** kazanır.

Görev durumu değiştiği **an** `docs/TASKS.md`'ye yazılır; "sonra yazarım" yoktur.

---

## 3. ULTRA DETAYLI DOSYALAMA VE DİZİN HİYERARŞİSİ STANDARDI

Monolith Works projelerinde rastgele dosya dağıtımı veya derme çatma klasörlemeye KESİNLİKLE İZİN VERİLMEZ. Her proje, mimari amacına uygun olarak aşağıda tanımlanan ultra detaylı hiyerarşiyi birebir uygulamak zorundadır.

### 3.1. Kök Dizin Hijyeni ve Evrensel Yerleşim
Her projenin kök dizininde sadece standart yapı taşları bulunur:
```text
repo-root/
├── .github/                      # CI/CD workflows, issue/PR şablonları, CODEOWNERS
│   ├── workflows/                # build.yml, test.yml, release.yml
│   └── CODEOWNERS                # Sorumlu ekip tanımları
├── docs/                         # Merkezi proje hafızası ve mimari belgeler
├── src/                          # Kaynak kod kökü (veya Go/Rust: cmd/, internal/)
├── tests/                        # Test paketi (unit, integration, e2e, fixtures)
├── scripts/                      # Derleme, geçiş, doğrulama ve yerel geliştirme betikleri
├── .editorconfig                 # Katı satır sonu, girinti ve boşluk standardı
├── .gitignore                    # Eksiksiz üretim atıklarını dışlama kuralı
├── LICENSE                       # Monolith Works telif lisansı
├── README.md                     # Kurumsal seviye tanıtım, mimari özet ve kılavuz
└── CONTRIBUTING.md               # MonarchDevLab kod katkı ve inceleme sözleşmesi
```

### 3.2. Proje Tiplerine Göre Ultra Detaylı Klasörleme Matrisi

#### TİP 1: Kapsamlı Web Platformu / SaaS (Fullstack / Modern Frontend)
Domain logic framework'ten (Next.js/Nuxt/SvelteKit/React) tamamen bağımsızdır:
```text
src/
├── app/                          # Sayfa yönlendirme ve HTTP uç noktaları (Routing & API handlers)
│   ├── (auth)/                   # Giriş, kayıt, şifre sıfırlama rotaları
│   ├── (dashboard)/              # Korumalı kullanıcı panel rotaları
│   ├── api/                      # REST / Webhook / RPC endpoint kontrolcüleri
│   └── layout.tsx                # Global kabuk ve bağlam sağlayıcılar
├── core/                         # Saf iş mantığı (Framework ve UI'dan %100 bağımsız)
│   ├── domain/                   # Varlıklar (Entities), Değer Nesneleri (Value Objects)
│   │   ├── user/                 # UserEntity, UserRole, UserPreferences
│   │   ├── billing/              # Subscription, Invoice, Plan
│   │   └── audit/                # AuditLog, ActivityRecord
│   ├── use-cases/                # Uygulama senaryoları (Command / Query yürütücüleri)
│   │   ├── authenticate-user.ts  # Kullanıcı doğrulama akışı
│   │   └── process-payment.ts    # Ödeme işleme mantığı
│   └── errors/                   # Tipli domain hata sınıfları (DomainError, NotFoundError)
├── engine/                       # Deterministik işlem ve senkronizasyon motorları
│   ├── state-machine/            # İş akışlarının durum geçiş makineleri
│   ├── sync-worker/              # Arka plan veri eşitleme döngüleri
│   └── event-bus/                # Dahili olay yönlendirme ve kuyruk mekanizması
├── design-system/                # Monolith Works kurumsal tasarım sistemi (Zero Slop)
│   ├── tokens/                   # colors.css, typography.css, spacing.css, motion.css
│   ├── primitives/               # Buton, input, modal, dropdown gibi temel yapı taşları
│   ├── components/               # Veri tabloları, grafik kartları, form blokları
│   └── layouts/                  # Izgara (grid), sayfa konteynerleri, kenar çubukları
├── infrastructure/               # Dış dünya adaptörleri (Clean Architecture I/O)
│   ├── database/                 # Prisma / Drizzle / SQL sürücüleri, client havuzu
│   ├── storage/                  # S3, yerel disk veya bulut dosya deposu adaptörü
│   ├── telemetry/                # Structured logger, OpenTelemetry, metrics
│   └── http-client/              # Tip güvenli dış API istemcileri (retry, timeout)
└── shared/                       # Paylaşılan saf yardımcı yapılar (Çöp klasör değildir!)
    ├── contracts/                # DTO'lar, OpenAPI şemaları, Zod doğrulayıcıları
    ├── constants/                # İmmutable sabitler, hata kodları
    └── formatting/               # Tarih, para birimi, metin dönüştürücüler
```

#### TİP 2: Kurumsal Backend Servis / Dağıtık Sistem / Hexagonal API (Go / Rust / Node / C#)
Ports & Adapters (Hexagonal Architecture) ve Domain-Driven Design standardı:
```text
backend-root/
├── cmd/                          # Giriş noktaları (Entrypoints)
│   ├── server/                   # HTTP/gRPC ana servis yürütücüsü
│   ├── worker/                   # Asenkron kuyruk ve cron yürütücüsü
│   └── migrate/                  # Veritabanı migrasyon CLI aracı
├── internal/                     # Depo dışına kapalı çekirdek kod
│   ├── core/
│   │   ├── domain/               # Saf etki alanı modelleri, aggregate kökleri
│   │   ├── ports/                # Giriş/çıkış arayüz sözleşmeleri (Interfaces)
│   │   │   ├── repositories.go   # UserRepository, OrderRepository arayüzü
│   │   │   ├── services.go       # NotificationService, PaymentGateway arayüzü
│   │   │   └── queue.go          # MessageBroker arayüzü
│   │   └── services/             # İş kuralı orkestratörleri (Application Services)
│   └── adapters/                 # Port arayüzlerini uygulayan somut sürücüler
│       ├── driving/              # Servisi tetikleyen adaptörler (Inbound)
│       │   ├── rest/             # HTTP router, middleware, handlers, DTO validation
│       │   └── grpc/             # Protobuf tanımları, RPC sunucu implementasyonu
│       └── driven/               # Servisin kullandığı adaptörler (Outbound)
│           ├── postgres/         # SQL sorguları, bağlantı havuzu, transaction yönetimi
│           ├── redis/            # Dağıtık kilit (distributed lock), cache adaptörü
│           └── stripe/           # Harici ödeme ağ geçidi istemcisi
├── migrations/                   # Sıralı ve geri alınabilir up/down SQL dosyaları
│   ├── 000001_create_users_table.up.sql
│   └── 000001_create_users_table.down.sql
└── deployments/                  # Altyapı ve orkestrasyon kodları
    ├── docker/                   # Multi-stage production Dockerfile
    ├── k8s/                      # Kubernetes deployment, service, ingress manifestleri
    └── terraform/                # Bulut kaynak şablonları
```

#### TİP 3: Yüksek Başarımlı CLI Araçları / Sistem Kütüphaneleri / SDK'lar
```text
cli-root/
├── bin/                          # Çalıştırılabilir derleme çıktıları
├── src/
│   ├── cli/                      # Komut satırı kullanıcı arayüzü
│   │   ├── commands/             # init, analyze, build, deploy komut sınıfları
│   │   ├── flags/                # Argüman ayrıştırıcılar, ortam değişkeni okuyucular
│   │   └── output/               # Tablo, renkli terminal formatlayıcı, JSON render
│   ├── engine/                   # Çekirdek algoritma ve işlem motoru
│   │   ├── parser/               # Streaming token/AST ayrıştırıcı
│   │   ├── pipeline/             # Paralel işlem hattı (worker pool, chunking)
│   │   └── cache/                # Sıfır tahsisli yerel önbellekleme
│   └── contracts/                # Genel API sözleşmeleri, tipler, protokoller
└── benchmarks/                   # Bellek tahsis ve hız performans testleri
```

#### TİP 4: Masaüstü Uygulaması (Electron / Tauri / Rust Native)
Katı güvenlik, process izolasyonu ve typed IPC hattı:
```text
desktop-root/
├── src-tauri/ (veya main/)       # Yerel işletim sistemi süreci (Native OS Process)
│   ├── src/
│   │   ├── sys/                  # İşletim sistemi bildirimleri, tray, dosya sistemi
│   │   ├── ipc/                  # Güvenli ve tipli IPC komut yönlendiricileri
│   │   └── storage/              # Yerel SQLite / şifreli anahtar kasası adaptörü
│   └── Cargo.toml
├── src/                          # Renderer süreci (UI & Presentation)
│   ├── views/                    # Uygulama ekranları
│   ├── components/               # Masaüstü yerel hissi veren UI bileşenleri
│   ├── bridge/                   # Native süreçle konuşan tipli IPC istemcisi
│   └── store/                    # Reaktif uygulama durumu
```

### 3.3. Kıdemli Dosyalama İlkeleri & Anti-Spam Kuralları
1. **"God Folder" (Çöp Sepeti Klasör) Yasağı**:
   - `utils/`, `helpers/`, `misc/`, `common/` adında çöplük klasör açmak KESİNLİKLE YASAKTIR.
   - Her fonksiyon ve dosya ait olduğu etki alanına (domain) göre adlandırılır (`formatting/currency.ts`, `crypto/signature.ts`, `validation/schema.ts`).
2. **Kebab-Case İsimlendirme Standardı**:
   - Tüm klasör ve dosya isimleri küçük harf ve tire ile ayrılmış (`kebab-case`) biçimde oluşturulur (Örn: `order-processing-engine.ts`, `user-profile-card.tsx`).
   - *İstisna:* Dillerin resmi konvansiyonları korunur (Go: tek kelime küçük harf paketler; Rust: snake_case; C#: PascalCase; React Component: PascalCase bileşen adı).
3. **Derinlik Limiti (Max 4-5 Seviye)**:
   - Gereksiz iç içe klasör piramitleri oluşturulamaz (`a/b/c/d/e/f/g/file.ts` yasaktır). Klasör hiyerarşisi mantıksal ve düz (flat-as-possible) tutulmalıdır.
4. **Tek Sorumluluk ve Bağımlılık Yönü (Dependency Rule)**:
   - İç katmanlar (Domain / Core) dış katmanlara (UI / Framework / Database) ASLA bağımlı olamaz. Bağımlılıklar daima dışarıdan içeriye doğru (Inversion of Control) akar.

---

## 4. PROJEYE GÖRE ADAPTİF VE ULTRA DETAYLI MİMARİ ZİNCİR
Architecture, Engine, Design System, PWA, Test Suite gibi bileşenler **bağlama göre şekillenen örnek katmanlardır**. Şablonculuk ve gereksiz yük yasaktır: gerekmeyen katman çıkarılır, gereken yeni katman eklenir. Ancak seçilen her katman **ultra detaylı, derinlemesine ve eksiksiz** kodlanır ve belgelenir.

Ölçüt: *Bu depoyu ilk kez açan mühendisin cevabını kodu okumadan bulması gereken sorular neler?* Her biri bir katman ya da bir dokümandır. Sahip olunmayan katman için doküman yazmak sahteciliktir; sahip olunan katmanı belgesiz bırakmak eksikliktir.

---

## 5. ANTI-AI VE KIDEMLİ MÜHENDİSLİK KALİTESİ
1. **Ultra Detaylı ve Eksiksiz Kodlama (Zero Stub / Zero Placeholder)**:
   - Hiçbir dosyada `// TODO: Implement later`, `// mock data`, `// stub`, `pass`, boş gövde veya sahte fonksiyon bırakılamaz.
   - Her modül production-ready, hata toleranslı, sınır durumları (edge-cases) ele alınmış ve gerçek dünya standartlarında eksiksiz yazılır.
2. **Robotik Yorumların Temizlenmesi**:
   - Fonksiyonun adını veya bariz davranışını tekrarlayan yüzeysel JSDoc/docstring yorumları yasaktır (Örnek yasak: `/** Gets the user by id */`).
   - Yalnızca mimari tercihin **"neden"** yapıldığını (RFC kararları, bellek/performans optimizasyonu, donanım veya protokol sınırları) açıklayan kıdemli mühendis yorumları yazılır.
3. **Katı Tip Güvenliği ve Domain Error Disiplini**:
   - `any` veya kontrolsüz `as` cast'leri yasaktır; tipler katı biçimde daraltılır (narrowing).
   - Sessizce yutulan `catch (e) {}` yasaktır. Domain Error sınıfları (`StorageConflictError`, `TokenExpiredError`, `ProtocolViolationError`) ile yapısal hata fırlatılır ve loglanır.
4. **Etki Alanına Özgü İsimlendirme (Ubiquitous Language)**:
   - `data`, `item`, `temp`, `info`, `processData`, `handleStuff` gibi tembel isimler yasaktır. İsimler gerçek iş mantığını ifade eder (`AccountReconciliationEngine`, `BatchIngestionQueue`, `PayloadSigner`).

---

## 6. GERÇEK GİT VE GELİŞTİRME MİMARİ ZİNCİRİ
Kıdemli bir ekibin sıfırdan geliştirdiği projelerdeki mantıksal geliştirme sırası izlenir:
1. Her commit tek bir mantıksal adımı temsil eder (Atomic Commits).
2. Format: Conventional Commits (`feat(engine): ...`, `refactor(domain): ...`, `test(core): ...`). Mesaj İngilizce ve emir kipinde; gövde nedeni anlatır.
3. Commit geçmişi, mimar ve ekibin adım adım inşa ettiği profesyonel bir kronoloji sunar:
   - `chore(init): configure workspace tooling, compiler strictness and contracts`
   - `feat(arch): document system blueprint and rfc decisions in docs/`
   - `feat(core): implement core domain engine and deterministic state transitions`
   - `feat(layer): implement project-specific layers (api / ui / pwa / store)`
   - `test(suite): provide complete unit, integration and contract coverage`
   - `ci(pipeline): add automated verification, linting and build automation`

---

## 7. DEPO DOKÜMANTASYON STANDARDI
- `README.md`: Profesyonel tanıtım, mimari diyagram, CLI/API kullanım rehberi, performans metrikleri ve lisans.
- `docs/`: Sistem haritası, hafıza, görevler ve mimari kayıtların tamamını içeren tek merkez.
- `CONTRIBUTING.md`: MonarchDevLab ekibi katkı, inceleme ve kod standartları kuralları.
