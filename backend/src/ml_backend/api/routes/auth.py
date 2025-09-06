import hashlib
import hmac
import os
from datetime import timedelta
from typing import Tuple

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel

from ml_backend.api.security import create_access_token
from ml_backend.api.session import (
    CSRF_COOKIE_NAME,
    SESSION_COOKIE_NAME,
    clear_session,
    create_session,
    require_session,
)

# Credentials for admin dashboard login
INTERNAL_API_USERNAME = os.getenv("INTERNAL_API_USERNAME")
INTERNAL_API_PASSWORD = os.getenv("INTERNAL_API_PASSWORD")

# Admin Token Expiration time (in seconds)
ADMIN_TOKEN_EXPIRE_SECONDS = int(
    os.getenv("ADMIN_TOKEN_EXPIRE_SECONDS", "1800")
)  # Default to 30 minutes

if not INTERNAL_API_USERNAME or not INTERNAL_API_PASSWORD:
    raise RuntimeError("INTERNAL_API_USERNAME and INTERNAL_API_PASSWORD must be set")

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password_hash: str


def _generate_session_token() -> Tuple[str, int]:
    """Generate a short-lived token used for front-back communications.

    The cookie/session protection (HTTPOnly + CSRF) is enforced by session.py.
    Expires are aligned with JWT_EXPIRE_SECONDS and further bounded by SESSION_TTL_SECONDS.
    """
    expires_in = int(os.getenv("JWT_EXPIRE_SECONDS", "60"))
    token = create_access_token({"sub": "session"})
    return token, expires_in


@router.post("/login")
async def login(req: LoginRequest):
    if req.username != INTERNAL_API_USERNAME:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    # Compute expected SHA-256 hash of the configured password
    expected_hash = hashlib.sha256(INTERNAL_API_PASSWORD.encode()).hexdigest()

    # Determine the supplied hash from request
    supplied_hash: str | None
    if req.password_hash:
        supplied_hash = req.password_hash.strip().lower()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="password_hash (or password) required",
        )

    # Constant-time comparison to mitigate timing attacks
    if not hmac.compare_digest(supplied_hash, expected_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    token = create_access_token(
        {"sub": req.username},
        expires_delta=timedelta(seconds=ADMIN_TOKEN_EXPIRE_SECONDS),
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": ADMIN_TOKEN_EXPIRE_SECONDS,
    }


@router.post("/token")
async def issue_token(response: Response, request: Request):
    token, expires_in = _generate_session_token()
    session_id, csrf, max_age = create_session(token, expires_in)
    secure = request.url.scheme == "https"
    response.set_cookie(
        SESSION_COOKIE_NAME,
        session_id,
        max_age=max_age,
        httponly=True,
        secure=secure,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        CSRF_COOKIE_NAME,
        csrf,
        max_age=max_age,
        httponly=False,
        secure=secure,
        samesite="lax",
        path="/",
    )
    return {"ok": True}


@router.post("/refresh")
async def refresh_token(
    response: Response, request: Request, session=Depends(require_session)
):
    old_session_id, _ = session
    token, expires_in = _generate_session_token()
    new_session_id, csrf, max_age = create_session(token, expires_in)
    clear_session(old_session_id)
    secure = request.url.scheme == "https"
    response.set_cookie(
        SESSION_COOKIE_NAME,
        new_session_id,
        max_age=max_age,
        httponly=True,
        secure=secure,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        CSRF_COOKIE_NAME,
        csrf,
        max_age=max_age,
        httponly=False,
        secure=secure,
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
