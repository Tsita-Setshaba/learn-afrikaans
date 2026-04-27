import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from server import Base, UserDB, ProgressDB, LeaderboardDB, PurchaseDB
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql+asyncpg://postgres:sec@UP52@localhost:5432/learn_afrikans')

async def create_tables():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        print("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("Tables created successfully.")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_tables())
