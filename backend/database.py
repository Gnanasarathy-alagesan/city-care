import os
from sqlalchemy import and_

from dao import (
    Service,
    User,
    Resource,
    Complaint,
    ComplaintImage,
    ComplaintStatusHistory,
    ResourceAssignment,
    COMPLAINT_RESOURCES,
)
from passlib.context import CryptContext
from seed import (
    SERVICES_DATA,
    USERS_DATA,
    RESOURCES_DATA,
    COMPLAINTS_DATA,
    COMPLAINT_IMAGES_DATA,
    COMPLAINT_STATUS_HISTORY_DATA,
    RESOURCE_ASSIGNMENTS_DATA,
    COMPLAINT_RESOURCES_DATA,
)
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
    # Users (with password hashing)
    for user_data in USERS_DATA:
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if not existing:
            user = User(
                id=user_data.get("id"),
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                email=user_data["email"],
                password_hash=get_password_hash(user_data["password"]),
                phone=user_data.get("phone"),
                address=user_data.get("address"),
                district=user_data.get("district"),
                is_admin=user_data.get("is_admin", False),
                is_active=user_data.get("is_active", True),
            )
            db.add(user)

    # Services
    for service_data in SERVICES_DATA:
        existing_service = (
            db.query(Service).filter(Service.id == service_data["id"]).first()
        )
        if not existing_service:
            service = Service(**service_data)
            db.add(service)

    # Resources
    for resource_data in RESOURCES_DATA:
        existing = db.query(Resource).filter(Resource.id == resource_data["id"]).first()
        if not existing:
            resource = Resource(**resource_data)
            db.add(resource)

    # Complaints
    for complaint_data in COMPLAINTS_DATA:
        existing = db.query(Complaint).filter(Complaint.id == complaint_data["id"]).first()
        if not existing:
            complaint = Complaint(**complaint_data)
            db.add(complaint)

    # Complaint images
    for img in COMPLAINT_IMAGES_DATA:
        existing = (
            db.query(ComplaintImage)
            .filter(
                (ComplaintImage.id == img["id"]) |
                (
                    (ComplaintImage.complaint_id == img["complaint_id"]) &
                    (ComplaintImage.image_url == img["image_url"]) 
                )
            )
            .first()
        )
        if not existing:
            db.add(ComplaintImage(**img))

    # Complaint status history
    for hist in COMPLAINT_STATUS_HISTORY_DATA:
        existing = db.query(ComplaintStatusHistory).filter(ComplaintStatusHistory.id == hist["id"]).first()
        if not existing:
            db.add(ComplaintStatusHistory(**hist))

    # Resource assignments
    for asn in RESOURCE_ASSIGNMENTS_DATA:
        existing = db.query(ResourceAssignment).filter(ResourceAssignment.id == asn["id"]).first()
        if not existing:
            db.add(ResourceAssignment(**asn))

    db.commit()

    # Many-to-many association entries with required assigned_by
    for link in COMPLAINT_RESOURCES_DATA:
        exists_row = db.execute(
            COMPLAINT_RESOURCES.select().where(
                and_(
                    COMPLAINT_RESOURCES.c.complaint_id == link["complaint_id"],
                    COMPLAINT_RESOURCES.c.resource_id == link["resource_id"],
                )
            )
        ).first()
        if not exists_row:
            db.execute(
                COMPLAINT_RESOURCES.insert().values(
                    complaint_id=link["complaint_id"],
                    resource_id=link["resource_id"],
                    assigned_by=link.get("assigned_by", "system"),
                )
            )

    db.commit()
