import json

import aiohttp
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from ml_api_client import APIClient
from ml_api_client.models import ChatCompletionsRequest, RagRetrieveRequest
from ml_backend.api.services import get_api_client
from ml_backend.utils import load_prompt_from_file

router = APIRouter()


@router.post("/completions")
async def chat_completions(
        body: ChatCompletionsRequest,
        api_client: APIClient = Depends(get_api_client),
):
    try:
        # Vérifiez si le modèle est spécifié, sinon utilisez le modèle par défaut

        top_k = await api_client.rag.retrieve("mathis_bio", RagRetrieveRequest(
            query=body.input,
            model="mistral-embed",
            limit=5,
        ))

        if not top_k:
            top_k = "Aucun document trouvé pour la requête."

        rag_prompt = load_prompt_from_file('./src/ml_backend/prompts/rag_main.txt')
        rag_prompt = rag_prompt.replace("<<top_k>>", json.dumps(top_k))
        body.prompt = rag_prompt

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
