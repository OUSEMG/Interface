# Atlas — Quant Tooling Page Agent Prompt

## Objective

Build the **Quant Tooling** page for Atlas. This is a tool browsing interface — a searchable grid of tool cards, styled consistently with the Atlas design language. React with plain JavaScript. No TypeScript. No component libraries.

---

## Design Language

Inherit directly from the Atlas landing page aesthetic:

| Token | Value |
|---|---|
| Primary accent | `#1d6b35` |
| Background | Deep navy / near-black |
| Feel | High-tech, data-dense, terminal-inspired |
| Fonts | `Space Mono` (monospace) + `Outfit` (display) — load from Google Fonts |

Cards should feel like interface panels, not marketing tiles. Think Bloomberg function menu meets a modern dark UI.

---

## Page Structure

### 1. Page Header
- Title: **"Quant Tooling"**
- Subtitle: A short descriptor, e.g. `"Select a tool to begin."`
- Monospace font for the subtitle. Display font for the title.
- Minimal. No hero animation needed on this page — save that for the landing page.

### 2. Search & Actions Bar

Below the page header, a toolbar row containing:

- **Search bar** — filters tool cards by title and description as the user types. Monospace input, dark panel background, green focus border.
- **Add button** — a `+` with a right arrow (`+ →`) inline SVG icon. Placeholder action for adding a new tool (`onClick` logs to console). Sits to the right of the search bar.

### 3. Tool Card Grid

The core of the page. A responsive grid of tool cards, filtered by the search bar.

**Grid behavior:**
- 3 cards per row maximum
- When more than 3 cards exist, they wrap to a new row beneath
- Cards are uniform in size — consistent height and width
- Even spacing between all cards in all directions

**Each card contains:**
- **Title** — name of the tool, display font, prominent
- **Description** — one to two sentences explaining what the tool does, monospace font, subdued color
- **Status badge** — a small tag indicating tool state. Use one of:
  - `LIVE` — green accent, tool is usable
  - `COMING SOON` — muted, tool is not yet built
- **Launch arrow** — a `+ →` icon in the card footer indicating the tool can be opened
- A subtle hover state — border highlight in `#1d6b35`, slight background lift. No dramatic animations.

**Card interaction:**
- Clicking a `LIVE` card navigates to that tool (placeholder route is fine — e.g. `onClick={() => console.log('navigate to tool')}`)
- Clicking a `COMING SOON` card does nothing, and the cursor should reflect that (`cursor: not-allowed`)
- Search filters cards in real time; show an empty state when no cards match

---

## Tool Cards

| Title | Description | Status |
|---|---|---|
| Monte Carlo Simulation | Runs terminal price distribution simulations with configurable paths and horizons. | `LIVE` |

Only Monte Carlo Simulation is populated for now. Additional tools will be added later via the add button.

---

## Technical Constraints

- React with plain JavaScript only — no TypeScript
- All styling in a single CSS file (`tooling_page.css`)
- No external dependencies beyond React itself
- No placeholder images — all visual elements must be CSS or inline SVG
- Responsive down to tablet width
- Grid must use CSS Grid, not Flexbox, for the card layout

---

## Deliverables

```
src/
  tooling_page.jsx
  tooling_page.css
```

No boilerplate comments. Production-quality code only.
