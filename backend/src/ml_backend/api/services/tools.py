__all__ = ["get_mathis_info", "get_mathis_projects", "get_mathis_experiences"]


async def get_mathis_info(query: str):
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


def get_mathis_projects():
    return "Mathis has worked on many projects"


def get_mathis_experiences():
    return "Mathis has worked on many projects"
