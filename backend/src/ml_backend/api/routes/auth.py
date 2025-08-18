import hmac
import hashlib
import os
import time
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel
from urllib.parse import urlparse

from ml_backend.api.security import create_access_token

USERNAME = os.getenv("API_USERNAME", "admin")
PASSWORD = os.getenv("API_PASSWORD", "secret")

if not PASSWORD or PASSWORD == "secret":
    raise RuntimeError("API_PASSWORD must be set to a strong value.")

ALLOWED_ORIGINS_STR = os.getenv(
    "ALLOWED_ORIGINS", "https://mathislambert.fr,http://localhost:5173"
)
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_STR.split(",")]


NONCE_TTL_SECONDS = int(os.getenv("NONCE_TTL_SECONDS", "30"))


class TokenRequest(BaseModel):
    username: str
    nonce: str
    signature: str


router = APIRouter()


@router.get("/challenge")
async def get_challenge():
    """Return a timestamp nonce used for HMAC challenge."""
    return {"nonce": str(int(time.time()))}


@router.post("/token")
async def issue_token(req: TokenRequest, request: Request):
    if req.username != USERNAME:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    try:
        nonce_ts = int(req.nonce)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid nonce"
        ) from exc

    if abs(int(time.time()) - nonce_ts) > NONCE_TTL_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Expired nonce"
        )

    origin_header = request.headers.get("origin")
    referer_header = request.headers.get("referer")

    def get_origin(header_value):
        if not header_value:
            return None
        try:
            # Return scheme://netloc
            parsed = urlparse(header_value)
            return f"{parsed.scheme}://{parsed.netloc}"
        except Exception:
            return None

    request_origin = get_origin(origin_header) or get_origin(referer_header)

    if not request_origin or request_origin not in ALLOWED_ORIGINS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid origin"
        )

    expected = hmac.new(
        PASSWORD.encode(), f"{req.username}:{req.nonce}".encode(), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(req.signature, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature"
        )

    token = create_access_token({"sub": req.username})
    return {"access_token": token, "token_type": "bearer"}
