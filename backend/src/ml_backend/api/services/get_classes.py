from fastapi import HTTPException, Request
from ml_api_client import APIClient


def get_api_client(request: Request) -> APIClient:
    apiclient: APIClient = request.app.apiclient

    if not apiclient:
        raise HTTPException(status_code=500, detail="API client not found")

    return apiclient
