from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
import uvicorn
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import jwt
from passlib.context import CryptContext
import uuid
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, String, DateTime, Integer, Text, Boolean, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.dialects.postgresql import UUID
import json
from pathlib import Path
from datetime import datetime, timedelta
from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from auth import get_current_user, get_admin_access

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="CityCare API",
    description="Backend service for CityCare citizen complaint platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./citycare.db")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT token handling
security = HTTPBearer()

# Database setup
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

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
    
    id = Column(String, primary_key=True, default=lambda: f"CC-{str(uuid.uuid4())[:8].upper()}")
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
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    reporter = relationship("User", back_populates="complaints")
    status_history = relationship("ComplaintStatusHistory", back_populates="complaint")
    images = relationship("ComplaintImage", back_populates="complaint")

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

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic models
class UserCreate(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    firstName: str
    lastName: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    isAdmin: bool
    joinDate: str
    status: str
    complaintsCount: int
    lastActive: str

class ComplaintCreate(BaseModel):
    title: str
    description: str
    serviceType: str
    location: Optional[dict] = None

class ComplaintResponse(BaseModel):
    id: str
    title: str
    description: str
    service: str
    status: str
    priority: str
    date: str
    location: Optional[dict] = None
    reporter: dict
    assignedTo: Optional[str] = None
    images: List[str] = []
    statusHistory: List[dict] = []
    aiAnalysis: Optional[dict] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

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
            is_admin=True
        )
        db.add(admin_user)
    
    # Create services if not exist
    services_data = [
        {
            "id": "roads",
            "name": "Roads & Infrastructure",
            "description": "Report potholes, damaged roads, broken sidewalks, and traffic issues",
            "icon": "Construction",
            "examples": json.dumps(["Potholes", "Broken sidewalks", "Traffic signals", "Road signs"])
        },
        {
            "id": "water",
            "name": "Water Supply",
            "description": "Water leaks, pipe bursts, water quality issues, and supply problems",
            "icon": "Droplets",
            "examples": json.dumps(["Water leaks", "Pipe bursts", "Low pressure", "Water quality"])
        },
        {
            "id": "electricity",
            "name": "Electricity",
            "description": "Street lighting, power outages, electrical hazards, and maintenance",
            "icon": "Zap",
            "examples": json.dumps(["Street lights", "Power outages", "Electrical hazards", "Transformer issues"])
        },
        {
            "id": "waste",
            "name": "Waste Management",
            "description": "Garbage collection, recycling, illegal dumping, and sanitation",
            "icon": "Trash2",
            "examples": json.dumps(["Missed collection", "Illegal dumping", "Overflowing bins", "Recycling issues"])
        },
        {
            "id": "safety",
            "name": "Public Safety",
            "description": "Safety hazards, emergency situations, and security concerns",
            "icon": "Shield",
            "examples": json.dumps(["Safety hazards", "Emergency situations", "Security concerns", "Vandalism"])
        },
        {
            "id": "parks",
            "name": "Parks & Recreation",
            "description": "Park maintenance, playground issues, landscaping, and facilities",
            "icon": "TreePine",
            "examples": json.dumps(["Playground damage", "Tree maintenance", "Park facilities", "Landscaping"])
        }
    ]
    
    for service_data in services_data:
        existing_service = db.query(Service).filter(Service.id == service_data["id"]).first()
        if not existing_service:
            service = Service(**service_data)
            db.add(service)
    
    db.commit()

# Initialize default data on startup
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    init_default_data(db)
    db.close()


@app.get("/api")
def read_root():
    return {"message": "API is running"}


# Authentication endpoints
@app.post("/api/auth/login", response_model=dict)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    # Check for admin credentials
    if user_credentials.email == "admin" and user_credentials.password == "admin":
        user = db.query(User).filter(User.email == "admin@admin.com").first()
    else:
        user = db.query(User).filter(User.email == user_credentials.email).first()
    
    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    # Update last active
    user.last_active = datetime.now(timezone.utc)
    db.commit()
    
    return {
        "token": access_token,
        "user": {
            "id": user.id,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "email": user.email,
            "isAdmin": user.is_admin
        },
        "isAdmin": user.is_admin
    }

@app.post("/api/auth/register", response_model=dict)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        first_name=user_data.firstName,
        last_name=user_data.lastName,
        email=user_data.email,
        password_hash=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    
    return {
        "token": access_token,
        "user": {
            "id": new_user.id,
            "firstName": new_user.first_name,
            "lastName": new_user.last_name,
            "email": new_user.email,
            "isAdmin": new_user.is_admin
        },
        "isAdmin": new_user.is_admin
    }
class UserUpdate(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    
@app.put("/api/user", response_model=dict)
async def update_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Update only provided fields
    if user_update.phone is not None:
        user.phone = user_update.phone
    if user_update.address is not None:
        user.address = user_update.address
    if user_update.district is not None:
        user.district = user_update.district

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "email": user.email,
        "phone": user.phone,
        "address": user.address,
        "district": user.district,
        "isAdmin": user.is_admin
    }

@app.get("/api/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "user": {
            "id": current_user.id,
            "firstName": current_user.first_name,
            "lastName": current_user.last_name,
            "email": current_user.email,
            "isAdmin": current_user.is_admin
        },
        "isAdmin": current_user.is_admin
    }

@app.post("/api/auth/logout")
async def logout():
    return {"message": "Successfully logged out"}


# Dashboard endpoints
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_complaints = db.query(Complaint).filter(Complaint.reporter_id == current_user.id).count()
    in_progress = db.query(Complaint).filter(
        Complaint.reporter_id == current_user.id,
        Complaint.status == "In Progress"
    ).count()
    resolved = db.query(Complaint).filter(
        Complaint.reporter_id == current_user.id,
        Complaint.status == "Resolved"
    ).count()
    
    return {
        "totalComplaints": total_complaints,
        "inProgress": in_progress,
        "resolved": resolved
    }

# Complaint endpoints
@app.get("/api/admin/complaints")
async def get_admin_complaints(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    service: Optional[str] = None,
    db: Session = Depends(get_db),
    admin_access = Depends(get_admin_access)
):
    query = db.query(Complaint).options(
        joinedload(Complaint.status_history),
        joinedload(Complaint.reporter),   # eager load reporter
        joinedload(Complaint.images)      # eager load images
    )
    
    if search:
        query = query.filter(Complaint.title.contains(search))
    if status and status != "all":
        query = query.filter(Complaint.status == status.replace("-", " ").title())
    if priority and priority != "all":
        query = query.filter(Complaint.priority == priority.title())
    if service and service != "all":
        query = query.filter(Complaint.service_type == service)
    
    total = query.count()
    complaints = (
        query
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    
    complaint_list = []
    for complaint in complaints:
        # Sort history by created_at DESC
        sorted_history: list[ComplaintStatusHistory] = sorted(
            complaint.status_history,
            key=lambda h: h.created_at,
            reverse=True
        )
        
        complaint_list.append({
            "id": complaint.id,
            "title": complaint.title,
            "description": complaint.description,
            "service": complaint.service_type,
            "status": complaint.status,
            "priority": complaint.priority,
            "date": complaint.created_at.strftime("%Y-%m-%d"),
            "location": {
                "address": complaint.location_address,
                "lat": complaint.location_lat,
                "lng": complaint.location_lng
            } if complaint.location_address else None,
            "reporter": {
                "name": f"{complaint.reporter.first_name} {complaint.reporter.last_name}",
                "email": complaint.reporter.email
            } if complaint.reporter else None,
            "images": [img.image_url for img in complaint.images],
            "history": [
                {
                    "status": hist.status,
                    "note": hist.note,
                    "updated_by": hist.updated_by,
                    "date": hist.created_at.strftime("%Y-%m-%d %H:%M:%S")
                }
                for hist in sorted_history
            ]
        })
    
    return {
        "complaints": complaint_list,
        "total": total,
        "page": page
    }


@app.get("/api/complaints/{complaint_id}")
async def get_complaint(complaint_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.reporter_id == current_user.id
    ).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Get status history
    status_history = db.query(ComplaintStatusHistory).filter(
        ComplaintStatusHistory.complaint_id == complaint_id
    ).order_by(ComplaintStatusHistory.created_at.desc()).all()
    
    # Get images
    images = db.query(ComplaintImage).filter(
        ComplaintImage.complaint_id == complaint_id
    ).all()
    
    return {
        "complaint": {
            "id": complaint.id,
            "title": complaint.title,
            "description": complaint.description,
            "service": complaint.service_type,
            "status": complaint.status,
            "priority": complaint.priority,
            "date": complaint.created_at.strftime("%Y-%m-%d"),
            "location": {
                "address": complaint.location_address,
                "coordinates": {"lat": complaint.location_lat, "lng": complaint.location_lng}
            } if complaint.location_address else None,
            "reporter": {
                "name": f"{complaint.reporter.first_name} {complaint.reporter.last_name}",
                "email": complaint.reporter.email
            },
            "assignedTo": complaint.assigned_to,
            "estimatedResolution": "2024-01-20",  # Mock data
            "images": [img.image_url for img in images],
            "aiSuggestion": {
                "priority": "High",
                "reasoning": "Based on the description and location, this issue poses a significant safety risk and should be prioritized.",
                "estimatedCost": "$500 - $800",
                "recommendedAction": "Immediate temporary patching followed by permanent repair within 5 business days."
            },
            "statusHistory": [
                {
                    "status": history.status,
                    "date": history.created_at.strftime("%Y-%m-%d %H:%M %p"),
                    "note": history.note
                } for history in status_history
            ]
        }
    }

@app.post("/api/complaints")
async def create_complaint(
    title: str = Form(...),
    description: str = Form(...),
    serviceType: str = Form(...),
    location: Optional[str] = Form(None),
    images: List[UploadFile] = File(default=[]),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Parse location if provided
    location_data = None
    if location:
        try:
            location_data = json.loads(location)
        except:
            pass
    
    # Create complaint
    new_complaint = Complaint(
        title=title,
        description=description,
        service_type=serviceType,
        reporter_id=current_user.id,
        location_lat=location_data.get("lat") if location_data else None,
        location_lng=location_data.get("lng") if location_data else None,
        location_address=location_data.get("address") if location_data else None
    )
    
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    
    # Add initial status history
    status_history = ComplaintStatusHistory(
        complaint_id=new_complaint.id,
        status="Open",
        note="Complaint submitted by citizen",
        updated_by=f"{current_user.first_name} {current_user.last_name}"
    )
    db.add(status_history)
    
    # Handle image uploads (mock - in production, save to cloud storage)
    image_urls = []
    for image in images:
        if image.filename:
            # Mock image URL - in production, upload to cloud storage
            image_url = f"/uploads/{new_complaint.id}_{image.filename}"
            image_urls.append(image_url)
            
            complaint_image = ComplaintImage(
                complaint_id=new_complaint.id,
                image_url=image_url
            )
            db.add(complaint_image)
    
    db.commit()
    
    return {
        "complaint": {
            "id": new_complaint.id,
            "title": new_complaint.title,
            "status": new_complaint.status,
            "images": image_urls
        }
    }

# Admin endpoints
@app.get("/api/admin/dashboard/stats")
async def get_admin_dashboard_stats(admin_access = Depends(get_admin_access), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)
    prev_week_start = now - timedelta(days=14)

    # Current week counts
    total_complaints = db.query(Complaint).filter(
        Complaint.created_at >= week_start
    ).count()

    in_progress = db.query(Complaint).filter(
        Complaint.status == "In Progress"
    ).count()

    resolved = db.query(Complaint).filter(
        Complaint.status == "Resolved"
    ).count()

    high_priority = db.query(Complaint).filter(
        Complaint.priority == "High",
        Complaint.status in ("In Progress", "Open")
    ).count()

    # Previous week counts
    prev_total = db.query(Complaint).filter(
        Complaint.created_at >= prev_week_start,
        Complaint.created_at < week_start
    ).count()

    prev_in_progress = db.query(Complaint).filter(
        Complaint.status == "In Progress",
        Complaint.created_at >= prev_week_start,
        Complaint.created_at < week_start
    ).count()

    prev_resolved = db.query(Complaint).filter(
        Complaint.status == "Resolved",
        Complaint.created_at >= prev_week_start,
        Complaint.created_at < week_start
    ).count()

    prev_high_priority = db.query(Complaint).filter(
        Complaint.priority == "High",
        Complaint.created_at >= prev_week_start,
        Complaint.created_at < week_start
    ).count()

    def calc_percent_change(current, previous):
        if previous == 0:
            return None
        return round(((current - previous) / previous) * 100, 2)

    return {
        "totalComplaints": total_complaints,
        "totalComplaintsChange": calc_percent_change(total_complaints, prev_total),
        "inProgress": in_progress,
        "inProgressChange": calc_percent_change(in_progress, prev_in_progress),
        "resolved": resolved,
        "resolvedChange": calc_percent_change(resolved, prev_resolved),
        "highPriority": high_priority,
        "highPriorityChange": calc_percent_change(high_priority, prev_high_priority),
    }

# Complaint endpoints
@app.get("/api/complaints")
async def get_complaints(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    service: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Complaint)
    
    if search:
        query = query.filter(Complaint.title.contains(search))
    if status and status != "all":
        query = query.filter(Complaint.status == status.replace("-", " ").title())
    if priority and priority != "all":
        query = query.filter(Complaint.priority == priority.title())
    if service and service != "all":
        query = query.filter(Complaint.service_type == service)
    
    total = query.count()
    complaints = query.offset((page - 1) * limit).limit(limit).all()
    
    complaint_list = []
    for complaint in complaints:
        complaint_list.append({
            "id": complaint.id,
            "title": complaint.title,
            "description": complaint.description,
            "service": complaint.service_type,
            "status": complaint.status,
            "priority": complaint.priority,
            "date": complaint.created_at.strftime("%Y-%m-%d"),
            "location": {
                "address": complaint.location_address,
                "lat": complaint.location_lat,
                "lng": complaint.location_lng
            } if complaint.location_address else None
        })
    
    return {
        "complaints": complaint_list,
        "total": total,
        "page": page
    }

@app.get("/api/admin/users")
async def get_all_users(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    status: Optional[str] = None,
    district: Optional[str] = None,
    db: Session = Depends(get_db),
    admin_access = Depends(get_admin_access)
):
    query = db.query(User).filter(User.is_admin == False)
    
    if search:
        query = query.filter(
            (User.first_name.contains(search)) | 
            (User.last_name.contains(search)) |
            (User.email.contains(search))
        )
    if status and status != "all":
        is_active = status == "active"
        query = query.filter(User.is_active == is_active)
    if district and district != "all":
        query = query.filter(User.district == district)
    
    total = query.count()
    users = query.offset((page - 1) * limit).limit(limit).all()
    
    user_list = []
    for user in users:
        complaints_count = db.query(Complaint).filter(Complaint.reporter_id == user.id).count()
        user_list.append({
            "id": user.id,
            "name": f"{user.first_name} {user.last_name}",
            "email": user.email,
            "phone": user.phone or "NA",
            "location": user.district or "NA",
            "joinDate": user.created_at.strftime("%Y-%m-%d"),
            "status": "Active" if user.is_active else "Inactive",
            "complaintsCount": complaints_count,
            "lastActive": user.last_active.strftime("%H hours ago") if user.last_active else "Never",
            "avatar": "/diverse-user-avatars.png"
        })
    
    return {
        "users": user_list,
        "total": total,
        "page": page
    }

# AI endpoints
@app.post("/api/ai/suggest-category")
async def get_ai_suggestions(request: dict, current_user: User = Depends(get_current_user)):
    description = request.get("description", "")
    
    # Mock AI suggestions based on keywords
    suggestions = []
    if "pothole" in description.lower() or "road" in description.lower():
        suggestions = ["Pothole on main road", "Road surface damage", "Traffic hazard on street"]
    elif "light" in description.lower():
        suggestions = ["Street light not working", "Broken street lamp", "Dark street area"]
    elif "water" in description.lower() or "leak" in description.lower():
        suggestions = ["Water leak on sidewalk", "Pipe burst", "Water pressure issue"]
    elif "garbage" in description.lower() or "trash" in description.lower():
        suggestions = ["Garbage not collected", "Overflowing trash bin", "Illegal dumping"]
    else:
        suggestions = ["General infrastructure issue", "Public safety concern", "Maintenance required"]
    
    return {
        "suggestions": suggestions[:3],
        "confidence": 0.85
    }


@app.post("/api/admin/complaint")
async def admin_create_complaint(
    title: str = Form(...),
    description: str = Form(...),
    service_type: str = Form(...),
    location: Optional[str] = Form(None),
    images: List[UploadFile] = File(default=[]),
    user_email: str = Form(...),
    db: Session = Depends(get_db),
    admin_access = Depends(get_admin_access)
):
    # Parse location JSON if provided
    location_data = None
    if location:
        try:
            location_data = json.loads(location)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid location format. Must be valid JSON.")

    # Fetch user by email
    user = None
    if user_email:
        user = db.query(User).filter(User.email == user_email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")

    try:
        # Create complaint
        new_complaint = Complaint(
            title=title,
            description=description,
            service_type=service_type,
            reporter_id=user.id,
            location_lat=location_data.get("lat") if location_data else None,
            location_lng=location_data.get("lng") if location_data else None,
            location_address=location_data.get("address") if location_data else None
        )
        db.add(new_complaint)
        db.commit()
        db.refresh(new_complaint)

        # Add initial status history
        status_history = ComplaintStatusHistory(
            complaint_id=new_complaint.id,
            status="Open",
            note="Complaint submitted by citizen",
            updated_by=f"{user.first_name} {user.last_name}" if user else "Admin"
        )
        db.add(status_history)

        # Handle image uploads
        image_urls = []
        for image in images:
            if image.filename:
                image_url = f"/uploads/{new_complaint.id}_{image.filename}"
                image_urls.append(image_url)
                complaint_image = ComplaintImage(
                    complaint_id=new_complaint.id,
                    image_url=image_url
                )
                db.add(complaint_image)

        db.commit()

        return {
            "complaint": {
                "id": new_complaint.id,
                "title": new_complaint.title,
                "status": new_complaint.status,
                "images": image_urls
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


# Geocoding endpoint
@app.post("/api/geocode")
async def reverse_geocode(request: dict, current_user: User = Depends(get_current_user)):
    lat = request.get("lat")
    lng = request.get("lng")
    
    # Mock geocoding response
    return {
        "address": f"123 Main Street, Downtown (Lat: {lat:.4f}, Lng: {lng:.4f})",
        "district": "Downtown District"
    }

# Services endpoint
@app.get("/api/services")
async def get_services(db: Session = Depends(get_db)):
    services = db.query(Service).all()
    service_list = []
    
    for service in services:
        service_list.append({
            "id": service.id,
            "name": service.name,
            "description": service.description,
            "icon": service.icon,
            "examples": json.loads(service.examples)
        })
    
    return {"services": service_list}

# File upload endpoint
@app.post("/api/upload")
async def upload_files(files: List[UploadFile] = File(...), current_user: User = Depends(get_current_user)):
    uploaded_urls = []
    
    # Create uploads directory if it doesn't exist
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    
    for file in files:
        if file.filename:
            # Generate unique filename
            file_extension = file.filename.split(".")[-1]
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            file_path = upload_dir / unique_filename
            
            # Save file (in production, upload to cloud storage)
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            uploaded_urls.append(f"/uploads/{unique_filename}")
    
    return {"urls": uploaded_urls}
    

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
