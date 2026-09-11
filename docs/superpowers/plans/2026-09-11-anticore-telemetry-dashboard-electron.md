# Anticore Telemetry & Fleet Radar: Electron Desktop App & Hexcore Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix client version reading to dynamically report `v0.3.1.1`, relocate `anticore-dashboard` to `E:\Personel\Branding\Uygulama\anticore-dashboard` for zero-leakage isolation, and transform it into a standalone Electron desktop application featuring a high-density Hexcore operations UI.

**Architecture:** Fastify 5 + `node:sqlite` (WAL mode) backend bundled with Electron main process, serving a React 19 + Tailwind CSS v4 frontend inside a native frameless dark slate window. Anticore desktop connects seamlessly via local HTTP beacon.

**Tech Stack:** Electron 35+, Node.js (node:sqlite, Fastify 5), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Tauri v2 (Rust + TS).

**Spec:** `docs/superpowers/specs/2026-09-11-anticore-telemetry-dashboard-electron-design.md`

## Global Constraints
- Strict zero-leakage: `anticore-dashboard` must live outside the git repository at `E:\Personel\Branding\Uygulama\anticore-dashboard` and never be committed to GitHub.
- Strict zero-emoji rule: Only Lucide SVG icons and pure text.
- Anticore client fail-safe: Max 2.5s HTTP timeout, 100 ring-buffer limit, zero-crash error suppression.

---

### Task 1: Anticore Client Dynamic Version Reading (`v0.3.1.1`)

**Files:**
- Modify: `antikor/desktop/src/components/Titlebar.tsx`
- Modify: `antikor/desktop/src/views/TrayQuickPanel.tsx`
- Modify: `antikor/desktop/src-tauri/tauri.conf.json`
- Modify: `antikor/desktop/src/services/connectivitySync.ts`
- Test: `antikor/desktop/src/services/connectivitySync.test.ts`

**Interfaces:**
- Consumes: `api.getAppVersion()` from `src/lib/tauri.ts`
- Produces: Dynamic `v0.3.1.1` version badge in Titlebar, QuickPanel, and telemetry payload.

- [ ] **Step 1: Update `tauri.conf.json` to `0.3.1.1`**
  - In `antikor/desktop/src-tauri/tauri.conf.json`, change line 4 `"version": "0.3.1"` to `"version": "0.3.1.1"`.

- [ ] **Step 2: Update `Titlebar.tsx` to dynamically display `v0.3.1.1`**
  - Mount hook calls `api.getAppVersion().then(setVersion).catch(() => setVersion("0.3.1.1"))`.
  - Render `<span className="text-[10px] font-mono text-paper-muted font-semibold bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/[0.08]">v{appVersion}</span>` next to `ANTICORE`.

- [ ] **Step 3: Update `TrayQuickPanel.tsx` fallback**
  - Change line 242 from `v{appVersion || "0.3.0"}` to `v{appVersion || "0.3.1.1"}`.

- [ ] **Step 4: Update `connectivitySync.ts` to dynamically send `appVersion`**
  - In `init()`, query `const ver = await api.getAppVersion().catch(() => '0.3.1.1'); this.appVersion = ver;`.
  - In `flush()`, use `appVersion: this.appVersion || '0.3.1.1'`.

- [ ] **Step 5: Run tests & verify compilation**
  - Run `npm test` in `antikor/desktop`.
  - Run `npm run build` in `antikor/desktop`.
  - Run `cargo check` in `antikor/desktop/src-tauri`.

---

### Task 2: Relocate Dashboard to `E:\Personel\Branding\Uygulama\anticore-dashboard`

**Files:**
- Move directory: `antikor/../anticore-dashboard` -> `E:\Personel\Branding\Uygulama\anticore-dashboard`
- Modify: `antikor/.gitignore` (confirm `/anticore-dashboard/` entry)
- Create: `E:\Personel\Branding\Uygulama\anticore-dashboard/.gitignore`

- [ ] **Step 1: Move directory using PowerShell**
  - Execute `Move-Item -Path "e:\Personel\Branding\Uygulama\Anticore\anticore-dashboard" -Destination "E:\Personel\Branding\Uygulama\anticore-dashboard" -Force`.

- [ ] **Step 2: Verify git status in `antikor`**
  - Run `git status` in `antikor` to confirm no untracked `anticore-dashboard` files remain.

- [ ] **Step 3: Verify target directory integrity**
  - Check directory listing at `E:\Personel\Branding\Uygulama\anticore-dashboard` (server, client, data, package.json).

---

### Task 3: Electron Desktop Scaffolding & Server Integration

**Files:**
- Create: `E:\Personel\Branding\Uygulama\anticore-dashboard/main.js`
- Create: `E:\Personel\Branding\Uygulama\anticore-dashboard/preload.js`
- Modify: `E:\Personel\Branding\Uygulama\anticore-dashboard/package.json`
- Modify: `E:\Personel\Branding\Uygulama\anticore-dashboard/start-dashboard.bat`

- [ ] **Step 1: Install Electron dependency**
  - In `E:\Personel\Branding\Uygulama\anticore-dashboard`, run `npm install --save-dev electron`.

- [ ] **Step 2: Create `main.js` (Main Process)**
  - Request single instance lock (`app.requestSingleInstanceLock()`).
  - Start Fastify server (`require('./server/dist/index.js')`).
  - Create frameless `BrowserWindow` with `titleBarStyle: 'hidden'`, `backgroundColor: '#08090d'`, `width: 1480, height: 920`.
  - Handle window control IPCs: `window-minimize`, `window-maximize`, `window-close`, `get-system-metrics` (RAM usage).

- [ ] **Step 3: Create `preload.js`**
  - Expose `window.electronAPI` with `minimize()`, `maximize()`, `close()`, `getSystemMemory()`.

- [ ] **Step 4: Update `package.json` and `start-dashboard.bat`**
  - Add `"main": "main.js"`, `"start": "electron ."` script.
  - Update `start-dashboard.bat` to launch `npx electron .`.

---

### Task 4: Hexcore-Inspired Operations Center UI Overhaul

**Files:**
- Create: `client/src/components/Sidebar.tsx`
- Create: `client/src/components/QuickCommandPanel.tsx`
- Create: `client/src/components/SystemHealthCard.tsx`
- Create: `client/src/components/DistributionSection.tsx` (with SVG Donut Chart)
- Modify: `client/src/components/Header.tsx` (add frameless window drag & controls)
- Modify: `client/src/components/StatCards.tsx` (Hexcore pill styling & neon top borders)
- Modify: `client/src/components/HourlyHeatmap.tsx`
- Modify: `client/src/components/EventsFeed.tsx`
- Modify: `client/src/App.tsx` (integrated Hexcore command center layout)

- [ ] **Step 1: Create `Sidebar.tsx`**
  - Categories: Filo & Operasyon, Güvenlik & Müdahale, Güncelleme & OTA, Sistem.
  - Category headers in tiny uppercase slate font, active indicator markers, session status badge.

- [ ] **Step 2: Create `QuickCommandPanel.tsx` & `SystemHealthCard.tsx`**
  - 4 quick actions: 3D Bakım Modu, OTA Güncelleme Yayını, Anomali Kuralı, Veritabanı Bakımı.
  - System Health: Process RAM MB, Port 8080, Pending Anomalies, DB WAL status.

- [ ] **Step 3: Create `DistributionSection.tsx`**
  - OS distribution badges (Windows 11, Windows 10, macOS).
  - Version distribution badges (v0.3.1.1 vs legacy).
  - Responsive pure SVG Donut Chart with central total count.

- [ ] **Step 4: Update `Header.tsx` and `StatCards.tsx`**
  - Add frameless window drag region (`-webkit-app-region: drag`), window minimize/maximize/close buttons.
  - Top neon border accents (`border-t-2 border-emerald-500/80`, etc.) and pill status tags.

- [ ] **Step 5: Assemble and build frontend**
  - In `client`, run `npm run build` to output to `client/dist`.

---

### Task 5: End-to-End Verification & Verification Run

- [ ] **Step 1: Run server test suite**
  - In `server`, run `npm test`.
- [ ] **Step 2: Test desktop app launch**
  - Launch `electron .` and verify window opens, connects to port 8080, and renders the Hexcore dashboard.
- [ ] **Step 3: Test client-to-dashboard telemetri**
  - Send simulated beacon from `antikor/desktop`. Verify PC name, uptime, dwell time, and `v0.3.1.1` show up in real-time.
- [ ] **Step 4: Update documentation**
  - Update `antikor/docs/TASKS.md`, `antikor/docs/WORKLOG.md`, `antikor/docs/HANDOFF.md`.
