#!/bin/bash

# Install dependencies
pip install -r requirements.txt

# Create uploads directory
mkdir -p uploads

# Run the application
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
