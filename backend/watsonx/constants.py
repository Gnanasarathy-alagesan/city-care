# Bot session storage (in production, use database)
BOT_SESSIONS = {}
BOT_MESSAGES = {}
BOT_CONFIG = {
    "isEnabled": True,
    "maxSessionDuration": 60,
    "confidenceThreshold": 0.5,
    "fallbackMessage": "I'm sorry, I didn't understand that. Could you please rephrase your question?",
    "adminNotifications": True,
    "autoEscalation": False,
    "escalationThreshold": 3,
}
