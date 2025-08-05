from typing import Any, Dict, List

import aiohttp
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from ml_api_client import APIClient
from ml_api_client.models import ChatCompletionsRequest, RagRetrieveRequest
from pydantic import BaseModel

from ml_backend.api.services import get_api_client
from ml_backend.utils import load_prompt_from_file

router = APIRouter()


class BackendCompletionsRequest(BaseModel):
    input: str
    history: List[Dict[str, Any]] = []


@router.post("/completions")
async def chat_completions(
    body: BackendCompletionsRequest,
    api_client: APIClient = Depends(get_api_client),
):
    try:
        # Vérifiez si le modèle est spécifié, sinon utilisez le modèle par défaut

        top_k = await api_client.rag.retrieve(
            "mathis_bio",
            RagRetrieveRequest(
                query=body.input,
                model="mistral-embed",
                limit=5,
            ),
        )

        if not top_k:
            top_k = "No docs found."

        rag_prompt = load_prompt_from_file("./src/ml_backend/prompts/rag_main.txt")

        user_input = f"""
`user_question`: {body.input}

`retrieved_documents`: {top_k if top_k else "No docs found."}
"""

        return StreamingResponse(
            api_client.chat.stream_sse(
                ChatCompletionsRequest(
                    input=user_input,
                    prompt=rag_prompt,
                    history=body.history,
                    temperature=0.3,
                    max_tokens=1024,
                    top_p=0.9,
                    stream=True,
                    model="mistral-small-latest",
                )
            ),
            media_type="text/event-stream",
        )

    except aiohttp.ClientResponseError as e:
        # Gestion spécifique des erreurs HTTP de l’API
        print(f"Erreur de réponse de l'API : {e}")
        raise HTTPException(status_code=e.status, detail=str(e))
    except Exception as e:
        # Gestion générique des autres erreurs
        raise HTTPException(status_code=500, detail=str(e))
