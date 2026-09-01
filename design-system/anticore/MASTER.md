# Design System Master File

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
