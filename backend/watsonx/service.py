# Mock WatsonX AI Service
import json
import os
import re

from dotenv import load_dotenv
from ibm_watsonx_ai.credentials import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

dotenv_path = os.path.join(parent_dir, ".env.local")

load_dotenv(dotenv_path=dotenv_path)


def extract_full_json(generated_text):
    # Step 1: Try direct JSON parse
    try:
        return json.loads(generated_text)
    except json.JSONDecodeError:
        pass

    # Step 2: Find the first '{' and match balanced braces
    start = generated_text.find('{')
    if start == -1:
        return {"error": "No JSON found", "raw": generated_text}

    brace_count = 0
    end = None
    for i, ch in enumerate(generated_text[start:], start=start):
        if ch == '{':
            brace_count += 1
        elif ch == '}':
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
    blocks = re.findall(r'\{[\s\S]*?\}', generated_text)
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
            "ai_insights": lambda input: f"""
                    You are an AI assistant for the Public Works Department.
                    Your task is to analyze the provided citizen complaints and available resources 
                    to produce actionable operational insights, predictive analytics, optimized resource allocation, 
                    and automated recommendations.

                    INPUT DATA:
                    Complaints (JSON list):
                    {input["complaints"]}

                    Resources (JSON list):
                    {input["resources"]}

                    REQUIREMENTS:
                    1. **Trend Analysis**: Summarize key trends and recurring issues from the complaints.
                    2. **Urgent Issues**: Identify the most urgent problems requiring immediate action.
                    3. **Predictive Analytics**: Forecast likely future issues or complaint patterns based on the given data.
                    4. **Resource Optimization**: Recommend the most efficient allocation of current resources to address both immediate and predicted issues.
                    5. **Automated Recommendations**: Suggest proactive measures, preventative maintenance, or policy changes to reduce future complaints.
                    6. **Gap Analysis**: Flag areas where resources are insufficient or mismatched to needs.

                    OUTPUT FORMAT:
                    Provide the output strictly as JSON in the following structure:

                    {{
                    "summary": "Brief high-level overview of complaint patterns",
                    "urgent_issues": [
                        {{ "issue": "Description", "frequency": <number>, "urgency_reason": "Why urgent" }}
                    ],
                    "predictive_analytics": [
                        {{ "predicted_issue": "Description", "confidence": "<percentage>", "expected_timeframe": "e.g., 2 weeks" }}
                    ],
                    "recommended_actions": [
                        {{ "action": "Description", "resources_assigned": ["resource_id", ...], "expected_impact": "Short description" }}
                    ],
                    "resource_optimization": [
                        {{ "resource_id": "ID", "optimized_use": "Description of best allocation" }}
                    ],
                    "resource_gaps": [
                        {{ "gap": "Description of missing resource or shortfall" }}
                    ]
                    }}

                    CONSTRAINTS:
                    - Base all analysis strictly on the input data provided.
                    - Be concise but specific.
                    - Ensure all recommendations are practical and implementable.
                    - Do not invent data or make unsupported assumptions.
                """
        }
        # WatsonX config
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

        generated_text = response.get("results", [{}])[0].get("generated_text", "{}")
        return extract_full_json(generated_text)

    def analyze_priority(self, description: str) -> str:

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
                "stop_sequences": ["\n"]
            },
        )
        return str(response.get("results", [{}])[0].get("generated_text", "").strip())
    
    def get_ai_insights(self, complaints:list, resources:list) -> dict:
        
        input_payload = {
            "complaints": complaints,
            "resources": resources,
        }
        response = self.model.generate(
            prompt=self.prompts["ai_insights"](input_payload),
            params={
                "decoding_method": "greedy",
                "max_new_tokens": 1000,
                "min_new_tokens": 50,
                "temperature": 0,
            },
        )

        generated_text = response.get("results", [{}])[0].get("generated_text", "{}")
        return generated_text