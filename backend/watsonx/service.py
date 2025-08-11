# Mock WatsonX AI Service
import json
import os

from dotenv import load_dotenv
from ibm_watsonx_ai.credentials import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

dotenv_path = os.path.join(parent_dir, ".env.local")

load_dotenv(dotenv_path=dotenv_path)


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

        self.prompts = {
            "analytical_insights": lambda input: f"""
                    You are an AI system for analyzing Public Works Department operational data. It contains the details of the complaints, resources, and resources that are busy.
                    Here is the input data:
                    {json.dumps(input, indent=2)}

                    Task:
                    Analyze the data and produce a JSON object with:
                    - overview: totals and key metrics
                    - insights: list of detected issues or opportunities (empty array if none)
                    - trends: complaintTrend, resolutionTrend, satisfactionTrend
                    - recommendations: actionable suggestions for improvement and easy resolving of the issues.

                    Output must be "valid JSON" - so i can convert it to json in python. It must not have extra text, keep it in this format:
                    {{
                        "overview": {{
                            "totalComplaints": <int>,
                            "resolvedComplaints": <int>,
                            "avgResolutionTime": <float>,
                            "resourceUtilization": <float>,
                            "citizenSatisfaction": <float>,
                            "costEfficiency": <float>,
                            "activeResources": <int>,
                            "pendingComplaints": <int>
                        }},
                        "insights": [],
                        "trends": {{
                            "complaintTrend": "<string>",
                            "resolutionTrend": "<string>",
                            "satisfactionTrend": "<string>"
                        }},
                        "recommendations": []
                    }}
                """
        }
        # WatsonX config
        self.model_id = os.getenv("WATSONX_MODEL")
        self.project_id = os.getenv("PROJECT_ID")
        self.credentials = Credentials(
            url=os.getenv("WATSONX_URL"), api_key=os.getenv("WATSONX_APIKEY")
        )
        self.model = ModelInference(
            model_id=self.model_id,
            credentials=self.credentials,
            project_id=self.project_id,
        )

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

    def get_analytical_insights(
        self, complaints_data: list, resources_data: list, busy_resources_data: list
    ) -> dict:
        """
        Generates analytical insights using WatsonX AI by combining complaint & resource data.

        Args:
            complaints_data (dict): Dictionary of complaint data from API.
            resources_data (dict): Dictionary of resource data from API.

        Returns:
            dict: JSON-formatted analytics containing overview, insights, trends, and recommendations.
        """
        # Structure data for the prompt
        input_payload = {
            "complaints": complaints_data,
            "resources": resources_data,
            "busy_resources": busy_resources_data,
        }

        # Call WatsonX
        response = self.model.generate(
            prompt=self.prompts["analytical_insights"](input_payload),
            params={
                "decoding_method": "greedy",
                "max_new_tokens": 800,
                "min_new_tokens": 50,
                "temperature": 0,
            },
        )

        # Extract and parse response
        generated_text = response.get("results", [{}])[0].get("generated_text", "{}")
        # Step 2: Locate the JSON boundaries
        start = generated_text.find("{")
        end = generated_text.rfind("}") + 1  # +1 to include the closing brace

        if start == -1 or end == -1:
            raise ValueError("No valid JSON object found in generated_text")

        json_str = generated_text[start:end]
        try:
            parsed_json = json.loads(json_str)
        except json.JSONDecodeError:
            parsed_json = {
                "error": "Model output was not valid JSON",
                "raw": generated_text,
            }

        return parsed_json
