from typing import Any, Dict, List

import aiohttp
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from ml_api_client import APIClient
from pydantic import BaseModel

from ml_backend.databases import MongoDBConnector as MongoDB
from ml_backend.api.services import get_api_client, get_mongo_client
from ml_backend.utils import load_prompt_from_file

router = APIRouter()


class BackendCompletionsRequest(BaseModel):
    messages: List[Dict[str, Any]] = []
    location: str


@router.post("/completions")
async def chat_completions(
    body: BackendCompletionsRequest,
    api_client: APIClient = Depends(get_api_client),
    mongodb: MongoDB=Depends(get_mongo_client)
):
    try:
        rag_prompt = load_prompt_from_file("./src/ml_backend/prompts/rag_main.txt")

        user_input = f"""
`user_question`: {body.messages[-1]["content"]}

`location`: {body.location}
"""

        messages = [
            {
                "role": "system",
                "content": rag_prompt,
            },
        ]

        if len(body.messages) > 0:
            for message in body.messages[:-1]:
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
        
        await mongodb.log_event(
            user_id=None
        )

        return StreamingResponse(
            api_client.chat.stream_sse(
                messages=messages, model="openai/gpt-oss-120b", auto_tool_execution=True
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
