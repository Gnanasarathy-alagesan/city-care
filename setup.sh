#!/bin/bash

# CityCare Application Setup Script
# This script sets up the environment and launches the CityCare application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js (v18 or higher)."
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    # Check Python
    if ! command_exists python3; then
        print_error "Python 3 is not installed. Please install Python 3.8 or higher."
        echo "Visit: https://python.org/"
        exit 1
    fi
    
    # Check pip
    if ! command_exists pip3; then
        print_error "pip3 is not installed. Please install pip3."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check if ports are available
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port 3000 is already in use. Frontend may not start properly."
    fi
    
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port 8000 is already in use. Backend may not start properly."
    fi
    
    print_success "System requirements check completed."
}

# Function to create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    if [ ! -f backend/.env ]; then
        cat > backend/.env << EOF
# Backend Configuration
SECRET_KEY=your-super-secret-key-change-in-production-$(date +%s)
BACKEND_PORT=8000
ALLOWED_ORIGINS=http://localhost:3000

# Database Configuration (SQLite for development)
DATABASE_URL=sqlite:///./citycare.db

# Development Mode
DEBUG=True
EOF
        print_success "Backend environment file created successfully."
    else
        print_status "Backend environment file already exists. Skipping creation."
    fi
    
    if [ ! -f frontend/.env.local ]; then
        cat > frontend/.env.local << EOF
# Frontend Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_ADMIN_API_KEY=admin-key-123
EOF
        print_success "Frontend environment file created successfully."
    else
        print_status "Frontend environment file already exists. Skipping creation."
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install backend dependencies
    print_status "Installing Python backend dependencies..."
    cd backend
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        print_success "Python virtual environment created."
    fi
    
    source venv/bin/activate
    pip install -r requirements.txt
    print_success "Backend dependencies installed."
    cd ..
    
    # Install frontend dependencies
    print_status "Installing Node.js frontend dependencies..."
    cd frontend
    npm install
    print_success "Frontend dependencies installed."
    cd ..
}

# Function to start backend
start_backend() {
    print_status "Starting backend server..."
    cd backend
    source venv/bin/activate
    
    # Initialize database
    python -c "
from app import create_app
from models import db
app = create_app()
with app.app_context():
    db.create_all()
    print('Database initialized successfully.')
" 2>/dev/null || print_warning "Database initialization may have failed."
    
    # Start backend in background
    nohup python app.py > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    cd ..
    
    # Wait for backend to start
    print_status "Waiting for backend to be ready..."
    timeout=30
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:8000/api/health >/dev/null 2>&1; then
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "Backend failed to start within 30 seconds. Check backend.log for details."
        exit 1
    fi
    
    print_success "Backend server started successfully!"
}

# Function to start frontend
start_frontend() {
    print_status "Starting frontend server..."
    cd frontend
    
    # Build and start frontend in background
    npm run build
    nohup npm start > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    cd ..
    
    # Wait for frontend to start
    print_status "Waiting for frontend to be ready..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:3000 >/dev/null 2>&1; then
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "Frontend failed to start within 60 seconds. Check frontend.log for details."
        exit 1
    fi
    
    print_success "Frontend server started successfully!"
}

# Function to show service status
show_status() {
    echo ""
    print_success "CityCare Application is now running!"
    echo ""
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:8000"
    echo "📊 API Documentation: http://localhost:8000/docs"
    echo ""
    echo "Default Admin Credentials:"
    echo "  Username: admin"
    echo "  Password: admin"
    echo ""
    echo "Log files:"
    echo "  Backend: backend.log"
    echo "  Frontend: frontend.log"
    echo ""
    print_status "To stop the application, run: ./setup.sh --stop"
    print_status "To view logs, run: ./setup.sh --logs"
}

# Function to stop services
stop_services() {
    print_status "Stopping CityCare services..."
    
    if [ -f backend.pid ]; then
        BACKEND_PID=$(cat backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID
            print_success "Backend server stopped."
        fi
        rm -f backend.pid
    fi
    
    if [ -f frontend.pid ]; then
        FRONTEND_PID=$(cat frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID
            print_success "Frontend server stopped."
        fi
        rm -f frontend.pid
    fi
    
    # Kill any remaining processes on ports 3000 and 8000
    pkill -f "node.*3000" 2>/dev/null || true
    pkill -f "python.*8000" 2>/dev/null || true
    
    print_success "All services stopped successfully."
}

# Function to show logs
show_logs() {
    if [ "$2" = "backend" ]; then
        tail -f backend.log
    elif [ "$2" = "frontend" ]; then
        tail -f frontend.log
    else
        print_status "Showing both backend and frontend logs..."
        tail -f backend.log frontend.log
    fi
}

# Function to handle cleanup on exit
cleanup() {
    if [ $? -ne 0 ]; then
        print_error "Setup failed. Cleaning up..."
        stop_services >/dev/null 2>&1 || true
    fi
}

# Main execution
main() {
    echo "=================================================="
    echo "🏙️  CityCare Application Setup"
    echo "   Smart City Complaint Management System"
    echo "=================================================="
    echo ""
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Check if help is requested
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "CityCare Setup Script - Local development setup"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --stop              Stop all services"
        echo "  --restart           Restart all services"
        echo "  --logs [service]    Show service logs (backend/frontend/both)"
        echo "  --status            Show service status"
        echo "  --clean             Clean up log files and stop services"
        echo ""
        echo "Requirements:"
        echo "  - Node.js 18+ and npm"
        echo "  - Python 3.8+ and pip3"
        echo ""
        echo "First time setup:"
        echo "  1. chmod +x setup.sh"
        echo "  2. ./setup.sh"
        echo ""
        echo "Access points after setup:"
        echo "  🌐 Frontend: http://localhost:3000"
        echo "  🔧 Backend API: http://localhost:8000"
        echo ""
        exit 0
    fi
    
    # Handle different commands
    case "$1" in
        --stop)
            stop_services
            exit 0
            ;;
        --restart)
            print_status "Restarting CityCare services..."
            stop_services
            sleep 2
            start_backend
            start_frontend
            show_status
            exit 0
            ;;
        --logs)
            show_logs "$@"
            exit 0
            ;;
        --status)
            if [ -f backend.pid ] && [ -f frontend.pid ]; then
                BACKEND_PID=$(cat backend.pid)
                FRONTEND_PID=$(cat frontend.pid)
                if kill -0 $BACKEND_PID 2>/dev/null && kill -0 $FRONTEND_PID 2>/dev/null; then
                    show_status
                else
                    print_warning "Some services may not be running properly."
                fi
            else
                print_warning "Services don't appear to be running."
            fi
            exit 0
            ;;
        --clean)
            print_status "Cleaning up..."
            stop_services
            rm -f backend.log frontend.log
            rm -f backend/citycare.db
            print_success "Cleanup completed."
            exit 0
            ;;
    esac
    
    # Run setup steps
    check_requirements
    create_env_file
    install_dependencies
    start_backend
    start_frontend
    show_status
    
    # Remove trap
    trap - EXIT
}

# Run main function with all arguments
main "$@"
