import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import bcrypt
from jose import jwt

from config import JWT_ALGORITHM, JWT_EXPIRY_HOURS, JWT_SECRET


BACKEND_ROOT = Path(__file__).resolve().parents[1]
USERS_PATH = BACKEND_ROOT / "data" / "users.json"


def get_user_by_username(username):
    # SWAP POINT: Replace JSON file lookup with SQLAlchemy query when PostgreSQL is ready.
    if not USERS_PATH.exists():
        return None

    with USERS_PATH.open(encoding="utf-8") as file:
        users = json.load(file)

    normalized = username.strip().lower()
    return next((user for user in users if user["username"].lower() == normalized), None)


def verify_password(plain, hashed):
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_token(user):
    payload = {
        "sub": user["username"],
        "role": user["role"],
        "display_name": user["display_name"],
        "exp": datetime.now(UTC) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token):
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
