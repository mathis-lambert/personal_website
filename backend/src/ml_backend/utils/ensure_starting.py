import asyncio
import os
import signal
import sys
from typing import Tuple

from dotenv import load_dotenv
from ml_api_client import APIClient

from ml_backend.databases import MongoDBConnector

from .logger import CustomLogger

logger = CustomLogger().get_logger(__name__)

load_dotenv()


def handle_sigint(signal, frame):
    logger.info("Interruption reçue. Arrêt du programme...")
    sys.exit(0)


signal.signal(signal.SIGINT, handle_sigint)


async def ensure_starting() -> Tuple[MongoDBConnector, APIClient]:
    mongodb_client = MongoDBConnector(logger=logger)

    while not await mongodb_client.check_connection():
        logger.error("MongoDB connection failed. Retrying in 5 seconds...")
        await asyncio.sleep(5)

    logger.debug("MongoDB connection successful.")

    # api_username = os.getenv("ML_API_USERNAME")
    # api_password = os.getenv("ML_API_PASSWORD")
    api_key = os.getenv("ML_API_KEY")
    if not api_key:
        raise ValueError("ML_API_KEY is not set in the environment variables.")

    apiclient = APIClient(api_key=api_key)

    # while not apiclient.auth_token:
    #     await apiclient.auth.login(username=api_username, password=api_password)
    #     if not apiclient.auth_token:
    #         await asyncio.sleep(5)
    #         logger.error("API connection failed. Retrying in 5 seconds...")

    logger.debug("API connection successful.")

    return mongodb_client, apiclient
