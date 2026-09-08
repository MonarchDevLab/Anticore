# HANDOFF

## Anlık Durum
Anticore, 2026 Raycast / Warp / Little Snitch standartlarında $10K Cyber-Hardware arayüz mimarisine dönüştürüldü. Web SaaS klonu görünümüne yol açan çift başlık çubuğu ve 240px'lik sol dikey menü tamamen kaldırıldı; yerine yekpare Frameless Donanım Şasisi (`decorations: false`, `Titlebar.tsx`), yatay Segmented HUD Tab Bar (`App.tsx`), dönen çift segment halkalı dokunsal Cyber-Reactor Hub, canlı Throughput dalga formu osiloskopu, gerçek zamanlı paket teftiş radarı (`Dashboard.tsx`) ve Slide-over Kılavuz Çekmecesi (`GuideDrawer.tsx`) entegre edildi.
- **Tasarım Sistemi:** Derin Uzay Obsidyeni (`#06080C`), yüksek voltajlı Hyper-Emerald (`#00F59B`), 1px sub-pixel hairline gradient kenarlıklar, ambient aura ve dokunsal buton çökme efektleri (`globals.css`).
- **Çalışma Alanı:** Ekran genişliği %100 oranında çalışma alanına tahsis edildi.
- **Doğrulama:** `npm run build` (11.04s) 0 hata, `cargo check` (desktop/src-tauri) 0 hata, `cargo test --workspace` 46/46 yeşil.

## Kritik Komutlar
- Frontend Derleme: `npm run build` (`antikor/desktop`)
- Frontend Geliştirme: `npm run tauri dev` (`antikor/desktop`)
- Rust Motor Testleri: `cargo test --workspace` (`antikor/engine`)
- Rust Backend Kontrolü: `cargo check` (`antikor/desktop/src-tauri`)
- Sürüm ve Varlık Kontrolü: `gh release view v0.3.0`

## Commit Zinciri
- Son Commit: `5a35dd0` (`feat(ui): transform interface to 10k cyber-hardware console`)
- Durum: `main` dalı ve `v0.3.0` etiketi kurumsal mimari zincirle güncel ve senkronize.

## Riskler ve Öncelikler
- **Gizlilik:** Depo `PRIVATE` durumdadır. Dışarı açılmak istendiğinde `gh repo edit --visibility public` ile açılabilir.
- **Sıfır Hız Kaybı:** Hedef listesi harici tüm trafik tünellenmeksizin doğrudan çekirdekten geçer (`PacketVerdict::Passthrough`).
