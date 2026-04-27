from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, Text, select, update, UniqueConstraint, Boolean
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import anthropic
import json
import random
import hashlib
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from twilio.rest import Client

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ============== DATABASE SETUP ==============

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql+asyncpg://postgres:sec@UP52@localhost:5432/learn_afrikans')

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

# ============== DATABASE MODELS ==============

class UserDB(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone_number = Column(String, nullable=True)
    password = Column(String, nullable=False)
    interface_language = Column(String, default="en")
    skill_level = Column(String, default="beginner")
    streak = Column(Integer, default=0)
    last_active_date = Column(String, default="")
    total_points = Column(Integer, default=0)
    badges = Column(JSON, default=[])
    chat_count = Column(Integer, default=0)
    words_learned = Column(Integer, default=0)
    created_at = Column(String)
    # Verification Fields
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True) # For email
    sms_code = Column(String, nullable=True) # For SMS

class ProgressDB(Base):
    __tablename__ = "progress"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False)
    topic_id = Column(String, nullable=False)
    topic_name = Column(String)
    confidence_score = Column(Integer, default=0)
    lessons_completed = Column(Integer, default=0)
    quizzes_completed = Column(Integer, default=0)
    average_score = Column(Integer, default=0)

class LeaderboardDB(Base):
    __tablename__ = "leaderboard"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, unique=True, nullable=False)
    name = Column(String)
    total_points = Column(Integer, default=0)
    weekly_points = Column(Integer, default=0)
    streak = Column(Integer, default=0)
    skill_level = Column(String, default="beginner")

class QuizResultDB(Base):
    __tablename__ = "quiz_results"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False)
    topic_id = Column(String)
    score = Column(Integer, default=0)
    correct = Column(Integer, default=0)
    total = Column(Integer, default=0)
    time_taken = Column(Integer, default=0)
    completed_at = Column(String)

class BookDB(Base):
    __tablename__ = "books"
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=5)
    book_type = Column(String) # 'digital' or 'physical'
    cover_image = Column(String, nullable=True)
    pdf_url = Column(String, nullable=True) # For digital books

class PurchaseDB(Base):
    __tablename__ = "purchases"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False)
    book_id = Column(String, nullable=False)
    purchased_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())
    amount_paid = Column(Float)
    
    # DATABASE INTEGRITY: This constraint prevents the same user from buying the same book twice
    # SQL Equivalent: ALTER TABLE purchases ADD CONSTRAINT unique_user_book UNIQUE (user_id, book_id);
    __table_args__ = (UniqueConstraint('user_id', 'book_id', name='unique_user_book'),)

# ============== EMAIL CONFIG ==============

SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')
EMAIL_FROM = os.environ.get('EMAIL_FROM', 'noreply@learnafrikaans.com')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# ============== TWILIO CONFIG ==============

TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER')

async def send_verification_email(email: str, name: str, token: str):
    """
    Sends a verification email to the user.
    If SMTP is not configured, it logs the token for development.
    """
    verification_link = f"{FRONTEND_URL}/verify-email?token={token}&email={email}"
    
    subject = "Verify your Learn Afrikaans Account"
    body = f"""
    Halo {name}!
    
    Thank you for registering with Learn Afrikaans. 
    Please click the link below to verify your email address and activate your account:
    
    {verification_link}
    
    If you did not create this account, please ignore this email.
    
    Lekker leer!
    The Learn Afrikaans Team
    """

    if not SMTP_USERNAME or not SMTP_PASSWORD or "PASTE_YOUR" in SMTP_PASSWORD:
        print("\n" + "🚀" * 25)
        print("MOCK EMAIL SENT (DEVELOPMENT MODE)")
        print(f"To: {name} ({email})")
        print(f"VERIFICATION LINK: {verification_link}")
        print("🚀" * 25 + "\n")
        logger.warning("SMTP NOT CONFIGURED. Verification Token: %s", token)
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_FROM
        msg['To'] = email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"Verification email sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send email: {e}")

async def send_verification_sms(phone: str, code: str):
    """
    Sends a verification SMS via Twilio.
    If Twilio is not configured, it mocks sending by printing to terminal.
    """
    message_text = f"Your Learn Afrikaans verification code is: {code}"

    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_PHONE_NUMBER:
        print("\n" + "🚀"*30)
        print("🔥 MOCK SMS SERVICE - VERIFICATION CODE 🔥")
        print(f"👉 TO: {phone}")
        print(f"👉 CODE: {code}")
        print(f"👉 MESSAGE: {message_text}")
        print("🚀"*30 + "\n")
        logger.info(f"!!! MOCK VERIFICATION CODE FOR {phone} IS: {code} !!!")
        return

    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=message_text,
            from_=TWILIO_PHONE_NUMBER,
            to=phone
        )
        logger.info(f"Real SMS sent to {phone} via Twilio. SID: {message.sid}")
    except Exception as e:
        logger.error(f"Failed to send real SMS to {phone}: {e}")
        # Fallback to terminal if real SMS fails
        print("\n" + "❌"*30)
        print("FAILED TO SEND REAL SMS - FALLBACK TO MOCK")
        print(f"👉 ERROR: {str(e)}")
        print(f"👉 TO: {phone}")
        print(f"👉 CODE: {code}")
        print("❌"*30 + "\n")

# ============== JWT & APP CONFIG ==============

JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7

ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== DB SESSION DEPENDENCY ==============

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

# ============== MODELS ==============

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    phone_number: str
    password: str
    interface_language: str = "en"
    skill_level: str = "beginner"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str
    interface_language: str
    skill_level: str
    streak: int = 0
    total_points: int = 0
    badges: List[str] = []
    created_at: str

class QuizRequest(BaseModel):
    topic_id: str
    skill_level: str

class QuizSubmission(BaseModel):
    topic_id: str
    questions: List[Dict[str, Any]]
    answers: List[str]
    time_taken: int

class ChatMessage(BaseModel):
    message: str
    skill_level: str

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    interface_language: Optional[str] = None
    skill_level: Optional[str] = None

class BookPurchaseRequest(BaseModel):
    book_id: str

# ============== LESSON DATA ==============

LESSON_TOPICS = [
    {
        "id": "greetings",
        "name": {"en": "Greetings", "nso": "Matumelelo"},
        "description": {"en": "Basic greetings and farewells", "nso": "Matumelelo a motheo le go laela"},
        "difficulty": "beginner",
        "words": [
            {"afrikaans": "Hallo", "english": "Hello", "sepedi": "Dumela", "example": "Hallo, hoe gaan dit?"},
            {"afrikaans": "Goeie môre", "english": "Good morning", "sepedi": "Madume a mosong", "example": "Goeie môre, meneer."},
            {"afrikaans": "Totsiens", "english": "Goodbye", "sepedi": "Šala gabotse", "example": "Totsiens, sien jou môre!"},
            {"afrikaans": "Dankie", "english": "Thank you", "sepedi": "Ke a leboga", "example": "Baie dankie vir jou hulp."},
            {"afrikaans": "Asseblief", "english": "Please", "sepedi": "Ke a kgopela", "example": "Kan jy my help, asseblief?"},
            {"afrikaans": "Jammer", "english": "Sorry", "sepedi": "Tshwarelo", "example": "Ek is baie jammer."},
        ]
    },
    {
        "id": "numbers",
        "name": {"en": "Numbers", "nso": "Dinomoro"},
        "description": {"en": "Learn to count in Afrikaans", "nso": "Ithute go bala ka Seafrikanse"},
        "difficulty": "beginner",
        "words": [
            {"afrikaans": "Een", "english": "One", "sepedi": "Tee", "example": "Ek het een appel."},
            {"afrikaans": "Twee", "english": "Two", "sepedi": "Pedi", "example": "Daar is twee kinders."},
            {"afrikaans": "Drie", "english": "Three", "sepedi": "Tharo", "example": "Drie huise staan daar."},
            {"afrikaans": "Vier", "english": "Four", "sepedi": "Nne", "example": "Ek het vier broers."},
            {"afrikaans": "Vyf", "english": "Five", "sepedi": "Hlano", "example": "Vyf minute nog."},
            {"afrikaans": "Tien", "english": "Ten", "sepedi": "Lesome", "example": "Ek het tien rand."},
        ]
    },
    {
        "id": "family",
        "name": {"en": "Family", "nso": "Lapa"},
        "description": {"en": "Family members and relationships", "nso": "Maloko a lapa le dikamano"},
        "difficulty": "beginner",
        "words": [
            {"afrikaans": "Ma", "english": "Mother", "sepedi": "Mma", "example": "My ma is baie lief vir my."},
            {"afrikaans": "Pa", "english": "Father", "sepedi": "Tate", "example": "My pa werk hard."},
            {"afrikaans": "Broer", "english": "Brother", "sepedi": "Buti", "example": "My broer is ouer as ek."},
            {"afrikaans": "Suster", "english": "Sister", "sepedi": "Sesi", "example": "My suster studeer."},
            {"afrikaans": "Gesin", "english": "Family", "sepedi": "Lapa", "example": "Ons gesin is groot."},
        ]
    },
    {
        "id": "colors",
        "name": {"en": "Colors", "nso": "Mebala"},
        "description": {"en": "Learn colors in Afrikaans", "nso": "Ithute mebala ka Seafrikanse"},
        "difficulty": "beginner",
        "words": [
            {"afrikaans": "Rooi", "english": "Red", "sepedi": "Hubedu", "example": "Die appel is rooi."},
            {"afrikaans": "Blou", "english": "Blue", "sepedi": "Talalerata", "example": "Die lug is blou."},
            {"afrikaans": "Groen", "english": "Green", "sepedi": "Tala", "example": "Gras is groen."},
            {"afrikaans": "Geel", "english": "Yellow", "sepedi": "Serolwana", "example": "Die son is geel."},
            {"afrikaans": "Swart", "english": "Black", "sepedi": "Ntsho", "example": "My kat is swart."},
            {"afrikaans": "Wit", "english": "White", "sepedi": "Tšhweu", "example": "Sneeu is wit."},
        ]
    },
    {
        "id": "food",
        "name": {"en": "Food & Drinks", "nso": "Dijo le Dino"},
        "description": {"en": "Common food and drinks vocabulary", "nso": "Mantšu a dijo le dino"},
        "difficulty": "intermediate",
        "words": [
            {"afrikaans": "Brood", "english": "Bread", "sepedi": "Senkgwa", "example": "Ek eet brood vir ontbyt."},
            {"afrikaans": "Water", "english": "Water", "sepedi": "Meetse", "example": "Drink genoeg water."},
            {"afrikaans": "Vleis", "english": "Meat", "sepedi": "Nama", "example": "Ons braai vleis op Saterdag."},
            {"afrikaans": "Koffie", "english": "Coffee", "sepedi": "Kofi", "example": "Ek drink oggend koffie."},
        ]
    },
    {
        "id": "phrases",
        "name": {"en": "Common Phrases", "nso": "Dipolelo tše tlwaelegilego"},
        "description": {"en": "Useful everyday phrases", "nso": "Dipolelo tše di šomišwago ka mehla"},
        "difficulty": "intermediate",
        "words": [
            {"afrikaans": "Hoe gaan dit?", "english": "How are you?", "sepedi": "O kae?", "example": "Hallo! Hoe gaan dit met jou?"},
            {"afrikaans": "Dit gaan goed", "english": "I'm fine", "sepedi": "Ke gabotse", "example": "Dit gaan goed, dankie."},
            {"afrikaans": "Ek verstaan nie", "english": "I don't understand", "sepedi": "Ga ke kwešiše", "example": "Ek verstaan nie, praat stadiger asseblief."},
        ]
    },
]

WORD_OF_DAY_POOL = [
    {"afrikaans": "Lekker", "english": "Nice/Good", "sepedi": "Bose", "example": "Die kos is baie lekker!", "fun_fact": "South Africans use 'lekker' for almost everything good!"},
    {"afrikaans": "Braai", "english": "Barbecue", "sepedi": "Go besa", "example": "Kom ons braai vandag!", "fun_fact": "Braai is a national pastime in South Africa."},
    {"afrikaans": "Mooi", "english": "Beautiful", "sepedi": "Botse", "example": "Sy is baie mooi.", "fun_fact": "Also used to say 'well done' or 'great'."},
    {"afrikaans": "Kuier", "english": "To visit/hang out", "sepedi": "Go etela", "example": "Kom kuier by ons.", "fun_fact": "A social visit, usually with food and drinks."},
]

BADGES = {
    "first_lesson": {"name": {"en": "First Steps", "nso": "Dikgato tša Pele"}, "description": {"en": "Completed your first lesson", "nso": "O phethile thuto ya gago ya mathomo"}},
    "quiz_crusher": {"name": {"en": "Quiz Crusher", "nso": "Mofenya wa Dipotšišo"}, "description": {"en": "Scored 100% on a quiz", "nso": "O hweditše 100% dipotšišong"}},
    "week_warrior": {"name": {"en": "Week Warrior", "nso": "Mohlabani wa Beke"}, "description": {"en": "7 day streak", "nso": "Beke ya go latellana"}},
    "vocabulary_master": {"name": {"en": "Word Wizard", "nso": "Mohlodi wa Mantšu"}, "description": {"en": "Learned 100 words", "nso": "O ithutile mantšu a 100"}},
}

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {"user_id": user_id, "exp": expiration}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def user_to_dict(user: UserDB) -> dict:
    return {
        "id": user.id, "name": user.name, "email": user.email,
        "interface_language": user.interface_language, "skill_level": user.skill_level,
        "streak": user.streak, "total_points": user.total_points,
        "badges": user.badges or [], "chat_count": user.chat_count,
        "words_learned": user.words_learned, "created_at": user.created_at,
        "last_active_date": user.last_active_date
    }

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        result = await db.execute(select(UserDB).where(UserDB.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user_to_dict(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register")
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserDB).where(UserDB.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    user = UserDB(
        id=user_id, name=user_data.name, email=user_data.email,
        phone_number=user_data.phone_number,
        password=hash_password(user_data.password),
        interface_language=user_data.interface_language,
        skill_level=user_data.skill_level, streak=0,
        last_active_date=now[:10], total_points=0,
        badges=[], chat_count=0, words_learned=0, created_at=now,
        is_verified=True,
        verification_token=None,
        sms_code=None
    )
    db.add(user)

    for topic in LESSON_TOPICS:
        db.add(ProgressDB(
            id=str(uuid.uuid4()), user_id=user_id,
            topic_id=topic["id"], topic_name=topic["name"]["en"],
            confidence_score=0, lessons_completed=0, quizzes_completed=0, average_score=0
        ))

    db.add(LeaderboardDB(
        id=str(uuid.uuid4()), user_id=user_id, name=user_data.name,
        total_points=0, weekly_points=0, streak=0, skill_level=user_data.skill_level
    ))

    await db.commit()
    
    return {
        "message": "Registration successful. You can now log in.",
        "email": user_data.email
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserDB).where(UserDB.email == credentials.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    token = create_token(user.id)
    return {"token": token, "user": user_to_dict(user)}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

# ============== USER ROUTES ==============

@api_router.put("/users/profile")
async def update_profile(updates: UpdateProfileRequest, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    update_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
    if update_dict:
        await db.execute(update(UserDB).where(UserDB.id == user["id"]).values(**update_dict))
        if "name" in update_dict:
            await db.execute(update(LeaderboardDB).where(LeaderboardDB.user_id == user["id"]).values(name=update_dict["name"]))
        if "skill_level" in update_dict:
            await db.execute(update(LeaderboardDB).where(LeaderboardDB.user_id == user["id"]).values(skill_level=update_dict["skill_level"]))
        await db.commit()
    result = await db.execute(select(UserDB).where(UserDB.id == user["id"]))
    updated = result.scalar_one_or_none()
    return user_to_dict(updated)

@api_router.post("/users/update-streak")
async def update_streak(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    last_active = user.get("last_active_date", "")

    if last_active == today:
        return {"streak": user["streak"], "message": "Already active today"}

    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
    new_streak = user["streak"] + 1 if last_active == yesterday else 1

    await db.execute(update(UserDB).where(UserDB.id == user["id"]).values(streak=new_streak, last_active_date=today))
    await db.execute(update(LeaderboardDB).where(LeaderboardDB.user_id == user["id"]).values(streak=new_streak))

    badges_to_add = list(user.get("badges", []))
    if new_streak >= 7 and "week_warrior" not in badges_to_add:
        badges_to_add.append("week_warrior")

    if len(badges_to_add) != len(user.get("badges", [])):
        await db.execute(update(UserDB).where(UserDB.id == user["id"]).values(badges=badges_to_add))

    await db.commit()
    return {"streak": new_streak, "badges_earned": [b for b in badges_to_add if b not in user.get("badges", [])]}

# ============== LESSONS ROUTES ==============

@api_router.get("/lessons/topics")
async def get_topics(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    lang = user.get("interface_language", "en")
    skill = user.get("skill_level", "beginner")
    topics_with_progress = []

    for topic in LESSON_TOPICS:
        if skill == "beginner" and topic["difficulty"] != "beginner":
            continue
        elif skill == "intermediate" and topic["difficulty"] == "pro":
            continue

        result = await db.execute(select(ProgressDB).where(
            ProgressDB.user_id == user["id"], ProgressDB.topic_id == topic["id"]
        ))
        progress = result.scalar_one_or_none()

        topics_with_progress.append({
            "id": topic["id"],
            "name": topic["name"].get("nso" if lang == "nso" else "en", topic["name"]["en"]),
            "description": topic["description"].get("nso" if lang == "nso" else "en", topic["description"]["en"]),
            "difficulty": topic["difficulty"],
            "word_count": len(topic["words"]),
            "progress": {
                "confidence_score": progress.confidence_score if progress else 0,
                "lessons_completed": progress.lessons_completed if progress else 0
            }
        })

    return topics_with_progress

@api_router.get("/lessons/{topic_id}")
async def get_lesson(topic_id: str, user: dict = Depends(get_current_user)):
    topic = next((t for t in LESSON_TOPICS if t["id"] == topic_id), None)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    lang = user.get("interface_language", "en")
    return {
        "id": topic["id"],
        "name": topic["name"].get("nso" if lang == "nso" else "en", topic["name"]["en"]),
        "description": topic["description"].get("nso" if lang == "nso" else "en", topic["description"]["en"]),
        "difficulty": topic["difficulty"],
        "words": topic["words"]
    }

@api_router.post("/lessons/{topic_id}/complete")
async def complete_lesson(topic_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProgressDB).where(
        ProgressDB.user_id == user["id"], ProgressDB.topic_id == topic_id
    ))
    progress = result.scalar_one_or_none()
    if progress:
        await db.execute(update(ProgressDB).where(
            ProgressDB.user_id == user["id"], ProgressDB.topic_id == topic_id
        ).values(lessons_completed=progress.lessons_completed + 1))

    points = 10
    new_words = user.get("words_learned", 0) + 8
    await db.execute(update(UserDB).where(UserDB.id == user["id"]).values(
        total_points=UserDB.total_points + points,
        words_learned=UserDB.words_learned + 8
    ))
    await db.execute(update(LeaderboardDB).where(LeaderboardDB.user_id == user["id"]).values(
        total_points=LeaderboardDB.total_points + points,
        weekly_points=LeaderboardDB.weekly_points + points
    ))

    badges_earned = []
    current_badges = list(user.get("badges", []))
    if "first_lesson" not in current_badges:
        current_badges.append("first_lesson")
        badges_earned.append("first_lesson")
    if new_words >= 100 and "vocabulary_master" not in current_badges:
        current_badges.append("vocabulary_master")
        badges_earned.append("vocabulary_master")

    if badges_earned:
        await db.execute(update(UserDB).where(UserDB.id == user["id"]).values(badges=current_badges))

    await db.commit()
    return {"points_earned": points, "badges_earned": badges_earned}

# ============== QUIZ ROUTES ==============

@api_router.post("/quiz/generate")
async def generate_quiz(request: QuizRequest, user: dict = Depends(get_current_user)):
    topic = next((t for t in LESSON_TOPICS if t["id"] == request.topic_id), None)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    skill_level = request.skill_level
    num_questions = 5 if skill_level == "beginner" else (7 if skill_level == "intermediate" else 10)

    if anthropic_client:
        try:
            prompt = f"""Generate {num_questions} quiz questions for learning Afrikaans.
Topic: {topic["name"]["en"]}
Skill Level: {skill_level}
Vocabulary: {json.dumps(topic["words"])}

Return ONLY a JSON array (no markdown) in this exact format:
[{{"question": "...", "options": ["A","B","C","D"], "correct_answer": "A", "explanation": "..."}}]"""

            response = anthropic_client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )
            cleaned = response.content[0].text.strip().strip("```json").strip("```").strip()
            questions = json.loads(cleaned)
            return {"questions": questions, "topic_id": request.topic_id}
        except Exception as e:
            logger.error(f"Quiz generation error: {e}")

    # Fallback: generate basic questions from vocabulary
    questions = []
    words = topic["words"][:]
    random.shuffle(words)
    for word in words[:num_questions]:
        wrong = [w["english"] for w in topic["words"] if w["english"] != word["english"]][:3]
        options = [word["english"]] + wrong
        random.shuffle(options)
        questions.append({
            "question": f"What does '{word['afrikaans']}' mean in English?",
            "options": options,
            "correct_answer": word["english"],
            "explanation": f"'{word['afrikaans']}' means '{word['english']}'. Example: {word['example']}"
        })
    return {"questions": questions, "topic_id": request.topic_id}

@api_router.post("/quiz/submit")
async def submit_quiz(submission: QuizSubmission, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    correct = sum(1 for i, q in enumerate(submission.questions) if submission.answers[i] == q["correct_answer"])
    total = len(submission.questions)
    score = int((correct / total) * 100)
    points = correct * 5
    wrong_answers = [
        {"question": q["question"], "your_answer": submission.answers[i], "correct_answer": q["correct_answer"]}
        for i, q in enumerate(submission.questions) if submission.answers[i] != q["correct_answer"]
    ]

    await db.execute(update(UserDB).where(UserDB.id == user["id"]).values(total_points=UserDB.total_points + points))
    await db.execute(update(LeaderboardDB).where(LeaderboardDB.user_id == user["id"]).values(
        total_points=LeaderboardDB.total_points + points,
        weekly_points=LeaderboardDB.weekly_points + points
    ))

    result = await db.execute(select(ProgressDB).where(
        ProgressDB.user_id == user["id"], ProgressDB.topic_id == submission.topic_id
    ))
    progress = result.scalar_one_or_none()
    if progress:
        new_quizzes = progress.quizzes_completed + 1
        new_avg = int((progress.average_score * (new_quizzes - 1) + score) / new_quizzes)
        new_confidence = min(100, new_avg + (new_quizzes * 2))
        await db.execute(update(ProgressDB).where(
            ProgressDB.user_id == user["id"], ProgressDB.topic_id == submission.topic_id
        ).values(quizzes_completed=new_quizzes, average_score=new_avg, confidence_score=new_confidence))

    db.add(QuizResultDB(
        id=str(uuid.uuid4()), user_id=user["id"], topic_id=submission.topic_id,
        score=score, correct=correct, total=total,
        time_taken=submission.time_taken, completed_at=datetime.now(timezone.utc).isoformat()
    ))

    badges_earned = []
    current_badges = list(user.get("badges", []))
    if score == 100 and "quiz_crusher" not in current_badges:
        current_badges.append("quiz_crusher")
        badges_earned.append("quiz_crusher")
        await db.execute(update(UserDB).where(UserDB.id == user["id"]).values(badges=current_badges))

    await db.commit()

    feedback = f"You scored {score}%! " + ("Excellent work!" if score >= 80 else "Keep practicing!")
    if anthropic_client:
        try:
            response = anthropic_client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=150,
                messages=[{"role": "user", "content": f"Student scored {score}% ({correct}/{total}). Wrong: {wrong_answers if wrong_answers else 'None'}. Give 2 sentence encouraging feedback."}]
            )
            feedback = response.content[0].text
        except Exception as e:
            logger.error(f"Feedback error: {e}")

    return {"score": score, "correct": correct, "total": total, "points_earned": points,
            "wrong_answers": wrong_answers, "feedback": feedback, "badges_earned": badges_earned}

# ============== CHATBOT ROUTES ==============

@api_router.post("/chatbot/message")
async def chatbot_message(message: ChatMessage, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    skill_level = message.skill_level
    
    # Improved system messages for a more natural and helpful AI tutor
    system_messages = {
        "beginner": (
            "You are 'Lekker AI', a warm and patient Afrikaans tutor for absolute beginners. "
            "Your goal is to build confidence. Use English for most explanations, "
            "but ALWAYS include at least 3-5 Afrikaans words or short phrases in every response. "
            "Format Afrikaans words in **bold** followed by English in parentheses. "
            "Example: 'That is **baie goed** (very good)!' "
            "Always end with a simple question in Afrikaans to encourage the user. "
            "Focus on high-frequency vocabulary and correct basic mistakes gently."
        ),
        "intermediate": (
            "You are 'Lekker AI', an encouraging Afrikaans conversation partner for intermediate learners. "
            "Use a mix of roughly 50% Afrikaans and 50% English (code-switching). "
            "When the user makes a mistake, provide the correct Afrikaans version and a brief explanation of the grammar rule. "
            "Introduce common South African idioms and slightly more complex sentence structures. "
            "Ask open-ended questions in Afrikaans to keep the conversation flowing. "
            "If the user asks a question in English, answer in Afrikaans first, then provide the English translation."
        ),
        "pro": (
            "You are 'Lekker AI', a native Afrikaans speaker engaging in advanced, natural conversation. "
            "Respond 90-100% in Afrikaans. Use rich, sophisticated vocabulary and natural slang where appropriate. "
            "Challenge the user's opinions and engage in deep discussions about culture, history, or current events. "
            "Correct even subtle errors in word order (stelsin) or nuance. "
            "Only use English for extremely complex technical terms that don't have a common Afrikaans equivalent."
        )
    }

    system_msg = system_messages.get(skill_level, system_messages["beginner"])
    
    # Add context about the user's progress and current stats
    user_context = (
        f"\n\nCONTEXT: You are talking to {user['name']}. "
        f"They are currently at the '{skill_level}' level. "
        f"They have earned {user['total_points']} points and have a {user['streak']}-day streak. "
        f"They have learned {user.get('words_learned', 0)} words so far. "
        f"Be encouraging and refer to their progress if it feels natural."
    )
    system_msg += user_context

    # Dynamic fallbacks in case the API is unavailable
    fallbacks = {
        "beginner": [
            "Hallo! Ek is jou Afrikaanse onderwyser. Kom ons leer saam! (Let's learn together!)",
            "Goeiedag! Ek is reg om jou te help met Afrikaans. Wat wil jy vandag leer? (What do you want to learn today?)",
            "Welkom! Jy doen uitstekend met jou punte. Hoe kan ek help? (How can I help?)"
        ],
        "intermediate": [
            "Goeiedag! Dit is lekker om weer met jou te gesels. Hoe gaan dit met jou studies?",
            "Hallo! Ek sien jy vorder baie goed. Waaroor wil jy vandag gesels?",
            "Aangename kennis! Kom ons oefen jou Afrikaans 'n bietjie meer vandag."
        ],
        "pro": [
            "Bly om jou weer te sien! Jou Afrikaans klink al hoe meer soos 'n moedertaalspreker s'n.",
            "Goeiedag! Ek is gereed vir 'n diep gesprek vandag. Waarop wil jy fokus?",
            "Dit is altyd 'n voorreg om met iemand van jou kaliber te gesels. Wat is op jou hart?"
        ]
    }

    # Pick a random fallback from the list
    possible_fallbacks = fallbacks.get(skill_level, fallbacks["beginner"])
    response_text = random.choice(possible_fallbacks)

    if anthropic_client:
        try:
            # Use the latest Claude 3.5 Sonnet for the best performance
            model_name = "claude-3-5-sonnet-20240620"
            logger.info(f"Sending message to Anthropic ({model_name}) for user {user['id']}")
            
            response = anthropic_client.messages.create(
                model=model_name,
                max_tokens=500,
                system=system_msg,
                messages=[{"role": "user", "content": message.message}]
            )
            response_text = response.content[0].text
            logger.info(f"Received response from {model_name}")
            
        except Exception as e:
            logger.error(f"Chatbot primary model error: {e}")
            try:
                # Fallback to a reliable and fast model (Claude 3 Haiku)
                fallback_model = "claude-3-haiku-20240307"
                logger.info(f"Attempting fallback with {fallback_model}")
                response = anthropic_client.messages.create(
                    model=fallback_model,
                    max_tokens=400,
                    system=system_msg,
                    messages=[{"role": "user", "content": message.message}]
                )
                response_text = response.content[0].text
                logger.info(f"Received response from fallback model {fallback_model}")
            except Exception as e2:
                logger.error(f"Chatbot critical failure (both models failed): {e2}")
                # response_text remains the random fallback selected above

    await db.execute(update(UserDB).where(UserDB.id == user["id"]).values(chat_count=UserDB.chat_count + 1))

    badges_earned = []
    result = await db.execute(select(UserDB).where(UserDB.id == user["id"]))
    updated_user = result.scalar_one_or_none()
    current_badges = list(updated_user.badges or [])
    if updated_user.chat_count >= 10 and "chatbot_champion" not in current_badges:
        current_badges.append("chatbot_champion")
        badges_earned.append("chatbot_champion")
        await db.execute(update(UserDB).where(UserDB.id == user["id"]).values(badges=current_badges))

    await db.commit()
    return {"response": response_text, "badges_earned": badges_earned}

# ============== LEADERBOARD ROUTES ==============

@api_router.get("/leaderboard")
async def get_leaderboard(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    all_result = await db.execute(select(LeaderboardDB).order_by(LeaderboardDB.total_points.desc()).limit(10))
    all_time = [{"user_id": r.user_id, "name": r.name, "total_points": r.total_points, "streak": r.streak, "skill_level": r.skill_level} for r in all_result.scalars()]

    weekly_result = await db.execute(select(LeaderboardDB).order_by(LeaderboardDB.weekly_points.desc()).limit(10))
    weekly = [{"user_id": r.user_id, "name": r.name, "weekly_points": r.weekly_points, "streak": r.streak} for r in weekly_result.scalars()]

    all_entries_result = await db.execute(select(LeaderboardDB).order_by(LeaderboardDB.total_points.desc()))
    all_entries = all_entries_result.scalars().all()
    user_rank = next((i + 1 for i, e in enumerate(all_entries) if e.user_id == user["id"]), 0)

    user_entry_result = await db.execute(select(LeaderboardDB).where(LeaderboardDB.user_id == user["id"]))
    user_entry = user_entry_result.scalar_one_or_none()
    user_stats = {"user_id": user_entry.user_id, "name": user_entry.name, "total_points": user_entry.total_points, "weekly_points": user_entry.weekly_points, "streak": user_entry.streak} if user_entry else {}

    return {"all_time": all_time, "weekly": weekly, "user_rank": user_rank, "user_stats": user_stats}

# ============== PROGRESS & DASHBOARD ==============

@api_router.get("/progress")
async def get_progress(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProgressDB).where(ProgressDB.user_id == user["id"]))
    return [{"topic_id": p.topic_id, "topic_name": p.topic_name, "confidence_score": p.confidence_score,
             "lessons_completed": p.lessons_completed, "quizzes_completed": p.quizzes_completed,
             "average_score": p.average_score} for p in result.scalars()]

@api_router.get("/dashboard")
async def get_dashboard(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    progress_result = await db.execute(select(ProgressDB).where(ProgressDB.user_id == user["id"]))
    progress = [{"topic_id": p.topic_id, "confidence_score": p.confidence_score, "lessons_completed": p.lessons_completed} for p in progress_result.scalars()]

    quiz_result = await db.execute(select(QuizResultDB).where(QuizResultDB.user_id == user["id"]).order_by(QuizResultDB.completed_at.desc()).limit(5))
    recent_quizzes = [{"topic_id": q.topic_id, "score": q.score, "completed_at": q.completed_at} for q in quiz_result.scalars()]

    all_entries = (await db.execute(select(LeaderboardDB).order_by(LeaderboardDB.total_points.desc()))).scalars().all()
    user_rank = next((i + 1 for i, e in enumerate(all_entries) if e.user_id == user["id"]), 0)

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    word_index = int(hashlib.md5(today.encode()).hexdigest(), 16) % len(WORD_OF_DAY_POOL)
    word_of_day = WORD_OF_DAY_POOL[word_index]

    lowest = min(progress, key=lambda x: x.get("confidence_score", 0)) if progress else None

    return {"user": user, "progress": progress, "recent_quizzes": recent_quizzes,
            "rank": user_rank, "word_of_day": word_of_day, "recommended_topic": lowest, "badges": BADGES}

@api_router.get("/word-of-day")
async def get_word_of_day():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    word_index = int(hashlib.md5(today.encode()).hexdigest(), 16) % len(WORD_OF_DAY_POOL)
    return WORD_OF_DAY_POOL[word_index]

@api_router.get("/bookstore/books")
async def get_books(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BookDB))
    books = result.scalars().all()
    
    # Get user's purchases
    purchase_result = await db.execute(select(PurchaseDB).where(PurchaseDB.user_id == user["id"]))
    purchased_book_ids = {p.book_id for p in purchase_result.scalars()}
    
    # Convert to dict for response
    return [{
        "id": b.id, "title": b.title, "author": b.author,
        "description": b.description, "price": b.price,
        "stock": b.stock, "book_type": b.book_type,
        "cover_image": b.cover_image, "pdf_url": b.pdf_url,
        "purchased": b.id in purchased_book_ids
    } for b in books]

@api_router.post("/bookstore/purchase")
async def purchase_book(
    request: BookPurchaseRequest, 
    user: dict = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    try:
        logger.info(f"Purchase request for book_id: {request.book_id} from user: {user.get('id')}")
        
        # ── STEP 1: Check if user already bought this book ────────────── 
        # SQL: SELECT * FROM purchases WHERE user_id = :u AND book_id = :b;
        stmt_check = select(PurchaseDB).where(
            PurchaseDB.user_id == user["id"],
            PurchaseDB.book_id == request.book_id
        )
        existing_purchase = await db.execute(stmt_check)
        if existing_purchase.scalar_one_or_none():
            raise HTTPException(
                status_code=400, 
                detail="You have already purchased this book."
            )

        # ── STEP 2: Lock the book row (concurrency control) ───────────── 
        # with_for_update() places a row-level lock. 
        # If two users hit this simultaneously, the second waits 
        # until the first transaction commits or rolls back. 
        # SQL: SELECT * FROM books WHERE id = :id FOR UPDATE;
        result = await db.execute(
            select(BookDB)
            .where(BookDB.id == request.book_id)
            .with_for_update()  # <-- KEY: row-level lock
        )
        book = result.scalar_one_or_none()
        
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        # ── STEP 3: Check stock AFTER acquiring lock ───────────────────── 
        # This is critical — without the lock, two users could both 
        # read stock=1, both pass this check, and both decrement to 0 
        if book.stock <= 0:
            raise HTTPException(
                status_code=400, 
                detail="Sorry, this book is out of stock. Another user just bought the last copy!"
            )
            
        # ── STEP 4: Reduce stock & record purchase ─────────────────────── 
        # SQL: UPDATE books SET stock = stock - 1 WHERE id = :id;
        if book.book_type == 'physical':
            book.stock -= 1
        
        # Record the purchase
        # SQL: INSERT INTO purchases (user_id, book_id) VALUES (:u, :b);
        purchase = PurchaseDB(
            id=str(uuid.uuid4()),
            user_id=user["id"], 
            book_id=book.id,
            purchased_at=datetime.now(timezone.utc).isoformat(),
            amount_paid=book.price
        )
        db.add(purchase)
        
        # ── STEP 5: Commit — releases the row lock ─────────────────────── 
        # SQL: COMMIT;
        await db.commit()
        
        logger.info(
            f"PURCHASE SUCCESS: User '{user['name']}' bought '{book.title}'. " 
            f"Stock remaining: {book.stock}" 
        )

        return {
            "success": True,
            "message": f"Successfully purchased '{book.title}'!", 
            "remaining_stock": book.stock, 
            "book_type": book.book_type, 
            "download_url": book.pdf_url if book.book_type == "digital" else None, 
            "transaction_id": purchase.id, 
            "amount_paid": book.price
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        await db.rollback()
        # Check for unique constraint violation (Database Level)
        # SQL: Error code 23505 (Unique Violation)
        error_msg = str(e)
        if "unique_user_book" in error_msg or "23505" in error_msg:
            logger.warning(f"Duplicate purchase prevented by DB constraint for user {user['id']}")
            raise HTTPException(status_code=400, detail="You have already purchased this book. (DB Verified)")
            
        logger.error(f"Purchase error: {error_msg}")
        raise HTTPException(status_code=500, detail=str(e))

# ── See purchase history ───────────────────────────────────────────────────── 
@api_router.get("/bookstore/my-purchases")
async def get_my_purchases(
    user: dict = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PurchaseDB, BookDB)
        .join(BookDB, PurchaseDB.book_id == BookDB.id)
        .where(PurchaseDB.user_id == user["id"])
        .order_by(PurchaseDB.purchased_at.desc())
    )
    rows = result.all()
    return [
        {
            "transaction_id": p.id,
            "book_title": b.title,
            "book_author": b.author,
            "amount_paid": p.amount_paid,
            "purchased_at": p.purchased_at,
            "download_url": b.pdf_url if b.book_type == "digital" else None
        }
        for p, b in rows
    ]

@api_router.post("/bookstore/notify")
async def bookstore_notify(data: Dict[str, Any], db: AsyncSession = Depends(get_db)):
    # This endpoint would handle PayFast ITN notifications in a real app
    logger.info(f"Received PayFast notification: {data}")
    return {"status": "ok"}

@api_router.get("/badges")
async def get_all_badges(user: dict = Depends(get_current_user)):
    lang = user.get("interface_language", "en")
    lang_key = "nso" if lang == "nso" else "en"
    user_badges = user.get("badges", [])
    return [{"id": bid, "name": info["name"].get(lang_key, info["name"]["en"]),
             "description": info["description"].get(lang_key, info["description"]["en"]),
             "earned": bid in user_badges} for bid, info in BADGES.items()]

@api_router.get("/")
async def root():
    return {"message": "LearnAfrikaans API is running"}

# ============== STARTUP ==============

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("\n" + "✨"*35)
    print("🌍 LEARN AFRIKAANS BACKEND IS RUNNING")
    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER:
        print("📱 SMS MODE: REAL (Using Twilio)")
    else:
        print("📱 SMS MODE: MOCK (Codes print in THIS terminal)")
    print("📧 EMAIL MODE: MOCK (Links print in THIS terminal)")
    print("✨"*35 + "\n")
    logger.info("Database tables verified/created")

    # Seed books if they don't exist
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(BookDB))
        if not result.scalars().first():
            books = [
                BookDB(
                    id="book_1",
                    title="Afrikaans vir Almal",
                    author="J. du Toit",
                    description="A comprehensive guide to learning Afrikaans for everyone.",
                    price=250.0,
                    stock=5,
                    book_type="physical",
                    pdf_url="/books/afrikaans_almal.pdf"
                ),
                BookDB(
                    id="book_2",
                    title="Die Kuns van Braai",
                    author="Jan Braai",
                    description="Master the South African art of the braai.",
                    price=350.0,
                    stock=5,
                    book_type="physical",
                    pdf_url="/books/kuns_braai.pdf"
                ),
                BookDB(
                    id="book_3",
                    title="Stories van die Karoo",
                    author="Sarah van Wyk",
                    description="Beautiful short stories set in the heart of the Karoo.",
                    price=150.0,
                    stock=5,
                    book_type="digital",
                    pdf_url="/books/stories_karoo.pdf"
                ),
                BookDB(
                    id="book_4",
                    title="Leer Afrikaans in 30 Dae",
                    author="Prof. S. Marais",
                    description="A fast-track course for busy people.",
                    price=200.0,
                    stock=5,
                    book_type="physical",
                    pdf_url="/books/leer_afrikaans.pdf"
                ),
                BookDB(
                    id="book_5",
                    title="Gedigte vir die Siel",
                    author="Breyten Breytenbach",
                    description="Soulful Afrikaans poetry from a master.",
                    price=120.0,
                    stock=5,
                    book_type="digital",
                    pdf_url="/books/gedigte_siel.pdf"
                )
            ]
            db.add_all(books)
            await db.commit()
            logger.info("Books seeded successfully")

app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)