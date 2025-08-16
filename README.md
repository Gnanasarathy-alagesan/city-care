# CityCare - Citizen Complaint Management System

A comprehensive digital platform for managing citizen complaints and civic issues with AI-powered assistance for citizen rights and government schemes awareness.

## 🏗️ System Architecture

![System Architecture](docs/system-overview.png)

## ✨ Features

### 🏛️ **Admin Dashboard**
- **Complaint Management**: View, assign, and track all citizen complaints
- **Resource Management**: Manage city resources (equipment, personnel, vehicles)
- **Analytics & Reporting**: Comprehensive insights and performance metrics
- **User Management**: Manage citizen accounts and admin privileges
- **Status Tracking**: Real-time complaint status updates and history

### 👥 **Citizen Portal**
- **Easy Complaint Filing**: Submit complaints with location, images, and descriptions
- **Real-time Tracking**: Track complaint status and resolution progress
- **Service Categories**: Organized complaint types (roads, water, electricity, etc.)
- **Mobile-Responsive**: Optimized for mobile and desktop usage
- **Notification System**: Updates on complaint progress

### 🤖 **AI Rights Agent**
- **Citizen Rights Information**: AI-powered knowledge base about citizen rights
- **Government Schemes**: Information about available government programs and benefits
- **Eligibility Checker**: Help citizens understand what schemes they qualify for
- **Interactive Chat**: Natural language interaction for rights and schemes queries
- **WatsonX Integration**: Advanced AI capabilities for comprehensive assistance

## 🛠️ Technology Stack

### **Backend**
- **Framework**: FastAPI (Python)
- **Database**: SQLite (with PostgreSQL support)
- **Authentication**: JWT with bcrypt password hashing
- **File Upload**: Aiofiles for image handling
- **AI Integration**: WatsonX for intelligent assistance
- **API Documentation**: Auto-generated with FastAPI/OpenAPI

### **Frontend**
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks and context
- **Forms**: React Hook Form with validation
- **Icons**: Lucide React icons
- **Responsive Design**: Mobile-first approach

### **Database Schema**
- **Users**: Citizen and admin account management
- **Complaints**: Complaint details with location and status tracking
- **Services**: Available city services and categories
- **Resources**: City resources (equipment, personnel, vehicles)
- **Status History**: Complete audit trail of complaint updates
- **Images**: File attachments for complaints

## 🚀 Quick Start

### **Prerequisites**
- Python 3.9+
- Node.js 18+
- SQLite (included with Python)

### **Development Setup**

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd citycare
   \`\`\`

2. **Setup Backend**
   \`\`\`bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   \`\`\`

3. **Initialize Database**
   \`\`\`bash
   python ../scripts/init_database.py
   \`\`\`

4. **Setup Frontend**
   \`\`\`bash
   cd ../frontend
   npm install
   \`\`\`

5. **Start Development Servers**
   
   **Backend** (Terminal 1):
   \`\`\`bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload
   \`\`\`
   
   **Frontend** (Terminal 2):
   \`\`\`bash
   cd frontend
   npm run dev
   \`\`\`

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### **Using Setup Script**
\`\`\`bash
# Make executable
chmod +x setup.sh

# Setup development environment
./setup.sh --setup-dev

# Start development servers
./setup.sh --dev
\`\`\`

## 🔐 Default Credentials

### **Admin Account**
- **Email**: admin@admin.com
- **Password**: admin

### **Test Users**
All dummy users use password: `password123`
- john.smith@email.com
- sarah.johnson@email.com
- michael.brown@email.com
- emily.davis@email.com
- david.wilson@email.com

## 📊 Database

### **SQLite Database**
- **Location**: `backend/citycare.db`
- **Initialization**: Automatic on first run
- **Seed Data**: Includes 7 users, 8 complaints, and sample data

### **Database Management**
\`\`\`bash
# Reset database with fresh data
./scripts/reset_database.sh

# Initialize database manually
python scripts/init_database.py
\`\`\`

## 🔧 Configuration

### **Environment Variables**

**Backend** (Optional - defaults provided):
\`\`\`bash
DATABASE_URL=sqlite:///./citycare.db
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
\`\`\`

**Frontend**:
\`\`\`bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
\`\`\`

## 📁 Project Structure

\`\`\`
citycare/
├── backend/                 # FastAPI backend
│   ├── routes/             # API route modules
│   │   ├── auth_routes.py  # Authentication endpoints
│   │   ├── user_routes.py  # User-facing operations
│   │   ├── admin_routes.py # Admin management
│   │   └── bot_routes.py   # AI agent endpoints
│   ├── watsonx/           # AI service integration
│   ├── models.py          # SQLAlchemy models
│   ├── database.py        # Database configuration
│   ├── main.py           # FastAPI application
│   ├── requirements.txt  # Python dependencies
│   └── citycare.db      # SQLite database
├── frontend/              # Next.js frontend
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── services/         # API service layer
│   └── lib/             # Utilities and helpers
├── scripts/              # Database and setup scripts
├── docs/                # Documentation and diagrams
└── setup.sh            # Development setup script
\`\`\`

## 🔌 API Endpoints

### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### **User Operations**
- `GET /api/user/complaints` - Get user complaints
- `POST /api/user/complaints` - Create new complaint
- `GET /api/user/services` - Get available services

### **Admin Operations**
- `GET /api/admin/complaints` - Get all complaints
- `PUT /api/admin/complaints/{id}` - Update complaint status
- `GET /api/admin/analytics` - Get system analytics
- `POST /api/admin/resources` - Create system resources

### **AI Agent**
- `POST /api/bot/chat` - Chat with rights agent
- `GET /api/bot/analytics` - Get bot analytics

## 🎯 Best Practices Implemented

### **Code Quality**
- **Modular Architecture**: Separated concerns with clear module boundaries
- **Type Safety**: TypeScript for frontend, Pydantic models for backend
- **Error Handling**: Comprehensive error handling and validation
- **API Documentation**: Auto-generated OpenAPI documentation
- **Consistent Naming**: Meaningful function and variable names

### **Security**
- **Password Hashing**: bcrypt for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Pydantic models for request validation
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **SQL Injection Prevention**: SQLAlchemy ORM for safe database queries

### **Database Design**
- **Normalized Schema**: Proper relational database design
- **UUID Primary Keys**: Secure and scalable identifier system
- **Audit Trail**: Complete history tracking for complaints
- **Indexing Strategy**: Optimized queries for performance
- **Data Integrity**: Foreign key constraints and validation

### **Development Workflow**
- **Environment Separation**: Clear development and production configurations
- **Seed Data**: Comprehensive test data for development
- **Database Migrations**: Structured database initialization
- **Modular Services**: Separated business logic and data access
- **Responsive Design**: Mobile-first UI/UX approach

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation at `/docs`

---

**Built with ❤️ for better civic engagement and citizen services** 🏙️

