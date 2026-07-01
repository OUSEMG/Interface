import json
from pathlib import Path

import bcrypt


BACKEND_ROOT = Path(__file__).resolve().parents[1]
USERS_PATH = BACKEND_ROOT / "data" / "users.json"


def main():
    USERS_PATH.parent.mkdir(parents=True, exist_ok=True)

    # DEV ONLY: Remove or rotate the master / 123 credentials before deployment.
    hashed_password = bcrypt.hashpw("123".encode(), bcrypt.gensalt()).decode()
    user = {
        "id": 1,
        "username": "master",
        "hashed_password": hashed_password,
        "role": "admin",
        "display_name": "Master Admin",
        "active": True,
    }

    USERS_PATH.write_text(json.dumps([user], indent=2), encoding="utf-8")
    print(f"Wrote dev users to {USERS_PATH}")


if __name__ == "__main__":
    main()
