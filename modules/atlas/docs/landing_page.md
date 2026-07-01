# Atlas Landing Page — Agent Prompt

## Objective

Build the initial frontend landing page for **Atlas**, a proprietary quantitative research platform for a student equity management group. This is a React application using plain JavaScript (no TypeScript) and CSS. No frameworks beyond React. No component libraries.

---

## Design Language

High-tech, futuristic, data-dense. Think dark background, sharp grid lines, subtle animated elements, monospace or technical typography mixed with a strong display font.

| Token | Value |
|---|---|
| Primary accent | `#1d6b35` |
| Background | Deep navy / near-black |
| Feel | Bloomberg terminal density meets modern spatial UI |

No cheap gradients. No generic SaaS landing page aesthetics. This should feel earned and precise — internal tooling for a serious investment group, not a startup marketing page.

---

## Layout Requirements

The page is a **dashboard skeleton** with four clearly delineated sections:

### 1. Header / Nav
- Atlas wordmark on the left (**AT** in accent green)
- No login button, no nav links — header is wordmark only
- Clean, minimal, sticky

### 2. Hero
- Full-width banner
- **"OUSEMG / Research Platform"** label above the title
- Large display text: **"Atlas"** as the primary mark
- Short subline beneath it communicating "quantitative research infrastructure"
- A subtle **animated element** — grid lines, a ticker-style scrolling bar, or a pulsing data visualization placeholder
- Must feel alive, not static

### 3. Module Grid
Three clearly outlined panel sections below the hero. These are placeholders — not built yet. Each panel must include:
- A placeholder icon or visual indicator (CSS or inline SVG only — no images)
- A title
- A one-line description
- A **"Coming Soon"** or locked-state badge

Label them exactly as follows:

| Panel | Title | Description |
|---|---|---|
| 1 | **Quant Tooling** | Automated analysis, factor models, and pitch appendix generation. |
| 2 | **Portfolio Research** | Live portfolio analytics, attribution, and risk monitoring. |
| 3 | **Labs** | Experimental workspace for members to build and test quant models. |

Panels should look like **real interface panels waiting to be activated**, not marketing cards.

### 4. Footer
- OUSEMG organization name, one line
- Version / internal-use meta on the opposite side
- Minimal

---

## Technical Constraints

- React with plain JavaScript only — no TypeScript
- All styling in a single CSS file (`landing_page.css`)
- No external dependencies beyond React itself
- Responsive down to tablet width — this is a desktop tool, don't obsess over mobile
- **No images** — all visual elements must be CSS or inline SVG
- Fonts: load from Google Fonts
  - Monospace: `Space Mono`
  - Display: `Outfit`

---

## Deliverables

Deliver the complete file structure:

```
src/
  App.jsx
  index.jsx
  landing_page.jsx
  landing_page.css
index.html
vite.config.js
```

No boilerplate comments. Production-quality code only.
