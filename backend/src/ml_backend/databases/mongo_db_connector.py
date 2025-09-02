import json
import os
from datetime import datetime, timezone

from bson import ObjectId
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()


class MongoDBConnector:
    def __init__(self, logger):
        self.logger = logger

        # Récupérer les informations depuis les variables d'environnement
        self.host = os.getenv("MONGODB_HOST", "localhost")
        self.port = int(os.getenv("MONGODB_PORT", 27017))
        self.username = os.getenv("MONGODB_USERNAME", "root")
        self.password = os.getenv("MONGODB_PASSWORD", "example")
        self.database = os.getenv("MONGODB_DATABASE", "api-database")

        # Créer le client MongoDB
        self.client = AsyncIOMotorClient(
            host=self.host,
            port=self.port,
            username=self.username,
            password=self.password,
        )

    async def insert_initial_data(self):
        """
        Insère les données initiales dans la base MongoDB à partir des fichiers JSON présents dans le dossier 'data'.
        Cette méthode est appelée une seule fois lors de l'initialisation du service.
        """
        self.logger.info("Populating MongoDB with initial data...")

        current_dir = os.path.dirname(__file__)
        data_dir = os.path.join(current_dir, "data")

        file_map = {
            "experiences": "experiences.json",
            "studies": "studies.json",
            "projects": "projects.json",
            "articles": "articles.json",
            "resume": "resume.json",
        }

        db = self.get_database()

        for collection_name, filename in file_map.items():
            path = os.path.join(data_dir, filename)

            try:
                with open(path, "r", encoding="utf-8") as file:
                    data = json.load(file)
            except (FileNotFoundError, json.JSONDecodeError) as e:
                self.logger.error(f"Failed to load data from {filename}: {e}")
                continue

            if not isinstance(data, list):
                self.logger.warning(f"Data in {filename} is not a list. Skipping.")
                continue

            try:
                collection = db[collection_name]

                await collection.delete_many({})
                self.logger.info(f"Purged collection: '{collection_name}'.")

                if data:
                    await collection.insert_many(data)
                    self.logger.info(
                        f"Inserted data into '{collection_name}' collection."
                    )
                else:
                    self.logger.info(f"No data to insert into '{collection_name}'.")
            except Exception as e:
                self.logger.error(
                    f"Failed to insert data into '{collection_name}': {e}"
                )

        self.logger.info("MongoDB initial data population complete.")

    async def check_connection(self):
        try:
            # timeout = 5
            # Essayer de se connecter à la base de données
            await self.client.admin.command("ping", maxTimeMS=5000)
            return True
        except Exception as e:
            self.logger.error(f"MongoDB connection error: {e}")
            return False

    def get_client(self):
        return self.client

    def get_database(self):
        return self.client[self.database]

    @staticmethod
    def serialize(document):
        if document is None:
            return None

        if "_id" in document:
            document["_id"] = str(document["_id"])

        return document

    async def find_one(self, collection_name, query, projection=None):
        collection = self.get_database()[collection_name]
        return await collection.find_one(query, projection=projection)

    async def find_many(self, collection_name, query, limit=100):
        collection = self.get_database()[collection_name]
        cursor = collection.find(query).limit(limit)
        return await cursor.to_list(length=limit)

    async def insert_one(self, collection_name, document):
        collection = self.get_database()[collection_name]

        if "created_at" not in document:
            document["created_at"] = datetime.now(timezone.utc)

        result = await collection.insert_one(document)
        return result.inserted_id

    async def log_event(
        self, job_id: str, action: str, request_body: dict
    ):
        collection_name = "events"
        collection = self.get_database()[collection_name]
        event = {
            "job_id": job_id,
            "action": action,
            "request_body": request_body,
            "created_at": datetime.now(timezone.utc),
        }
        result = await collection.insert_one(event)
        return result.inserted_id

    async def insert_many(self, collection_name, documents):
        collection = self.get_database()[collection_name]

        for document in documents:
            if "created_at" not in document:
                document["created_at"] = datetime.now(timezone.utc)

        result = await collection.insert_many(documents)
        return result.inserted_ids

    async def update_one(self, collection_name, query, update):
        collection = self.get_database()[collection_name]

        if "$set" not in update:
            update = {"$set": update}

        if "updated_at" not in update:
            update["$set"]["updated_at"] = datetime.now(timezone.utc)

        result = await collection.update_one(query, update)
        return result.modified_count

    async def update_many(self, collection_name, query, update):
        collection = self.get_database()[collection_name]

        if "$set" not in update:
            update = {"$set": update}

        if "updated_at" not in update["$set"]:
            update["$set"]["updated_at"] = datetime.now(timezone.utc)

        result = await collection.update_many(query, update)
        return result.modified_count

    async def delete_one(self, collection_name, query):
        collection = self.get_database()[collection_name]
        result = await collection.delete_one(query)
        return result.deleted_count

    async def delete_many(self, collection_name, query):
        collection = self.get_database()[collection_name]
        result = await collection.delete_many(query)
        return result.deleted_count

    def object_id(self, id_str):
        return ObjectId(id_str)
