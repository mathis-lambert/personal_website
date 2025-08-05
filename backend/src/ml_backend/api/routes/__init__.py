from .chat import router as chat_router
from .experiences import router as experiences_router
from .studies import router as studies_router
from .works import router as works_router
from .articles import router as articles_router

__all__ = [
    "chat_router",
    "experiences_router",
    "studies_router",
    "works_router",
    "articles_router",
]
