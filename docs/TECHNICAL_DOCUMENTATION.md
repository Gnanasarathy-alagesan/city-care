# CityCare: Technical Documentation

## 🏗️ System Architecture

### **High-Level Architecture**

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                        CityCare Platform                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   Web App   │  │ Mobile App  │  │  Admin      │  │   API   │ │
│  │  (Next.js)  │  │ (PWA/React) │  │  Dashboard  │  │ Gateway │ │
│  │             │  │             │  │             │  │         │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                      API Layer (FastAPI)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │    Auth     │  │ Complaints  │  │    Admin    │  │   Bot   │ │
│  │   Service   │  │   Service   │  │   Service   │  │ Service │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                     Business Logic Layer                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │ PostgreSQL  │  │ File Storage│  │  WatsonX    │  │  Cache  │ │
│  │  Database   │  │   (Local)   │  │     AI      │  │ (Redis) │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────────────┘
\`\`\`

### **Component Architecture**

#### **Frontend Layer**
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context + Custom Hooks
- **Authentication**: JWT token-based with secure storage
- **API Communication**: Axios with interceptors for error handling

#### **Backend Layer**
- **Framework**: FastAPI with Python 3.8+
- **Architecture**: Modular route-based structure
- **Authentication**: JWT with bcrypt password hashing
- **Database ORM**: SQLAlchemy with Alembic migrations
- **File Handling**: Secure upload with validation and compression

#### **Database Layer**
- **Primary Database**: PostgreSQL 13+
- **Connection Pooling**: SQLAlchemy connection pool
- **Migrations**: Alembic for schema versioning
- **Indexing**: Optimized indexes for query performance

#### **AI Integration Layer**
- **Platform**: IBM WatsonX
- **Integration**: REST API with secure authentication
- **Fallback**: Local knowledge base for offline scenarios
- **Caching**: Response caching for improved performance

## 🗄️ Database Design

### **Entity Relationship Diagram**

\`\`\`sql
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      Users      │     │   Complaints    │     │    Services     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │────┐│ id (PK)         │┌───│ id (PK)         │
│ first_name      │    ││ title           ││   │ name            │
│ last_name       │    ││ description     ││   │ description     │
│ email (UNIQUE)  │    ││ service_type    ││   │ category        │
│ password_hash   │    ││ status          ││   │ is_active       │
│ phone           │    ││ priority        ││   │ created_at      │
│ address         │    ││ location_lat    ││   └─────────────────┘
│ district        │    ││ location_lng    ││
│ is_admin        │    ││ location_address││
│ is_active       │    ││ location_district│
│ created_at      │    ││ reporter_id (FK)│┘
│ last_active     │    ││ assigned_to (FK)│
└─────────────────┘    ││ team_id         │
                       ││ created_at      │
                       ││ updated_at      │
                       │└─────────────────┘
                       │
┌─────────────────┐    │ ┌─────────────────┐
│ComplaintImages  │    │ │ComplaintStatus  │
├─────────────────┤    │ │    History      │
│ id (PK)         │    │ ├─────────────────┤
│ complaint_id(FK)│────┘ │ id (PK)         │
│ image_url       │      │ complaint_id(FK)│──┐
│ created_at      │      │ status          │  │
└─────────────────┘      │ note            │  │
                         │ updated_by (FK) │──┘
                         │ created_at      │
                         └─────────────────┘
\`\`\`

### **Database Schema Details**

#### **Users Table**
\`\`\`sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    district VARCHAR(100),
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_district ON users(district);
CREATE INDEX idx_users_active ON users(is_active);
\`\`\`

#### **Complaints Table**
\`\`\`sql
CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Open',
    priority VARCHAR(20) DEFAULT 'Medium',
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_address TEXT,
    location_district VARCHAR(100),
    reporter_id INTEGER REFERENCES users(id),
    assigned_to INTEGER REFERENCES users(id),
    team_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_reporter ON complaints(reporter_id);
CREATE INDEX idx_complaints_district ON complaints(location_district);
CREATE INDEX idx_complaints_service_type ON complaints(service_type);
CREATE INDEX idx_complaints_created_at ON complaints(created_at);
\`\`\`

## 🔧 API Documentation

### **Authentication Endpoints**

#### **POST /auth/login**
\`\`\`json
{
  "endpoint": "/auth/login",
  "method": "POST",
  "description": "Authenticate user and return JWT token",
  "request_body": {
    "email": "string (required)",
    "password": "string (required)"
  },
  "responses": {
    "200": {
      "access_token": "string",
      "token_type": "bearer",
      "user": {
        "id": "integer",
        "email": "string",
        "first_name": "string",
        "last_name": "string",
        "is_admin": "boolean"
      }
    },
    "401": {
      "detail": "Invalid credentials"
    }
  }
}
\`\`\`

#### **POST /auth/register**
\`\`\`json
{
  "endpoint": "/auth/register",
  "method": "POST",
  "description": "Register new user account",
  "request_body": {
    "first_name": "string (required)",
    "last_name": "string (required)",
    "email": "string (required)",
    "password": "string (required, min 8 chars)",
    "phone": "string (optional)",
    "address": "string (optional)",
    "district": "string (optional)"
  },
  "responses": {
    "201": {
      "message": "User registered successfully",
      "user_id": "integer"
    },
    "400": {
      "detail": "Email already registered"
    }
  }
}
\`\`\`

### **Complaint Management Endpoints**

#### **GET /complaints**
\`\`\`json
{
  "endpoint": "/complaints",
  "method": "GET",
  "description": "Retrieve complaints with filtering and pagination",
  "query_parameters": {
    "page": "integer (default: 1)",
    "limit": "integer (default: 10, max: 100)",
    "status": "string (optional)",
    "service_type": "string (optional)",
    "district": "string (optional)",
    "priority": "string (optional)",
    "search": "string (optional)"
  },
  "responses": {
    "200": {
      "complaints": "array of complaint objects",
      "total": "integer",
      "page": "integer",
      "limit": "integer",
      "total_pages": "integer"
    }
  }
}
\`\`\`

#### **POST /complaints**
\`\`\`json
{
  "endpoint": "/complaints",
  "method": "POST",
  "description": "Create new complaint",
  "request_body": {
    "title": "string (required, max 200 chars)",
    "description": "string (required)",
    "service_type": "string (required)",
    "priority": "string (optional, default: Medium)",
    "location_lat": "number (optional)",
    "location_lng": "number (optional)",
    "location_address": "string (optional)",
    "location_district": "string (optional)"
  },
  "files": {
    "images": "array of image files (optional, max 5 files, 10MB each)"
  },
  "responses": {
    "201": {
      "message": "Complaint created successfully",
      "complaint_id": "integer"
    }
  }
}
\`\`\`

### **AI Agent Endpoints**

#### **POST /bot/chat**
\`\`\`json
{
  "endpoint": "/bot/chat",
  "method": "POST",
  "description": "Chat with AI Rights Agent",
  "request_body": {
    "message": "string (required)",
    "conversation_id": "string (optional)",
    "user_context": {
      "district": "string (optional)",
      "user_type": "string (optional)"
    }
  },
  "responses": {
    "200": {
      "response": "string",
      "conversation_id": "string",
      "suggestions": "array of strings",
      "resources": "array of resource objects"
    }
  }
}
\`\`\`

## 🔒 Security Implementation

### **Authentication & Authorization**

#### **JWT Token Structure**
\`\`\`json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id",
    "email": "user@example.com",
    "is_admin": false,
    "exp": 1640995200,
    "iat": 1640908800
  }
}
\`\`\`

#### **Password Security**
- **Hashing Algorithm**: bcrypt with salt rounds = 12
- **Password Requirements**: Minimum 8 characters, complexity validation
- **Password Reset**: Secure token-based reset with expiration

#### **API Security**
- **CORS Configuration**: Restricted origins for production
- **Rate Limiting**: Request throttling to prevent abuse
- **Input Validation**: Comprehensive request validation using Pydantic
- **SQL Injection Prevention**: Parameterized queries with SQLAlchemy

### **File Upload Security**

#### **Validation Rules**
```python
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_FILES_PER_COMPLAINT = 5

def validate_image(file):
    # File extension validation
    # File size validation
    # MIME type validation
    # Image header validation
    # Malware scanning (future enhancement)
