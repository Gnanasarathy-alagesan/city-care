import uuid
from datetime import datetime, timezone, timedelta

from auth import get_admin_access, get_current_user
from dao import Complaint, Resource, User
from dto import BotConfig, BotMessage, WatsonXAnalysisRequest
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from utils import get_db
from watsonx.constants import BOT_CONFIG
from watsonx.service import WatsonXService

router = APIRouter(prefix="/api", tags=["Bot & AI Operations"])

# Initialize WatsonX service
watsonx_service = WatsonXService()


@router.post("/bot/chat")
async def chat_with_watsonx_bot(
    message_data: BotMessage, current_user: User = Depends(get_current_user)
):
    """
    Chat with the WatsonX-powered AI assistant for complaint support.

    Args:
        message_data: Chat message data including:
            - message: User's message text
            - history: Optional conversation history
        current_user: Authenticated user

    Returns:
        dict: Bot response including:
            - message: Bot's response text
            - confidence: Confidence score of the response
            - intent: Detected user intent
            - entities: Extracted entities from the message
            - suggestedActions: Suggested follow-up actions
    """
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


@router.get("/admin/bot/config")
async def get_bot_configuration_settings(admin_access=Depends(get_admin_access)):
    """
    Get current bot configuration settings.

    Returns:
        dict: Current bot configuration including:
            - isEnabled: Whether bot is enabled
            - maxSessionDuration: Maximum session duration
            - confidenceThreshold: Minimum confidence threshold
            - fallbackMessage: Default fallback message
            - adminNotifications: Admin notification settings
            - autoEscalation: Auto-escalation settings
    """
    return BOT_CONFIG


@router.put("/admin/bot/config")
async def update_bot_configuration_settings(
    config: BotConfig, admin_access=Depends(get_admin_access)
):
    """
    Update bot configuration settings.

    Args:
        config: Updated configuration settings

    Returns:
        dict: Confirmation message
    """
    for key, value in config.dict(exclude_unset=True).items():
        if value is not None:
            BOT_CONFIG[key] = value

    return {"message": "Configuration updated successfully"}


@router.get("/admin/bot/analytics")
async def get_bot_usage_analytics(admin_access=Depends(get_admin_access)):
    """
    Get bot usage analytics and performance metrics.

    Returns:
        dict: Bot analytics including:
            - totalSessions: Total number of bot sessions
            - activeSessions: Currently active sessions
            - avgSessionDuration: Average session duration
            - topIntents: Most common user intents
            - satisfactionScore: User satisfaction score
            - resolutionRate: Issue resolution rate
    """
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


@router.get("/admin/analytics/watsonx")
async def get_watsonx_system_analytics(
    admin_access=Depends(get_admin_access), db: Session = Depends(get_db)
):
    """
    Get comprehensive WatsonX-powered analytics and insights for system performance.

    Returns:
        dict: System analytics including:
            - overview: Key performance metrics
            - insights: AI-generated insights about system performance
            - trends: Identified trends in complaint patterns
            - recommendations: AI recommendations for system improvement
    """
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


@router.post("/admin/analytics/watsonx/generate")
async def generate_fresh_watsonx_insights(
    admin_access=Depends(get_admin_access), db: Session = Depends(get_db)
):
    """
    Generate new insights using fresh WatsonX analysis.

    Returns:
        dict: Newly generated insights and predictions
    """
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


@router.post("/admin/analytics/watsonx/analyze")
async def analyze_system_data_with_watsonx(
    request: WatsonXAnalysisRequest,
    admin_access=Depends(get_admin_access),
    db: Session = Depends(get_db),
):
    """
    Send current system data to WatsonX for comprehensive analysis.

    Args:
        request: Analysis request parameters including:
            - includeComplaints: Whether to include complaint data
            - includeResources: Whether to include resource data
            - includeUsers: Whether to include user data
            - timeframe: Analysis timeframe

    Returns:
        dict: Analysis results and processing statistics
    """
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


@router.get("/admin/analytics/watsonx/insights/{insight_id}")
async def get_detailed_insight_information(
    insight_id: str, admin_access=Depends(get_admin_access)
):
    """
    Get detailed information about a specific WatsonX insight.

    Args:
        insight_id: Unique identifier of the insight

    Returns:
        dict: Detailed insight information including methodology and recommendations
    """
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
