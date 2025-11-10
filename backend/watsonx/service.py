# Mock WatsonX AI Service
import json
import logging
import os
import re

from dotenv import load_dotenv

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
dotenv_path = os.path.join(parent_dir, ".env.local")
load_dotenv(dotenv_path=dotenv_path)

logger = logging.getLogger(__name__)


def extract_full_json(generated_text):
    # Step 1: Try direct JSON parse
    try:
        return json.loads(generated_text)
    except json.JSONDecodeError:
        pass

    # Step 2: Find the first '{' and match balanced braces
    start = generated_text.find("{")
    if start == -1:
        return {"error": "No JSON found", "raw": generated_text}

    brace_count = 0
    end = None
    for i, ch in enumerate(generated_text[start:], start=start):
        if ch == "{":
            brace_count += 1
        elif ch == "}":
            brace_count -= 1
            if brace_count == 0:
                end = i + 1
                break

    if end:
        json_str = generated_text[start:end]
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            pass

    # Step 3: Fallback — merge smaller blocks
    blocks = re.findall(r"\{[\s\S]*?\}", generated_text)
    merged = {}
    for block in blocks:
        try:
            obj = json.loads(block)
            merged.update(obj)
        except json.JSONDecodeError:
            continue
    if merged:
        return {"response": merged}

    return {"error": "No valid JSON found", "raw": generated_text}


class WatsonXService:
    FALLBACK_ANALYTICS = {
        "overview": {
            "totalComplaints": 156,
            "resolvedComplaints": 98,
            "avgResolutionTime": 4.5,
            "resourceUtilization": 78.5,
            "citizenSatisfaction": 82.0,
            "costEfficiency": 88.0,
            "activeResources": 24,
            "pendingComplaints": 32,
        },
        "insights": [
            "High complaint volume in water supply category detected",
            "Resource utilization peak hours: 9 AM - 11 AM",
            "Urban areas have 35% longer resolution times",
        ],
        "trends": {
            "complaintTrend": "Increasing",
            "resolutionTrend": "Stable",
            "satisfactionTrend": "Improving",
        },
        "recommendations": [
            "Allocate additional resources during peak hours",
            "Focus on water supply infrastructure improvements",
            "Implement preventive maintenance in high-complaint areas",
        ],
    }

    def __init__(self, model=None):
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
                """,
            "analyze_priority": lambda input: f"""
                    You are an AI assistant for a public works department. You are given a description related to infrastructure conditions such as roads, bridges, or public facilities.

                    Issue Priority:
                    {input['description']}

                    Analyze the description carefully and assign a single priority flag based on severity for repair or attention.

                    Severity categories:
                    - High: urgent attention needed, safety risk present.
                    - Medium: noticeable damage but not immediately dangerous.
                    - Low: minor issues, can be scheduled later.

                    **IMPORTANT:** Respond **ONLY** with exactly one of these phrases and nothing else (no explanations, no additional text, no punctuation):
                    High
                    Medium
                    Low

                    Your response must be a single line with one of the above exactly as written.

                    Now assign the priority:
            """,
        }

        self.is_watson_x_available = self._check_watson_x_credentials()
        self.model = None
        self.model_id = None
        self.project_id = None
        self.credentials = None

        if self.is_watson_x_available:
            try:
                from ibm_watsonx_ai.credentials import Credentials
                from ibm_watsonx_ai.foundation_models import ModelInference

                self.model_id = model or os.getenv("WATSONX_MODEL")
                self.project_id = os.getenv("PROJECT_ID")
                self.credentials = Credentials(
                    url=os.getenv("WATSONX_URL"), api_key=os.getenv("WATSONX_APIKEY")
                )
                self.model = ModelInference(
                    model_id=self.model_id,
                    credentials=self.credentials,
                    project_id=self.project_id,
                )
                logger.info("Watson X service initialized successfully")
            except Exception as e:
                logger.warning(
                    f"Failed to initialize Watson X: {str(e)}. Using fallback mode."
                )
                self.is_watson_x_available = False
        else:
            logger.info(
                "Watson X credentials not configured. Running in fallback mode."
            )

    def _check_watson_x_credentials(self) -> bool:
        """
        Check if all required Watson X credentials are configured
        Returns True only if all credentials are present
        """
        required_env_vars = [
            "WATSONX_APIKEY",
            "WATSONX_URL",
            "PROJECT_ID",
            "WATSONX_MODEL",
        ]
        for var in required_env_vars:
            if not os.getenv(var):
                logger.debug(f"Missing Watson X credential: {var}")
                return False
        return True

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
            "confidence": min(confidence + 0.3, 1.0),
            "entities": entities,
            "suggestedActions": suggested_actions,
        }

    def get_analytical_insights(
        self, complaints_data: list, resources_data: list, busy_resources_data: list
    ) -> dict:
        """
        Returns Watson X insights if available, otherwise returns static fallback data
        Generates analytical insights using WatsonX AI by combining complaint & resource data.

        Args:
            complaints_data (dict): Dictionary of complaint data from API.
            resources_data (dict): Dictionary of resource data from API.
            busy_resources_data (dict): Dictionary of busy resource data from API.

        Returns:
            dict: JSON-formatted analytics containing overview, insights, trends, and recommendations.
        """
        if not self.is_watson_x_available:
            logger.info("Watson X not available. Returning fallback analytics data.")
            return self.FALLBACK_ANALYTICS

        try:
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

            generated_text = response.get("results", [{}])[0].get(
                "generated_text", "{}"
            )
            return extract_full_json(generated_text)
        except Exception as e:
            logger.error(
                f"Error calling Watson X: {str(e)}. Falling back to static data."
            )
            return self.FALLBACK_ANALYTICS

    def analyze_priority(self, description: str) -> str:
        """
        Returns static priority if Watson X is not available
        Analyzes priority using Watson X or returns default priority.
        """
        if not self.is_watson_x_available:
            logger.info("Watson X not available. Returning default priority.")
            return "Medium"

        try:
            input_payload = {
                "description": description,
            }

            prompt_text = self.prompts["analyze_priority"](input_payload)

            response = self.model.generate(
                prompt=prompt_text,
                params={
                    "decoding_method": "greedy",
                    "max_new_tokens": 10,
                    "temperature": 0,
                    "stop_sequences": ["\n"],
                },
            )
            return str(
                response.get("results", [{}])[0].get("generated_text", "").strip()
            )
        except Exception as e:
            logger.error(
                f"Error analyzing priority with Watson X: {str(e)}. Returning default."
            )
            return "Medium"
