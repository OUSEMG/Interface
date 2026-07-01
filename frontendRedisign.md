# Frontend Redesign Spec
**OUSEMG Platform · Design System + Landing Page · v1.0**

---

## The Problem

The frontend feels like it was built by different people at different times — because it was. Components don't share a visual language. Cards look different across pages. Headings vary in size and weight without clear hierarchy. Navigation feels tacked on. The fix isn't rewriting everything; it's establishing a shared design system and applying it consistently, starting with the landing page.

---

## Design Direction

**Polished and welcoming.** This is not a gritty terminal tool. It's the first thing a new member sees, and it should feel like a product a professional organization is proud of — not intimidating, not over-engineered. Think: a well-designed fintech onboarding experience, not Bloomberg.

**Hybrid light/dark.** The shell (nav, hero, section backgrounds) is light. Data-heavy components (cards in Atlas, tables, metrics panels) stay dark. The contrast between environments is intentional — it signals "you've entered a data tool" when you go into Atlas, and "you're in the main platform" when you're on the landing or professional dev pages.

---

## Design System Tokens

These are the source of truth. Every component pulls from here — no one-off hex values anywhere in the codebase.

### Color

```css
/* Light shell */
--color-bg:            #F7F8F6;   /* off-white with a faint green tint — not pure white */
--color-surface:       #FFFFFF;   /* cards, panels on light pages */
--color-border:        #E4E7E2;   /* subtle border on light backgrounds */
--color-text-primary:  #111411;   /* near-black, slightly warm */
--color-text-muted:    #6B7468;   /* secondary text, labels */

/* Dark data panels (Atlas, data cards) */
--color-dark-bg:       #0d0d0d;
--color-dark-surface:  #141414;
--color-dark-border:   #1f1f1f;
--color-dark-text:     #F0F0F0;
--color-dark-muted:    #6b6b6b;

/* Accent */
--color-accent:        #1d6b35;   /* OUSEMG green — unchanged */
--color-accent-hover:  #22823f;
--color-accent-light:  #E8F2EC;   /* light green tint for badges, hover states on light bg */
--color-accent-text:   #FFFFFF;   /* text on green buttons */
```

### Typography

Two fonts. No more, no less.

```css
/* Display — used for hero headline, section titles, page headers */
--font-display: 'Outfit', sans-serif;

/* Body + UI — used for everything else */
--font-body: 'Inter', sans-serif;

/* Mono — data, tags, status badges, code */
--font-mono: 'JetBrains Mono', monospace;
```

**Type scale:**

| Role | Font | Size | Weight |
|---|---|---|---|
| Hero headline | Outfit | 48px | 700 |
| Page title | Outfit | 32px | 600 |
| Section heading | Outfit | 22px | 600 |
| Card title | Inter | 16px | 600 |
| Body | Inter | 15px | 400 |
| Label / caption | Inter | 13px | 500 |
| Badge / tag | JetBrains Mono | 11px | 500 |

### Spacing

Use an 8px base grid. Padding, margins, and gaps should always be multiples of 8.

```
4px   — tight internal spacing (icon + label gap)
8px   — small padding, compact elements
16px  — standard padding, card inner padding
24px  — section internal spacing
32px  — between major components
48px  — between sections
64px  — hero vertical padding
```

### Border Radius

```css
--radius-sm:   6px;   /* badges, tags, small inputs */
--radius-md:   10px;  /* cards, panels, buttons */
--radius-lg:   16px;  /* modal, drawer, hero card */
```

### Shadows (light mode only)

```css
--shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
--shadow-hover: 0 4px 16px rgba(0,0,0,0.10);
--shadow-nav: 0 1px 0px #E4E7E2;  /* hairline under nav, not a drop shadow */
```

---

## Navigation

**Top nav bar. Always visible. Fixed to top.**

```
┌────────────────────────────────────────────────────────────────┐
│  OUSEMG          Home   Atlas   Pro Dev   Portfolio      [→]  │
└────────────────────────────────────────────────────────────────┘
```

- Background: `#FFFFFF` with `--shadow-nav` (hairline bottom border, not a floating shadow)
- Logo/wordmark: "OUSEMG" in Outfit 600, `--color-text-primary`
- Nav links: Inter 14px, 500 weight, `--color-text-muted` default, `--color-text-primary` on hover, `--color-accent` on active
- Active link gets a 2px bottom border in `--color-accent`, not a background highlight
- Right side: a login button placeholder — outline style, `--color-accent` border and text, `--radius-md`
- Height: 56px
- Max content width: 1200px, centered

**No sidebar.** The sidebar added complexity without adding clarity. Top nav is sufficient for the number of sections this platform has.

---

## Landing Page

### Hero Section

Full-width, light background (`--color-bg`). Vertically centered content. Not a full-screen hero — height should be around 320px, enough to breathe but not wasteful.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   Ohio University Student Equity                             │
│   Management Group                          [Explore →]      │
│                                                              │
│   Managing a real portfolio. Building real skills.           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- Headline: Outfit 700, 48px, `--color-text-primary`
- Subheadline: Inter 400, 18px, `--color-text-muted`
- CTA button: filled, `--color-accent` background, white text, `--radius-md`, 44px tall
- Left-aligned content, not centered — centered heroes are overused and feel generic
- A thin green left-border rule (3px, `--color-accent`) next to the headline is the **signature element** — it anchors the brand color without overdoing it and gives the hero a quiet editorial quality

### Section Cards

Below the hero, a row of 3 cards — one per major section. These are the primary navigation affordance on the landing page.

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│              │  │              │  │              │
│   Atlas     │  │  Pro Dev     │  │  Portfolio   │
│              │  │              │  │              │
│  Quant tools │  │  Recruiting  │  │  Holdings &  │
│  & research  │  │  & alumni    │  │  performance │
│              │  │              │  │              │
│  [Open →]    │  │  [Open →]    │  │  [Open →]    │
└──────────────┘  └──────────────┘  └──────────────┘
```

- Background: `--color-surface` (`#FFFFFF`)
- Border: 1px `--color-border`
- Shadow: `--shadow-card`
- Hover: shadow elevates to `--shadow-hover`, card lifts 2px (CSS `transform: translateY(-2px)`)
- Card title: Outfit 600, 20px
- Description: Inter 400, 14px, `--color-text-muted`
- Link: Inter 500, 14px, `--color-accent`, arrow icon, no underline
- Border radius: `--radius-lg`
- Equal height, equal width (CSS grid, 3 columns, 1fr each)
- A small icon or emoji-free glyph in the top-left of each card in `--color-accent-light` background

### Below the Cards (optional v1 addition)

A single slim banner row in `--color-accent-light` showing 3 quick stats about the club:

```
  $X managed   ·   N members   ·   Est. 20XX
```

Inter 500, 14px, `--color-accent`. This grounds the platform in something real without being boastful. If the numbers aren't ready to be real yet, skip this row entirely — don't fake it.

---

## Shared Component Specs

These apply across all pages, not just the landing.

### Cards (Light mode)

```css
background:    var(--color-surface);
border:        1px solid var(--color-border);
border-radius: var(--radius-md);
padding:       24px;
box-shadow:    var(--shadow-card);
```

### Cards (Dark mode — Atlas, data panels)

```css
background:    var(--color-dark-surface);
border:        1px solid var(--color-dark-border);
border-radius: var(--radius-md);
padding:       24px;
```

### Buttons

**Primary (filled):**
```css
background:    var(--color-accent);
color:         var(--color-accent-text);
border:        none;
border-radius: var(--radius-md);
padding:       10px 20px;
font:          Inter 500 14px;
```

**Secondary (outline):**
```css
background:    transparent;
color:         var(--color-accent);
border:        1.5px solid var(--color-accent);
border-radius: var(--radius-md);
padding:       10px 20px;
font:          Inter 500 14px;
```

**Ghost (text link style):**
```css
background:    transparent;
color:         var(--color-text-muted);
border:        none;
padding:       10px 12px;
font:          Inter 500 14px;
```

All buttons: `cursor: pointer`, hover transitions at `150ms ease`.

### Badges / Tags

```css
font:          JetBrains Mono 500 11px;
padding:       3px 8px;
border-radius: var(--radius-sm);
text-transform: uppercase;
letter-spacing: 0.04em;
```

Color variants: green (`--color-accent-light` bg, `--color-accent` text), gray (`#F0F0EE` bg, `--color-text-muted` text), amber, blue, red — define these once in a `badges.css` and import everywhere.

### Section Headings

Every page section that has a title uses this pattern:

```
SECTION LABEL          ← JetBrains Mono, 11px, uppercase, --color-accent, letter-spacing 0.08em
Section Title          ← Outfit 600, 22px, --color-text-primary
Optional subtitle      ← Inter 400, 14px, --color-text-muted
```

The eyebrow label in mono above the title is the consistent device across all pages. It makes every section feel like it belongs to the same system.

---

## File Structure

```
frontend/
  src/
    styles/
      tokens.css          ← all CSS variables, imported globally
      typography.css      ← font imports, base type styles
      components.css      ← shared component styles (cards, buttons, badges)
      nav.css             ← top nav styles
    components/
      Nav/
        TopNav.jsx
        TopNav.css
      UI/
        Card.jsx           ← wraps light/dark variants
        Button.jsx         ← primary / secondary / ghost
        Badge.jsx          ← all badge color variants
        SectionHeader.jsx  ← eyebrow + title + subtitle pattern
    pages/
      Landing/
        index.jsx
        Hero.jsx
        SectionCards.jsx
        StatsBanner.jsx
```

---

## Build Order

1. `tokens.css` — write every variable first, nothing else gets touched until this exists
2. `typography.css` — import Outfit, Inter, JetBrains Mono from Google Fonts; set base font on `body`
3. `TopNav.jsx` — single source of truth for navigation across all pages
4. `Button.jsx`, `Badge.jsx`, `Card.jsx`, `SectionHeader.jsx` — shared primitives
5. `Landing/Hero.jsx` — hero section
6. `Landing/SectionCards.jsx` — three section cards
7. Wire together in `Landing/index.jsx`
8. Go back to existing pages (Atlas, Pro Dev) and swap their one-off styles for the shared components

**Do not touch existing pages until steps 1–4 are done.** The tokens and shared components are the foundation. Building on top of the existing mess before the foundation exists will just create a new mess.

---

## What Not To Do

- No gradients on the hero. They look dated and AI-generated.
- No animation on page load. Subtle hover transitions only.
- No glassmorphism. It reads as 2021.
- No more than 2 font families in use at any one time on a single page.
- Never use a raw hex value in a component file — always use a CSS variable from `tokens.css`.