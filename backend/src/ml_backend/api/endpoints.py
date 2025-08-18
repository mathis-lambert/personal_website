from fastapi import APIRouter, Depends

from .routes import (
    chat_router,
    experiences_router,
    studies_router,
    articles_router,
    projects_router,
    auth_router,
    resume_router,
)
from .security import verify_token

router = APIRouter()

router.include_router(auth_router, prefix="/auth", tags=["Auth"])
router.include_router(
    chat_router,
    prefix="/chat",
    tags=["Chat inference"],
    dependencies=[Depends(verify_token)],
)
router.include_router(
    experiences_router,
    prefix="/experiences",
    tags=["Experiences"],
    dependencies=[Depends(verify_token)],
)
router.include_router(
    studies_router,
    prefix="/studies",
    tags=["Studies"],
    dependencies=[Depends(verify_token)],
)
router.include_router(
    articles_router,
    prefix="/articles",
    tags=["Articles"],
    dependencies=[Depends(verify_token)],
)
router.include_router(
    projects_router,
    prefix="/projects",
    tags=["projects"],
    dependencies=[Depends(verify_token)],
)
router.include_router(
    resume_router,
    prefix="/resume",
    tags=["Resume"],
    dependencies=[Depends(verify_token)],
)


# Health check
@router.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
