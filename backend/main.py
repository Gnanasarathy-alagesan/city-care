import json
import logging
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional

import uvicorn
from auth import get_admin_access, get_current_user
from constants import ACCESS_TOKEN_EXPIRE_MINUTES
from dao import (
    Complaint,
    ComplaintImage,
    ComplaintStatusHistory,
    Resource,
    ResourceAssignment,
    Service,
    SessionLocal,
    User,
)
from database import init_default_data
from dto import (
    BotConfig,
    BotMessage,
    ResourceAssignmentCreate,
    ResourceCreate,
    ResourceUpdate,
    UserCreate,
    UserLogin,
    UserUpdate,
    WatsonXAnalysisRequest,
)
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from utils import (
    camel_to_snake,
    create_access_token,
    get_db,
    get_password_hash,
    verify_password,
)
from watsonx.constants import BOT_CONFIG
from watsonx.service import WatsonXService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def lifespan(app: FastAPI):
    # Startup
    db = SessionLocal()
    init_default_data(db)
    db.close()

    yield


app = FastAPI(
    lifespan=lifespan,
    title="CityCare API",
    description="Backend service for CityCare citizen complaint platform",
    version="1.0.0",
)


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize WatsonX service
watsonx_service = WatsonXService()


# Initialize default data on startup
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    init_default_data(db)
    db.close()


@app.get("/api")
def read_root():
    return {"message": "API is running"}


# Services endpoint
@app.get("/api/services")
async def get_services(db: Session = Depends(get_db)):
    services = db.query(Service).all()
    service_list = []

    for service in services:
        service_list.append(
            {
                "id": service.id,
                "name": service.name,
                "description": service.description,
                "icon": service.icon,
                "examples": json.loads(service.examples),
            }
        )

    return {"services": service_list}


# File upload endpoint
@app.post("/api/upload")
async def upload_files(
    files: List[UploadFile] = File(...), current_user: User = Depends(get_current_user)
):
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
            "isAdmin": user.is_admin,
        },
        "isAdmin": user.is_admin,
    }


@app.post("/api/auth/register", response_model=dict)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        first_name=user_data.firstName,
        last_name=user_data.lastName,
        email=user_data.email,
        password_hash=hashed_password,
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
            "isAdmin": new_user.is_admin,
        },
        "isAdmin": new_user.is_admin,
    }


@app.put("/api/user", response_model=dict)
async def update_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

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
        "isAdmin": user.is_admin,
    }


@app.get("/api/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "user": {
            "id": current_user.id,
            "firstName": current_user.first_name,
            "lastName": current_user.last_name,
            "email": current_user.email,
            "isAdmin": current_user.is_admin,
        },
        "isAdmin": current_user.is_admin,
    }


@app.post("/api/auth/logout")
async def logout():
    return {"message": "Successfully logged out"}


# Dashboard endpoints
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    total_complaints = (
        db.query(Complaint).filter(Complaint.reporter_id == current_user.id).count()
    )
    in_progress = (
        db.query(Complaint)
        .filter(
            Complaint.reporter_id == current_user.id, Complaint.status == "In Progress"
        )
        .count()
    )
    resolved = (
        db.query(Complaint)
        .filter(
            Complaint.reporter_id == current_user.id, Complaint.status == "Resolved"
        )
        .count()
    )

    return {
        "totalComplaints": total_complaints,
        "inProgress": in_progress,
        "resolved": resolved,
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
    admin_access=Depends(get_admin_access),
):
    query = db.query(Complaint).options(
        joinedload(Complaint.status_history),
        joinedload(Complaint.reporter),
        joinedload(Complaint.images),
        joinedload(Complaint.resources),
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
    complaints = query.offset((page - 1) * limit).limit(limit).all()

    complaint_list = []
    for complaint in complaints:
        # Sort history by created_at DESC
        sorted_history: list[ComplaintStatusHistory] = sorted(
            complaint.status_history, key=lambda h: h.created_at, reverse=True
        )

        complaint_list.append(
            {
                "id": complaint.id,
                "title": complaint.title,
                "description": complaint.description,
                "service": complaint.service_type,
                "status": complaint.status,
                "priority": complaint.priority,
                "date": complaint.created_at.strftime("%Y-%m-%d"),
                "location": (
                    {
                        "address": complaint.location_address,
                        "lat": complaint.location_lat,
                        "lng": complaint.location_lng,
                    }
                    if complaint.location_address
                    else None
                ),
                "reporter": (
                    {
                        "name": f"{complaint.reporter.first_name} {complaint.reporter.last_name}",
                        "email": complaint.reporter.email,
                    }
                    if complaint.reporter
                    else None
                ),
                "images": [img.image_url for img in complaint.images],
                "resources": [
                    {
                        "id": resource.id,
                        "name": resource.name,
                        "type": resource.type,
                        "status": resource.availability_status,
                    }
                    for resource in complaint.resources
                ],
                "history": [
                    {
                        "status": hist.status,
                        "note": hist.note,
                        "updated_by": hist.updated_by,
                        "date": hist.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    }
                    for hist in sorted_history
                ],
            }
        )

    return {"complaints": complaint_list, "total": total, "page": page}


@app.get("/api/complaints/{complaint_id}")
async def get_complaint(
    complaint_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    complaint = (
        db.query(Complaint)
        .filter(Complaint.id == complaint_id, Complaint.reporter_id == current_user.id)
        .first()
    )

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Get status history
    status_history = (
        db.query(ComplaintStatusHistory)
        .filter(ComplaintStatusHistory.complaint_id == complaint_id)
        .order_by(ComplaintStatusHistory.created_at.desc())
        .all()
    )

    # Get images
    images = (
        db.query(ComplaintImage)
        .filter(ComplaintImage.complaint_id == complaint_id)
        .all()
    )

    return {
        "complaint": {
            "id": complaint.id,
            "title": complaint.title,
            "description": complaint.description,
            "service": complaint.service_type,
            "status": complaint.status,
            "priority": complaint.priority,
            "date": complaint.created_at.strftime("%Y-%m-%d"),
            "location": (
                {
                    "address": complaint.location_address,
                    "coordinates": {
                        "lat": complaint.location_lat,
                        "lng": complaint.location_lng,
                    },
                }
                if complaint.location_address
                else None
            ),
            "reporter": {
                "name": f"{complaint.reporter.first_name} {complaint.reporter.last_name}",
                "email": complaint.reporter.email,
            },
            "assignedTo": complaint.assigned_to,
            "estimatedResolution": "2024-01-20",  # Mock data
            "images": [img.image_url for img in images],
            "aiSuggestion": {
                "priority": "High",
                "reasoning": "Based on the description and location, this issue poses a significant safety risk and should be prioritized.",
                "estimatedCost": "$500 - $800",
                "recommendedAction": "Immediate temporary patching followed by permanent repair within 5 business days.",
            },
            "statusHistory": [
                {
                    "status": history.status,
                    "date": history.created_at.strftime("%Y-%m-%d %H:%M %p"),
                    "note": history.note,
                }
                for history in status_history
            ],
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
    db: Session = Depends(get_db),
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
        location_address=location_data.get("address") if location_data else None,
    )

    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    # Add initial status history
    status_history = ComplaintStatusHistory(
        complaint_id=new_complaint.id,
        status="Open",
        note="Complaint submitted by citizen",
        updated_by=f"{current_user.first_name} {current_user.last_name}",
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
                complaint_id=new_complaint.id, image_url=image_url
            )
            db.add(complaint_image)

    db.commit()

    return {
        "complaint": {
            "id": new_complaint.id,
            "title": new_complaint.title,
            "status": new_complaint.status,
            "images": image_urls,
        }
    }


# Admin endpoints with API Key authentication
@app.get("/api/admin/dashboard/stats")
async def get_admin_dashboard_stats(
    admin_access=Depends(get_admin_access), db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)
    prev_week_start = now - timedelta(days=14)

    # Current week counts
    total_complaints = (
        db.query(Complaint).filter(Complaint.created_at >= week_start).count()
    )

    in_progress = db.query(Complaint).filter(Complaint.status == "In Progress").count()

    resolved = db.query(Complaint).filter(Complaint.status == "Resolved").count()

    high_priority = (
        db.query(Complaint)
        .filter(
            Complaint.priority == "High", Complaint.status.in_(["In Progress", "Open"])
        )
        .count()
    )

    # Resource stats
    total_resources = db.query(Resource).filter(Resource.is_active == True).count()
    available_resources = (
        db.query(Resource)
        .filter(Resource.is_active == True, Resource.availability_status == "Available")
        .count()
    )
    busy_resources = (
        db.query(Resource)
        .filter(Resource.is_active == True, Resource.availability_status == "Busy")
        .count()
    )

    # Previous week counts
    prev_total = (
        db.query(Complaint)
        .filter(
            Complaint.created_at >= prev_week_start, Complaint.created_at < week_start
        )
        .count()
    )

    prev_in_progress = (
        db.query(Complaint)
        .filter(
            Complaint.status == "In Progress",
            Complaint.created_at >= prev_week_start,
            Complaint.created_at < week_start,
        )
        .count()
    )

    prev_resolved = (
        db.query(Complaint)
        .filter(
            Complaint.status == "Resolved",
            Complaint.created_at >= prev_week_start,
            Complaint.created_at < week_start,
        )
        .count()
    )

    prev_high_priority = (
        db.query(Complaint)
        .filter(
            Complaint.priority == "High",
            Complaint.created_at >= prev_week_start,
            Complaint.created_at < week_start,
        )
        .count()
    )

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
        "totalResources": total_resources,
        "availableResources": available_resources,
        "busyResources": busy_resources,
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
        complaint_list.append(
            {
                "id": complaint.id,
                "title": complaint.title,
                "description": complaint.description,
                "service": complaint.service_type,
                "status": complaint.status,
                "priority": complaint.priority,
                "date": complaint.created_at.strftime("%Y-%m-%d"),
                "location": (
                    {
                        "address": complaint.location_address,
                        "lat": complaint.location_lat,
                        "lng": complaint.location_lng,
                    }
                    if complaint.location_address
                    else None
                ),
            }
        )

    return {"complaints": complaint_list, "total": total, "page": page}


@app.get("/api/admin/users")
async def get_all_users(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    status: Optional[str] = None,
    district: Optional[str] = None,
    db: Session = Depends(get_db),
    admin_access=Depends(get_admin_access),
):
    query = db.query(User).filter(User.is_admin == False)

    if search:
        query = query.filter(
            (User.first_name.contains(search))
            | (User.last_name.contains(search))
            | (User.email.contains(search))
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
        complaints_count = (
            db.query(Complaint).filter(Complaint.reporter_id == user.id).count()
        )
        user_list.append(
            {
                "id": user.id,
                "name": f"{user.first_name} {user.last_name}",
                "email": user.email,
                "phone": user.phone or "NA",
                "location": user.district or "NA",
                "joinDate": user.created_at.strftime("%Y-%m-%d"),
                "status": "Active" if user.is_active else "Inactive",
                "complaintsCount": complaints_count,
                "lastActive": (
                    user.last_active.strftime("%H hours ago")
                    if user.last_active
                    else "Never"
                ),
                "avatar": "/diverse-user-avatars.png",
            }
        )

    return {"users": user_list, "total": total, "page": page}


# AI endpoints
@app.post("/api/ai/suggest-category")
async def get_ai_suggestions(
    request: dict, current_user: User = Depends(get_current_user)
):
    description = request.get("description", "")

    # Mock AI suggestions based on keywords
    suggestions = []
    if "pothole" in description.lower() or "road" in description.lower():
        suggestions = [
            "Pothole on main road",
            "Road surface damage",
            "Traffic hazard on street",
        ]
    elif "light" in description.lower():
        suggestions = [
            "Street light not working",
            "Broken street lamp",
            "Dark street area",
        ]
    elif "water" in description.lower() or "leak" in description.lower():
        suggestions = ["Water leak on sidewalk", "Pipe burst", "Water pressure issue"]
    elif "garbage" in description.lower() or "trash" in description.lower():
        suggestions = [
            "Garbage not collected",
            "Overflowing trash bin",
            "Illegal dumping",
        ]
    else:
        suggestions = [
            "General infrastructure issue",
            "Public safety concern",
            "Maintenance required",
        ]

    return {"suggestions": suggestions[:3], "confidence": 0.85}


@app.post("/api/admin/complaint")
async def admin_create_complaint(
    title: str = Form(...),
    description: str = Form(...),
    service_type: str = Form(...),
    location: Optional[str] = Form(None),
    images: List[UploadFile] = File(default=[]),
    user_email: str = Form(...),
    db: Session = Depends(get_db),
    admin_access=Depends(get_admin_access),
):
    # Parse location JSON if provided
    location_data = None
    if location:
        try:
            location_data = json.loads(location)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=400, detail="Invalid location format. Must be valid JSON."
            )

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
            location_address=location_data.get("address") if location_data else None,
        )
        db.add(new_complaint)
        db.commit()
        db.refresh(new_complaint)

        # Add initial status history
        status_history = ComplaintStatusHistory(
            complaint_id=new_complaint.id,
            status="Open",
            note="Complaint submitted by citizen",
            updated_by=f"{user.first_name} {user.last_name}" if user else "Admin",
        )
        db.add(status_history)

        # Handle image uploads
        image_urls = []
        for image in images:
            if image.filename:
                image_url = f"/uploads/{new_complaint.id}_{image.filename}"
                image_urls.append(image_url)
                complaint_image = ComplaintImage(
                    complaint_id=new_complaint.id, image_url=image_url
                )
                db.add(complaint_image)

        db.commit()

        return {
            "complaint": {
                "id": new_complaint.id,
                "title": new_complaint.title,
                "status": new_complaint.status,
                "images": image_urls,
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


# Geocoding endpoint
@app.post("/api/geocode")
async def reverse_geocode(
    request: dict, current_user: User = Depends(get_current_user)
):
    lat = request.get("lat")
    lng = request.get("lng")

    # Mock geocoding response
    return {
        "address": f"123 Main Street, Downtown (Lat: {lat:.4f}, Lng: {lng:.4f})",
        "district": "Downtown District",
    }


# Resource Management Endpoints
@app.get("/api/admin/resources")
async def get_resources(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    type_filter: Optional[str] = None,
    service_category: Optional[str] = None,
    availability_status: Optional[str] = None,
    admin_access=Depends(get_admin_access),
    db: Session = Depends(get_db),
):
    query = db.query(Resource).filter(Resource.is_active == True)

    if search:
        query = query.filter(Resource.name.contains(search))
    if type_filter and type_filter != "all":
        query = query.filter(Resource.type == type_filter)
    if service_category and service_category != "all":
        query = query.filter(Resource.service_category == service_category)
    if availability_status and availability_status != "all":
        query = query.filter(Resource.availability_status == availability_status)

    total = query.count()
    resources = query.offset((page - 1) * limit).limit(limit).all()

    resource_list = []
    for resource in resources:
        # Count active assignments
        active_assignments = (
            db.query(ResourceAssignment)
            .filter(
                ResourceAssignment.resource_id == resource.id,
                ResourceAssignment.status.in_(["Assigned", "In Progress"]),
            )
            .count()
        )

        resource_list.append(
            {
                "id": resource.id,
                "name": resource.name,
                "type": resource.type,
                "serviceCategory": resource.service_category,
                "description": resource.description,
                "availabilityStatus": resource.availability_status,
                "contactPerson": resource.contact_person,
                "contactPhone": resource.contact_phone,
                "contactEmail": resource.contact_email,
                "location": resource.location,
                "capacity": resource.capacity,
                "hourlyRate": resource.hourly_rate,
                "activeAssignments": active_assignments,
                "createdAt": resource.created_at.strftime("%Y-%m-%d"),
                "updatedAt": resource.updated_at.strftime("%Y-%m-%d"),
            }
        )

    return {"resources": resource_list, "total": total, "page": page}


@app.post("/api/admin/resources")
async def create_resource(
    resource_data: ResourceCreate,
    admin_access=Depends(get_admin_access),
    db: Session = Depends(get_db),
):
    new_resource = Resource(
        name=resource_data.name,
        type=resource_data.type,
        service_category=resource_data.service_category,
        description=resource_data.description,
        contact_person=resource_data.contact_person,
        contact_phone=resource_data.contact_phone,
        contact_email=resource_data.contact_email,
        location=resource_data.location,
        capacity=resource_data.capacity,
        hourly_rate=resource_data.hourly_rate,
    )

    db.add(new_resource)
    db.commit()
    db.refresh(new_resource)

    return {
        "message": "Resource created successfully",
        "resource": {
            "id": new_resource.id,
            "name": new_resource.name,
            "type": new_resource.type,
            "serviceCategory": new_resource.service_category,
        },
    }


@app.put("/api/admin/resources/{resource_id}")
async def update_resource(
    resource_id: str,
    resource_data: ResourceUpdate,
    admin_access=Depends(get_admin_access),
    db: Session = Depends(get_db),
):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    # Update fields
    for field, value in resource_data.model_dump(exclude_unset=True).items():
        updated_field = camel_to_snake(field)
        setattr(resource, updated_field, value)
    resource.updated_at = datetime.now(timezone.utc)
    db.add(resource)
    db.commit()
    db.refresh(resource)

    return {
        "message": "Resource updated successfully",
        "resource": {
            "id": resource.id,
            "name": resource.name,
            "availabilityStatus": resource.availability_status,
        },
    }


@app.delete("/api/admin/resources/{resource_id}")
async def delete_resource(
    resource_id: str,
    admin_access=Depends(get_admin_access),
    db: Session = Depends(get_db),
):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    # Soft delete
    resource.is_active = False
    resource.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {"message": "Resource deleted successfully"}


# Complaint Resource Assignment Endpoints
@app.get("/api/admin/complaints/{complaint_id}/resources")
async def get_complaint_resources(
    complaint_id: str,
    admin_access=Depends(get_admin_access),
    db: Session = Depends(get_db),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Get resource assignments
    assignments = (
        db.query(ResourceAssignment)
        .filter(ResourceAssignment.complaint_id == complaint_id)
        .join(Resource)
        .all()
    )

    assignment_list = []
    for assignment in assignments:
        assignment_list.append(
            {
                "id": assignment.id,
                "resource": {
                    "id": assignment.resource.id,
                    "name": assignment.resource.name,
                    "type": assignment.resource.type,
                    "serviceCategory": assignment.resource.service_category,
                    "contactPerson": assignment.resource.contact_person,
                    "contactPhone": assignment.resource.contact_phone,
                },
                "assignedBy": assignment.assigned_by,
                "assignedAt": assignment.assigned_at.strftime("%Y-%m-%d %H:%M:%S"),
                "status": assignment.status,
                "startTime": (
                    assignment.start_time.strftime("%Y-%m-%d %H:%M:%S")
                    if assignment.start_time
                    else None
                ),
                "endTime": (
                    assignment.end_time.strftime("%Y-%m-%d %H:%M:%S")
                    if assignment.end_time
                    else None
                ),
                "estimatedHours": assignment.estimated_hours,
                "actualHours": assignment.actual_hours,
                "notes": assignment.notes,
            }
        )

    return {
        "complaint": {
            "id": complaint.id,
            "title": complaint.title,
            "service": complaint.service_type,
            "status": complaint.status,
        },
        "assignments": assignment_list,
    }


@app.post("/api/admin/complaints/{complaint_id}/resources")
async def assign_resources_to_complaint(
    complaint_id: str,
    assignment_data: ResourceAssignmentCreate,
    admin_access=Depends(get_admin_access),
    db: Session = Depends(get_db),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    assigned_resources = []
    assigned_by = (
        "Admin API"  # You might want to get this from the admin_access context
    )

    for resource_id in assignment_data.resource_ids:
        resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            continue

        # Check if already assigned
        existing_assignment = (
            db.query(ResourceAssignment)
            .filter(
                ResourceAssignment.complaint_id == complaint_id,
                ResourceAssignment.resource_id == resource_id,
                ResourceAssignment.status.in_(["Assigned", "In Progress"]),
            )
            .first()
        )

        if existing_assignment:
            continue

        # Create new assignment
        assignment = ResourceAssignment(
            complaint_id=complaint_id,
            resource_id=resource_id,
            assigned_by=assigned_by,
            notes=assignment_data.notes,
            estimated_hours=assignment_data.estimated_hours,
        )

        db.add(assignment)

        # Update resource status
        resource.availability_status = "Busy"

        assigned_resources.append(
            {"id": resource.id, "name": resource.name, "type": resource.type}
        )

    # Add status history
    if assigned_resources:
        resource_names = ", ".join([r["name"] for r in assigned_resources])
        status_history = ComplaintStatusHistory(
            complaint_id=complaint_id,
            status=complaint.status,
            note=f"Resources assigned: {resource_names}",
            updated_by=assigned_by,
        )
        db.add(status_history)

    db.commit()

    return {
        "message": f"Successfully assigned {len(assigned_resources)} resources",
        "assignedResources": assigned_resources,
    }


@app.delete("/api/admin/complaints/{complaint_id}/resources/{resource_id}")
async def remove_resource_from_complaint(
    complaint_id: str,
    resource_id: str,
    admin_access=Depends(get_admin_access),
    db: Session = Depends(get_db),
):
    assignment = (
        db.query(ResourceAssignment)
        .filter(
            ResourceAssignment.complaint_id == complaint_id,
            ResourceAssignment.resource_id == resource_id,
            ResourceAssignment.status.in_(["Assigned", "In Progress"]),
        )
        .first()
    )

    if not assignment:
        raise HTTPException(status_code=404, detail="Resource assignment not found")

    # Update assignment status
    assignment.status = "Cancelled"
    assignment.end_time = datetime.now(timezone.utc)

    # Update resource availability
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if resource:
        resource.availability_status = "Available"

    # Add status history
    status_history = ComplaintStatusHistory(
        complaint_id=complaint_id,
        status=db.query(Complaint).filter(Complaint.id == complaint_id).first().status,
        note=f"Resource removed: {resource.name if resource else resource_id}",
        updated_by="Admin API",
    )
    db.add(status_history)

    db.commit()

    return {"message": "Resource removed from complaint successfully"}


# Simplified Bot endpoints
@app.post("/api/bot/chat")
async def chat_with_bot(
    message_data: BotMessage, current_user: User = Depends(get_current_user)
):
    if not BOT_CONFIG["isEnabled"]:
        raise HTTPException(status_code=503, detail="Bot service is currently disabled")

    # Get bot response using WatsonX service
    bot_response = watsonx_service.analyze_message(
        message_data.message, message_data.history or []
    )

    return {
        "message": bot_response["message"],
        "confidence": bot_response["confidence"],
        "intent": bot_response["intent"],
        "entities": bot_response["entities"],
        "suggestedActions": bot_response["suggestedActions"],
    }


# Admin bot endpoints
@app.get("/api/admin/bot/config")
async def get_bot_config(admin_access=Depends(get_admin_access)):
    return BOT_CONFIG


@app.put("/api/admin/bot/config")
async def update_bot_config(config: BotConfig, admin_access=Depends(get_admin_access)):
    for key, value in config.dict(exclude_unset=True).items():
        if value is not None:
            BOT_CONFIG[key] = value

    return {"message": "Configuration updated successfully"}


@app.get("/api/admin/bot/analytics")
async def get_bot_analytics(admin_access=Depends(get_admin_access)):
    # Mock analytics data
    return {
        "totalSessions": 156,
        "activeSessions": 12,
        "avgSessionDuration": "8.5 min",
        "topIntents": [
            {"intent": "file_complaint", "count": 45},
            {"intent": "check_status", "count": 32},
            {"intent": "get_services", "count": 28},
            {"intent": "admin_help", "count": 15},
            {"intent": "greeting", "count": 12},
        ],
        "satisfactionScore": 92,
        "resolutionRate": 85,
    }


# WatsonX Analytics Endpoints
@app.get("/api/admin/analytics/watsonx")
async def get_watsonx_analytics(
    admin_access=Depends(get_admin_access), db: Session = Depends(get_db)
):
    """Get WatsonX-powered analytics and insights"""

    # Gather current system data
    now = datetime.now(timezone.utc)
    month_start = now - timedelta(days=30)

    total_complaints = db.query(Complaint).count()
    resolved_complaints = (
        db.query(Complaint).filter(Complaint.status == "Resolved").count()
    )
    pending_complaints = (
        db.query(Complaint)
        .filter(Complaint.status.in_(["Open", "In Progress"]))
        .count()
    )

    # Calculate average resolution time (mock calculation)
    avg_resolution_time = 4.2

    # Resource metrics
    total_resources = db.query(Resource).filter(Resource.is_active == True).count()
    busy_resources = (
        db.query(Resource)
        .filter(Resource.is_active == True, Resource.availability_status == "Busy")
        .count()
    )

    resource_utilization = (
        (busy_resources / total_resources * 100) if total_resources > 0 else 0
    )

    # Mock citizen satisfaction and cost efficiency
    citizen_satisfaction = 4.2
    cost_efficiency = 87.5

    # Prepare data for WatsonX analysis
    system_data = {
        "totalComplaints": total_complaints,
        "resolvedComplaints": resolved_complaints,
        "avgResolutionTime": avg_resolution_time,
        "resourceUtilization": resource_utilization,
        "citizenSatisfaction": citizen_satisfaction,
        "costEfficiency": cost_efficiency,
        "activeResources": total_resources,
        "pendingComplaints": pending_complaints,
    }

    # Get WatsonX analysis
    watsonx_analysis = watsonx_service.analyze_system_data(system_data)

    # Prepare response
    analytics_response = {
        "overview": {
            "totalComplaints": total_complaints,
            "resolvedComplaints": resolved_complaints,
            "avgResolutionTime": avg_resolution_time,
            "resourceUtilization": resource_utilization,
            "citizenSatisfaction": citizen_satisfaction,
            "costEfficiency": cost_efficiency,
            "activeResources": total_resources,
            "pendingComplaints": pending_complaints,
        },
        "insights": watsonx_analysis["insights"],
        "trends": watsonx_analysis["trends"],
        "recommendations": watsonx_analysis["recommendations"],
    }

    return analytics_response


@app.post("/api/admin/analytics/watsonx/generate")
async def generate_watsonx_insights(
    admin_access=Depends(get_admin_access), db: Session = Depends(get_db)
):
    """Generate new insights using WatsonX analysis"""

    # Gather fresh data
    total_complaints = db.query(Complaint).count()
    resolved_complaints = (
        db.query(Complaint).filter(Complaint.status == "Resolved").count()
    )

    # Mock fresh analysis with more dynamic insights
    fresh_insights = [
        {
            "id": str(uuid.uuid4()),
            "type": "prediction",
            "title": "Complaint Volume Forecast",
            "description": "Based on current trends, expect a 15% increase in complaints next week due to weather patterns.",
            "confidence": 89,
            "impact": "medium",
            "actionable": True,
            "data": {
                "expectedIncrease": "15%",
                "timeframe": "next week",
                "cause": "weather patterns",
            },
        },
        {
            "id": str(uuid.uuid4()),
            "type": "optimization",
            "title": "Resource Reallocation Opportunity",
            "description": "Moving 2 personnel from low-activity District A to high-demand District C could reduce response time by 18 minutes.",
            "confidence": 94,
            "impact": "high",
            "actionable": True,
            "data": {
                "timeSaved": "18 minutes",
                "personnel": 2,
                "fromDistrict": "District A",
                "toDistrict": "District C",
            },
        },
    ]

    return {
        "message": "New insights generated successfully",
        "insights": fresh_insights,
    }


@app.post("/api/admin/analytics/watsonx/analyze")
async def analyze_with_watsonx(
    request: WatsonXAnalysisRequest,
    admin_access=Depends(get_admin_access),
    db: Session = Depends(get_db),
):
    """Send current data to WatsonX for analysis"""

    # Gather data based on request parameters
    data_payload = {}

    if request.includeComplaints:
        complaints = db.query(Complaint).all()
        data_payload["complaints"] = [
            {
                "id": c.id,
                "status": c.status,
                "service_type": c.service_type,
                "priority": c.priority,
                "created_at": c.created_at.isoformat(),
            }
            for c in complaints
        ]

    if request.includeResources:
        resources = db.query(Resource).filter(Resource.is_active == True).all()
        data_payload["resources"] = [
            {
                "id": r.id,
                "type": r.type,
                "availability_status": r.availability_status,
                "service_category": r.service_category,
            }
            for r in resources
        ]

    if request.includeUsers:
        users = db.query(User).filter(User.is_admin == False).all()
        data_payload["users"] = [
            {"id": u.id, "district": u.district, "created_at": u.created_at.isoformat()}
            for u in users
        ]

    # In a real implementation, this would send data to WatsonX API
    # For now, we'll return a mock analysis

    analysis_result = {
        "status": "completed",
        "insights_generated": 3,
        "confidence_score": 0.87,
        "processing_time": "2.3s",
        "data_points_analyzed": len(data_payload.get("complaints", []))
        + len(data_payload.get("resources", [])),
        "recommendations": [
            "Optimize resource allocation based on complaint patterns",
            "Implement predictive maintenance for high-usage resources",
            "Enhance citizen communication during peak complaint periods",
        ],
    }

    return analysis_result


@app.get("/api/admin/analytics/watsonx/insights/{insight_id}")
async def get_insight_details(insight_id: str, admin_access=Depends(get_admin_access)):
    """Get detailed information about a specific insight"""

    # Mock detailed insight data
    insight_details = {
        "id": insight_id,
        "type": "optimization",
        "title": "Resource Allocation Optimization",
        "description": "Detailed analysis of current resource allocation patterns and optimization opportunities.",
        "confidence": 92,
        "impact": "high",
        "actionable": True,
        "data": {
            "current_efficiency": "76%",
            "potential_improvement": "18%",
            "affected_resources": 12,
            "estimated_savings": "$2,400/month",
        },
        "detailed_analysis": {
            "methodology": "Machine learning analysis of historical resource usage patterns",
            "data_sources": [
                "complaint_history",
                "resource_assignments",
                "resolution_times",
            ],
            "key_findings": [
                "Peak demand occurs between 9 AM - 11 AM",
                "Resource utilization varies by 40% across different districts",
                "Average response time could be reduced by 23 minutes",
            ],
        },
        "recommended_actions": [
            "Redistribute 2 personnel from District A to District C",
            "Implement dynamic scheduling based on demand patterns",
            "Consider adding mobile resources for peak hours",
        ],
    }

    return insight_details


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
