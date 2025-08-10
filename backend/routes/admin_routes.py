import json
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from auth import get_admin_access
from dao import (
    Complaint,
    ComplaintImage,
    ComplaintStatusHistory,
    Resource,
    ResourceAssignment,
    User,
)
from dto import ResourceAssignmentCreate, ResourceCreate, ResourceUpdate
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload
from utils import camel_to_snake, get_db
from watsonx.service import WatsonXService

router = APIRouter(prefix="/api/admin", tags=["Admin Operations"])

# Initialize WatsonX service
watsonx_service = WatsonXService()


@router.get("/dashboard/stats")
async def get_admin_dashboard_overview(
    admin_access=Depends(get_admin_access), db: Session = Depends(get_db)
):
    """
    Get comprehensive dashboard statistics for admin overview.

    Returns:
        dict: Dashboard metrics including:
            - totalComplaints: Total complaints this week
            - totalComplaintsChange: Percentage change from previous week
            - inProgress: Currently active complaints
            - resolved: Resolved complaints count
            - highPriority: High priority pending complaints
            - totalResources: Total active resources
            - availableResources: Available resources count
            - busyResources: Resources currently assigned
    """
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


@router.get("/complaints")
async def get_all_complaints_for_admin(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    service: Optional[str] = None,
    db: Session = Depends(get_db),
    admin_access=Depends(get_admin_access),
):
    """
    Get paginated list of all complaints with detailed information for admin management.

    Args:
        page: Page number for pagination
        limit: Number of complaints per page
        search: Search term for complaint titles
        status: Filter by complaint status
        priority: Filter by priority level
        service: Filter by service category

    Returns:
        dict: Paginated complaints with full details including reporter info and resources
    """
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


@router.post("/complaint")
async def create_complaint_on_behalf_of_user(
    title: str = Form(..., description="Title of the complaint"),
    description: str = Form(..., description="Detailed description of the issue"),
    service_type: str = Form(..., description="Service category for the complaint"),
    location: Optional[str] = Form(None, description="Location data as JSON string"),
    images: List[UploadFile] = File(default=[], description="Supporting images"),
    user_email: str = Form(..., description="Email of the user filing the complaint"),
    db: Session = Depends(get_db),
    admin_access=Depends(get_admin_access),
):
    """
    Create a complaint on behalf of a citizen (admin function).

    Args:
        title: Brief title of the issue
        description: Detailed problem description
        service_type: Category of municipal service
        location: JSON string with location information
        images: List of supporting image files
        user_email: Email address of the citizen for whom complaint is filed

    Returns:
        dict: Created complaint details
    """
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


@router.get("/users")
async def get_all_registered_users(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    status: Optional[str] = None,
    district: Optional[str] = None,
    db: Session = Depends(get_db),
    admin_access=Depends(get_admin_access),
):
    """
    Get paginated list of all registered users (excluding admins).

    Args:
        page: Page number for pagination
        limit: Number of users per page
        search: Search term for user names or email
        status: Filter by user status (active/inactive)
        district: Filter by user district

    Returns:
        dict: Paginated list of users with their complaint statistics
    """
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


@router.get("/resources")
async def get_all_system_resources(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    type_filter: Optional[str] = None,
    service_category: Optional[str] = None,
    availability_status: Optional[str] = None,
    admin_access=Depends(get_admin_access),
    db: Session = Depends(get_db),
):
    """
    Get paginated list of all system resources with filtering options.

    Args:
        page: Page number for pagination
        limit: Number of resources per page
        search: Search term for resource names
        type_filter: Filter by resource type
        service_category: Filter by service category
        availability_status: Filter by availability status

    Returns:
        dict: Paginated list of resources with assignment counts
    """
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


@router.post("/resources")
async def create_new_system_resource(
    resource_data: ResourceCreate,
    admin_access=Depends(get_admin_access),
    db: Session = Depends(get_db),
):
    """
    Create a new system resource for complaint resolution.

    Args:
        resource_data: Resource information including:
            - name: Resource name
            - type: Resource type (Personnel, Equipment, Vehicle)
            - service_category: Service category it supports
            - description: Optional description
            - contact_person: Contact person name
            - contact_phone: Contact phone number
            - contact_email: Contact email
            - location: Resource location
            - capacity: Resource capacity
            - hourly_rate: Hourly rate if applicable

    Returns:
        dict: Created resource information
    """
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


@router.put("/resources/{resource_id}")
async def update_existing_resource(
    resource_id: str,
    resource_data: ResourceUpdate,
    admin_access=Depends(get_admin_access),
    db: Session = Depends(get_db),
):
    """
    Update an existing system resource.

    Args:
        resource_id: Unique identifier of the resource to update
        resource_data: Updated resource information

    Returns:
        dict: Updated resource information
    """
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


@router.delete("/resources/{resource_id}")
async def deactivate_system_resource(
    resource_id: str,
    admin_access=Depends(get_admin_access),
    db: Session = Depends(get_db),
):
    """
    Deactivate a system resource (soft delete).

    Args:
        resource_id: Unique identifier of the resource to deactivate

    Returns:
        dict: Confirmation message
    """
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    # Soft delete
    resource.is_active = False
    resource.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {"message": "Resource deleted successfully"}


@router.get("/complaints/{complaint_id}/resources")
async def get_complaint_assigned_resources(
    complaint_id: str,
    admin_access=Depends(get_admin_access),
    db: Session = Depends(get_db),
):
    """
    Get all resources assigned to a specific complaint.

    Args:
        complaint_id: Unique identifier of the complaint

    Returns:
        dict: Complaint information and list of assigned resources with assignment details
    """
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


@router.post("/complaints/{complaint_id}/resources")
async def assign_resources_to_complaint(
    complaint_id: str,
    assignment_data: ResourceAssignmentCreate,
    admin_access=Depends(get_admin_access),
    db: Session = Depends(get_db),
):
    """
    Assign resources to a complaint for resolution.

    Args:
        complaint_id: Unique identifier of the complaint
        assignment_data: Assignment information including:
            - resource_ids: List of resource IDs to assign
            - notes: Optional assignment notes
            - estimated_hours: Estimated hours for completion

    Returns:
        dict: List of successfully assigned resources
    """
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


@router.delete("/complaints/{complaint_id}/resources/{resource_id}")
async def remove_resource_assignment_from_complaint(
    complaint_id: str,
    resource_id: str,
    admin_access=Depends(get_admin_access),
    db: Session = Depends(get_db),
):
    """
    Remove a resource assignment from a complaint.

    Args:
        complaint_id: Unique identifier of the complaint
        resource_id: Unique identifier of the resource to remove

    Returns:
        dict: Confirmation message
    """
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
