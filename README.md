# OUSEMG Interface

Internal portal for the Ohio University Student Equity Management Group. One React shell hosts domain modules — **Atlas** (quantitative research) and **Professional Development** (alumni network and career tools).

See [rootTree.md](rootTree.md) for the full repository layout and conventions.

## Quick start

From the repo root:

```bash
# Install frontend dependencies (first time)
cd frontend && npm install && cd ..

# Install backend dependencies (first time)
pip install -r modules/atlas/backend/requirements.txt

# Run frontend + backend together
npm run dev
```

Or run services separately:

```bash
npm run dev:frontend   # http://localhost:5173
npm run dev:backend    # http://127.0.0.1:8000
```

## Routes

| Path | Module |
|------|--------|
| `/` | Platform home |
| `/atlas` | Atlas landing |
| `/atlas/portfolio-research` | Portfolio analytics |
| `/atlas/tooling` | Quant tools (Monte Carlo, etc.) |
| `/professional-development` | ProfDev landing |
| `/professional-development/alumni` | Alumni directory |

## Data pipeline

Refresh alumni JSON after updating the spreadsheet in `data/`:

```bash
npm run data:alumni
```

Source: `data/OUSEMG Alumni List - 2.17.2026 (2).xlsx`  
Output: `frontend/src/data/alumni.json`

## Module ownership

| Domain | UI | Backend | Scripts / docs |
|--------|----|---------|----------------|
| Platform | `frontend/src/app/`, `frontend/src/pages/` | — | This README |
| Atlas | `frontend/src/modules/atlas/` | `modules/atlas/backend/` | `modules/atlas/docs/` |
| Professional Development | `frontend/src/modules/professional-development/` | — | `modules/professional-development/` |

## Build

```bash
npm run build
npm run preview
```

## Environment

Root `.env` (see `.env.example`):

| Variable | Purpose |
|----------|---------|
| `LOGO_API` | Logo.dev sample URL; token is parsed from the query string for Application Tracker firm logos |

Restart the dev server after changing `.env`.
