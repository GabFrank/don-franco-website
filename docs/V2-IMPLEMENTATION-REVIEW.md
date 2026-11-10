# Don Franco V2 — Implementation Review

**Branch:** `cursor/feat-v2-greenfield-8e75`  
**PR:** [#1 (Draft)](https://github.com/GabFrank/don-franco-website/pull/1)  
**Status:** ✅ Complete — NOT deployed to production  
**Stack:** Astro 7 (greenfield rewrite from Astro 4)

---

## Executive Summary

Complete greenfield rebuild of Don Franco website with new Brewery Ember palette, mobile-first approach, and flexible menu architecture. Key decisions include cream-first theme inversion, unified WhatsApp messaging, and component-driven structure.

**⚠️ No Production Cutover:** This branch is complete and ready for preview. It is **NOT merged to main** and **NOT deployed to production**. Manual deployment decision pending.

---

## Stack & Dependencies

| Component | Version/Tool | Notes |
|-----------|--------------|-------|
| Framework | Astro 7.0.0 | Upgraded from Astro 4 |
| Node | ≥22 | Required for build |
| TypeScript | 5.6.0 | With `resolveJsonModule: true` |
| Dev Tools | @astrojs/check 0.9.0 | Type checking |
| Deployment | Digital Ocean | Rsync via GitHub Actions (unchanged) |
| APIs | Google Drive + Places | For gallery/menu images + ratings |

### Key Configuration Changes

- **`tsconfig.json`:** Added `resolveJsonModule: true` for direct JSON imports in Astro components
- **Content structure:** Moved `content/` → `src/content/` for Astro 7 compatibility
- **Import paths:** Updated all component imports to reflect `src/content/` location

---

## Brewery Ember Palette (Cream-First)

### Token Definitions (`src/styles/tokens.css`)

```css
:root {
  --color-bg: #1A1614;        /* Dark Charcoal */
  --color-surface: #2C2520;   /* Lighter charcoal (footer) */
  --color-surface-2: #3D342C; /* Even lighter (cards) */
  --color-text: #FAF3E8;      /* Cream */
  --color-muted: #A89888;     /* Muted grey-brown */
  --color-accent: #E85D04;    /* Ember Orange (CTAs) */
  --color-accent-2: #F0A202;  /* Amber Yellow (highlights) */
  --color-craft: #2F9E4F;     /* Lively Green (badges, chips) */
  --color-border: #3D342C;    /* Charcoal border */
}
```

### ⚠️ Token Naming Gotcha

**IMPORTANT:** Despite their names, `--color-bg` and `--color-text` are **inverted** in the cream-first theme:

- **Default page background:** `var(--color-text)` (#FAF3E8 cream)
- **Default text color:** `var(--color-bg)` (#1A1614 charcoal)
- **Dark sections (footer, gallery, beer):** Use `var(--color-surface)` for bg and `var(--color-text)` for text

This inversion was intentional to minimize component refactoring while flipping the visual theme. Future refactors should consider renaming tokens to semantic names (e.g., `--color-primary`, `--color-on-primary`).

### Color Usage by Context

| Context | Background | Text | Accents |
|---------|-----------|------|---------|
| Body default | `--color-text` (cream) | `--color-bg` (charcoal) | `--color-accent` (ember) |
| Light sections (story, menu, contact, map) | `--color-text` (cream) | `--color-bg` / `#5A5046` | `--color-craft` (green badges) |
| Dark bands (footer, gallery, beer strip) | `--color-surface` (charcoal) | `--color-text` (cream) | `--color-accent` |
| Header (sticky) | `--color-text` (cream) | `--color-bg` (charcoal) | Logo inverted to black |
| Hero (photo overlay) | Full-bleed image | `--color-text` (cream) | `brightness(0.65)` overlay |
| Primary CTAs | `--color-accent` (ember) | `--color-text` (cream) | — |
| Craft badges/chips | `--color-craft` (green) | `#FFFFFF` | — |

---

## Architecture

### Component Structure

```
src/
├── components/
│   ├── Header.astro          # Sticky header + mobile menu drawer (cream)
│   ├── Hero.astro            # Full-bleed photo + "Ver menú" CTA
│   ├── StorySection.astro    # Historia + story chips (craft badges)
│   ├── BeerStrip.astro       # Horizontal scrollable beer cards
│   ├── MenuSection.astro     # Flexible PNG/digital/both modes
│   ├── GallerySection.astro  # CSS grid gallery
│   ├── ReviewsSection.astro  # Rating + static quote cards
│   ├── ContactSection.astro  # WhatsApp + address + hours cards
│   ├── MapSection.astro      # Google Maps embed
│   ├── Footer.astro          # Dark footer (surface charcoal)
│   ├── StickyCtaBar.astro    # Mobile-only bottom CTA bar
│   └── WhatsAppFloat.astro   # Fixed bottom-right WhatsApp bubble (all breakpoints)
├── content/
│   ├── site.json             # Central content config
│   ├── menu-pages.json       # PNG menu page Drive IDs
│   └── menu-digital.json     # Structured menu items (seed data)
├── layouts/
│   └── BaseLayout.astro      # HTML wrapper + JSON-LD
├── lib/
│   ├── drive.ts              # Google Drive API helpers
│   └── places.ts             # Google Places API
├── pages/
│   └── index.astro           # Main page composition
└── styles/
    ├── tokens.css            # Design tokens
    └── global.css            # Reset + base styles + utilities
```

### Section Order (Final)

1. **Hero** — Full-bleed food photo + "Ver menú" CTA (no WhatsApp button)
2. **Story** — Historia + craft chips (2018/2020/Salto del Guairá)
3. **BeerStrip** — Horizontal scrollable beer cards (comes BEFORE menu per Gabriel)
4. **MenuSection** — Flexible mode (PNG/digital/both)
5. **GallerySection** — Food/venue photos
6. **ReviewsSection** — Rating + 2 static quote cards
7. **ContactSection** — WhatsApp + address + hours (no phone card)
8. **MapSection** — Google Maps embed
9. **Footer** — Dark band with nav, social, legal

**Fixed UI:**
- Header (sticky top)
- WhatsAppFloat (bottom-right, all breakpoints, above sticky bar on mobile)
- StickyCtaBar (mobile-only, bottom, visible when scrolled past hero)

---

## Menu Architecture

### Flexible Modes (`site.json`)

```json
"menu": {
  "mode": "png",
  "modes": {
    "png": { "enabled": true, "source": "menu-pages.json" },
    "digital": { "enabled": false, "source": "menu-digital.json" }
  }
}
```

**Switching modes:** Change `menu.mode` in `src/content/site.json` to:
- `"png"` — Drive-based PNG menu pages (current)
- `"digital"` — Structured JSON menu (seed data in `menu-digital.json`)
- `"both"` — Tabs to toggle between PNG and digital

### Menu Component Logic (`MenuSection.astro`)

- **PNG mode:** Shows first menu page as preview + "Ver carta" button → opens fullscreen slideshow
- **Digital mode:** Shows "Destacados" spotlight (3 featured items) + structured categories
- **Both mode:** Tab UI to switch between PNG and digital views

**PNG Sources:** `menu-pages.json` contains Google Drive file IDs → converted via `getMenuPageImageUrl()` helper.

---

## Key Technical Decisions

### 1. Cream-First Theme Flip

**Decision:** Default page background is cream (#FAF3E8), not charcoal.

**Rationale:** Gabriel's direction to match US burger brand aesthetics (light, appetizing). Charcoal reserved for craft/night accent bands (footer, gallery, beer).

**Implementation Notes:**
- Token names (`--color-bg` / `--color-text`) are inverted from their literal meanings
- All light sections verify text contrast: charcoal text on cream backgrounds
- Dark bands (`.section-dark`) use `--color-surface` bg + `--color-text` text

### 2. WhatsApp Unified Messaging

**Decision:** All WhatsApp links use the same prefill message: **"Hola, me gustaría hacer un pedido"**

**Locations:**
- Header "Reservar" button (desktop)
- Sticky CTA bar "Reservar" (mobile)
- WhatsApp float (all breakpoints)
- Contact section "Escribinos" button
- Footer WhatsApp link

**Rationale:** Unified messaging for reservations + orders. No distinction between "reserva" and "pedido" — single friendly CTA.

### 3. Mobile-First + Overflow Hardening

**Problem:** Initial horizontal scroll on mobile (measured scrollWidth > viewport).

**Solution:**
- `overflow-x: clip` on `html` and `body`
- All containers: `max-width: 100%`
- Grid layouts: `minmax(min(100%, 280px), 1fr)` to prevent overflow
- Flex rows: `flex-wrap: wrap`, `min-width: 0` on children
- Mobile menu drawer: `transform: translateX(100%)` + `visibility: hidden` when closed (truly off-canvas)
- WhatsApp float: CSS-controlled visibility (no JS hide on mobile)
- Long text: `overflow-wrap: break-word` (not `anywhere` — causes mid-word truncation)

### 4. Scroll Padding for Fixed Elements

**Problem:** Sticky header and mobile CTA bar covered content on hash navigation and scroll.

**Solution:**
- `html { scroll-padding-top: 80px; scroll-padding-bottom: 88px; }`
- `.section { scroll-margin-top: 80px; }`
- Mobile `body { padding-bottom: calc(88px + env(safe-area-inset-bottom)); }`

**Result:** Hash links (#menu, #contacto) land below sticky header; footer content visible above sticky bar.

### 5. Logo Inversion for Contrast

**Asset:** `/public/logo.png` (white/light logo on transparent)

**Problem:** White logo invisible on cream header.

**Solution:** `filter: brightness(0) saturate(100%)` on header logo → inverts to black for contrast.

**Locations:**
- Header desktop logo
- Mobile menu drawer logo
- Footer logo (on dark surface, no filter)

### 6. Astro Scoped CSS Specificity

**Problem:** Global utility classes (`.desktop-only`, `.mobile-only`) lost to component-scoped styles.

**Solution:** Explicit visibility control in component `<style>` blocks with `!important` where necessary.

**Example (Header.astro):**
```css
.nav.desktop-only { display: none; }
@media (min-width: 768px) { .nav.desktop-only { display: flex; } }
```

**Gotcha:** Astro generates scoped selectors like `.nav[data-astro-cid-xxx]` → higher specificity than global classes.

---

## Component Details

### Header (`Header.astro`)

- **Sticky:** `position: sticky; top: 0; z-index: var(--z-sticky);`
- **Desktop:** Logo (black filter) + nav links + "Reservar" button
- **Mobile:** Logo + hamburger button → opens cream-first drawer
- **Mobile menu drawer:**
  - Background: `var(--color-text)` (cream)
  - Text: `var(--color-bg)` (charcoal)
  - Logo: black filter
  - Close button: charcoal with ember hover
  - Off-canvas: `transform: translateX(100%)` when closed

### Hero (`Hero.astro`)

- **Height:** `min-height: calc(100dvh - 64px)` — fills viewport below header (not full 100vh that extends under header)
- **Background:** First `hero.backgroundImages` Drive link → converted to direct image URL
- **Overlay:** `filter: brightness(0.65)` on image + gradient overlay (ember → charcoal)
- **CTAs:** Single "Ver menú" primary button (removed "Reservar WhatsApp" per Gabriel)

### BeerStrip (`BeerStrip.astro`)

- **Layout:** Horizontal scrollable row (`.beer-scroll-container`)
- **Cards:** Photo/placeholder + name + style + notes (no prices)
- **Padding:** Generous vertical padding: `var(--space-16)` mobile, `var(--space-24)` desktop
- **Content:** `site.json` → `beers.items[]` (name, style, notes, image)
- **Images:** Use existing Drive/fallback or charcoal placeholder (no random stock URLs)

### MenuSection (`MenuSection.astro`)

- **Mode switching:** Reads `site.json` → `menu.mode`
- **PNG preview:** First menu page + "Ver carta" overlay button
- **Digital spotlight:** "Destacados" title + 3 featured items (name + price)
- **Fullscreen slideshow:** PNG pages with prev/next navigation (JavaScript)
- **Menu overlay buttons:** Text `#FFFFFF` on ember/craft backgrounds

### ReviewsSection (`ReviewsSection.astro`)

- **Title:** "Lo que dicen" (softened from "LO QUE DICEN NUESTROS CLIENTES")
- **Rating card:** 4.8 + ~120 reseñas + Google Maps link
- **Quote cards:** 2 static testimonials from `site.json` → `reviews.quotes[]`
- **Layout:** Dark band (`.section-dark`) with cream text

### ContactSection (`ContactSection.astro`)

- **Cards:** WhatsApp + Address + Hours (phone card removed per Gabriel)
- **WhatsApp label:** Neutral "WhatsApp" (not "Reservas") — CTA "Escribinos"
- **Address:** Full address with city/country: "Av. Paraguay c/ 30 de julio, Salto del Guairá, Paraguay"
- **Layout:** CSS Grid, responsive 1-2 columns

### WhatsAppFloat (`WhatsAppFloat.astro`)

- **Visibility:** `display: flex !important` on all breakpoints (no JS hide)
- **Position:**
  - Mobile: `bottom: calc(88px + env(safe-area-inset-bottom) + 12px)` (above sticky bar)
  - Desktop: `bottom: var(--space-8)` (standard bottom-right)
- **z-index:** `9999` (always on top)
- **Animation:** `pulse` keyframe (box-shadow only, no layout shift)

### StickyCtaBar (`StickyCtaBar.astro`)

- **Visibility:** Mobile-only (`<768px`), hidden by default, appears when scrolled past hero
- **Layout:** 2-column grid: "Reservar" (ember) + "Ver Menú" (charcoal surface)
- **JavaScript:** Shows/hides based on scroll position (hero 80% threshold)
- **Safe area:** `padding-bottom: env(safe-area-inset-bottom)`

### Footer (`Footer.astro`)

- **Background:** `var(--color-surface)` (dark charcoal)
- **Logo:** 72px height, white/light (no filter on dark bg)
- **Sections:** Brand + Visitanos (address/hours/WhatsApp) + Navigation + Social links
- **Social links:** Visible text on desktop, icons-only on mobile, with aria-labels
- **Legal text:** `opacity: 0.9` for better contrast

---

## Known Gaps & Limitations

### API Keys

- **Google Drive API:** `GOOGLE_DRIVE_API_KEY` required for dynamic gallery images. Fallback uses static `gallery.fallbackImages` from `site.json`.
- **Google Places API:** `GOOGLE_PLACES_API_KEY` required for live rating/review count. Fallback uses static `reviews.rating` / `reviews.count`.

### Content Completeness

- **Gallery:** Currently shows 2 fallback images (hero backgrounds). Expand when more food/venue photos are available.
- **Beer images:** Placeholder charcoal backgrounds with icon. Replace with actual beer photos when available.
- **Menu digital:** Seed data only (3 burgers). Requires full structured menu for production digital mode.

### Future Enhancements

- **Menu mode both:** Implement tab UI (currently prepared but not fully tested)
- **Gallery lightbox:** Consider adding click-to-expand functionality
- **Reviews:** Integrate live Google reviews feed (currently static quotes)
- **Performance:** Optimize Drive image loading (consider CDN/caching)

---

## Deployment

### Current State

- **Branch:** `cursor/feat-v2-greenfield-8e75` (pushed to remote)
- **PR:** [#1 (Draft)](https://github.com/GabFrank/don-franco-website/pull/1)
- **Cloudflare Pages preview:** Separate deployment (not part of this codebase)
- **Production:** **NOT deployed** — manual cutover decision pending

### Deployment Workflow (when approved)

1. **Pre-deploy checks:**
   - `npm run build` passes
   - Visual QA on preview URL
   - Mobile device testing (horizontal scroll, sticky elements, WhatsApp float)
   
2. **Merge to main:**
   ```bash
   git checkout main
   git merge cursor/feat-v2-greenfield-8e75
   git push origin main
   ```

3. **GitHub Action:** `.github/workflows/deploy.yml` triggers → rsync to Digital Ocean
   - **Note:** Verify Astro 7 build command in workflow (currently `npm run build`)
   - **Note:** Ensure Node ≥22 in CI environment

4. **Post-deploy verification:**
   - Verify live site on production domain
   - Test WhatsApp links on mobile
   - Check Google Maps embed
   - Verify API keys if using dynamic Drive/Places features

### Rollback Plan

If production issues arise:

1. **Revert merge commit:**
   ```bash
   git revert -m 1 <merge-commit-sha>
   git push origin main
   ```

2. **Emergency hotfix:** Patch directly on main branch, cherry-pick to `cursor/feat-v2-greenfield-8e75` later.

---

## Development Commands

```bash
# Install dependencies
npm install

# Local dev server
npm run dev

# Production build
npm run build

# Preview build
npm run preview

# Type check
npm run astro check
```

---

## Testing Checklist

### Mobile (<768px)

- [ ] No horizontal scroll (document scrollWidth === viewport width)
- [ ] Header: only logo + hamburger visible (no desktop nav)
- [ ] Mobile menu drawer: cream bg, charcoal text, black logo, closes properly
- [ ] Hero: fits `100dvh - header` (no content under header on load)
- [ ] Sticky CTA bar: appears when scrolled past hero, doesn't cover footer
- [ ] WhatsApp float: visible bottom-right, above sticky bar (z-index correct)
- [ ] Section titles: no mid-word truncation, wrap at word boundaries
- [ ] Contact cards: readable charcoal text on cream backgrounds
- [ ] Footer: legal text visible above sticky bar

### Desktop (≥768px)

- [ ] Header: logo + nav links + "Reservar" button visible
- [ ] Hero: full-bleed photo, "Ver menú" CTA centered
- [ ] Beer cards: horizontal scroll smooth
- [ ] Gallery: 2-3 column grid (not 1-column mobile grid)
- [ ] WhatsApp float: visible bottom-right (standard position, not above sticky)
- [ ] Sticky CTA bar: hidden on desktop
- [ ] Footer: 4-column grid layout

### Cross-Browser

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (iOS + macOS)

### Accessibility

- [ ] All interactive elements have ≥44px touch targets
- [ ] WhatsApp float / buttons have aria-labels
- [ ] Header mobile menu has aria-label on open/close buttons
- [ ] Sufficient color contrast (charcoal on cream, cream on charcoal)

---

## File Change Summary

### Created/Modified Files

**Created:**
- `src/content/menu-digital.json` — Seed data for digital menu mode
- `docs/V2-IMPLEMENTATION-REVIEW.md` — This document

**Major rewrites:**
- `src/components/Header.astro` — Cream-first mobile drawer, logo inversion
- `src/components/Hero.astro` — Single CTA, hero height fix
- `src/components/BeerStrip.astro` — Horizontal scrollable cards
- `src/components/MenuSection.astro` — Flexible mode switching
- `src/components/ContactSection.astro` — WhatsApp-only cards
- `src/components/WhatsAppFloat.astro` — All-breakpoint visibility
- `src/components/StickyCtaBar.astro` — Mobile-only logic
- `src/styles/global.css` — Overflow hardening, scroll padding
- `src/styles/tokens.css` — Brewery Ember palette (final hex values)

**Updated:**
- `package.json` — Astro 4 → 7
- `tsconfig.json` — Added `resolveJsonModule`
- `src/content/site.json` — Menu modes, beers, copy fixes, address completeness
- `src/pages/index.astro` — Section reordering (BeerStrip before MenuSection)

**Deleted:**
- `TrustStrip.astro` — Redundant with unified ReviewsSection
- Destacados row in MenuSection — Removed duplicate

---

## Contact & Maintenance

**Developer:** Cursor Cloud Agent (Gabriel's direction)  
**Branch owner:** Gabriel Frank  
**Repository:** [GabFrank/don-franco-website](https://github.com/GabFrank/don-franco-website)

**For questions or issues:**
- Check this review doc for technical decisions
- Refer to `docs/BRIEF-V2.md` for original brief
- Review PR #1 comments for QA history

---

**Last updated:** 2026-09-10  
**Document version:** 1.0
