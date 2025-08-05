from fastapi import APIRouter

from .routes import chat_router, experiences_router, studies_router

router = APIRouter()

router.include_router(chat_router, prefix="/chat", tags=["Chat inference"])
router.include_router(experiences_router, prefix="/experiences", tags=["Experiences"])
router.include_router(studies_router, prefix="/studies", tags=["Studies"])


# Health check
@router.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
