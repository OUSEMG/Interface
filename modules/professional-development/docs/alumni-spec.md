# OUSEMG — Alumni Directory Agent Prompt

## Objective

Build the **Alumni Directory** page inside the Professional Development section of the OUSEMG Interface. The page loads alumni data from a converted JSON file (sourced from the Excel spreadsheet), and renders an interactive directory with search, filtering, and a full scrollable table. React with plain JavaScript. No TypeScript. No component libraries.

This page lives at `/professional-development/alumni` within the root Interface app at `Interface/frontend/`.

---

## Design Language

Inherit from the OUSEMG Interface / Atlas design system:

| Token | Value |
|---|---|
| Primary accent | `#1d6b35` |
| Background | Deep navy / near-black |
| Feel | Professional, clean, data-dense |
| Fonts | `Space Mono` (monospace) + `Outfit` (display) — load from Google Fonts |

Professional Development should feel slightly warmer than Atlas's terminal aesthetic — still dark and structured, but optimized for browsing people rather than charts.

---

## Data Source

**Excel file:** `data/OUSEMG Alumni List - 2.17.2026 (2).xlsx`

- **197 alumni records**
- Header row is on **row 3** — use `pandas.read_excel(path, header=2)`
- Drop rows where `Name` is null

### Column mapping

| Excel Column | JSON field | Notes |
|---|---|---|
| Name | `name` | Required |
| Grad Class | `gradClass` | Integer year, 24 classes (2002–2025) |
| Location | `location` | City, State string |
| Industry | `industry` | ~70 unique values |
| Firm | `firm` | |
| Title | `title` | |
| Email #1 | `emails[0]` | |
| Email #2 | `emails[1]` | Omit if empty |
| Email #3 | `emails[2]` | Omit if empty |
| LinkedIn | `linkedin` | Full URL; 6 records missing |

### JSON record shape

```json
{
  "id": 1,
  "name": "Sarah Luczak (Greenham)",
  "gradClass": 2002,
  "location": "Walled Lake, MI",
  "industry": "Nonprofit",
  "firm": "National Disability Institute",
  "title": "Payments Manager",
  "emails": ["sarahlluczak@gmail.com", "sluczak@ndi-inc.org"],
  "linkedin": null
}
```

---

## Data Pipeline

**Script:** `modules/professional-development/scripts/convert_alumni.py`

- Reads the xlsx from `data/OUSEMG Alumni List - 2.17.2026 (2).xlsx`
- Writes `frontend/src/data/alumni.json`
- Run manually when the spreadsheet is updated: `npm run data:alumni`
- Dependencies: `pandas`, `openpyxl` (see `modules/professional-development/scripts/requirements.txt`)

No backend API is required — the frontend imports the JSON directly.

---

## Page Structure

### 1. Filter Bar

Sticky bar at the top of the page.

| Control | Type | Behavior |
|---|---|---|
| Search | Text input | Instant filter across name, firm, title, location, industry |
| Grad Class | Dropdown | `All` + each unique grad class, sorted descending |
| Industry | Dropdown | `All` + each unique industry, sorted alphabetically |
| Location | Text input | Filter location substring |
| Clear Filters | Button | Resets all filters to default |

Show results count: `Showing 42 of 197 alumni`

### 2. Alumni Table

Full-width scrollable table listing **all filtered alumni**.

| Column | Notes |
|---|---|
| Name | Display font, prominent |
| Grad Class | Monospace |
| Location | |
| Industry | |
| Firm | |
| Title | |
| Contact | Email mailto links + LinkedIn external link |

- Sticky table header
- Subtle row dividers, no heavy borders
- Sort by name ascending (default)
- Empty state when no matches: `> no alumni match your filters`

### 3. Navigation

- Header wordmark links to `/professional-development`
- Back link: `← Professional Development` in header
- Interface home accessible via `/`

---

## Client-Side Filter Logic

```javascript
alumni
  → filter by gradClass (if not "All")
  → filter by industry (if not "All")
  → filter by location substring (case-insensitive)
  → filter by search query across all text fields
  → sort by name
```

All filtering in `useMemo` — no API calls.

---

## Router Context

The Alumni page is one route in the root Interface app:

```
/                                    → HomeLanding
/atlas                              → Atlas module grid
/professional-development            → ProfDev landing
/professional-development/alumni     → AlumniPage (this page)
```

---

## Technical Constraints

- React with plain JavaScript only — no TypeScript
- All styling in a single CSS file per page
- No external dependencies beyond React and react-router-dom
- Import alumni data from `frontend/src/data/alumni.json`
- Responsive down to tablet width

---

## Deliverables

```
frontend/src/
  data/alumni.json
  modules/professional-development/pages/
    AlumniPage.jsx
    AlumniPage.css
    ProfDevLanding.jsx
    ProfDevLanding.css
modules/professional-development/
  docs/alumni-spec.md
  scripts/convert_alumni.py
  scripts/requirements.txt
```

No boilerplate comments. Production-quality code only.
