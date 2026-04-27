import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def verify_user(email):
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        print(f"Manually verifying user: {email}")
        result = await conn.execute(
            text("UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE email = :email"),
            {"email": email}
        )
        if result.rowcount > 0:
            print(f"✅ Success! User {email} is now verified.")
        else:
            print(f"❌ Failed! User with email {email} not found.")
            
    await engine.dispose()

if __name__ == "__main__":
    email = input("Enter the email address you want to verify: ").strip()
    if email:
        asyncio.run(verify_user(email))
    else:
        print("No email provided.")
