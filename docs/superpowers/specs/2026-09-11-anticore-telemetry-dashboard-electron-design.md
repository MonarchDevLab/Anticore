# Anticore Telemetry & Fleet Radar: Electron Desktop App & Hexcore Architecture Design Spec

**Date:** 2026-09-11  
**Author:** Monolith Works Core Team  
**Status:** Approved by User  
**Target:** Private Developer Operational Fleet Radar (Strict Zero-Leakage)

---

## 1. Executive Summary & Problem Definition

Anticore is an enterprise-grade DPI bypass and network integrity engine for Windows and macOS. To maintain optimal connectivity, diagnose regional ISP censorship anomalies (TCP RST, DNS poisoning, timeouts), and remotely safeguard the fleet (emergency self-purge, client locking, maintenance mode, and OTA updates), a dedicated developer radar is required.

The previous web-based dashboard prototype has been upgraded based on three explicit requirements:
1. **Dynamic Version Reading:** The client must dynamically read, broadcast, and display `v0.3.1.1` across all layers (`Titlebar`, `TrayQuickPanel`, `tauri.conf.json`, `connectivitySync.ts`).
2. **Physical Directory Isolation:** The dashboard must reside outside the Anticore repository at `E:\Personel\Branding\Uygulama\anticore-dashboard`, maintaining zero git tracking and zero repository leakage.
3. **Full Electron Desktop Application with Hexcore Operational UI:** The dashboard must be a standalone desktop application (Electron) featuring a high-density, dark slate (`#08090d`), frameless command center layout inspired by the Hexcore operations interface (Quick Command Panel, System Health telemetry, Platform/Version Distribution, SVG Donut chart, 24-hour hourly heatmap, and live SSE event stream).

---

## 2. Architecture & Directory Isolation

```
E:\Personel\Branding\Uygulama\
├── Anticore\                      (Git Repository: MonarchDevLab/Anticore)
│   ├── .gitignore                 (Contains: /anticore-dashboard/)
│   └── antikor\
│       ├── .gitignore             (Contains: /anticore-dashboard/)
│       └── desktop\
│           ├── src\
│           │   ├── components\
│           │   │   └── Titlebar.tsx         [Displays v0.3.1.1 dynamically]
│           │   ├── views\
│           │   │   └── TrayQuickPanel.tsx   [Removes 0.3.0 fallback -> 0.3.1.1]
│           │   └── services\
│           │       └── connectivitySync.ts  [Dynamic api.getAppVersion()]
│           └── src-tauri\
│               └── tauri.conf.json          [version: 0.3.1.1]
│
└── anticore-dashboard\            (STANDALONE DESKTOP APPLICATION - ZERO REPO LEAKAGE)
    ├── .gitignore                 (Ignores node_modules, data, dist)
    ├── package.json               (Electron + concurrently + fastify + react scripts)
    ├── main.js                    (Electron Main Process: starts Fastify & native window)
    ├── preload.js                 (Secure Context Bridge: window controls & system metrics)
    ├── start-dashboard.bat        (One-click native launcher)
    ├── server\                    (Fastify 5 + node:sqlite engine)
    │   ├── src\
    │   │   ├── db\database.ts     (WAL mode, SQLite tables)
    │   │   ├── api\beacon.ts      (Telemetry ingestion, maintenance, commands, OTA)
    │   │   ├── api\admin.ts       (JWT auth, overview, hourly metrics, actions, SSE)
    │   │   └── index.ts           (Server entrypoint)
    │   └── data\telemetry.db      (Local persistent database)
    └── client\                    (React 19 + Tailwind CSS v4 Hexcore UI)
        ├── src\
        │   ├── components\
        │   │   ├── Header.tsx             (Frameless titlebar + status badges + window buttons)
        │   │   ├── Sidebar.tsx            (Categorized nav groups + Monolith session status)
        │   │   ├── QuickCommandPanel.tsx  (4 Action cards: Maintenance, OTA, Anomaly Rule, DB Vacuum)
        │   │   ├── SystemHealthCard.tsx   (RAM, port, anomalies, DB WAL telemetry)
        │   │   ├── StatCards.tsx          (4 Neon-bordered metric cards with pills)
        │   │   ├── DistributionSection.tsx(Platform & Version cards + SVG Donut Chart)
        │   │   ├── HourlyHeatmap.tsx      (24h density histogram bars)
        │   │   ├── ClientsTable.tsx       (PC Name, Uptime, Lock & Purge action buttons)
        │   │   ├── AnomaliesRadar.tsx     (ISP blocked domains + one-click bypass rule)
        │   │   ├── EventsFeed.tsx         (SSE live terminal stream)
        │   │   ├── MaintenanceModal.tsx   (3D Metallic Grey Orb remote maintenance controller)
        │   │   └── UpdateBroadcastModal.tsx(Targeted OTA update broadcaster)
        │   └── App.tsx
        └── vite.config.ts
```

---

## 3. Detailed Component Specifications

### 3.1. Client-Side Version Integrity (`antikor/desktop`)
- `Titlebar.tsx`: Must invoke `api.getAppVersion()` on mount and render a discrete mono badge `v0.3.1.1` adjacent to the brand title `ANTICORE`.
- `TrayQuickPanel.tsx`: Replace `v{appVersion || "0.3.0"}` with `v{appVersion || "0.3.1.1"}`.
- `tauri.conf.json`: Set `"version": "0.3.1.1"`.
- `connectivitySync.ts`: In `init()`, query `await api.getAppVersion()`. Store dynamically on `this.appVersion` and pass in beacon payloads.

### 3.2. Electron Desktop Main Process (`anticore-dashboard/main.js`)
- Runs with `singleInstanceLock` to prevent multiple daemon port collisions.
- Boots internal Fastify server asynchronously (`server/dist/index.js`).
- Spawns a frameless, dark slate styled `BrowserWindow`:
  - Dimensions: 1480x920 (minWidth: 1200, minHeight: 760).
  - Frame: `false`, titleBarStyle: `hidden`, backgroundColor: `#08090d`.
  - WebPreferences: `nodeIntegration: false`, `contextIsolation: true`, `preload: preload.js`.
- IPC Handlers for window controls (`minimize`, `maximize`, `close`).

### 3.3. Hexcore-Inspired Operations Center UI
- **Design Language:**
  - Background: Obsidian Void (`#08090d`), Surface Cards (`#0f121a`), Hover (`#161b26`).
  - Borders: 1px `rgba(255, 255, 255, 0.07)` with top neon accent glow on active cards.
  - Colors: Neon Cyan (`#00edff`), Neon Flame (`#ff642b`), Emerald Green (`#10b981`), Violet (`#8b5cf6`), Amber (`#f59e0b`).
  - Strict zero emoji rule: All indicators and actions use Lucide SVG icons.
- **Top Quick Command Panel:** 4 action tiles with interactive neon borders:
  1. *Küresel Bakım Modu:* Instant fleet-wide 3D grey metallic wireframe orb lock toggle.
  2. *OTA Güncelleme:* Broadcast modal prompt to target or all versions.
  3. *Anomali Kuralı:* Instantly convert unlisted ISP blocked domains into bypass rules.
  4. *Veritabanı Bakımı:* Trigger SQLite `PRAGMA wal_checkpoint(TRUNCATE)` and VACUUM.
- **System & Infrastructure Health Card:**
  - Real-time RAM memory consumption of the Node.js/Electron process.
  - Telemetry port listener status (`8080`).
  - Pending blocked domain anomaly count.
  - SQLite WAL size in KB/MB.
- **SVG Donut Chart & Distribution Section:**
  - OS distribution (Windows 11, Windows 10, macOS).
  - Version distribution (v0.3.1.1 vs legacy).
  - Responsive pure SVG donut chart displaying percentage segments with hover tooltips and central total device count.
- **Hourly Activity Histogram:** 24 interactive bars (00:00 - 23:00) showing fleet operational hours.
- **Live SSE Telemetry Terminal:** Real-time log console showing client check-ins, dwell times, and anomaly detections.

---

## 4. Verification & Validation Protocol

1. **Anticore Client Verification:**
   - Run `npm test` in `antikor/desktop` (23/23 Vitest tests pass).
   - Run `cargo check` in `antikor/desktop/src-tauri` (100% clean).
   - Verify `v0.3.1.1` rendered in `Titlebar` and `TrayQuickPanel`.
2. **Directory Relocation & Zero-Leakage:**
   - Move directory to `E:\Personel\Branding\Uygulama\anticore-dashboard`.
   - Run `git status` in `antikor` to verify zero untracked dashboard files.
3. **Electron Desktop Build & Launch:**
   - Install Electron dependency in `anticore-dashboard`.
   - Build server (`npm run build` in server) and client (`npm run build` in client).
   - Launch via `npm start` / `start-dashboard.bat`.
   - Verify frameless window, custom controls, and live Fastify connection.
4. **End-to-End Functional Test:**
   - Send simulated beacon from client to `127.0.0.1:8080`.
   - Confirm PC hostname, dwell time, and `v0.3.1.1` version appear on the dashboard.
   - Test toggle of 3D maintenance mode and verify client response.
