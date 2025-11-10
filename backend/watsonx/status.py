"""
Watson X Service Status and Configuration Checker

This module provides utilities to check Watson X credential configuration
and provide appropriate logging/error messages.
"""

import logging
import os
from typing import Dict, Tuple

logger = logging.getLogger(__name__)


def check_watson_x_credentials() -> Tuple[bool, Dict[str, bool]]:
    """
    Check if all required Watson X credentials are configured.

    Returns:
        Tuple containing:
        - bool: True if all credentials are available, False otherwise
        - Dict: Status of each required credential
    """
    required_credentials = {
        "WATSONX_APIKEY": os.getenv("WATSONX_APIKEY"),
        "WATSONX_URL": os.getenv("WATSONX_URL"),
        "PROJECT_ID": os.getenv("PROJECT_ID"),
        "WATSONX_MODEL": os.getenv("WATSONX_MODEL"),
    }

    status = {
        "WATSONX_APIKEY": bool(required_credentials["WATSONX_APIKEY"]),
        "WATSONX_URL": bool(required_credentials["WATSONX_URL"]),
        "PROJECT_ID": bool(required_credentials["PROJECT_ID"]),
        "WATSONX_MODEL": bool(required_credentials["WATSONX_MODEL"]),
    }

    all_available = all(status.values())

    if not all_available:
        missing = [key for key, value in status.items() if not value]
        logger.warning(f"Watson X credentials missing: {', '.join(missing)}")
        logger.info(
            "System will use fallback static data for Watson X-dependent endpoints"
        )

    return all_available, status


def get_watson_x_status() -> Dict:
    """
    Get detailed status of Watson X configuration.

    Returns:
        Dict containing:
        - isConfigured: Whether Watson X is fully configured
        - credentialStatus: Individual credential status
        - mode: Current mode ('live' or 'fallback')
        - message: Human-readable status message
    """
    is_configured, credential_status = check_watson_x_credentials()

    return {
        "isConfigured": is_configured,
        "credentialStatus": credential_status,
        "mode": "live" if is_configured else "fallback",
        "message": (
            "Watson X is properly configured and running in LIVE mode"
            if is_configured
            else "Watson X credentials are missing. System is running in FALLBACK mode with static data."
        ),
    }


def log_watson_x_startup():
    """Log Watson X startup status and mode."""
    status = get_watson_x_status()
    logger.info(f"Watson X Status: {status['message']}")
    logger.info(f"Operating Mode: {status['mode'].upper()}")

    if not status["isConfigured"]:
        logger.info(
            "To enable Watson X, configure these environment variables in .env.local:"
        )
        logger.info("  - WATSONX_APIKEY")
        logger.info("  - WATSONX_URL")
        logger.info("  - PROJECT_ID")
        logger.info("  - WATSONX_MODEL")
