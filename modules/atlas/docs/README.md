# Atlas Module

Atlas provides quantitative research tools: portfolio analytics, Monte Carlo simulation, and quant tooling.

## UI

React pages live in the root Interface app:

```
frontend/src/modules/atlas/
  pages/          LandingPage, PortfolioResearchPage, ToolingPage
  components/     MonteCarloTool
  api/            portfolioResearch.js
```

Run the app from the repo root: `npm run dev:frontend`

## Backend

FastAPI service at `modules/atlas/backend/`:

```bash
npm run dev:backend
```

Endpoints are proxied from the frontend at `/api/*`.

## Specs

Agent prompts and feature specs: `modules/atlas/docs/`
