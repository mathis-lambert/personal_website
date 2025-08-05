from typing import List

import aiohttp
from fastapi import APIRouter, Depends, HTTPException
from ml_api_client import APIClient
from ml_api_client.models import ChatCompletionsRequest
from pydantic import BaseModel

from ml_backend.api.services import get_api_client
from ml_backend.utils import load_prompt_from_file

router = APIRouter()


class Component(BaseModel):
    component_id: str
    description: str
    triggers: List[str]


class GetComponentsInference(BaseModel):
    input: str
    available_components: List[Component]


@router.post("/get-components")
async def get_components(
    body: GetComponentsInference,
    api_client: APIClient = Depends(get_api_client),
):
    try:
        prompt = load_prompt_from_file("./src/ml_backend/prompts/choose_component.txt")

        user_input = f"""
# NOW, PROCESS THE FOLLOWING:

`user_input`: {body.input}

`available_components`: {body.available_components}

# OUTPUT (JSON List of component_ids):"""

        response = await api_client.chat.get_completions(
            ChatCompletionsRequest(
                input=user_input,
                prompt=prompt,
                history=body.history,
                temperature=0.3,
                max_tokens=256,
                top_p=0.95,
                stream=False,
                model="mistral-small-latest",
            )
        )

        if not response:
            raise HTTPException(
                status_code=500, detail="Aucune réponse reçue de l'API."
            )

        # Traitez la réponse ici si nécessaire
        print(f"Réponse de l'API : {response}")
        return response

    except aiohttp.ClientResponseError as e:
        # Gestion spécifique des erreurs HTTP de l’API
        print(f"Erreur de réponse de l'API : {e}")
        raise HTTPException(status_code=e.status, detail=str(e)) from e
    except Exception as e:
        # Gestion générique des autres erreurs
        raise HTTPException(status_code=500, detail=str(e)) from e
