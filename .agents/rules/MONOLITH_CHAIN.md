# MONOLITH WORKS & MONARCHDEVLAB KURUMSAL MÜHENDİSLİK ZİNCİRİ (v1.2)
# Dosya Konumu: .agents/rules/MONOLITH_CHAIN.md & docs/MONOLITH_CHAIN.md

Bu kural dokümanı, Monolith Works bünyesinde ve MonarchDevLab ekosisteminde üretilen tüm yazılım, kütüphane, servis, arayüz ve mimarilerde istisnasız uygulanan kurumsal geliştirme standardıdır.

TEMEL HEDEF:
Kod tabanına ve git geçmişine bakan en kıdemli yazılım mimarının dahi projenin bir yapay zeka oturumundan çıktığını asla anlamaması; sistemin MonarchDevLab çekirdek mühendislik ekibi tarafından sıfırdan, projeye özgü mimari adımlarla, ultra detaylı ve eksiksiz biçimde inşa edildiğini görmesidir.

---

## 1. GELİŞTİRİCİ KİMLİĞİ VE AİDİYET PROTOKOLÜ
1. **Geliştirici & Telif**:
   - Geliştirici kimliği istisnasız her zaman **Monolith Works** olarak tanımlanır.
   - GitHub organizasyonu, takım ve dağıtım çatı adı **MonarchDevLab** (`github.com/MonarchDevLab/...`) olarak yapılandırılır.
   - Paket tanımlayıcılarında (`package.json`, `Cargo.toml`, `pyproject.toml`, `*.csproj`, `go.mod`):
     - `author`: `Monolith Works <dev@monolithworks.com.tr>`
     - `organization` / `publisher`: `MonarchDevLab`
     - `copyright`: `Copyright (c) 2026 Monolith Works. All rights reserved.`
2. **Gizlilik & Sıfır Yapay Zeka İzi (Zero AI Footprint)**:
   - Kod dosyalarında, commit mesajlarında, PR açıklamalarında, dokümantasyonlarda ve konfigürasyonlarda yapay zeka, LLM, model adları, prompt, context, token veya bot etiketlerine dair en ufak bir iz KESİNLİKLE BULUNAMAZ.
   - `Co-authored-by: AI...`, `Generated with...`, `AI Assistant` gibi tüm bot izleri yasaktır.

---

## 2. DOKÜMANTASYON VE HAFIZA BİRLEŞTİRME STANDARDI (docs/ MERKEZİ)
- **.ai/ Klasör Yasağı**: Proje kökünde `.ai/` klasörü KESİNLİKLE OLUŞTURULMAZ. Bu isim doğrudan yapay zeka oturumunu ifşa eder.
- **Tek Merkez: docs/ Klasörü**: Tüm sistem hafıza dosyaları, görev yönetim belgeleri ve kurumsal mimari zincir standartları tek bir çatı altında `docs/` dizininde toplanır:
  1. `docs/HANDOFF.md`: Anlık yönelim, kritik komutlar, commit zinciri, riskler.
  2. `docs/TASKS.md`: Tek gerçek kaynak görev listesi (`[~]` ŞİMDİ, `[ ]` SIRADAKİ, `[x]` TAMAMLANDI).
  3. `docs/WORKLOG.md`: Oturum kayıtları, mimari kararlar (`[KARAR-NNN]`), GOTCHAS / dersler.
  4. `docs/SYSTEM_MAP.md`: Mimari harita, design tokens, güvenlik ve modül sınırları.
  5. `docs/MONOLITH_CHAIN.md`: Kurumsal mühendislik zinciri ve kalite standardı.
  6. `docs/architecture/` (gerektiğinde): ADR'ler, RFC kararları ve Mermaid şemaları.

---

## 3. PROJEYE GÖRE ADAPTİF VE ULTRA DETAYLI MİMARİ ZİNCİRİ
Architecture, Engine, Design System, PWA, Test Suite gibi bileşenler bağlama göre şekillenen örnek katmanlardır. **Şablonculuk ve gereksiz yük yasaktır.** Projenin türüne ve ihtiyacına göre katmanlar esnek biçimde belirlenir (gerekmeyen katman çıkarılır, gereken yeni katmanlar eklenir). Ancak seçilen her katman **ultra detaylı, derinlemesine ve eksiksiz** kodlanır.

### Proje Tiplerine Göre Adaptif Matris:
1. **Kapsamlı Web Platformu / SaaS**:
   - Architecture (RFC / ADR / System Blueprint)
   - Core Domain Engine (Deterministik iş mantığı, state machine)
   - Design System & Tokens (CSS Variables / Tokens, headless primitives, WCAG-AA)
   - Web App / PWA Runtime (Service Worker, offline cache, installable manifest)
   - Test Suite (Unit, Integration, E2E Playwright)
2. **Backend Servis / Mikroservis / API**:
   - Architecture (Domain-Driven Design, API Contracts, OpenAPI/gRPC specs)
   - Core Engine & Pipeline (İş kuralları, transaction boundaries, CQRS / Event Store)
   - Data & Migration Layer (Strict schema, up/down SQL migrations, connection pooling)
   - Test Suite & Benchmark (Unit, integration, contract tests, load/concurrency benchmarks)
3. **CLI / Araç / Kütüphane / SDK**:
   - Architecture (RFC, CLI Interface Contract, I/O boundary)
   - Core Algorithm Engine (Memory-efficient, zero-dependency, strict types)
   - Error Handling & Recovery (Typed domain errors, user-friendly CLI output)
   - Benchmark & Test Suite (Unit, property-based tests, execution profiling)
4. **Gömülü / Donanım / Yerel Uygulama**:
   - Hardware Abstraction Layer (HAL), Driver Engine, Memory Lifecycle, Telemetry & Watchdog.

---

## 4. ANTI-AI VE KIDEMLİ MÜHENDİSLİK KALİTESİ
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

## 5. GERÇEK KURUMSAL GİT VE GELİŞTİRME ZİNCİRİ
Kıdemli bir ekibin sıfırdan geliştirdiği projelerdeki mantıksal geliştirme sırası izlenir:
1. Her commit tek bir mantıksal adımı temsil eder (Atomic Commits).
2. Format: Conventional Commits (`feat(engine): ...`, `refactor(domain): ...`, `test(core): ...`).
3. Commit geçmişi, mimar ve ekibin adım adım inşa ettiği profesyonel bir kronoloji sunar:
   - `chore(init): configure workspace tooling, compiler strictness and contracts`
   - `feat(arch): document system blueprint and rfc decisions in docs/`
   - `feat(core): implement core domain engine and deterministic state transitions`
   - `feat(layer): implement project-specific layers (api / ui / pwa / store)`
   - `test(suite): provide complete unit, integration and contract coverage`
   - `ci(pipeline): add automated verification, linting and build automation`

---

## 6. DEPO DOKÜMANTASYON STANDARDI
- `README.md`: Profesyonel kurumsal tanıtım, mimari diyagram, CLI/API kullanım rehberi, performans metrikleri ve lisans.
- `docs/`: Sistem haritası, hafıza, görevler ve mimari kayıtların tamamını içeren tek merkez.
- `CONTRIBUTING.md`: MonarchDevLab ekibi katkı, inceleme ve kod standartları kuralları.
