# OUSEMG Interface — Repository Layout

Internal portal organized as a **platform shell** + **domain modules**. One React app, module-owned backends and data pipelines, shared assets at the repo root.

See [README.md](README.md) for how to run the project.

---

## Current Tree

```
Interface/
├── README.md
├── rootTree.md                         # this file
├── package.json                        # root scripts (dev, build, data:alumni)
├── .gitignore
│
├── assets/                             # shared static files
│   └── ousemg-logo.jpg
│
├── data/                               # gitignored source inputs (xlsx, csv)
│   └── OUSEMG Alumni List - 2.17.2026 (2).xlsx
│
├── scripts/
│   ├── dev.ps1                         # start backend + frontend (Windows)
│   └── dev.sh                          # start backend + frontend (Unix)
│
├── frontend/                           # single React shell app
│   ├── package.json
│   ├── vite.config.js                  # @assets alias, /api → :8000
│   └── src/
│       ├── index.jsx
│       ├── app/                        # platform shell
│       │   ├── App.jsx                 # route table
│       │   ├── Layout.jsx
│       │   └── components/
│       │       └── NavBar/
│       │           ├── NavBar.jsx
│       │           └── NavBar.css
│       ├── pages/
│       │   └── HomeLanding/
│       │       ├── HomeLanding.jsx
│       │       └── HomeLanding.css
│       ├── modules/
│       │   ├── atlas/
│       │   │   ├── pages/
│       │   │   │   ├── LandingPage.jsx
│       │   │   │   ├── LandingPage.css
│       │   │   │   ├── PortfolioResearchPage.jsx
│       │   │   │   ├── PortfolioResearchPage.css
│       │   │   │   ├── ToolingPage.jsx
│       │   │   │   └── ToolingPage.css
│       │   │   ├── components/
│       │   │   │   ├── MonteCarloTool.jsx
│       │   │   │   └── MonteCarloTool.css
│       │   │   └── api/
│       │   │       └── portfolioResearch.js
│       │   └── professional-development/
│       │       └── pages/
│       │           ├── AlumniPage.jsx
│       │           ├── AlumniPage.css
│       │           ├── ProfDevLanding.jsx
│       │           └── ProfDevLanding.css
│       └── data/                       # generated/static JSON
│           └── alumni.json
│
└── modules/                            # domain-owned non-UI code + docs
    ├── atlas/
    │   ├── backend/                    # FastAPI
    │   │   ├── main.py
    │   │   ├── analytics.py
    │   │   ├── monte_carlo.py
    │   │   └── requirements.txt
    │   └── docs/                       # feature specs + agent prompts
    │       ├── README.md
    │       ├── landing_page.md
    │       ├── portfolio-research.md
    │       ├── quant_tooling.md
    │       └── monte_carlo_spec.md
    └── professional-development/
        ├── docs/
        │   └── alumni-spec.md
        └── scripts/
            ├── convert_alumni.py       # data/*.xlsx → frontend/src/data/alumni.json
            └── requirements.txt
```

---

## Route Map

| Path | Component | Domain |
|------|-----------|--------|
| `/` | `HomeLanding` | Platform |
| `/atlas` | `LandingPage` | Atlas |
| `/atlas/portfolio-research` | `PortfolioResearchPage` | Atlas |
| `/atlas/tooling` | `ToolingPage` | Atlas |
| `/professional-development` | `ProfDevLanding` | Professional Development |
| `/professional-development/alumni` | `AlumniPage` | Professional Development |

---

## Data Flow

```
data/*.xlsx
    └── modules/professional-development/scripts/convert_alumni.py
            └── frontend/src/data/alumni.json
                    └── AlumniPage.jsx (static import)

frontend (Vite :5173)
    └── /api/* proxy
            └── modules/atlas/backend (FastAPI :8000)
```

---

## Naming Conventions

| Layer | Convention | Example |
|-------|------------|---------|
| Repo folders | `kebab-case` | `professional-development/` |
| React components | `PascalCase.jsx` + co-located CSS | `LandingPage.jsx` |
| Utilities / API | `camelCase.js` | `portfolioResearch.js` |
| Python scripts | `snake_case.py` | `convert_alumni.py` |
| Routes | `kebab-case` | `/professional-development/alumni` |

---

## Ownership Model

| Domain | UI | Backend | Data pipeline | Specs |
|--------|----|---------|---------------|-------|
| Platform | `frontend/src/app/`, `frontend/src/pages/` | — | — | root README |
| Atlas | `frontend/src/modules/atlas/` | `modules/atlas/backend/` | — | `modules/atlas/docs/` |
| Professional Development | `frontend/src/modules/professional-development/` | — | `modules/professional-development/scripts/` | `modules/professional-development/docs/` |

### Adding a new domain module

1. Create `modules/<domain>/docs/` for specs and `modules/<domain>/scripts/` if needed.
2. Add pages under `frontend/src/modules/<domain>/pages/`.
3. Register routes in `frontend/src/app/App.jsx` and nav links in `NavBar.jsx`.
4. Add a tile on `HomeLanding.jsx`.

---

## Root Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend + frontend (Windows via `scripts/dev.ps1`) |
| `npm run dev:frontend` | Vite dev server only |
| `npm run dev:backend` | FastAPI with reload |
| `npm run build` | Production frontend build |
| `npm run data:alumni` | Regenerate `alumni.json` from spreadsheet |

---

## Migration Checklist

- [x] `.gitignore` covers `node_modules`, `dist`, Python caches
- [x] Root `README.md` exists
- [x] Legacy `Atlas/frontend/` removed
- [x] Atlas specs moved to `modules/atlas/docs/`
- [x] `ProfessionalDevelopment/` moved to `modules/professional-development/`
- [x] Duplicate `monte_carlo.py` script removed (kept API module only)
- [x] Logo moved to `assets/` and wired in NavBar
- [x] Empty `Alumni.md` removed
- [x] Dev convenience scripts added
- [x] Frontend restructured to `src/app/` + `src/modules/`
- [x] Atlas pages renamed to PascalCase

---

*Last updated: 2026-06-17*
