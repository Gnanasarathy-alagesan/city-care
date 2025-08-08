# 🏙️ CityCare - Citizen Issue Reporting Platform

A comprehensive platform that bridges the gap between citizens and the Public Works Department, making it easier to report issues and track their resolution.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Development](#development)
- [Production Deployment](#production-deployment)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### 🎯 **Core Features**
- **Citizen Complaint Management**: Report, track, and resolve city issues
- **Real-time Status Updates**: Live tracking of complaint resolution
- **Admin Dashboard**: Comprehensive management interface
- **File Upload Support**: Attach photos to complaints
- **Geolocation Integration**: Location-based issue reporting
- **AI-Powered Suggestions**: Smart categorization and priority assignment

### 🔐 **Security & Authentication**
- JWT-based authentication
- Role-based access control (Admin/User)
- Secure password hashing
- CORS protection

### 📱 **User Experience**
- Responsive design for all devices
- Modern Material UI components
- Intuitive navigation and workflows
- Real-time notifications

## 🏗️ Architecture

\`\`\`
CityCare Platform
├── Frontend (Next.js + React)
│   ├── User Interface
│   ├── Admin Dashboard
│   └── Authentication
├── Backend (FastAPI + Python)
│   ├── REST API
│   ├── Authentication
│   ├── File Upload
│   └── AI Integration
├── Database (PostgreSQL)
│   ├── User Management
│   ├── Complaint Tracking
│   └── Audit Logs
└── Infrastructure (Docker)
    ├── Container Orchestration
    ├── Reverse Proxy (Nginx)
    └── Environment Management
\`\`\`

## 🚀 Quick Start

### Prerequisites

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- **Git**

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd citycare
\`\`\`

### 2. Run the Setup Script

\`\`\`bash
chmod +x setup.sh
./setup.sh
\`\`\`

The setup script will:
- ✅ Check system requirements
- ✅ Create environment configuration
- ✅ Set up necessary directories
- ✅ Build and start all services
- ✅ Verify service health

### 3. Access the Application

- **🌐 Frontend**: http://localhost:3000
- **🔧 Backend API**: http://localhost:8000
- **📊 API Docs**: http://localhost:8000/docs
- **🗄️ Database**: localhost:5432

### 4. Default Credentials

- **Admin Login**: `admin` / `admin`
- **Regular Users**: Register through the application

## 📁 Project Structure

\`\`\`
citycare/
├── frontend/                 # Next.js React Application
│   ├── app/                 # App Router pages
│   ├── components/          # Reusable components
│   ├── services/           # API service layer
│   ├── lib/                # Utilities and configurations
│   └── public/             # Static assets
├── backend/                 # FastAPI Python Application
│   ├── main.py             # Main application file
│   ├── models.py           # Database models
│   ├── auth.py             # Authentication utilities
│   └── uploads/            # File upload directory
├── nginx/                   # Nginx configuration
├── init-db/                # Database initialization scripts
├── docker-compose.yml      # Multi-service orchestration
├── setup.sh               # Environment setup script
└── .env                   # Environment variables
\`\`\`

## ⚙️ Configuration

### Environment Variables

The application uses environment variables for configuration. Key variables include:

\`\`\`bash
# Database
POSTGRES_DB=citycare
POSTGRES_USER=citycare
POSTGRES_PASSWORD=citycare123

# Backend
SECRET_KEY=your-secret-key
BACKEND_PORT=8000

# Frontend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
FRONTEND_PORT=3000
\`\`\`

### Customization

1. **Database Configuration**: Modify PostgreSQL settings in `.env`
2. **API Endpoints**: Update backend URLs in frontend services
3. **UI Theming**: Customize Tailwind CSS configuration
4. **Feature Flags**: Enable/disable features via environment variables

## 🛠️ Development

### Running in Development Mode

\`\`\`bash
# Start all services
./setup.sh

# View logs
./setup.sh --logs

# Stop services
./setup.sh --stop

# Restart services
./setup.sh --restart
\`\`\`

### Individual Service Development

#### Frontend Development
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

#### Backend Development
\`\`\`bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
\`\`\`

### Database Management

\`\`\`bash
# Access PostgreSQL
docker-compose exec postgres psql -U citycare -d citycare

# Backup database
docker-compose exec postgres pg_dump -U citycare citycare > backup.sql

# Restore database
docker-compose exec -T postgres psql -U citycare -d citycare < backup.sql
\`\`\`

## 🚀 Production Deployment

### Using Docker Compose

1. **Update Environment Variables**:
   \`\`\`bash
   cp .env .env.production
   # Edit .env.production with production values
   \`\`\`

2. **Enable Production Profile**:
   \`\`\`bash
   export COMPOSE_PROFILES=production
   docker-compose up -d
   \`\`\`

3. **SSL Configuration**:
   - Place SSL certificates in `nginx/ssl/`
   - Update nginx configuration for HTTPS

### Cloud Deployment Options

- **AWS**: ECS, EKS, or EC2 with Docker
- **Google Cloud**: Cloud Run, GKE, or Compute Engine
- **Azure**: Container Instances, AKS, or Virtual Machines
- **DigitalOcean**: App Platform or Droplets

## 📚 API Documentation

### Interactive Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

#### Complaints
- `GET /api/complaints` - List user complaints
- `POST /api/complaints` - Create new complaint
- `GET /api/complaints/{id}` - Get complaint details

#### Admin
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/users` - List all users
- `PUT /api/admin/complaints/{id}/assign` - Assign complaint

## 🔧 Troubleshooting

### Common Issues

#### Port Conflicts
\`\`\`bash
# Check what's using the port
lsof -i :3000
lsof -i :8000
lsof -i :5432

# Kill processes if needed
kill -9 <PID>
\`\`\`

#### Database Connection Issues
\`\`\`bash
# Check database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
\`\`\`

#### Frontend Build Issues
\`\`\`bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run build
\`\`\`

#### Backend Issues
\`\`\`bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
\`\`\`

### Service Management Commands

\`\`\`bash
# Check service status
./setup.sh --status

# View all logs
./setup.sh --logs

# Clean up everything
./setup.sh --clean

# Get help
./setup.sh --help
\`\`\`

### Performance Optimization

1. **Database Indexing**: Ensure proper indexes on frequently queried columns
2. **Caching**: Implement Redis for session and data caching
3. **CDN**: Use CDN for static assets in production
4. **Load Balancing**: Scale horizontally with multiple backend instances

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Made with ❤️ for better cities and communities**
