# Backend Local Data

`users.json` is intentionally ignored because it contains local login accounts and password hashes.

Create it locally with:

```powershell
$env:OUSEMG_DEV_ADMIN_USERNAME = "your-local-admin"
$env:OUSEMG_DEV_ADMIN_PASSWORD = "choose-a-local-password"
$env:OUSEMG_DEV_ADMIN_DISPLAY_NAME = "Local Admin"
python modules/atlas/backend/scripts/seed_users.py
```

Use `users.example.json` only as a schema reference. Do not commit real users or password hashes.
