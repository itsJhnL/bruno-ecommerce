# Design.md — BRUNO Liquid Glass Design System

> The brief: *elegant luxury, liquid glass, high-end product showcase, storytelling,
> premium brand values, exclusive membership.* Sophistication and exclusivity.

---

## 1. Design thesis

Luxury online is communicated by **restraint, space, and light** — not by ornament.
Three decisions carry the whole system:

1. **Darkness as the ground.** A near-black obsidian field makes light expensive. Glass
   only reads as glass when there is something dark behind it — which is why dark is the
   default and light is a deliberate second treatment rather than an inversion.
2. **Light as the material.** Surfaces are not coloured — they are *lit*. Every panel is
   a translucent pane catching a specular edge, a refracted gradient, a soft bloom.
3. **Air as the luxury signal.** Section padding is roughly double what a mass-market
   store uses. Empty space is the most expensive thing on the page.

**Anti-patterns, explicitly banned:** AI purple/pink gradients; neon cyberpunk glow;
drop shadows imitating Material elevation; more than one accent hue; bouncy spring
easing; carousels that auto-advance; stock-photo smiling models; emoji in UI chrome.

---

## 2. Colour

Two themes. **Dark is the ground** — a first-time visitor always sees it. Light is
offered, and remembered, but it is not an inversion: it is *frosted porcelain over warm
bone*, where a cast shadow does the work the specular edge does in dark.

### The semantic layer

Components never reference a raw ramp. Everything resolves to one of these, which is
what makes a theme a token swap rather than a rewrite.

| Token | Dark | Light | Use |
|---|---|---|---|
| `canvas` | `#08070A` | `#F4F1EA` | Page ground |
| `canvas-raised` | `#131218` | `#FBF9F5` | Selects, raised blocks |
| `canvas-overlay` | `#1B1922` | `#FFFFFF` | Sheets, tooltips, menus — opaque |
| `scrim` | `#08070A` | *unchanged* | Over imagery. **Never flips.** |
| `ink-primary` | `#F4F2EE` 17.9:1 | `#14120E` 16.6:1 | Body and headings |
| `ink-secondary` | `#B6B2AB` 9.5:1 | `#4A463E` 8.3:1 | Supporting copy |
| `ink-tertiary` | `#7E7A74` 4.7:1 | `#6E6960` 4.8:1 | The floor for readable text |
| `ink-muted` | `#5A5751` | `#928C82` | Decorative only |
| `ink-inverse` | `#14100A` | *unchanged* | On `accent-solid` — 8.3:1 |
| `ink-on-scrim` | `#F4F2EE` | *unchanged* | Captions over imagery |
| `accent` | `#E3CBA0` 12.7:1 | `#7C5F2A` 5.3:1 | Default accent text |
| `accent-strong` | `#F6EBD8` 17.0:1 | `#5A4318` 8.3:1 | Hover, emphasis |
| `accent-quiet` | `#9A7C42` 5.1:1 | `#856527` 4.8:1 | Eyebrows, small labels |
| `accent-line` | `#C9A96A` 9.0:1 | `#9C7A34` 3.6:1 | Borders, rings, icon strokes |
| `accent-solid` | `#C9A96A` | *unchanged* | Filled buttons |
| `accent-wash` | `#4A3A1E` | `#EFE4CD` | Tinted backgrounds |
| `accent-on-scrim` | `#E3CBA0` | *unchanged* | Accent over imagery |

Every ratio above is measured against that theme's `canvas`. The floor is 4.5:1 for
anything a customer must read, and 3:1 for a border or icon that carries meaning.

### Hairlines and tints

Twenty-four hardcoded `white/NN` values were the single biggest obstacle to a light
theme: white at 12% is a hairline on obsidian and invisible on bone. They collapse to
five tokens — and note that the two families behave **differently** between themes:

| Token | Dark | Light |
|---|---|---|
| `hairline-faint` | white 7% | ink 9% |
| `hairline` | white 13% | ink 16% |
| `hairline-strong` | white 24% | ink 30% |
| `tint` | white 4.5% | **white 72%** |
| `tint-strong` | white 8.5% | **white 95%** |

On dark, fills and borders both lighten. On light they diverge: **fills lighten toward
porcelain, borders darken toward ink**. Treating a light theme as "the same tokens with
less alpha" is exactly what makes most light modes look washed out.

### What must never flip

Product imagery is dark in **both** themes — a dark plate on a light page reads as
photography, which is correct. So anything sitting on top of imagery uses a fixed
token: `scrim`, `ink-on-scrim`, `accent-on-scrim`, and the `onScrim` / `accentOnScrim`
badge tones. A theme-following badge over a dark plate disappears in light mode; this
was found by looking, not by reasoning.

### Anti-patterns, explicitly banned

AI purple/pink gradients; neon glow; Material-style elevation shadows; more than one
accent hue; bouncy spring easing; auto-advancing carousels; stock-photo smiling models;
emoji in UI chrome.

---

## 3. Typography

Two families, both sans. Luxury online has moved away from heritage serifs toward
restraint — the Celine / Jil Sander / The Row register — and the type reflects that.

| Role | Family | Notes |
|---|---|---|
| Display | **Jost** (200/300/400/500) | A geometric sans in the Futura lineage: single-storey `a`, circular bowls, near-uniform stroke. Headlines, wordmark, prices. |
| Body / UI | **Inter Tight** (400/500/600) | Neutral, tight, excellent at small sizes. Tabular numerals for money and quantities. |

Both are self-hosted at build time via `next/font` — no render-blocking request to
Google, no FOUT, no third-party connection on first paint.

### Geometric sans behaves the opposite way to a serif

This is the thing to understand before changing any size below. A serif gains presence
as it grows and needs *more* tracking when small. A geometric sans does the reverse: the
circular bowls open up at display sizes and need **negative tracking**, and the uniform
stroke turns to mush when small so it needs **generous positive tracking**. Weight comes
*down* as size goes up.

| Step | Size | Weight | Line height | Tracking |
|---|---|---|---|---|
| Display XL | `clamp(2.75rem, 6.6vw, 5.75rem)` | 300 | 0.98 | `-0.035em` |
| Display L | `clamp(2rem, 4.4vw, 3.5rem)` | 300 | 1.04 | `-0.03em` |
| Display M | `clamp(1.625rem, 3vw, 2.5rem)` | 300 | 1.1 | `-0.025em` |
| Display S | `clamp(1.125rem, 1.7vw, 1.375rem)` | 400 | 1.25 | `-0.01em` |
| Body L | `1.0625rem` | 400 | 1.7 | `0` |
| Body | `0.9375rem` | 400 | 1.65 | `0` |
| Caption | `0.8125rem` | 400 | 1.5 | `0.01em` |
| Eyebrow | `0.6875rem` | 500 | 1 | `0.24em` |

**Two dedicated classes.** `.wordmark` tracks the BRUNO caps out to `0.36em` with a
matching `text-indent` — tracking adds space *after* the final letter, so without the
indent the mark sits visibly off-centre. `.figure` sets prices in the display face at
weight 300 with tabular numerals, so columns of money align.

**Rules.** Display face never below 18px. Measure capped at 68ch for body, 22ch for
display. Headings use `text-wrap: balance`, paragraphs `text-wrap: pretty`.

---

## 4. The glass system

Four pane grades. Everything on the site is one of these.

| Grade | Blur | Fill | Border | Use |
|---|---|---|---|---|
| **Veil** | 8px | 3% white | 8% white | Nav bar, sticky chrome |
| **Pane** | 16px | 4.5% white | 12% white | Cards, panels, form fields |
| **Vitrine** | 28px | 7% white | 18% white | Product showcase, modals, membership block |
| **Monolith** | 40px + saturate(1.4) | 9% white | 24% white | Hero foreground, single hero moment per page |

### The anatomy of one pane

```
1. backdrop-filter: blur(N) saturate(1.3)   — the refraction
2. background: linear-gradient(160deg, rgba(255,255,255,.07), rgba(255,255,255,.02))
                                            — the body, lit from upper-left
3. border: 1px solid var(--glass-edge)      — the cut edge
4. ::before  inset top hairline, --glass-edge-lit, fading to transparent by 40%
                                            — the specular highlight
5. ::after   a large soft radial bloom, champagne at 6%, offset outside the pane
                                            — light bleeding through the glass
6. box-shadow: 0 24px 80px -20px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.08)
                                            — depth and inner lip
```

### Non-negotiables

- **Never stack more than two blurred layers.** Blur is composited per layer; three deep
  and mobile Safari drops frames.
- **Never blur a surface that moves on scroll.** Blur + transform = repaint storms.
- **Always provide a solid fallback.** `@supports not (backdrop-filter: blur(1px))`
  swaps to an opaque `--obsidian-800` fill. The page must be beautiful without glass.
- **Blur is capped at 40px.** Beyond that it reads as fog, not glass.
- **Text never sits directly on a blur boundary.** It sits inside a pane, at least 24px
  from the edge, over a region where the composited contrast has been measured.

### Refraction accents

- **Caustics:** a single fixed, `pointer-events: none` SVG turbulence layer at 3%
  opacity over the page ground — the shimmer of light through water.
- **Grain:** an inline SVG `feTurbulence` noise at 3.5% opacity, `mix-blend-mode:
  overlay`, over every large gradient. Kills banding, adds film texture.
- **Chromatic edge:** on the Monolith grade only, a 1px inset ring that shifts from
  `rgba(201,169,106,.3)` to `rgba(126,150,184,.2)` — the prism edge of thick glass.

---

## 5. Layout

- **Grid:** 12 columns, 24px gutter, max content width 1280px, wide bleed 1536px.
- **Spacing scale:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 192px.
- **Section rhythm:** 128px vertical padding desktop, 80px tablet, 56px mobile.
- **Radius:** 4 (chips) · 12 (fields, buttons) · 20 (cards) · 32 (vitrines) · 999 (pills).
- **Asymmetry:** hero and story sections use a 7/5 split, not 6/6. Symmetry reads
  corporate; a deliberate imbalance reads editorial.

---

## 6. Product showcase

The product is the only thing allowed to be loud.

- Product media sits in a **Vitrine** pane on a plinth: a soft elliptical champagne
  bloom beneath the object, plus a 40%-opacity mirrored reflection fading over 25% of
  its height.
- Gallery: one large frame, a vertical thumbnail rail on desktop, swipe on mobile.
  Hover reveals a 1.6× zoom lens, disabled on touch and under reduced motion.
- Aspect ratio locked to 4:5 for every product image. No exceptions, no CLS.
- Badges (Limited / New / Atelier) are Veil-grade pills in the top-left, with an icon
  *and* a word.
- Price: `.figure` — display face, weight 300, tabular — in `--color-accent`. A sale strikes the original in
  `--color-ink-muted` at 0.85× and adds a text label, never colour alone.

---

## 7. Motion

Motion is slow, weighted, and mostly about light.

| Interaction | Spec |
|---|---|
| Section reveal | opacity 0→1, `translateY(16px)→0`, 700ms, `cubic-bezier(.16,1,.3,1)`, once, staggered 60ms |
| Pane hover | border and fill lighten one grade, 240ms ease-out. **No lift, no scale.** |
| Button press | `scale(.985)`, 90ms |
| Image reveal | blur(12px)→0 + scale(1.04)→1, 900ms |
| Hero light drift | a 24s infinite background-position drift on the bloom layer only |
| Page transition | 180ms cross-fade |

**Under `prefers-reduced-motion: reduce`:** all reveals become immediate, the light
drift stops, the zoom lens is disabled, transitions collapse to 0ms. The page loses
nothing but movement.

---

## 8. Imagery

Photography is not available, so imagery is **generated as art direction, not as fake
photography**. Every asset is procedurally composed SVG/PNG, and every one of them:

- lives in a 4:5 or 16:9 frame with a fixed aspect ratio
- uses only the obsidian + champagne palette, so the page reads as one object
- carries the same grain and gradient-mesh treatment
- is deliberately abstract — a suggestion of material, drape, and light, in the manner
  of a luxury house's texture plates — rather than a poor imitation of a photograph

Asset families: **Editorial** (large gradient-mesh compositions for hero and story),
**Plate** (4:5 product textures — weave, twill, fleece, canvas, leather, metal),
**Monogram** (the B mark, wordmark, seal), **Texture** (grain, caustics, paper).

An `scripts/generate-images.ts` pipeline and a `product_images` table mean swapping in
real photography later is a data change, not a code change.

---

## 9. Components

Built on Radix primitives in shadcn style, restyled to the glass grades.

Button (Primary champagne-fill · Ghost pane · Link underline-on-hover) · Input ·
Select · Checkbox · Radio · Slider (price range) · Badge · Card · Dialog · Sheet
(cart drawer, mobile filters) · Tabs · Accordion (FAQ) · Tooltip · Toast · Skeleton ·
Breadcrumb · Pagination · Avatar · Table (admin) · DropdownMenu · Separator.

Every component ships **five states**: default, hover, focus-visible, disabled,
loading — plus empty and error states for anything that fetches.

---

## 10. Theming

Three states: **Light**, **Dark**, **System**. Dark is what a first-time visitor sees;
the choice is stored in `localStorage` under `bruno-theme` and survives navigation.

- `data-theme="light" | "dark"` on `<html>` drives everything. There is no `.dark` class
  and no reliance on `prefers-color-scheme` in component CSS.
- An **inline script in `<head>`** stamps the attribute before first paint. It has to be
  synchronous and inline; a React effect runs too late and a light-mode visitor sees a
  black flash on every navigation.
- **System follows the OS live.** A `matchMedia` listener stays attached while — and only
  while — the choice is `system`, so changing your OS appearance updates the open tab.
- The control is a **menu, not a switch.** A two-state toggle cannot express "follow my
  device". The trigger icon shows what is *currently rendered*; the menu shows what is
  *chosen*. Conflating those two is why most theme toggles feel wrong on a system-set
  machine.
- `themeColor` is declared per scheme so mobile browser chrome matches the page.
- Only the active theme's editorial backdrop is downloaded — they are CSS background
  images swapped by a custom property, not two `<img>` tags with one hidden.

---

## 11. Accessibility contract

- 4.5:1 minimum for all body text, measured over the composited glass.
- `:focus-visible` is a 2px `--champagne-300` ring with a 2px offset, on everything.
- Every interactive element gets `cursor: pointer` and a ≥44×44px hit area.
- Filter chips wrap; they never truncate into an inaccessible overflow.
- Skip-to-content link, landmark regions, one `h1` per page, ordered headings.
- Full keyboard operation of gallery, filters, cart drawer and dialogs.
- Reduced motion and forced-colors modes both tested.
- Responsive validated at 375 / 768 / 1024 / 1440px, and at 200% browser zoom.
