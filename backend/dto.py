from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserUpdate(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None


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
    images: list[str] = []
    statusHistory: list[dict] = []
    aiAnalysis: Optional[dict] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class ResourceCreate(BaseModel):
    name: str
    type: str
    service_category: str
    description: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    hourly_rate: Optional[float] = None


class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    serviceCategory: Optional[str] = None
    description: Optional[str] = None
    availabilityStatus: Optional[str] = None
    contactPerson: Optional[str] = None
    contactPhone: Optional[str] = None
    contactEmail: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    hourlyRate: Optional[float] = None
    isActive: Optional[bool] = None


class ResourceAssignmentCreate(BaseModel):
    resource_ids: list[str]
    notes: Optional[str] = None
    estimated_hours: Optional[float] = None


# Bot Models
class BotMessage(BaseModel):
    message: str


class BotConfig(BaseModel):
    isEnabled: Optional[bool] = None
    maxSessionDuration: Optional[int] = None
    confidenceThreshold: Optional[float] = None
    fallbackMessage: Optional[str] = None
    adminNotifications: Optional[bool] = None
    autoEscalation: Optional[bool] = None
    escalationThreshold: Optional[int] = None


# WatsonX Analytics Models
class WatsonXAnalysisRequest(BaseModel):
    includeComplaints: Optional[bool] = True
    includeResources: Optional[bool] = True
    includeUsers: Optional[bool] = True
    timeframe: Optional[str] = "30d"


class ComplaintCreateDTO(BaseModel):
    title: str = Field(..., description="Title of the complaint")
    description: str = Field(..., description="Detailed description of the issue")
    service_type: str = Field(..., description="Service category for the complaint")
    address: str = Field(..., description="Address for the complaint")
    user_email: str = Field(..., description="Email of the user filing the complaint")
