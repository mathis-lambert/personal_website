from fastapi import HTTPException, Request
from ml_api_client import APIClient


def get_api_client(request: Request) -> APIClient:
    apiclient: APIClient = request.app.apiclient

    if not apiclient:
        raise HTTPException(status_code=500, detail="API client not found")

    return apiclient


def get_mongo_client(request: Request):
    mongodb = request.app.mongodb_client

    if not mongodb:
        raise HTTPException(status_code=500, detail="MongoDB client not found")

    return mongodb
