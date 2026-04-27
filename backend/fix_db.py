import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def fix_database():
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        print("Dropping existing tables to refresh schema...")
        # Drop tables in order of dependency
        await conn.execute(text("DROP TABLE IF EXISTS progress CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS leaderboard CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS purchases CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
        print("Tables dropped successfully.")
        
    print("Now restart your server.py and it will recreate the tables with the new phone_number and sms_code columns.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix_database())
