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
    
    # Check Docker
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Check if ports are available
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port 3000 is already in use. Frontend may not start properly."
    fi
    
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port 8000 is already in use. Backend may not start properly."
    fi
    
    if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port 5432 is already in use. PostgreSQL may not start properly."
    fi
    
    print_success "System requirements check completed."
}

# Function to create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    if [ ! -f .env ]; then
        cat > .env << EOF
# Database Configuration
POSTGRES_DB=citycare
POSTGRES_USER=citycare
POSTGRES_PASSWORD=citycare123
POSTGRES_PORT=5432

# Backend Configuration
SECRET_KEY=your-super-secret-key-change-in-production-$(date +%s)
BACKEND_PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,http://frontend:3000

# Frontend Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
FRONTEND_PORT=3000
NODE_ENV=production

# Nginx Configuration (for production)
NGINX_PORT=80
NGINX_SSL_PORT=443

# Development/Production Mode
COMPOSE_PROFILES=development
EOF
        print_success "Environment file (.env) created successfully."
    else
        print_status "Environment file (.env) already exists. Skipping creation."
    fi
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    # Create backend uploads directory
    mkdir -p backend/uploads
    
    # Create nginx configuration directory
    mkdir -p nginx/ssl
    
    # Create database initialization directory
    mkdir -p init-db
    
    print_success "Directories created successfully."
}

# Function to create nginx configuration
create_nginx_config() {
    print_status "Creating Nginx configuration..."
    
    if [ ! -f nginx/nginx.conf ]; then
        cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }
    
    upstream backend {
        server backend:8000;
    }
    
    server {
        listen 80;
        server_name localhost;
        
        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Backend API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Backend uploads
        location /uploads/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
EOF
        print_success "Nginx configuration created successfully."
    else
        print_status "Nginx configuration already exists. Skipping creation."
    fi
}

# Function to create database initialization script
create_db_init() {
    print_status "Creating database initialization script..."
    
    if [ ! -f init-db/01-init.sql ]; then
        cat > init-db/01-init.sql << 'EOF'
-- CityCare Database Initialization Script
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE citycare TO citycare;

-- Create indexes for better performance (will be created by SQLAlchemy, but good to have)
-- These will be created after tables are created by the application
EOF
        print_success "Database initialization script created successfully."
    else
        print_status "Database initialization script already exists. Skipping creation."
    fi
}

# Function to build and start services
start_services() {
    print_status "Building and starting CityCare services..."
    
    # Build images
    print_status "Building Docker images..."
    docker-compose build --no-cache
    
    # Start services
    print_status "Starting services..."
    docker-compose up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be ready..."
    
    # Wait for database
    print_status "Waiting for PostgreSQL to be ready..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose exec -T postgres pg_isready -U citycare -d citycare >/dev/null 2>&1; then
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "PostgreSQL failed to start within 60 seconds."
        exit 1
    fi
    
    # Wait for backend
    print_status "Waiting for backend to be ready..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:8000/api/health >/dev/null 2>&1; then
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "Backend failed to start within 60 seconds."
        exit 1
    fi
    
    # Wait for frontend
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
        print_error "Frontend failed to start within 60 seconds."
        exit 1
    fi
    
    print_success "All services are running successfully!"
}

# Function to show service status
show_status() {
    print_status "Service Status:"
    docker-compose ps
    
    echo ""
    print_success "CityCare Application is now running!"
    echo ""
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:8000"
    echo "📊 API Documentation: http://localhost:8000/docs"
    echo "🗄️  Database: localhost:5432"
    echo ""
    echo "Default Admin Credentials:"
    echo "  Username: admin"
    echo "  Password: admin"
    echo ""
    print_status "To stop the application, run: docker-compose down"
    print_status "To view logs, run: docker-compose logs -f"
}

# Function to handle cleanup on exit
cleanup() {
    if [ $? -ne 0 ]; then
        print_error "Setup failed. Cleaning up..."
        docker-compose down >/dev/null 2>&1 || true
    fi
}

# Function to setup backend development environment
setup_backend_dev() {
    print_status "Setting up backend development environment..."
    
    cd backend
    
    # Check if Python 3.8+ is installed
    if ! command_exists python3; then
        print_error "Python 3 is not installed. Please install Python 3.8 or higher."
        exit 1
    fi
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
        print_success "Virtual environment created."
    fi
    
    # Activate virtual environment and install dependencies
    print_status "Installing Python dependencies..."
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    
    print_success "Backend development environment setup completed."
    cd ..
}

# Function to start backend in development mode
start_backend_dev() {
    print_status "Starting backend in development mode..."
    
    cd backend
    source venv/bin/activate
    
    # Initialize database with seed data
    print_status "Initializing database with seed data..."
    python scripts/init_database.py
    
    # Start the backend server
    print_status "Starting FastAPI server..."
    uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    
    print_success "Backend server started on http://localhost:8000"
    print_status "API Documentation available at http://localhost:8000/docs"
    
    cd ..
    return $BACKEND_PID
}

# Function to setup frontend development environment
setup_frontend_dev() {
    print_status "Setting up frontend development environment..."
    
    cd frontend
    
    # Check if Node.js is installed
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    # Install dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    print_success "Frontend development environment setup completed."
    cd ..
}

# Function to start frontend in development mode
start_frontend_dev() {
    print_status "Starting frontend in development mode..."
    
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    
    print_success "Frontend server started on http://localhost:3000"
    
    cd ..
    return $FRONTEND_PID
}

# Function to start development mode
start_dev_mode() {
    print_status "Starting CityCare in development mode..."
    
    # Setup environments
    setup_backend_dev
    setup_frontend_dev
    
    # Start services
    start_backend_dev
    BACKEND_PID=$!
    
    start_frontend_dev  
    FRONTEND_PID=$!
    
    echo ""
    print_success "CityCare Development Environment is running!"
    echo ""
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:8000"
    echo "📊 API Documentation: http://localhost:8000/docs"
    echo "🤖 Rights Agent: http://localhost:3000/watsonxbot"
    echo ""
    echo "Default Admin Credentials:"
    echo "  Email: admin@admin.com"
    echo "  Password: admin"
    echo ""
    print_status "Press Ctrl+C to stop all services"
    
    # Wait for interrupt
    trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
    wait
}

# Main execution
main() {
    echo "=================================================="
    echo "🏙️  CityCare Application Setup"
    echo "=================================================="
    echo ""
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Check if help is requested
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --dev          Start in development mode (recommended for development)"
        echo "  --setup-dev    Setup development environment only"
        echo "  --stop         Stop all services"
        echo "  --restart      Restart all services"
        echo "  --logs         Show service logs"
        echo "  --status       Show service status"
        echo "  --clean        Clean up all containers and volumes"
        echo ""
        exit 0
    fi
    
    # Handle different commands
    case "$1" in
        --dev)
            start_dev_mode
            exit 0
            ;;
        --setup-dev)
            setup_backend_dev
            setup_frontend_dev
            print_success "Development environment setup completed."
            echo ""
            echo "To start development servers:"
            echo "  Backend: cd backend && source venv/bin/activate && uvicorn main:app --reload"
            echo "  Frontend: cd frontend && npm run dev"
            echo ""
            echo "Or run: ./setup.sh --dev"
            exit 0
            ;;
        --stop)
            print_status "Stopping CityCare services..."
            docker-compose down
            print_success "Services stopped successfully."
            exit 0
            ;;
        --restart)
            print_status "Restarting CityCare services..."
            docker-compose down
            docker-compose up -d
            show_status
            exit 0
            ;;
        --logs)
            docker-compose logs -f
            exit 0
            ;;
        --status)
            show_status
            exit 0
            ;;
        --clean)
            print_warning "This will remove all containers, networks, and volumes."
            read -p "Are you sure? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_status "Cleaning up..."
                docker-compose down -v --remove-orphans
                docker system prune -f
                print_success "Cleanup completed."
            else
                print_status "Cleanup cancelled."
            fi
            exit 0
            ;;
    esac
    
    # Run setup steps
    check_requirements
    create_env_file
    create_directories
    create_nginx_config
    create_db_init
    start_services
    show_status
    
    # Remove trap
    trap - EXIT
}

# Run main function with all arguments
main "$@"
