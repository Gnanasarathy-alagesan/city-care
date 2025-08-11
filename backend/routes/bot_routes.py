import uuid

import httpx
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

    total_complaints = [obj.to_dict() for obj in db.query(Complaint).all()]
    total_resources = [
        obj.to_dict()
        for obj in db.query(Resource).filter(Resource.is_active == True).all()
    ]
    busy_resources = [
        obj.to_dict()
        for obj in (
            db.query(Resource)
            .filter(Resource.is_active == True, Resource.availability_status == "Busy")
            .all()
        )
    ]
    # # Get WatsonX analysis
    watsonx_analysis = watsonx_service.get_analytical_insights(
        complaints_data=total_complaints,
        resources_data=total_resources,
        busy_resources_data=busy_resources,
    )

    return watsonx_analysis


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


@router.post("bot/chat")
async def chat_with_citizen_rights_agent(
    message_data: BotMessage, current_user: User = Depends(get_current_user)
):
    """
    Chat with the AI-powered Citizen Rights & Schemes Assistant.

    This endpoint connects to an actual AI agent that provides information about:
    - Citizen rights and legal protections
    - Government schemes and benefits
    - Eligibility criteria for various programs
    - Application processes and documentation
    - Legal remedies and complaint procedures

    Args:
        message_data: Chat message data including:
            - message: User's question about rights or schemes
            - history: Optional conversation history for context
        current_user: Authenticated user

    Returns:
        dict: AI agent response including:
            - message: Agent's informative response
            - confidence: Confidence score of the response
            - intent: Detected user intent (rights_query, scheme_info, etc.)
            - entities: Extracted entities (scheme names, rights categories)
            - suggestedActions: Suggested follow-up actions
            - sources: Relevant sources or references
    """
    if not BOT_CONFIG["isEnabled"]:
        raise HTTPException(
            status_code=503, detail="Rights Agent service is currently disabled"
        )

    try:
        # Prepare the payload for the AI agent
        agent_payload = {
            "message": message_data.message,
            "context": "citizen_rights_and_schemes",
            "user_id": str(current_user.id),
            "user_district": current_user.district,
            "conversation_history": message_data.history or [],
            "system_prompt": """You are a knowledgeable AI assistant specializing in citizen rights and government schemes. 
            Provide accurate, helpful information about:
            - Constitutional rights and legal protections
            - Government welfare schemes and benefits
            - Eligibility criteria and application processes
            - Documentation requirements
            - Grievance redressal mechanisms
            - Legal remedies and procedures
            
            Always provide specific, actionable information and cite relevant sources when possible.""",
        }

        # Make HTTP request to actual AI agent endpoint
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Replace with your actual AI agent endpoint URL
            agent_endpoint = "https://api.your-ai-service.com/v1/chat"

            # Add authentication headers if required
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {BOT_CONFIG.get('ai_api_key', 'your-api-key')}",
            }

            response = await client.post(
                agent_endpoint, json=agent_payload, headers=headers
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"AI agent service error: {response.status_code}",
                )

            agent_response = response.json()

            # Extract and format the response
            bot_response = {
                "message": agent_response.get(
                    "response",
                    "I apologize, but I couldn't process your request at the moment.",
                ),
                "confidence": agent_response.get("confidence", 0.8),
                "intent": agent_response.get("intent", "general_inquiry"),
                "entities": agent_response.get("entities", []),
                "suggestedActions": agent_response.get(
                    "suggested_actions",
                    [
                        "Ask about specific schemes",
                        "Learn about eligibility criteria",
                        "Get application guidance",
                    ],
                ),
                "sources": agent_response.get("sources", []),
            }

            return bot_response

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504, detail="AI agent service timeout. Please try again."
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=502, detail=f"Failed to connect to AI agent service: {str(e)}"
        )
    except Exception as e:
        print(f"AI agent service error: {str(e)}")

        # Fallback to local rights and schemes knowledge
        fallback_response = generate_local_rights_response(
            message_data.message, current_user
        )
        return fallback_response


def generate_local_rights_response(message: str, user: User) -> dict:
    """
    Generate a response using local knowledge base when external AI service is unavailable.

    Args:
        message: User's message
        user: Current user for personalization

    Returns:
        dict: Formatted response with rights and schemes information
    """
    message_lower = message.lower()

    rights_keywords = {
        "education": {
            "response": "🎓 **Right to Education**: Every child aged 6-14 has the right to free and compulsory education under Article 21A. Key schemes include:\n\n• **Sarva Shiksha Abhiyan**: Universal elementary education\n• **Mid-Day Meal Scheme**: Free meals in government schools\n• **Scholarship schemes** for SC/ST/OBC students\n• **Beti Bachao Beti Padhao**: Girl child education promotion",
            "actions": [
                "Check scholarship eligibility",
                "Find nearby schools",
                "Apply for education schemes",
            ],
        },
        "health": {
            "response": "🏥 **Right to Health**: While not explicitly fundamental, health is a directive principle. Key schemes:\n\n• **Ayushman Bharat**: Health insurance up to ₹5 lakh\n• **Janani Suraksha Yojana**: Maternal health benefits\n• **National Health Mission**: Primary healthcare\n• **ESIS**: Employee health insurance",
            "actions": [
                "Check Ayushman Bharat eligibility",
                "Find empaneled hospitals",
                "Apply for health schemes",
            ],
        },
        "employment": {
            "response": "💼 **Right to Work**: Guaranteed under MGNREGA and various employment schemes:\n\n• **MGNREGA**: 100 days guaranteed employment\n• **Pradhan Mantri Rojgar Protsahan Yojana**: Employment generation\n• **Skill India**: Vocational training programs\n• **Stand Up India**: SC/ST/Women entrepreneurship",
            "actions": [
                "Apply for MGNREGA",
                "Check skill development programs",
                "Start your business",
            ],
        },
        "food": {
            "response": "🍽️ **Right to Food**: Ensured through Public Distribution System:\n\n• **National Food Security Act**: Subsidized food grains\n• **Antyodaya Anna Yojana**: For poorest families\n• **Pradhan Mantri Garib Kalyan Anna Yojana**: Free food grains\n• **Integrated Child Development Services**: Nutrition for children",
            "actions": [
                "Get ration card",
                "Check PDS eligibility",
                "Apply for food schemes",
            ],
        },
        "housing": {
            "response": "🏠 **Right to Shelter**: Housing schemes for all:\n\n• **Pradhan Mantri Awas Yojana**: Housing for all by 2022\n• **Indira Awas Yojana**: Rural housing\n• **Credit Linked Subsidy Scheme**: Home loan subsidies\n• **Rental Housing Scheme**: Affordable rental housing",
            "actions": [
                "Apply for PM Awas Yojana",
                "Check housing subsidies",
                "Find affordable housing",
            ],
        },
        "pension": {
            "response": "👴 **Social Security Rights**: Pension and social security schemes:\n\n• **National Social Assistance Programme**: Old age pension\n• **Atal Pension Yojana**: Guaranteed pension\n• **Pradhan Mantri Vaya Vandana Yojana**: Senior citizen pension\n• **Widow Pension Scheme**: Support for widows",
            "actions": [
                "Apply for old age pension",
                "Check pension eligibility",
                "Calculate pension amount",
            ],
        },
    }

    # Detect intent and generate response
    detected_intent = "general_inquiry"
    response_data = None

    for category, data in rights_keywords.items():
        if category in message_lower or any(
            keyword in message_lower
            for keyword in [category, f"{category} scheme", f"{category} right"]
        ):
            detected_intent = f"{category}_inquiry"
            response_data = data
            break

    if response_data:
        return {
            "message": response_data["response"]
            + f"\n\n📍 *Information personalized for {user.district} district*",
            "confidence": 0.85,
            "intent": detected_intent,
            "entities": [{"entity": "topic", "value": category}],
            "suggestedActions": response_data["actions"],
            "sources": [
                "National Portal of India",
                "Ministry of Rural Development",
                "Constitution of India",
            ],
        }
    else:
        # General response for unmatched queries
        return {
            "message": """🇮🇳 **Welcome to Citizen Rights & Schemes Assistant!**

I can help you learn about your fundamental rights and government schemes. Here are some areas I can assist with:

**🎯 Popular Topics:**
• Education rights and scholarships
• Healthcare schemes (Ayushman Bharat)
• Employment programs (MGNREGA)
• Housing schemes (PM Awas Yojana)
• Food security (PDS, Ration Card)
• Social security and pensions

**💡 How to ask:**
• "Tell me about education rights"
• "What housing schemes am I eligible for?"
• "How to apply for Ayushman Bharat?"

What would you like to know about?""",
            "confidence": 0.9,
            "intent": "welcome",
            "entities": [],
            "suggestedActions": [
                "Learn about education rights",
                "Check healthcare schemes",
                "Explore employment programs",
                "Find housing assistance",
            ],
            "sources": [
                "Government of India",
                "National Portal",
                "Constitution of India",
            ],
        }
