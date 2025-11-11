import logging
import os
from datetime import datetime, timezone

import uvicorn
from dao import SessionLocal
from database import init_default_data
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes.admin_routes import router as admin_router
from routes.auth_routes import router as auth_router
from routes.bot_routes import router as bot_router
from routes.user_routes import router as user_router
from watsonx.service import WatsonXService
from watsonx.status import log_watson_x_startup

load_dotenv("../.env.local")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

log_watson_x_startup()


async def lifespan(app: FastAPI):
    # Startup
    db = SessionLocal()
    init_default_data(db)
    db.close()

    yield


app = FastAPI(
    lifespan=lifespan,
    title="CityCare API",
    description="Backend service for CityCare citizen complaint platform",
    version="1.0.0",
)

app.mount("/uploads", StaticFiles(directory="./uploads"), name="uploads")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS").split(","),
    allow_origin_regex=".*zscaler.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize WatsonX service
watsonx_service = WatsonXService()


# Initialize default data on startup
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    init_default_data(db)
    db.close()


@app.get("/api")
def read_root():
    """
    Root endpoint to check API status.

    Returns:
        dict: API status message
    """
    return {"message": "API is running"}


@app.get("/api/health")
async def health_check():
    """
    Health check endpoint for monitoring API status.

    Returns:
        dict: Health status and timestamp
    """
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/api/health/watson-x")
async def watson_x_health_check():
    """
    Check Watson X service status and configuration.

    Returns:
        dict: Watson X service status including configuration state and mode
    """
    from watsonx.status import get_watson_x_status

    status = get_watson_x_status()
    return {
        "service": "watson-x",
        "status": "healthy" if status["isConfigured"] else "degraded",
        "mode": status["mode"],
        "isConfigured": status["isConfigured"],
        "credentialStatus": status["credentialStatus"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# Include routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(admin_router)
app.include_router(bot_router)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
