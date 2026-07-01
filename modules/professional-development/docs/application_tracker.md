# Application Tracker — Implementation Spec
**OUSEMG Professional Development · Feature Spec v1.0**

---

## Overview

A per-member application tracker for recording recruiting activity — firms, roles, stages, and outcomes. No login system exists yet, so data is stored locally in the browser (localStorage) for now. The swap point to a real user-authenticated backend is clearly marked throughout.

This is intentionally scoped down. The goal is something that actually gets used, not a CRM with 40 fields nobody fills out.

---

## Logo API

Use **[Logo.dev](https://www.logo.dev/)** — free tier, up to 500,000 requests/month, no attribution badge required, supports dark mode, SVG/PNG/WebP, and query by domain or stock ticker. That last part matters: most firms members are recruiting at (GS, MS, JPM, BX, KKR, etc.) have tickers, which makes logo lookup trivial.

**How it works:**
```
https://img.logo.dev/{domain}?token=YOUR_TOKEN&size=64&format=png
```

Example:
```
https://img.logo.dev/goldmansachs.com?token=YOUR_TOKEN&size=64&format=png
```

The token is free on signup. Store it as an environment variable, not in the codebase.

**Fallback behavior:** If a logo fetch fails (bad domain, unknown firm), fall back to a styled monogram tile using the first letter of the firm name. Do not show a broken image.

---

## Data Model

Each application entry has the following fields. Keep it flat and simple — no nested objects.

```python
# models/application.py (SQLAlchemy — swap in when auth is live)

class Application(Base):
    __tablename__ = "applications"

    id            = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id       = Column(String, nullable=True)   # ← NULL during local-only phase; FK to users when auth is live
    firm_name     = Column(String, nullable=False)
    firm_domain   = Column(String, nullable=True)   # used for logo lookup (e.g. "goldmansachs.com")
    role          = Column(String, nullable=False)
    role_type     = Column(String, nullable=False)  # "IB" | "AM" | "ER" | "S&T" | "Quant" | "PE" | "VC" | "Other"
    stage         = Column(String, nullable=False)  # see Stage enum below
    applied_date  = Column(Date, nullable=True)
    deadline      = Column(Date, nullable=True)
    notes         = Column(Text, nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

**Stage enum (in order):**
- `Watching` — on radar, not applied
- `Applied`
- `Online Assessment`
- `First Round`
- `Superday / Final Round`
- `Offer`
- `Rejected`
- `Withdrew`

Keep it as a string column, not a database enum. Enums in Postgres are a pain to migrate.

---

## Local Storage Schema (Pre-Auth Phase)

During development (no auth), data lives in `localStorage` under the key `ousemg_applications`. Format:

```json
[
  {
    "id": "uuid-string",
    "firm_name": "Goldman Sachs",
    "firm_domain": "goldmansachs.com",
    "role": "Summer Analyst — IBD",
    "role_type": "IB",
    "stage": "First Round",
    "applied_date": "2025-09-01",
    "deadline": "2025-08-15",
    "notes": "Referred by John Doe (alumni, Class of 2022)",
    "created_at": "2025-09-01T12:00:00Z",
    "updated_at": "2025-09-01T12:00:00Z"
  }
]
```

> **⚠ SWAP POINT — Auth Migration**
> When user authentication is live, replace all `localStorage` reads/writes with API calls to `/api/applications`. The FastAPI routes are pre-specced below. No other frontend logic should need to change if the API shape matches.

---

## API Routes (FastAPI — wire in when auth is live)

```python
# routes/applications.py

GET    /api/applications          # fetch all for current user
POST   /api/applications          # create new entry
PUT    /api/applications/{id}     # update existing entry
DELETE /api/applications/{id}     # delete entry
```

All routes will eventually require a valid session token. During local-only phase, these endpoints don't exist — everything is handled client-side.

---

## Frontend — Page Layout

### View: Application Board

The default view. A kanban-style column layout, one column per stage. Cards show:
- Company logo (via Logo.dev) or monogram fallback
- Firm name + role title
- Role type badge (IB, AM, Quant, etc.)
- Days since applied (or days until deadline if not yet applied)
- Stage pill

Columns in order: `Watching → Applied → OA → First Round → Superday → Offer → Rejected / Withdrew`

Rejected and Withdrew are collapsed by default into a single "Archived" column. Members can expand it. This keeps the board from looking like a graveyard.

### View: Table View

Toggle button switches to a sortable/filterable table. Columns: Logo, Firm, Role, Type, Stage, Applied Date, Deadline, Last Updated. Useful for members who want to export or compare at a glance.

### Detail Drawer

Clicking any card opens a right-side drawer (not a modal — modals are annoying) with all fields editable inline. Save button commits the change. No confirmation dialog for edits; add one only for deletes.

### Add Application Form

Triggered by a persistent "+ Add Application" button in the top-right. Inline form (not a separate page). Required fields: Firm, Role, Role Type, Stage. Everything else optional.

On firm name input, auto-attempt to resolve the domain via a simple lookup (pre-populated list of common finance firms → domain mappings, stored as a JSON constant). If no match, user can type the domain manually or leave blank (logo falls back to monogram).

---

## Pre-Populated Firm → Domain Map

Hardcode a JSON constant for the most common recruiting targets. This avoids depending on a third-party firm lookup API and keeps it fast.

```json
{
  "Goldman Sachs": "goldmansachs.com",
  "Morgan Stanley": "morganstanley.com",
  "JPMorgan": "jpmorgan.com",
  "Bank of America": "bankofamerica.com",
  "Citigroup": "citi.com",
  "Wells Fargo": "wellsfargo.com",
  "Barclays": "barclays.com",
  "UBS": "ubs.com",
  "Credit Suisse": "credit-suisse.com",
  "Deutsche Bank": "db.com",
  "Lazard": "lazard.com",
  "Evercore": "evercore.com",
  "Centerview": "centerviewpartners.com",
  "PJT Partners": "pjtpartners.com",
  "Houlihan Lokey": "hl.com",
  "Blackstone": "blackstone.com",
  "KKR": "kkr.com",
  "Apollo": "apollo.com",
  "Carlyle": "carlyle.com",
  "Warburg Pincus": "warburgpincus.com",
  "Fidelity": "fidelity.com",
  "BlackRock": "blackrock.com",
  "Vanguard": "vanguard.com",
  "Wellington": "wellington.com",
  "Point72": "point72.com",
  "Citadel": "citadel.com",
  "Two Sigma": "twosigma.com",
  "Jane Street": "janestreet.com",
  "D.E. Shaw": "deshaw.com"
}
```

Add more as needed. This list covers 90% of what Ohio University finance students are actually recruiting for.

---

## Design System

Consistent with the rest of the OUSEMG platform:

| Token | Value |
|---|---|
| Background | `#0d0d0d` |
| Surface / Card | `#141414` |
| Border | `#1f1f1f` |
| Accent green | `#1d6b35` |
| Accent green hover | `#22823f` |
| Text primary | `#f0f0f0` |
| Text muted | `#6b6b6b` |
| Display font | Syne or Outfit |
| Mono / data font | JetBrains Mono |

**Stage badge colors:**
- `Watching` — muted gray
- `Applied` — blue-gray
- `OA` — amber
- `First Round` — blue
- `Superday` — purple
- `Offer` — `#1d6b35` green
- `Rejected` — muted red
- `Withdrew` — muted gray

---

## Honest Scope Boundaries

**In scope for v1:**
- Add, edit, delete applications
- Kanban board + table toggle
- Logo resolution via Logo.dev + monogram fallback
- localStorage persistence
- Basic filter by stage and role type

**Not in scope for v1 (do these later or not at all):**
- Deadline reminder notifications — don't build this until you have auth and a real user session; browser push notifications without a backend are flaky
- Shared/public application boards — interesting idea, not worth the complexity now
- AI-generated application advice — see earlier note; skip it
- Analytics dashboard (acceptance rates, etc.) — add this in v2 once there's enough real data in the system to make it meaningful
- Import from spreadsheet — members will ask for this; defer until v2

---

## File Structure

```
frontend/
  src/
    pages/
      ProfessionalDev/
        ApplicationTracker/
          index.jsx              # page shell, view toggle
          BoardView.jsx          # kanban columns
          TableView.jsx          # sortable table
          ApplicationCard.jsx    # card component used in board
          ApplicationDrawer.jsx  # edit drawer
          AddApplicationForm.jsx # creation form
          firmDomains.js         # pre-populated firm → domain map
          useApplications.js     # localStorage hook (swap point: replace with API calls)
          stageConfig.js         # stage order, colors, display labels

backend/
  app/
    routes/
      applications.py            # REST routes (wire in when auth is live)
    models/
      application.py             # SQLAlchemy model
    schemas/
      application.py             # Pydantic request/response schemas
```

---

## Build Order

1. `firmDomains.js` + `stageConfig.js` — constants first, no logic yet
2. `useApplications.js` — localStorage hook, get CRUD working in isolation
3. `ApplicationCard.jsx` — logo + monogram fallback, static data
4. `AddApplicationForm.jsx` — creation flow
5. `BoardView.jsx` — kanban layout using real hook data
6. `ApplicationDrawer.jsx` — edit/delete
7. `TableView.jsx` + view toggle
8. Wire up FastAPI routes when auth is ready (drop-in swap)

Test each step before moving to the next. Don't write the backend routes until the frontend is working against localStorage — you'll know the exact shape you need.