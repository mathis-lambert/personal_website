import aiohttp
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from ml_api_client import APIClient
from ml_api_client.models import ChatCompletionsRequest

from ml_backend.api.services import get_api_client

router = APIRouter()


@router.post("/completions")
async def chat_completions(
    body: ChatCompletionsRequest,
    api_client: APIClient = Depends(get_api_client),
):
    try:
        api_client.logger.info(f"API Client token: {api_client.auth_token}")
        api_client.logger.info(f"API Client key: {api_client.api_key}")
        if body.stream:
            # Utilisez StreamingResponse pour retransmettre le flux SSE brut
            return StreamingResponse(
                api_client.chat.stream_sse(body), media_type="text/event-stream"
            )
        else:
            # Réponse complète si le streaming n’est pas activé
            response = await api_client.chat.get_completions(body)
            return response
    except aiohttp.ClientResponseError as e:
        # Gestion spécifique des erreurs HTTP de l’API
        raise HTTPException(status_code=e.status, detail=str(e))
    except Exception as e:
        # Gestion générique des autres erreurs
        raise HTTPException(status_code=500, detail=str(e))
