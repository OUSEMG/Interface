# Frontend Local Data

`alumni.json` is generated from the private alumni spreadsheet and is intentionally ignored.

To recreate it locally:

```powershell
npm run data:alumni
```

The app imports `alumni.json` for the Alumni Directory, so a fresh clone needs the private source spreadsheet in `data/` before running the data pipeline.
