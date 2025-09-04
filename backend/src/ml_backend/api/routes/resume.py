import aiohttp
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from ml_backend.api.services import get_mongo_client
from ml_backend.api.services.resume_pdf import ResumePDFExporter, load_resume_from_dict
from ml_backend.databases import MongoDBConnector
from ml_backend.utils import CustomLogger

logger = CustomLogger().get_logger(__name__)

router = APIRouter()


@router.get("")
async def get_resume(
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    try:
        db = mongodb.get_database()
        resume = await db["resume"].find_one({})
        return {"resume": mongodb.serialize(resume)}
    except aiohttp.ClientResponseError as e:
        logger.error(f"Erreur de réponse de l'API : {e}")
        raise HTTPException(status_code=e.status, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erreur lors du traitement de la requête : {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/export", response_class=Response)
async def export_resume_pdf(mongodb: MongoDBConnector = Depends(get_mongo_client)) -> Response:
    """Generate a one-page PDF resume from local JSON data."""
    try:
        db = mongodb.get_database()
        resume = await db["resume"].find_one({})
        pdf_bytes = ResumePDFExporter(load_resume_from_dict(resume)).build_pdf()
        headers = {"Content-Disposition": 'attachment; filename="mathis_lambert_resume.pdf"'}
        return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)
    except FileNotFoundError as e:
        logger.error(f"Resume data not found: {e}")
        raise HTTPException(status_code=404, detail=f"Resume data not found: {e}") from e
    except Exception as e:
        logger.error(f"Error generating PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e
