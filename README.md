# OUSEMG Interface

Internal portal for the Ohio University Student Equity Management Group. One React shell hosts domain modules for **Atlas** quantitative research, **Portfolio Tracking**, and **Professional Development** career tools.

See [rootTree.md](rootTree.md) for the full repository layout and conventions.

## Quick start

From the repo root:

```powershell
# Install frontend dependencies (first time)
cd frontend && npm install && cd ..

# Install backend dependencies (first time)
pip install -r modules/atlas/backend/requirements.txt

# Create a local admin login (first time)
$env:OUSEMG_DEV_ADMIN_USERNAME = "your-local-admin"
$env:OUSEMG_DEV_ADMIN_PASSWORD = "choose-a-local-password"
$env:OUSEMG_DEV_ADMIN_DISPLAY_NAME = "Local Admin"
python modules/atlas/backend/scripts/seed_users.py

# Run frontend + backend together
npm run dev
```

Or run services separately:

```bash
npm run dev:frontend   # http://localhost:5173
npm run dev:backend    # http://127.0.0.1:8000
```

## Routes

All routes except `/login` are protected by local JWT auth.

| Path | Feature |
|------|---------|
| `/login` | Login page |
| `/` | Platform home |
| `/atlas` | Atlas landing |
| `/atlas/tooling` | Quant tools, including Monte Carlo simulation |
| `/portfolio` | Portfolio tracker for combined, traditional, and sustainable portfolios |
| `/professional-development` | Professional Development landing |
| `/professional-development/alumni` | Alumni directory |
| `/professional-development/applications` | Recruiting application tracker |

## Features

| Domain | Current features |
|--------|------------------|
| Platform | Auth-protected React shell, shared layout, top-level navigation |
| Atlas | Quant tooling and FastAPI-backed research endpoints |
| Portfolio Tracking | Portfolio snapshots, top movers, and combined portfolio views backed by `/api/portfolio/*` |
| Professional Development | Alumni directory and local-browser application tracker with firm logos |

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
| Portfolio Tracking | `frontend/src/modules/portfolio-tracking/` | `modules/atlas/backend/routers/portfolio.py` | `modules/portfolio-tracking/docs/` |
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

## Local auth data

Development users live in `modules/atlas/backend/data/users.json`. That file is intentionally ignored because it contains local usernames and password hashes.

Use `modules/atlas/backend/data/users.example.json` as the schema reference, or rerun:

```powershell
$env:OUSEMG_DEV_ADMIN_USERNAME = "your-local-admin"
$env:OUSEMG_DEV_ADMIN_PASSWORD = "choose-a-local-password"
$env:OUSEMG_DEV_ADMIN_DISPLAY_NAME = "Local Admin"
python modules/atlas/backend/scripts/seed_users.py
```
