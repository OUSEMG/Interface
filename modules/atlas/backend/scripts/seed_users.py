import json
import os
from pathlib import Path

import bcrypt


BACKEND_ROOT = Path(__file__).resolve().parents[1]
USERS_PATH = BACKEND_ROOT / "data" / "users.json"


def main():
    username = os.environ.get("OUSEMG_DEV_ADMIN_USERNAME")
    password = os.environ.get("OUSEMG_DEV_ADMIN_PASSWORD")

    if not username or not password:
        raise RuntimeError(
            "Set OUSEMG_DEV_ADMIN_USERNAME and OUSEMG_DEV_ADMIN_PASSWORD before seeding users."
        )

    USERS_PATH.parent.mkdir(parents=True, exist_ok=True)

    # DEV ONLY: writes a local users.json file that is intentionally ignored by git.
    hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    user = {
        "id": 1,
        "username": username,
        "hashed_password": hashed_password,
        "role": "admin",
        "display_name": os.environ.get("OUSEMG_DEV_ADMIN_DISPLAY_NAME", "Local Admin"),
        "active": True,
    }

    USERS_PATH.write_text(json.dumps([user], indent=2), encoding="utf-8")
    print(f"Wrote dev users to {USERS_PATH}")


if __name__ == "__main__":
    main()
