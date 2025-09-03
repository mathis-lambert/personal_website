import os
import secrets
import time
from threading import Lock
from typing import Any, Dict, Tuple

from fastapi import HTTPException, Request, status

SESSION_COOKIE_NAME = "session_id"
CSRF_COOKIE_NAME = "XSRF-TOKEN"
SESSION_TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", "900"))

_sessions: Dict[str, Dict[str, Any]] = {}
_lock = Lock()  # to protect _sessions dict


def create_session(token: str, expires_in: int) -> Tuple[str, str, int]:
    max_age = min(expires_in, SESSION_TTL_SECONDS)
    session_id = secrets.token_urlsafe(32)
    csrf = secrets.token_urlsafe(32)
    with _lock:
        _sessions[session_id] = {
            "token": token,
            "exp": time.time() + max_age,
            "csrf": csrf,
        }
    return session_id, csrf, max_age


def get_session(request: Request, require_csrf: bool = True) -> Tuple[str, Dict[str, Any]]:
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    with _lock:
        sess = _sessions.get(session_id) if session_id else None
        if not sess:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        if sess["exp"] < time.time():
            del _sessions[session_id]
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
    if require_csrf and request.method not in ("GET", "HEAD", "OPTIONS"):
        csrf_header = request.headers.get("X-CSRF-Token")
        if not csrf_header or csrf_header != sess["csrf"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid CSRF token")
    return session_id, sess


def require_session(request: Request):
    return get_session(request)


def clear_session(session_id: str):
    with _lock:
        _sessions.pop(session_id, None)
