# Mock WatsonX AI Service
import uuid


class WatsonXService:
    def __init__(self):
        self.intents = {
            "file_complaint": ["complaint", "report", "issue", "problem", "file"],
            "check_status": ["status", "check", "update", "progress"],
            "get_services": ["services", "help", "what can", "available"],
            "admin_help": ["admin", "manage", "administration", "control"],
            "greeting": ["hello", "hi", "hey", "good morning", "good afternoon"],
            "goodbye": ["bye", "goodbye", "see you", "thanks", "thank you"],
        }

        self.responses = {
            "file_complaint": "I can help you file a complaint. What type of issue would you like to report? We handle roads, water, electricity, waste management, public safety, and parks & recreation.",
            "check_status": "I can help you check your complaint status. Please provide your complaint ID or I can look up your recent complaints.",
            "get_services": "CityCare offers these services:\n• Roads & Infrastructure\n• Water Supply\n• Electricity\n• Waste Management\n• Public Safety\n• Parks & Recreation\n\nWhich service do you need help with?",
            "admin_help": "I have admin privileges and can help you with:\n• Managing complaints\n• Assigning resources\n• Updating complaint status\n• Viewing user information\n• Generating reports\n\nWhat would you like to do?",
            "greeting": "Hello! I'm your CityCare AI Assistant powered by WatsonX. I'm here to help you with city services, complaints, and administrative tasks. How can I assist you today?",
            "goodbye": "Thank you for using CityCare! Have a great day and don't hesitate to reach out if you need any assistance.",
            "fallback": "I'm not sure I understand that request. I can help you with filing complaints, checking status, city services information, and administrative tasks. Could you please rephrase your question?",
        }

    def analyze_message(self, message: str, history: list[dict] = None) -> dict:
        message_lower = message.lower()

        # Determine intent
        detected_intent = "fallback"
        confidence = 0.0

        for intent, keywords in self.intents.items():
            matches = sum(1 for keyword in keywords if keyword in message_lower)
            if matches > 0:
                intent_confidence = matches / len(keywords)
                if intent_confidence > confidence:
                    confidence = intent_confidence
                    detected_intent = intent

        # Extract entities (mock)
        entities = []
        if "complaint" in message_lower and any(
            word in message_lower for word in ["cc-", "id", "number"]
        ):
            entities.append({"entity": "complaint_id", "value": "CC-12345678"})

        # Generate response
        response_message = self.responses.get(
            detected_intent, self.responses["fallback"]
        )

        # Add context-aware responses
        if detected_intent == "admin_help":
            response_message += "\n\nAs an admin, you can also:\n• Access all user complaints\n• Manage city resources\n• View analytics and reports"

        # Suggested actions
        suggested_actions = []
        if detected_intent == "file_complaint":
            suggested_actions = [
                "File a new complaint",
                "Upload photos of the issue",
                "Set complaint priority",
            ]
        elif detected_intent == "check_status":
            suggested_actions = [
                "View complaint details",
                "Check recent updates",
                "Contact assigned team",
            ]
        elif detected_intent == "admin_help":
            suggested_actions = [
                "View all complaints",
                "Manage resources",
                "Generate reports",
                "Update complaint status",
            ]

        return {
            "message": response_message,
            "intent": detected_intent,
            "confidence": min(confidence + 0.3, 1.0),  # Boost confidence
            "entities": entities,
            "suggestedActions": suggested_actions,
        }

    def analyze_system_data(self, data: dict) -> dict:
        """Analyze system data and generate insights using WatsonX-like logic"""

        # Extract key metrics
        total_complaints = data.get("totalComplaints", 0)
        resolved_complaints = data.get("resolvedComplaints", 0)
        avg_resolution_time = data.get("avgResolutionTime", 0)
        resource_utilization = data.get("resourceUtilization", 0)
        citizen_satisfaction = data.get("citizenSatisfaction", 0)

        insights = []
        recommendations = []

        # Generate insights based on data patterns
        if total_complaints > 100:
            if resolved_complaints / total_complaints < 0.8:
                insights.append(
                    {
                        "id": str(uuid.uuid4()),
                        "type": "alert",
                        "title": "Low Resolution Rate Detected",
                        "description": f"Current resolution rate is {(resolved_complaints/total_complaints)*100:.1f}%, which is below the target of 80%.",
                        "confidence": 92,
                        "impact": "high",
                        "actionable": True,
                        "data": {
                            "currentRate": f"{(resolved_complaints/total_complaints)*100:.1f}%",
                            "targetRate": "80%",
                            "gap": f"{80 - (resolved_complaints/total_complaints)*100:.1f}%",
                        },
                    }
                )
                recommendations.append(
                    "Increase resource allocation to high-priority complaints to improve resolution rate"
                )

        if avg_resolution_time > 5:
            insights.append(
                {
                    "id": str(uuid.uuid4()),
                    "type": "optimization",
                    "title": "Resolution Time Optimization Opportunity",
                    "description": f"Average resolution time of {avg_resolution_time} days exceeds the target of 5 days.",
                    "confidence": 87,
                    "impact": "medium",
                    "actionable": True,
                    "data": {
                        "currentTime": f"{avg_resolution_time} days",
                        "targetTime": "5 days",
                        "improvement": f"{avg_resolution_time - 5} days",
                    },
                }
            )
            recommendations.append(
                "Implement automated routing and priority-based assignment to reduce resolution time"
            )

        if resource_utilization > 85:
            insights.append(
                {
                    "id": str(uuid.uuid4()),
                    "type": "prediction",
                    "title": "Resource Capacity Warning",
                    "description": f"Resource utilization at {resource_utilization}% indicates potential capacity constraints.",
                    "confidence": 89,
                    "impact": "high",
                    "actionable": True,
                    "data": {
                        "currentUtilization": f"{resource_utilization}%",
                        "threshold": "85%",
                        "risk": "capacity shortage",
                    },
                }
            )
            recommendations.append(
                "Consider expanding resource capacity or optimizing current resource allocation"
            )

        if citizen_satisfaction < 4.0:
            insights.append(
                {
                    "id": str(uuid.uuid4()),
                    "type": "recommendation",
                    "title": "Citizen Satisfaction Improvement Needed",
                    "description": f"Current satisfaction score of {citizen_satisfaction}/5 is below expectations.",
                    "confidence": 84,
                    "impact": "medium",
                    "actionable": True,
                    "data": {
                        "currentScore": f"{citizen_satisfaction}/5",
                        "targetScore": "4.0/5",
                        "improvement": f"{4.0 - citizen_satisfaction:.1f} points",
                    },
                }
            )
            recommendations.append(
                "Implement citizen feedback system and improve communication during complaint resolution"
            )

        # Determine trends
        trends = {
            "complaintTrend": "increasing" if total_complaints > 50 else "stable",
            "resolutionTrend": (
                "improving"
                if resolved_complaints / total_complaints > 0.8
                else "declining"
            ),
            "satisfactionTrend": (
                "stable" if citizen_satisfaction >= 4.0 else "declining"
            ),
        }

        return {
            "insights": insights,
            "recommendations": recommendations,
            "trends": trends,
        }
