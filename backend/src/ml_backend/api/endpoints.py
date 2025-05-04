from fastapi import APIRouter

from .routes import chat_router

router = APIRouter()

router.include_router(chat_router, prefix="/chat", tags=["Chat inference"])


# Health check
@router.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
