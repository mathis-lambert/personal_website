import hashlib
import hmac
import os
import secrets
import time
from typing import Tuple

import httpx
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel

from ml_backend.api.security import create_access_token
from ml_backend.api.session import (
    CSRF_COOKIE_NAME,
    SESSION_COOKIE_NAME,
    create_session,
    require_session,
    clear_session,
)

API_URL = os.getenv("API_URL")
API_USERNAME = os.getenv("API_USERNAME")
API_PASSWORD = os.getenv("API_PASSWORD")

if not API_URL or not API_USERNAME or not API_PASSWORD:
    raise RuntimeError("API_URL, API_USERNAME and API_PASSWORD must be set")

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


async def fetch_api_token() -> Tuple[str, int]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        nonce_res = await client.get(f"{API_URL}/api/auth/challenge")
        nonce_res.raise_for_status()
        nonce = nonce_res.json().get("nonce")
        if not nonce:
            raise HTTPException(status_code=500, detail="Invalid nonce")
        signature = hmac.new(
            API_PASSWORD.encode(),
            f"{API_USERNAME}:{nonce}".encode(),
            hashlib.sha256,
        ).hexdigest()
        token_res = await client.post(
            f"{API_URL}/api/auth/token",
            json={"username": API_USERNAME, "nonce": nonce, "signature": signature},
        )
        token_res.raise_for_status()
        data = token_res.json()
        token = data.get("access_token")
        if not token:
            raise HTTPException(status_code=500, detail="Token missing")
        expires_in = int(data.get("expires_in", 60))
        return token, expires_in


@router.post("/login")
async def login(req: LoginRequest):
    if req.username != API_USERNAME or req.password != API_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    token = create_access_token({"sub": req.username})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/token")
async def issue_token(response: Response):
    token, expires_in = await fetch_api_token()
    session_id, csrf, max_age = create_session(token, expires_in)
    response.set_cookie(
        SESSION_COOKIE_NAME,
        session_id,
        max_age=max_age,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        CSRF_COOKIE_NAME,
        csrf,
        max_age=max_age,
        httponly=False,
        secure=True,
        samesite="lax",
        path="/",
    )
    return {"ok": True}


@router.post("/refresh")
async def refresh_token(response: Response, session=Depends(require_session)):
    old_session_id, _ = session
    token, expires_in = await fetch_api_token()
    new_session_id, csrf, max_age = create_session(token, expires_in)
    clear_session(old_session_id)
    response.set_cookie(
        SESSION_COOKIE_NAME,
        new_session_id,
        max_age=max_age,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        CSRF_COOKIE_NAME,
        csrf,
        max_age=max_age,
        httponly=False,
        secure=True,
        samesite="lax",
        path="/",
    )
    return {"ok": True}


@router.post("/logout")
async def logout(response: Response, session=Depends(require_session)):
    session_id, _ = session
    clear_session(session_id)
    response.delete_cookie(SESSION_COOKIE_NAME, path="/")
    response.delete_cookie(CSRF_COOKIE_NAME, path="/")
    return {"ok": True}
