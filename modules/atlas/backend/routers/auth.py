from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from config import JWT_EXPIRY_HOURS
from middleware.auth_middleware import get_current_user
from services.auth_service import create_token, get_user_by_username, verify_password


router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(request: LoginRequest):
    user = get_user_by_username(request.username)
    if not user or not verify_password(request.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not user.get("active", True):
        raise HTTPException(status_code=403, detail="Account inactive")

    return {
        "access_token": create_token(user),
        "token_type": "bearer",
        "display_name": user["display_name"],
        "role": user["role"],
        "expires_in": JWT_EXPIRY_HOURS * 3600,
    }


@router.post("/logout")
def logout():
    return {"message": "Logged out"}


@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return {
        "username": current_user["sub"],
        "display_name": current_user["display_name"],
        "role": current_user["role"],
    }
