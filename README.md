# 🏙️ CityCare - Smart City Complaint Management System

CityCare is a comprehensive full-stack application that enables citizens to report city issues and provides administrators with AI-powered insights for efficient city management. Built with modern technologies and integrated with IBM WatsonX AI for intelligent recommendations.

## 🚀 Features

### For Citizens
- **Report Issues**: Submit complaints about city infrastructure, roads, utilities, and public services
- **Photo Upload**: Attach images to provide visual evidence of issues
- **Real-time Status**: Track the status of submitted complaints
- **AI Assistant**: Get help with government schemes and citizen rights through WatsonX chatbot

### For Administrators
- **Dashboard**: Comprehensive overview of all complaints and city metrics
- **Interactive Map**: Visualize complaint locations on San Francisco street map
- **Analytics**: Detailed insights and trends analysis
- **AI Recommendations**: WatsonX-powered suggestions for issue resolution
- **Complaint Management**: Efficient workflow for processing and resolving issues

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 19** - Latest React with modern features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Leaflet** - Interactive maps without external API dependencies

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **SQLite** - Lightweight database for development
- **JWT Authentication** - Secure user authentication
- **IBM WatsonX AI** - AI-powered insights and recommendations

## 📋 Prerequisites

Before running CityCare, ensure you have:

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **Python 3.8+** and **pip3**
- **Git** (for cloning the repository)
- **4GB RAM** (recommended for smooth operation)

### System Requirements
- **OS**: Linux, macOS, or Windows
- **Ports**: 3000 (frontend), 8000 (backend) should be available
- **Disk Space**: At least 1GB free space

## 🚀 Quick Start

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
- ✅ Check system requirements (Node.js, Python)
- ✅ Create environment configuration
- ✅ Create Python virtual environment
- ✅ Install backend dependencies
- ✅ Install frontend dependencies
- ✅ Initialize SQLite database
- ✅ Start backend and frontend servers
- ✅ Verify service health

### 3. Access the Application

Once setup is complete, access:

- **🌐 Frontend**: http://localhost:3000
- **🔧 Backend API**: http://localhost:8000
- **📊 API Documentation**: http://localhost:8000/docs

### Default Admin Credentials
- **Username**: `admin`
- **Password**: `admin`

## 📖 Usage Guide

### Setup Script Commands

\`\`\`bash
# Start the application
./setup.sh

# Show help
./setup.sh --help

# Stop all services
./setup.sh --stop

# Restart services
./setup.sh --restart

# View service logs
./setup.sh --logs [backend|frontend]

# Check service status
./setup.sh --status

# Clean up everything
./setup.sh --clean
\`\`\`

### Manual Development Commands

\`\`\`bash
# Backend (from project root)
cd backend
source venv/bin/activate
python app.py

# Frontend (from project root)
cd frontend
npm run dev
\`\`\`

## 🏗️ Project Structure

\`\`\`
citycare/
├── frontend/                 # Next.js React application
│   ├── app/                 # App Router pages
│   ├── components/          # React components
│   ├── services/           # API service layers
│   └── public/             # Static assets
├── backend/                 # FastAPI Python application
│   ├── routes/             # API route handlers
│   ├── models/             # Database models
│   ├── services/           # Business logic
│   ├── venv/              # Python virtual environment
│   └── dto.py              # Data transfer objects
├── components/             # Shared React components
├── setup.sh              # Automated setup script
├── backend.log           # Backend server logs
├── frontend.log          # Frontend server logs
└── README.md             # This file
\`\`\`

## 🔧 Configuration

### Environment Variables

The setup script creates environment files with default values:

**Backend (.env)**:
\`\`\`env
SECRET_KEY=your-super-secret-key
BACKEND_PORT=8000
ALLOWED_ORIGINS=http://localhost:3000
DATABASE_URL=sqlite:///./citycare.db
DEBUG=True
\`\`\`

**Frontend (.env.local)**:
\`\`\`env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_ADMIN_API_KEY=admin-key-123
\`\`\`

### Custom Configuration

1. **Database**: Uses SQLite by default for simplicity
2. **Ports**: Modify in environment files
3. **AI Integration**: Configure WatsonX API keys in backend environment
4. **Maps**: Customize city focus in map components

## 🗺️ API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh

### Complaint Endpoints
- `GET /api/complaints` - List complaints
- `POST /api/complaints` - Create complaint
- `GET /api/complaints/{id}` - Get complaint details
- `PUT /api/complaints/{id}` - Update complaint

### Admin Endpoints
- `GET /api/admin/dashboard` - Dashboard metrics
- `GET /api/admin/analytics` - Analytics data
- `POST /api/admin/watsonx/recommendations` - AI recommendations

### WatsonX Integration
- `POST /api/watsonx/chat` - AI chatbot interaction
- `GET /api/watsonx/insights` - AI-generated insights

## 🧪 Development

### Local Development Setup

1. **Frontend Development**:
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

2. **Backend Development**:
\`\`\`bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python app.py
\`\`\`

### Code Style

- **Frontend**: ESLint + Prettier configuration
- **Backend**: Black + isort for Python formatting
- **TypeScript**: Strict mode enabled
- **Commits**: Conventional commit messages

## 🚨 Troubleshooting

### Common Issues

**Port Already in Use**
\`\`\`bash
# Check what's using the port
lsof -i :3000
# Kill the process
kill -9 <PID>
\`\`\`

**Python Virtual Environment Issues**
\`\`\`bash
# Recreate virtual environment
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
\`\`\`

**Node.js Issues**
\`\`\`bash
# Clear npm cache
npm cache clean --force
# Delete node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
\`\`\`

**Database Issues**
\`\`\`bash
# Reset database
rm backend/citycare.db
./setup.sh --restart
\`\`\`

### Service Health Checks

\`\`\`bash
# Check backend health
curl http://localhost:8000/api/health

# Check frontend
curl http://localhost:3000

# Check if services are running
./setup.sh --status
\`\`\`

## 📊 Monitoring

### Service Logs
\`\`\`bash
# View all logs
./setup.sh --logs

# View specific service logs
./setup.sh --logs backend
./setup.sh --logs frontend

# View log files directly
tail -f backend.log
tail -f frontend.log
\`\`\`

### Performance Monitoring
- Frontend: Built-in Next.js analytics
- Backend: FastAPI automatic metrics
- Database: SQLite lightweight performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript/Python best practices
- Write tests for new features
- Update documentation
- Ensure local setup works

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **IBM WatsonX** - AI and machine learning capabilities
- **OpenStreetMap** - Map data and tiles
- **Vercel** - Deployment and hosting inspiration
- **FastAPI** - Modern Python web framework
- **Next.js** - React framework

## 📞 Support

For support and questions:

1. **Documentation**: Check this README and API docs
2. **Issues**: Create a GitHub issue
3. **Discussions**: Use GitHub Discussions
4. **Email**: Contact the development team

---

**Built with ❤️ for smarter cities and better citizen services**
