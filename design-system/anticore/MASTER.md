# Design System Master File

## Operations console — current revision 2026-09-09

User selected a technical, dense control panel after rejecting the previous card dashboard. This section supersedes all earlier geometry and layout directions. The shell uses a 174px navigation rail (154px at native width), a subtle 24px engineering grid, 5px panel corners and 3px control corners. Use the installed theme palette; light action colors remain live-dim on white. Body and data text is at least 12px; compact brand/eyebrow marks may be smaller. Local Fira Sans supplies 26–40px engine state; Fira Code supplies uppercase panel labels, numerical telemetry and event rows.

The signature is a circuit-style core indicator reflecting only known engine state, never traffic or reachability. The engine console owns state, power action and profile selection. Real counters and packet sampling occupy the adjacent telemetry console. Three TLS targets form a horizontal inspection row, with event history and diagnostic routes below. At 1080×720, engine, telemetry and target testing fit without scrolling. Below 700px modules stack; below 430px the start action spans the available width. All controls retain keyboard focus, unknown/busy/empty/error states and reduced-motion support. Shared tool pages adopt the same compact surfaces.

Local network-monitoring design research supported the Fira pairing and high density. Marketing sections and glass effects were excluded. No font or runtime dependency was added. Existing behavior tests and Edge acceptance are the validation basis; preview data is a test fixture.

## Compact connection console — current revision 2026-09-08

Supersedes prior power-console geometry. A horizontal connection card pairs left-aligned state and explanation with a filled, rounded-square power control. Profile selection remains adjacent; measured counters share a single inset strip. Shared panels use 20px radius, active navigation uses a restrained theme tint, and utility shortcuts use inset icon surfaces. Below 430px the power control becomes a full-width 56px action. Retain bundled Fira Sans / Fira Code and installed theme colors: void #06080C, card #0E131F, paper #F1F5F9, muted #94A3B8, accent #00F59B. Light actions use existing live-dim #047857 on white for 5.48:1 contrast. No new dependencies or data behavior changes. Reduced motion covers the connection workspace and navigation.

Local design research matched network monitoring and the existing Fira pairing; its marketing layout and glass effects were excluded from this utility. Verified in Edge at 390, 768 and 1080px, plus light/dark desktop captures. Fixture data is only for acceptance tests.

## Power console — revision 2026-09-08

User rejected the slate workspace. Restore the installed theme accent and compact instrument character without restoring fabricated metrics. Signature: a large physical-style power control, paired with profile selection. Fira Sans semibold titles, Fira Code counters. Existing palette: void #06080C, card #0E131F, paper #F1F5F9, live #00F59B; use theme tokens, not hardcoded component colors. Radius 16px, 8px spacing grid, 44px minimum actions. Unknown backend state stays visibly unknown and cannot start. This section supersedes the slate-blue visual direction below.

## Connection workspace — 2026-09-08

This section supersedes the historical dashboard specifications below for the application shell and connection workspace. Subject: a local Windows network utility for everyday users. Primary job: operate the engine and distinguish its state from measured reachability.

- Direction: graphite instrument panel, calm slate-blue illumination, restrained green status. Signature: a split connection path between device and destination; an explanatory diagram, never a fabricated traffic map.
- Workspace interaction tokens: `--workspace-accent` #a9c8f4 and `--workspace-on-accent` #101a29; light equivalents #075985 and #ffffff. Radius 16px; motion 200ms ease-out. These override the historical sky interaction token for the new workspace.
- Tokens: existing theme surfaces `--color-void` (#06080C), `--color-surface-card` (#0E131F), text `--color-paper` (#F1F5F9), secondary `--color-paper-muted` (#94A3B8), interaction `--color-sky` (#00D2FF), state `--color-live` (#00F59B). Alternate themes inherit their existing equivalents. Raw colors belong only to token definitions.
- Type: locally bundled Fira Sans for 28–36px headings and 14px body, Fira Code for measured values and technical labels. Minimum label size 12px.
- Layout: 208px grouped side navigation; a spacious connection panel paired with configuration; measured activity and on-demand target checks below. Narrow windows collapse navigation; no horizontal page overflow.
- Controls: one primary engine action on the dashboard, shared operation lock across views; native labelled profile selector; 44px controls, visible focus, loading/empty/error/stale states. All existing routes remain reachable.
- Metrics: no random series, inferred success or decorative counts. Failed status polling makes the state unavailable. Endpoint probes show their exact result; no inference of download speed.
- Motion: 180–240ms opacity/transform for deliberate interactions; no ambient rotating machinery. Reduced motion disables non-essential effects.
- Validation: existing tests/build, focused interaction tests for unknown/busy state, browser screenshots at desktop and narrow widths, keyboard and text contrast checks. Browser fixtures are testing-only and never part of production data.

Design research: ui-ux-pro-max `network monitoring dashboard` returned a matching Fira Code/Fira Sans operations direction. Its marketing sections and heavy glass effects are not applicable to this desktop workflow. The prior generic hero/CTA result was rejected. No additional font, animation or UI dependency is introduced.

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Anticore
**Generated:** 2026-08-24 11:29:17
**Last Synced with `globals.css`:** 2026-09-02 (Faz 4 item 40 — this file previously described a generic flat-color scaffold; the shipped UI is Glassmorphism dark and had diverged. Tokens below now mirror `desktop/src/styles/globals.css`'s `@theme` block exactly — that file is the executable source of truth, this document exists to keep new UI work consistent with it without re-reading the CSS every time.)
**Category:** Smart Home/IoT Dashboard
**Design Dials:** Variance 6/10 (Balanced / Modern) | Motion 4/10 (Standard) | Density 8/10 (Dense / Dashboard)

---

## Global Rules

### Color Palette (Dark — default)

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Background (ink) | `#0a0e1a` | `--color-ink` |
| Background deep | `#060911` | `--color-ink-deep` |
| Panel / Card base | `#111827` | `--color-panel` |
| Panel muted | `#1e293b` | `--color-panel-muted` |
| Border (edge) | `#334155` | `--color-edge` |
| Muted foreground (fog) | `#94a3b8` | `--color-fog` |
| Foreground (paper) | `#f1f5f9` | `--color-paper` |
| Foreground bright | `#ffffff` | `--color-paper-bright` |
| Accent/CTA (live) | `#22c55e` | `--color-live` |
| Accent dim | `#16a34a` | `--color-live-dim` |
| Destructive (alert) | `#ef4444` | `--color-alert` |
| Destructive dim | `#dc2626` | `--color-alert-dim` |
| Warning | `#f59e0b` | `--color-warn` |
| Info (sky) | `#38bdf8` | `--color-sky` |
| Info dim | `#0ea5e9` | `--color-sky-dim` |

**Light mode:** ink→`#f8fafc`, panel→`#ffffff`, edge→`#cbd5e1`, fog→`#64748b`, paper→`#0f172a` (full override block in `globals.css` under `html.light, [data-theme="light"]`).

**Glassmorphism layers** (used instead of flat card/panel fills):

| Layer | Fill (dark) | Border (dark) | Blur |
|-------|-------------|----------------|------|
| glass-1 | `rgba(255,255,255,.03)` | `rgba(255,255,255,.06)` | 8px |
| glass-2 (default `.card`) | `rgba(255,255,255,.06)` | `rgba(255,255,255,.10)` | 16px |
| glass-3 | `rgba(255,255,255,.10)` | `rgba(255,255,255,.15)` | 24px |

Neon glow tokens `--glow-live` / `--glow-alert` / `--glow-sky` (soft double-shadow, used on hover/active states, not as a permanent glow).

**Color Notes:** Dark tech + status green — glassmorphism over flat fills.

### Typography

- **Heading Font:** Fira Code (`--font-mono`)
- **Body Font:** Fira Sans (`--font-sans`)
- **Mood:** dashboard, data, analytics, code, technical, precise
- **Delivery:** self-hosted, NOT Google Fonts CDN (`desktop/src/styles/fonts.css`, woff2 files under `desktop/src/assets/fonts/`, latin + latin-ext subsets only — Turkish characters need latin-ext). An app whose purpose is helping filtered-network users must not depend on an external font CDN for its own UI (Faz 4 analysis A5.9).

**CSS Import (in `globals.css`, first line):**
```css
@import "./fonts.css";
```

### Spacing Variables

*Density: 8/10 — Dense / Dashboard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `2px` / `0.125rem` | Tight gaps |
| `--space-sm` | `4px` / `0.25rem` | Icon gaps, inline spacing |
| `--space-md` | `8px` / `0.5rem` | Standard padding |
| `--space-lg` | `12px` / `0.75rem` | Section padding |
| `--space-xl` | `16px` / `1rem` | Large gaps |
| `--space-2xl` | `24px` / `1.5rem` | Section margins |
| `--space-3xl` | `32px` / `2rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

> These mirror the ACTUAL classes in `desktop/src/styles/globals.css` —
> reuse `.card`/`.btn-*`/`.input`, don't reinvent per-page variants.

### Buttons

```css
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  border-radius: 10px; padding: 0.55rem 1.15rem; font-size: 0.8125rem; font-weight: 600;
}
.btn:active { transform: scale(0.97); }
.btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* Variants — background/color/border only; base .btn above stays the same */
.btn-primary  { background: var(--color-live); color: var(--color-ink); }
.btn-ghost    { background: var(--glass-1); color: var(--color-paper); border-color: var(--glass-border-2); }
.btn-secondary{ background: rgba(255,255,255,.05); color: var(--color-paper); border-color: rgba(255,255,255,.12); }
.btn-danger   { background: rgba(239,68,68,.1); color: var(--color-alert); border-color: rgba(239,68,68,.25); }
.btn-sky      { background: rgba(56,189,248,.1); color: var(--color-sky); border-color: rgba(56,189,248,.25); }
```

Each variant gets a matching `box-shadow` glow on `:hover:not(:disabled)` (e.g. `.btn-primary:hover` → `0 0 16px rgba(34,197,94,.4)`), and a radial-gradient sheen via `.btn::after` — see `globals.css` for the exact values, don't hand-roll a new hover treatment per button.

### Cards

```css
.card {
  background: var(--glass-2);              /* NOT a flat fill */
  backdrop-filter: blur(16px) saturate(1.2);
  border: 1px solid var(--glass-border-2);
  border-radius: 16px;
  transition: border-color 250ms ease-out, box-shadow 250ms ease-out;
}
.card:hover { border-color: rgba(255,255,255,.14); }
```

Depth variants `.card-glass-1` (blur 8px, subtle) and `.card-glass-3` (blur 24px, prominent) exist for hierarchy — pick by importance, don't add a fourth depth. `.card-glow-live` / `.card-glow-sky` add a colored border+shadow on hover for interactive/selected cards.

### Inputs

```css
.input {
  width: 100%; border-radius: 10px;
  border: 1px solid rgba(71,85,105,.4);
  background: rgba(0,0,0,.25);
  backdrop-filter: blur(8px);
  padding: 0.6rem 0.85rem; font-size: 0.8125rem; color: var(--color-paper);
}
.input:focus { border-color: var(--color-live); box-shadow: 0 0 0 3px rgba(34,197,94,.1); }
```

### Modals / Dialogs

Use `components/ConfirmDialog.tsx` (`role="dialog" aria-modal="true"`, `bg-black/60` overlay, `.card` body) rather than a new one-off overlay — every destructive/blocking confirmation in the app already goes through it.

---

## Style Guidelines

**Style:** Glassmorphism

**Keywords:** Frosted glass, transparent, blurred background, layered, vibrant background, light source, depth, multi-layer

**Best For:** Modern SaaS, financial dashboards, high-end corporate, lifestyle apps, modal overlays, navigation

**Key Effects:** Backdrop blur (10-20px), subtle border (1px solid rgba white 0.2), light reflection, Z-depth

### Page Pattern

**Pattern Name:** Real-Time / Operations Landing

- **Conversion Strategy:** Offer a demo or sandbox and show trust signals. Label telemetry as live only when backed by a current source, with update time and stale state. Provide pause/hide or update-frequency controls for tickers and previews, stop offscreen/hidden work, support keyboard controls, and render a static final snapshot under reduced motion.
- **CTA Placement:** Primary CTA in nav + After metrics
- **Section Order:** Hero (product + live preview or status) > Key metrics/indicators > How it works > CTA (Start trial / Contact)

---

## Motion

**Stagger List** (Standard) — Trigger: load or scroll | Duration: 300-450ms | Easing: `back.out(1.4)`

```js
gsap.from('.grid-item', { opacity: 0, scale: 0.92, y: 16, duration: 0.4, stagger: { each: 0.06, from: 'start', grid: 'auto' }, ease: 'back.out(1.4)' });
```

**Framework notes:** grid: 'auto' lets GSAP infer rows/columns from a CSS grid layout for a natural wave stagger; Use matchMedia('(prefers-reduced-motion: reduce)') to skip non-essential motion and render the final state immediately

- ✅ Combine with from: 'center' for a bento-grid layout to draw the eye inward first
- ❌ Don't use back.out on dense data tables; the overshoot reads as sloppy on informational UI
- ⚡ Group DOM writes; avoid interleaving layout reads (getBoundingClientRect) between staggered tweens

---

## Anti-Patterns (Do NOT Use)

- ❌ Slow updates
- ❌ No automation

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
