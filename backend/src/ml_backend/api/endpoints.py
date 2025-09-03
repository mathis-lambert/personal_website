from fastapi import APIRouter, Depends

from .routes import (
    articles_router,
    auth_router,
    chat_router,
    experiences_router,
    projects_router,
    resume_router,
    studies_router,
)
from .routes.admin import router as admin_router
from .security import verify_token
from .session import require_session

router = APIRouter()

router.include_router(auth_router, prefix="/auth", tags=["Auth"])
router.include_router(
    chat_router,
    prefix="/chat",
    tags=["Chat inference"],
    dependencies=[Depends(require_session)],
)
router.include_router(
    experiences_router,
    prefix="/experiences",
    tags=["Experiences"],
    dependencies=[Depends(require_session)],
)
router.include_router(
    studies_router,
    prefix="/studies",
    tags=["Studies"],
    dependencies=[Depends(require_session)],
)
router.include_router(
    articles_router,
    prefix="/articles",
    tags=["Articles"],
    dependencies=[Depends(require_session)],
)
router.include_router(
    projects_router,
    prefix="/projects",
    tags=["projects"],
    dependencies=[Depends(require_session)],
)
router.include_router(
    resume_router,
    prefix="/resume",
    tags=["Resume"],
    dependencies=[Depends(require_session)],
)

# Admin endpoints (file-backed data management)
router.include_router(admin_router, prefix="", tags=["Admin"], dependencies=[Depends(verify_token)])


# Health check
@router.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
