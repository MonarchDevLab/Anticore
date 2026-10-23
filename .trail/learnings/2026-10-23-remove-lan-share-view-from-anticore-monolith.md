---
title: Remove LAN share view from Anticore desktop
author: Monolith
date: 2026-10-23
branch: main
touches:
  - CHANGELOG.md
  - desktop/src-tauri/gen/schemas/acl-manifests.json
  - desktop/src-tauri/src/lan_share.rs
  - desktop/src-tauri/src/lib.rs
  - desktop/src/App.tsx
  - desktop/src/components/AppNavigation.tsx
  - desktop/src/components/MobileBottomNav.tsx
  - desktop/src/lib/i18n.ts
  - desktop/src/lib/tauri.ts
  - desktop/src/views/LanShare.test.tsx
---

## Decided
Removed the Ağ & Cihaz Paylaşımı view: LanShare.tsx/test, lan_share.rs (Tauri commands), nav and settings entries, tauri.ts API, i18n lan_* keys. Kept core LanProxy in anticore-core because the Android SOCKS5 tunnel (service.rs) uses it. Left the dead lan_share engine flag (CLI, config JSON, win_divert test) as a REVIEW item.

## Tried and ruled out
Regex edits with \n failed on CRLF files (App.tsx, SettingsView.tsx, tauri.ts); line-range sed after grep -n worked. Repo-wide grep -r from the root hangs past 120s (dist, target, node_modules): scope it with --exclude-dir or use the Grep tool.

## Watch out
READMEs (5 languages) still advertise LAN sharing and the HTML tables need hand edits. cargo check of src-tauri takes ~3 min cold.
