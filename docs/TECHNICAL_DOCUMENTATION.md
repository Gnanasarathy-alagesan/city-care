# CityCare: Technical Documentation

## 🏗️ System Architecture

### **High-Level Architecture**

CityCare follows a modern, scalable architecture with clear separation of concerns:

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (SQLite)      │
│                 │    │                 │    │                 │
│ • React 18      │    │ • Python 3.11   │    │ • SQLAlchemy    │
│ • Tailwind CSS  │    │ • JWT Auth      │    │ • Seed Data     │
│ • shadcn/ui     │    │ • WatsonX AI    │    │ • File Storage  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

### **Component Architecture**

#### **Frontend Components**
- **Pages**: Next.js App Router pages for routing
- **Components**: Reusable React components with shadcn/ui
- **Services**: API communication layer
- **Hooks**: Custom React hooks for state management
- **Utils**: Helper functions and utilities

#### **Backend Services**
- **Routes**: Modular API endpoints (auth, user, admin, bot)
- **Models**: SQLAlchemy database models
- **Services**: Business logic and external integrations
- **Utils**: Authentication, validation, and helper functions
- **Database**: SQLite with automatic initialization

## 🗄️ Database Design

### **Entity Relationship Diagram**

![Database Schema](docs/architecture-diagram.png)

### **Core Tables**

#### **Users Table**
\`\`\`sql
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,           -- UUID
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    district VARCHAR(50),
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

#### **Complaints Table**
\`\`\`sql
CREATE TABLE complaints (
    id VARCHAR PRIMARY KEY,           -- Format: CC-XXXXXXXX
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'Open',
    priority VARCHAR(10) DEFAULT 'Medium',
    location_lat FLOAT,
    location_lng FLOAT,
    location_address TEXT,
    location_district VARCHAR(50),
    reporter_id VARCHAR NOT NULL,
    assigned_to VARCHAR(100),
    team_id VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id)
);
\`\`\`

#### **Services Table**
\`\`\`sql
CREATE TABLE services (
    id VARCHAR PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    examples TEXT NOT NULL             -- JSON string
);
\`\`\`

#### **Resources Table**
\`\`\`sql
CREATE TABLE resources (
    id VARCHAR PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,         -- Equipment, Personnel, Vehicle
    service_category VARCHAR(50) NOT NULL,
    description TEXT,
    availability_status VARCHAR(20) DEFAULT 'Available',
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    location VARCHAR(200),
    capacity INTEGER,
    hourly_rate FLOAT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
\`\`\`

### **Database Features**

#### **Relationships**
- **One-to-Many**: User → Complaints
- **One-to-Many**: Complaint → Status History
- **One-to-Many**: Complaint → Images
- **Many-to-Many**: Complaints ↔ Resources (through assignment table)

#### **Indexing Strategy**
\`\`\`sql
-- Performance indexes for common queries
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_district ON complaints(location_district);
CREATE INDEX idx_complaints_reporter ON complaints(reporter_id);
CREATE INDEX idx_complaints_created ON complaints(created_at DESC);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_district ON users(district);
\`\`\`

## 🔌 API Architecture

### **RESTful API Design**

#### **Authentication Endpoints**
```python
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
