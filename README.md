# 🏙️ CityCare - Intelligent Civic Complaint Management System

CityCare is a comprehensive civic complaint management platform that empowers citizens to report municipal issues and provides administrators with powerful tools to manage and resolve complaints efficiently. The system features an AI-powered Rights Agent that helps citizens understand their rights and access government schemes.

## 🌟 Features

### For Citizens
- **Easy Complaint Submission**: Report civic issues with photos, location, and detailed descriptions
- **Real-time Tracking**: Monitor complaint status and receive updates
- **AI Rights Agent**: Get information about citizen rights and government schemes
- **Mobile-Responsive Design**: Access from any device
- **Secure Authentication**: Protected user accounts and data

### For Administrators
- **Comprehensive Dashboard**: Overview of all complaints and system analytics
- **Complaint Management**: Assign, update, and resolve complaints
- **Team Management**: Organize field teams and assign responsibilities
- **Analytics & Reporting**: Insights into complaint patterns and resolution metrics
- **User Management**: Manage citizen accounts and permissions

### AI-Powered Features
- **WatsonX Integration**: Advanced AI agent for citizen assistance
- **Intelligent Categorization**: Automatic complaint classification
- **Predictive Analytics**: Insights for better resource allocation
- **Natural Language Processing**: Enhanced search and filtering

## 🏗️ Architecture

CityCare follows a modern microservices architecture:

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│  (PostgreSQL)   │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│   WatsonX AI    │              │
                        │   (External)    │              │
                        └─────────────────┘              │
                                 │                       │
                        ┌─────────────────┐              │
                        │   Nginx Proxy   │              │
                        │   (Production)  │              │
                        └─────────────────┘              │
                                 │                       │
                        ┌─────────────────┐              │
                        │   File Storage  │              │
                        │   (Local/Cloud) │              │
                        └─────────────────┘              │
\`\`\`

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** (Recommended for production)
- **Python 3.8+** (For development)
- **Node.js 18+** (For development)
- **PostgreSQL** (If running without Docker)

### Option 1: Development Mode (Recommended for Development)

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd citycare
   \`\`\`

2. **Setup development environment**
   \`\`\`bash
   chmod +x setup.sh
   ./setup.sh --setup-dev
   \`\`\`

3. **Start development servers**
   \`\`\`bash
   ./setup.sh --dev
   \`\`\`

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Rights Agent: http://localhost:3000/watsonxbot

### Option 2: Docker Production Mode

1. **Clone and start with Docker**
   \`\`\`bash
   git clone <repository-url>
   cd citycare
   chmod +x setup.sh
   ./setup.sh
   \`\`\`

2. **Access the application**
   - Application: http://localhost
   - API Documentation: http://localhost/api/docs

### Manual Development Setup

#### Backend Setup
\`\`\`bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python scripts/init_database.py
uvicorn main:app --reload
\`\`\`

#### Frontend Setup
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

\`\`\`env
# Database Configuration
POSTGRES_DB=citycare
POSTGRES_USER=citycare
POSTGRES_PASSWORD=citycare123
POSTGRES_PORT=5432

# Backend Configuration
SECRET_KEY=your-super-secret-key-change-in-production
BACKEND_PORT=8000
ALLOWED_ORIGINS=http://localhost:3000

# Frontend Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
FRONTEND_PORT=3000

# WatsonX AI Configuration (Optional)
WATSONX_API_KEY=your-watsonx-api-key
WATSONX_PROJECT_ID=your-project-id
WATSONX_ENDPOINT=your-watsonx-endpoint
\`\`\`

### Default Credentials

**Admin Account:**
- Email: `admin@admin.com`
- Password: `admin`

**Test User Accounts:**
- Email: `john.smith@email.com`
- Password: `password123`

## 📚 API Documentation

The API documentation is automatically generated and available at:
- Development: http://localhost:8000/docs
- Production: http://localhost/api/docs

### Key API Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout

#### Complaints
- `GET /complaints` - List complaints
- `POST /complaints` - Create complaint
- `GET /complaints/{id}` - Get complaint details
- `PUT /complaints/{id}` - Update complaint
- `DELETE /complaints/{id}` - Delete complaint

#### Admin
- `GET /admin/dashboard` - Admin dashboard data
- `GET /admin/users` - Manage users
- `GET /admin/analytics` - System analytics

#### AI Agent
- `POST /bot/chat` - Chat with Rights Agent
- `GET /bot/analytics` - Bot analytics

## 🤖 AI Rights Agent

The AI Rights Agent is powered by WatsonX and provides:

### Capabilities
- **Rights Information**: Details about citizen rights and entitlements
- **Scheme Discovery**: Information about government schemes and benefits
- **Eligibility Checking**: Help determine eligibility for various programs
- **Application Guidance**: Step-by-step guidance for applications
- **Legal Assistance**: Basic legal information and resources

### Integration
The agent integrates with WatsonX Orchestrate through:
- API key authentication
- Ngrok tunnel for external access
- Admin privilege level access
- Real-time conversation handling

## 🗄️ Database Schema

### Core Tables
- **users**: User accounts and profiles
- **complaints**: Complaint records
- **complaint_images**: Complaint attachments
- **complaint_status_history**: Status change tracking
- **services**: Available civic services

### Sample Data
The system includes comprehensive seed data:
- 7 test users across different districts
- 8 sample complaints with various statuses
- Complete status history tracking
- Realistic complaint images and locations

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt password encryption
- **CORS Protection**: Configured cross-origin resource sharing
- **Input Validation**: Comprehensive request validation
- **File Upload Security**: Secure file handling and validation
- **SQL Injection Prevention**: Parameterized queries

## 🧪 Testing

### Backend Testing
\`\`\`bash
cd backend
source venv/bin/activate
pytest tests/
\`\`\`

### Frontend Testing
\`\`\`bash
cd frontend
npm test
\`\`\`

### API Testing
Use the interactive API documentation at `/docs` or tools like Postman with the provided endpoints.

## 📊 Monitoring & Analytics

### Available Metrics
- Complaint resolution times
- User engagement statistics
- Geographic complaint distribution
- Service type analytics
- AI agent interaction metrics

### Dashboard Features
- Real-time complaint status overview
- Performance metrics visualization
- User activity monitoring
- System health indicators

## 🚀 Deployment

### Production Deployment with Docker
\`\`\`bash
# Set production environment
export COMPOSE_PROFILES=production

# Deploy with SSL (optional)
./setup.sh --production

# Or manual deployment
docker-compose -f docker-compose.prod.yml up -d
\`\`\`

### Environment-Specific Configurations
- **Development**: Hot reloading, debug mode, local database
- **Staging**: Production-like environment with test data
- **Production**: Optimized builds, SSL, external database

## 🛠️ Development

### Project Structure
\`\`\`
citycare/
├── backend/                 # FastAPI backend
│   ├── routes/             # API route modules
│   ├── models/             # Database models
│   ├── services/           # Business logic
│   ├── watsonx/            # AI integration
│   └── scripts/            # Utility scripts
├── frontend/               # Next.js frontend
│   ├── app/                # App router pages
│   ├── components/         # React components
│   ├── services/           # API services
│   └── lib/                # Utilities
├── nginx/                  # Nginx configuration
├── scripts/                # Setup scripts
└── docs/                   # Documentation
\`\`\`

### Contributing Guidelines
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

### Code Style
- **Backend**: Follow PEP 8 Python style guide
- **Frontend**: Use ESLint and Prettier configurations
- **Commits**: Use conventional commit messages

## 📞 Support

### Common Issues
1. **Port conflicts**: Check if ports 3000, 8000, 5432 are available
2. **Database connection**: Ensure PostgreSQL is running
3. **Permission errors**: Check file permissions for uploads directory
4. **Docker issues**: Restart Docker service and try again

### Getting Help
- Check the API documentation at `/docs`
- Review the logs: `docker-compose logs -f`
- Open an issue in the repository
- Contact the development team

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **WatsonX AI**: For providing advanced AI capabilities
- **FastAPI**: For the robust backend framework
- **Next.js**: For the modern frontend framework
- **PostgreSQL**: For reliable data storage
- **Docker**: For containerization support

---

**CityCare** - Empowering citizens, enabling efficient governance. 🏙️✨