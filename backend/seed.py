import json

SERVICES_DATA = [
    {
        "id": "roads",
        "name": "Roads & Infrastructure",
        "description": "Report potholes, damaged roads, broken sidewalks, and traffic issues",
        "icon": "Construction",
        "examples": json.dumps(
            ["Potholes", "Broken sidewalks", "Traffic signals", "Road signs"]
        ),
    },
    {
        "id": "water",
        "name": "Water Supply",
        "description": "Water leaks, pipe bursts, water quality issues, and supply problems",
        "icon": "Droplets",
        "examples": json.dumps(
            ["Water leaks", "Pipe bursts", "Low pressure", "Water quality"]
        ),
    },
    {
        "id": "electricity",
        "name": "Electricity",
        "description": "Street lighting, power outages, electrical hazards, and maintenance",
        "icon": "Zap",
        "examples": json.dumps(
            [
                "Street lights",
                "Power outages",
                "Electrical hazards",
                "Transformer issues",
            ]
        ),
    },
    {
        "id": "waste",
        "name": "Waste Management",
        "description": "Garbage collection, recycling, illegal dumping, and sanitation",
        "icon": "Trash2",
        "examples": json.dumps(
            [
                "Missed collection",
                "Illegal dumping",
                "Overflowing bins",
                "Recycling issues",
            ]
        ),
    },
    {
        "id": "safety",
        "name": "Public Safety",
        "description": "Safety hazards, emergency situations, and security concerns",
        "icon": "Shield",
        "examples": json.dumps(
            ["Safety hazards", "Emergency situations", "Security concerns", "Vandalism"]
        ),
    },
    {
        "id": "parks",
        "name": "Parks & Recreation",
        "description": "Park maintenance, playground issues, landscaping, and facilities",
        "icon": "TreePine",
        "examples": json.dumps(
            ["Playground damage", "Tree maintenance", "Park facilities", "Landscaping"]
        ),
    },
]
