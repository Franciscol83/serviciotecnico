"""
Dependencies para FastAPI
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import os

async def get_database() -> AsyncIOMotorDatabase:
    """
    Dependency para obtener la base de datos
    """
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    return db
