import os
import re
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from dao import SessionLocal
from dotenv import load_dotenv
from fastapi.security import HTTPBearer
from passlib.context import CryptContext

load_dotenv(".env.local")


def camel_to_snake(name: str) -> str:
    return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()


# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

# JWT token handling
security = HTTPBearer()


# Utility functions
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def fallback_priority(response: str):
    """
    Fallback function to handle unexpected responses.
    """
    if response.lower() not in ("low", "medium", "high"):
        return "Medium"
    else:
        return response.capitalize()
