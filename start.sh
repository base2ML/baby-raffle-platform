#!/bin/bash

# Baby Raffle SaaS Multi-Tenant Platform Startup Script

set -e

echo "🎉 Baby Raffle SaaS Multi-Tenant Platform"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "fastapi-backend/main.py" ]; then
    echo "❌ Error: Please run this script from the baby-raffle-serverless root directory"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists python3; then
    echo "❌ Python is not installed. Please install Python 3.11+"
    exit 1
fi

if ! command_exists pip3; then
    echo "❌ pip is not installed. Please install pip"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Navigate to backend directory
cd fastapi-backend/

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Check if requirements are installed
echo "📚 Installing/updating dependencies..."
# Use simplified requirements for Python 3.13 compatibility
pip3 install -q -r requirements-simple.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️  Setting up environment configuration..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "📝 Created .env from template. Please edit it with your configuration:"
        echo "   - DATABASE_URL (PostgreSQL connection)"
        echo "   - JWT_SECRET (secure random string)"
        echo "   - GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET"
        echo "   - APPLE_* credentials (if using Apple OAuth)"
        echo ""
        echo "⚠️  The system will use default values for development if not configured."
        echo ""
    else
        echo "❌ .env.example not found. Please create .env manually."
        exit 1
    fi
fi

# Check if database is configured
if grep -q "your-database-url" .env 2>/dev/null; then
    echo "⚠️  Database URL not configured in .env"
    echo "   Using default: sqlite:///./baby_raffle.db"
    echo "   For production, please configure PostgreSQL"
    echo ""
fi

# Offer to run database migration
echo "🗃️  Database setup..."
read -p "Do you want to run database migrations? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Running database migrations..."
    python3 migrate_db.py || echo "⚠️  Migration failed - continuing with existing database"
else
    echo "⏭️  Skipping database migration"
fi

echo ""
echo "🚀 Starting Baby Raffle SaaS API server..."
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "   Health Check: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the FastAPI server (using simple server for Python 3.13 compatibility)
echo "🚀 Starting with basic server - for full multi-tenant features, upgrade to Python 3.11"
python3 simple_server.py