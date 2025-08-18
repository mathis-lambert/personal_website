from .chat import router as chat_router
from .experiences import router as experiences_router
from .studies import router as studies_router
from .projects import router as projects_router
from .articles import router as articles_router
from .auth import router as auth_router
from .resume import router as resume_router

__all__ = [
    "chat_router",
    "experiences_router",
    "studies_router",
    "projects_router",
    "articles_router",
    "auth_router",
    "resume_router",
]
