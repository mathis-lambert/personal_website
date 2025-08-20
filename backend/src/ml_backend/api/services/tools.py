__all__ = ["get_self_info", "get_self_projects", "get_self_experiences"]


async def get_self_info(query: str):
    import os
    from ml_api_client import APIClient
    from ml_api_client.models import VectorStoreSearchRequest

    client = APIClient(api_key=os.getenv("ML_API_KEY"))
    top_k = await client.vector_stores.search_vector_store(
        "mathis_bio_store",
        VectorStoreSearchRequest(
            query=query,
            limit=3,
        ),
    )
    return top_k


def get_self_projects():
    from ml_api_client.utils import CustomLogger
    from ml_backend.databases import MongoDBConnector

    logger = CustomLogger().get_logger(__name__)
    mongo_client = MongoDBConnector(logger=logger)
    projects = mongo_client.get_database().projects.find()
    return projects


def get_self_experiences():
    from ml_api_client.utils import CustomLogger
    from ml_backend.databases import MongoDBConnector

    logger = CustomLogger().get_logger(__name__)
    mongo_client = MongoDBConnector(logger=logger)
    experiences = mongo_client.get_database().resume.find_one()
    return experiences
