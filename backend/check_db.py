
import asyncio
from sqlalchemy import select, text, update
from server import engine, Base, BookDB, PurchaseDB, AsyncSessionLocal, UserDB

async def check_db():
    try:
        async with engine.begin() as conn:
            # DROP the users table to fix schema mismatch (add is_verified)
            # DANGER: This will delete all users!
            await conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
            print("Dropped users table to fix schema mismatch")
            
            # DROP the purchases table to fix schema mismatch
            await conn.execute(text("DROP TABLE IF EXISTS purchases CASCADE"))
            print("Dropped purchases table to fix schema mismatch")
            
            # This will show what tables exist
            from sqlalchemy import inspect
            def get_tables(connection):
                return inspect(connection).get_table_names()
            
            tables = await conn.run_sync(get_tables)
            print(f"Existing tables after drop: {tables}")
            
            # Recreate all
            await conn.run_sync(Base.metadata.create_all)
            print("Successfully ran create_all")

        async with AsyncSessionLocal() as db:
            # MANUALLY VERIFY ALL USERS (for dev convenience)
            await db.execute(update(UserDB).values(is_verified=True, verification_token=None))
            await db.commit()
            print("Successfully verified all users in the database!")

            # Check users
            res_u = await db.execute(select(UserDB))
            users = res_u.scalars().all()
            print(f"Users count: {len(users)}")
            
            # Check books
            res = await db.execute(select(BookDB))
            books = res.scalars().all()
            print(f"Books count: {len(books)}")
            for b in books:
                print(f"- {b.title} (Stock: {b.stock})")
                
            # Check purchases
            try:
                res_p = await db.execute(select(PurchaseDB))
                purchases = res_p.scalars().all()
                print(f"Purchases count: {len(purchases)}")
            except Exception as e:
                print(f"Error checking purchases: {e}")

    except Exception as e:
        print(f"Global error: {e}")

if __name__ == "__main__":
    asyncio.run(check_db())
