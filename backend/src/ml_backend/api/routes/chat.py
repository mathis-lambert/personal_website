from typing import Any, Dict, List

import aiohttp
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from ml_api_client import APIClient
from ml_api_client.models import TextGenerationRequest, VectorStoreSearchRequest
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

        top_k = await api_client.vector_stores.search_vector_store(
            "mathis_bio_store",
            VectorStoreSearchRequest(
                query=body.input,
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

        messages = [
            {
                "role": "system",
                "content": rag_prompt,
            },
        ]

        if len(body.history) > 0:
            for message in body.history[:-1]:
                messages.append(
                    {
                        "role": message["role"],
                        "content": message["content"],
                    }
                )

        messages.append(
            {
                "role": "user",
                "content": user_input,
            }
        )

        return StreamingResponse(
            api_client.chat.stream_sse(
                messages=messages,
                model="openai/gpt-5-nano",
                reasoning_effort="minimal",
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
