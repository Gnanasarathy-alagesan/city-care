from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

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
