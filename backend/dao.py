import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    create_engine,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

Base = declarative_base()
import os

from dotenv import load_dotenv

load_dotenv(".env.local")

# Configuration

ACCESS_TOKEN_EXPIRE_MINUTES = 30
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./citycare.db")

COMPLAINT_RESOURCES = Table(
    "complaint_resources",
    Base.metadata,
    Column("complaint_id", String, ForeignKey("complaints.id"), primary_key=True),
    Column("resource_id", String, ForeignKey("resources.id"), primary_key=True),
    Column("assigned_at", DateTime, default=datetime.utcnow),
    Column("assigned_by", String(100), nullable=False),
)


# Database Models
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    district = Column(String(50), nullable=True)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)

    complaints = relationship("Complaint", back_populates="reporter")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(
        String, primary_key=True, default=lambda: f"CC-{str(uuid.uuid4())[:8].upper()}"
    )
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    service_type = Column(String(50), nullable=False)
    status = Column(String(20), default="Open")
    priority = Column(String(10), default="Medium")
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    location_address = Column(Text, nullable=True)
    location_district = Column(String(50), nullable=True)
    reporter_id = Column(String, ForeignKey("users.id"), nullable=False)
    assigned_to = Column(String(100), nullable=True)
    team_id = Column(String(50), nullable=True)
    estimated_resolution = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reporter = relationship("User", back_populates="complaints")
    status_history = relationship("ComplaintStatusHistory", back_populates="complaint")
    images = relationship("ComplaintImage", back_populates="complaint")
    resources = relationship(
        "Resource", secondary=COMPLAINT_RESOURCES, back_populates="complaints"
    )


class ComplaintStatusHistory(Base):
    __tablename__ = "complaint_status_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    status = Column(String(20), nullable=False)
    note = Column(Text, nullable=True)
    updated_by = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="status_history")


class ComplaintImage(Base):
    __tablename__ = "complaint_images"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    image_url = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="images")


class Service(Base):
    __tablename__ = "services"

    id = Column(String, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String(50), nullable=False)
    examples = Column(Text, nullable=False)  # JSON string


class Resource(Base):
    __tablename__ = "resources"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # Equipment, Personnel, Vehicle, etc.
    service_category = Column(
        String(50), nullable=False
    )  # roads, water, electricity, etc.
    description = Column(Text, nullable=True)
    availability_status = Column(
        String(20), default="Available"
    )  # Available, Busy, Maintenance
    contact_person = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(100), nullable=True)
    location = Column(String(200), nullable=True)
    capacity = Column(Integer, nullable=True)  # For equipment/vehicles
    hourly_rate = Column(Float, nullable=True)  # Cost per hour
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    complaints = relationship(
        "Complaint", secondary=COMPLAINT_RESOURCES, back_populates="resources"
    )


class ResourceAssignment(Base):
    __tablename__ = "resource_assignments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    resource_id = Column(String, ForeignKey("resources.id"), nullable=False)
    assigned_by = Column(String(100), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    status = Column(
        String(20), default="Assigned"
    )  # Assigned, In Progress, Completed, Cancelled
    notes = Column(Text, nullable=True)
    estimated_hours = Column(Float, nullable=True)
    actual_hours = Column(Float, nullable=True)

    complaint = relationship("Complaint")
    resource = relationship("Resource")


# Create tables


engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
