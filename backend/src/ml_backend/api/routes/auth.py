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


ENV = os.getenv("ENV", "development")
if ENV == "production" and (not PASSWORD or PASSWORD == "secret"):
    raise RuntimeError("API_PASSWORD must be set to a strong value in production.")

ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "https://mathislambert.fr")
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

    allowed_url = urlparse(ALLOWED_ORIGIN)
    origin_header = request.headers.get("origin")
    referer_header = request.headers.get("referer")

    def is_valid_header(header_value):
        if not header_value:
            return False
        try:
            parsed = urlparse(header_value)
            # Compare scheme and netloc (host:port)
            return (
                parsed.scheme == allowed_url.scheme and
                parsed.netloc == allowed_url.netloc
            )
        except Exception:
            return False

    if not (is_valid_header(origin_header) or is_valid_header(referer_header)):
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

