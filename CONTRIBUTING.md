# Katkı ve Mühendislik Standartları (CONTRIBUTING)

Anticore projesine katkıda bulunmak isteyen mühendisler, **Monolith Works & MonarchDevLab Kurumsal Mühendislik Standartları** (`docs/MONOLITH_CHAIN.md`) ilkelerine tam uyum sağlamakla yükümlüdür.

## 1. Mülkiyet ve Lisanslama
- Projedeki tüm fikri mülkiyet, kod hakları ve algoritmalar istisnasız **Monolith Works**'e aittir.
- GitHub'daki **MonarchDevLab** organizasyonu projenin resmi dağıtım ve yayınlama kanalıdır.
- Katkıda bulunulan tüm kodlar projenin MIT lisansı koşulları altında değerlendirilir.

## 2. Mühendislik Standartları
1. **Sıfır Stub / Sıfır Placeholder:**
   - Kod tabanına `TODO`, sahte veri, boş fonksiyon gövdesi veya geçici stub içeren PR'lar kabul edilmez.
   - Her modül eksiksiz, kenar durumları (edge-cases) test edilmiş ve üretime hazır teslim edilir.
2. **Katı Tip Güvenliği:**
   - TypeScript tarafında `any` veya kontrolsüz tip zorlamaları (`as`) yasaktır.
   - Rust tarafında `unwrap()` yerine tipli `Result`/`Option` desenleri ve etki alanına özgü hata türleri (`DomainError`) kullanılır.
3. **Tek Sorumluluk ve Dosyalama:**
   - "God folder" (`utils/`, `helpers/`, `misc/`, `common/`) kullanımı kesinlikle yasaktır; her fonksiyon ait olduğu etki alanına (domain) göre yapılandırılır.
   - Fonksiyon uzunluğu <50 satır, dosya uzunluğu <300 satır hedeflenir.

## 3. Git ve Commit Protokolü
- **Format:** Conventional Commits (`type(scope): subject`).
- **Kurallar:**
  - Bir commit = bir mantıksal değişiklik (Atomic Commit).
  - Commit mesajı İngilizce, emir kipinde (imperative mood) ve net teknik gerekçeyi içermelidir.
  - Yapay zeka veya bot izleri içeren etiketler (`Co-authored-by: AI...` vb.) kabul edilmez.

## 4. Doğrulama Döngüsü
Bir değişiklik teslim edilmeden önce aşağıdaki adımlar yerel ortamda doğrulanmalıdır:
```bash
# 1. Rust Motor Testleri
cd antikor/engine && cargo test --workspace

# 2. Rust Masaüstü Kontrolü
cd antikor/desktop/src-tauri && cargo check

# 3. Frontend Tip Kontrolü ve Derleme
cd antikor/desktop && npm run build
```
Tüm adımlar 0 hata ve %100 yeşil test sonucu vermelidir.
