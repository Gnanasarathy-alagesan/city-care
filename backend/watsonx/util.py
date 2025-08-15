import os
import random

import requests
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()


def fetch_data(
    endpoint,
    base_url="http://localhost:8000",
    token=random.choice(os.getenv("ADMIN_API_KEYS").split(",")),
    params=None,
):
    """
    Generic GET request function to fetch data from an API.
    """
    url = f"{base_url.rstrip('/')}/{endpoint.lstrip('/')}"
    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        try:
            return response.json()
        except ValueError:
            return response.text
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=502, detail=f"Error fetching data from {url}: {e}"
        )
