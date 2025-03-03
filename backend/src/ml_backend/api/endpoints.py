from fastapi import APIRouter

from .routes import chat_router

router = APIRouter()

router.include_router(chat_router, prefix="/chat", tags=["Chat inference"])
