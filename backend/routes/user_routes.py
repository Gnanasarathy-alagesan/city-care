import json
import shutil
import uuid
from pathlib import Path
from typing import List, Optional

from auth import get_current_user
from watsonx.service import WatsonXService
from dao import Complaint, ComplaintImage, ComplaintStatusHistory, Service, User
from dto import UserUpdate
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
from utils import get_db

router = APIRouter(prefix="/api", tags=["User Operations"])

BASE_DIR = Path(__file__).resolve().parent  # /backend
UPLOAD_DIR = BASE_DIR.parent / "uploads"  # /uploads/complaints

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.get("/services")
async def fetch_available_services(db: Session = Depends(get_db)):
    """
    Retrieve all available city services for complaint submission.

    Returns:
        dict: List of services with their details including:
            - id: Service identifier
            - name: Service name
            - description: Service description
            - icon: Service icon
            - examples: List of example complaints for this service
    """
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


@router.post("/upload")
async def upload_complaint_files(
    files: List[UploadFile] = File(...), current_user: User = Depends(get_current_user)
):
    """
    Upload files for complaint attachments.

    Args:
        files: List of files to upload (images, documents)
        current_user: Authenticated user making the upload

    Returns:
        dict: List of uploaded file URLs
    """
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


@router.put("/user")
async def update_user_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update current user's profile information.

    Args:
        user_update: Updated user information
            - phone: User's phone number
            - address: User's address
            - district: User's district/area
        current_user: Authenticated user

    Returns:
        dict: Updated user profile information
    """
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

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


@router.get("/dashboard/stats")
async def get_user_dashboard_statistics(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Get dashboard statistics for the current user.

    Args:
        current_user: Authenticated user

    Returns:
        dict: User's complaint statistics including:
            - totalComplaints: Total number of complaints filed
            - inProgress: Number of complaints in progress
            - resolved: Number of resolved complaints
    """
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


@router.get("/complaints/{complaint_id}")
async def get_user_complaint_details(
    complaint_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get detailed information about a specific complaint filed by the user.

    Args:
        complaint_id: Unique identifier of the complaint
        current_user: Authenticated user (must be the complaint reporter)

    Returns:
        dict: Detailed complaint information including status history and images
    """
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


@router.post("/complaints")
async def submit_new_complaint(
    title: str = Form(..., description="Title of the complaint"),
    description: str = Form(..., description="Detailed description of the issue"),
    serviceType: str = Form(
        ..., description="Type of service related to the complaint"
    ),
    location: Optional[str] = Form(
        None, description="Location information as JSON string"
    ),
    images: List[UploadFile] = File(
        default=[], description="Images related to the complaint"
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit a new complaint to the city services.

    Args:
        title: Brief title describing the issue
        description: Detailed description of the problem
        serviceType: Category of service (e.g., "Road Maintenance", "Water Supply")
        location: JSON string containing location data (address, lat, lng)
        images: List of image files showing the issue
        current_user: Authenticated user filing the complaint

    Returns:
        dict: Created complaint information with ID and status
    """
    # Parse location if provided
    location_data = None
    if location:
        try:
            location_data = json.loads(location)
        except:
            pass

    watsonx_service = WatsonXService()
    complaint_priority = watsonx_service.analyze_priority(description=description).strip()
    new_complaint = Complaint(
        title=title,
        description=description,
        service_type=serviceType,
        reporter_id=current_user.id,
        location_lat=location_data.get("lat") if location_data else None,
        location_lng=location_data.get("lng") if location_data else None,
        location_address=location_data.get("address") if location_data else None,
        priority=complaint_priority
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
            safe_filename = f"{new_complaint.id}_{image.filename}"
            file_path = UPLOAD_DIR / safe_filename
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            image_url = f"/uploads/{safe_filename}"
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


@router.get("/complaints")
async def get_user_complaints_list(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    service: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Get paginated list of complaints with optional filtering.

    Args:
        page: Page number for pagination (default: 1)
        limit: Number of items per page (default: 10)
        search: Search term to filter complaints by title
        status: Filter by complaint status
        priority: Filter by complaint priority
        service: Filter by service type

    Returns:
        dict: Paginated list of complaints with total count
    """
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


@router.post("/geocode")
async def reverse_geocode_location(
    request: dict, current_user: User = Depends(get_current_user)
):
    """
    Convert latitude and longitude coordinates to human-readable address.

    Args:
        request: Dictionary containing 'lat' and 'lng' coordinates
        current_user: Authenticated user

    Returns:
        dict: Address information including district
    """
    lat = request.get("lat")
    lng = request.get("lng")

    # Mock geocoding response
    return {
        "address": f"123 Main Street, Downtown (Lat: {lat:.4f}, Lng: {lng:.4f})",
        "district": "Downtown District",
    }


@router.post("/ai/suggest-category")
async def get_ai_complaint_suggestions(
    request: dict, current_user: User = Depends(get_current_user)
):
    """
    Get AI-powered suggestions for complaint categorization based on description.

    Args:
        request: Dictionary containing 'description' of the issue
        current_user: Authenticated user

    Returns:
        dict: AI suggestions with confidence score
    """
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
