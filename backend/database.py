import os

from dao import Service, User
from passlib.context import CryptContext
from seed import SERVICES_DATA
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./citycare.db")

# Create engine
if "sqlite" in DATABASE_URL:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()


# Dependency to get database session
def get_database():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Initialize default data
def init_default_data(db: Session):
    # Create admin user if not exists
    admin_user = db.query(User).filter(User.email == "admin@admin.com").first()
    if not admin_user:
        admin_user = User(
            first_name="Admin",
            last_name="User",
            email="admin@admin.com",
            password_hash=get_password_hash("admin"),
            is_admin=True,
        )
        db.add(admin_user)

    # Create services if not exist

    for service_data in SERVICES_DATA:
        existing_service = (
            db.query(Service).filter(Service.id == service_data["id"]).first()
        )
        if not existing_service:
            service = Service(**service_data)
            db.add(service)

    db.commit()
