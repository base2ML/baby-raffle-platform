#!/bin/bash

# Baby Raffle Site Builder Setup Script
# Sets up the complete site builder with backend and frontend

set -e

echo "🎯 Baby Raffle Site Builder Setup"
echo "=================================="

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

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Setup Backend
echo ""
echo "🔧 Setting up backend..."
cd fastapi-backend/

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing backend dependencies..."
pip3 install -q -r requirements-simple.txt

# Run site builder migration
echo "🗃️  Running site builder database migration..."
python3 migrate_site_builder.py

# Setup Frontend
echo ""
echo "🎨 Setting up frontend (site-builder)..."
cd ../site-builder/

# Check if node_modules exists, if not install
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
else
    echo "✅ Frontend dependencies already installed"
fi

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating frontend environment file..."
    cat > .env << EOF
VITE_API_URL=http://localhost:8000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51S3hZoFhUpc9egGhnIRUjLxKHsUtudV0aDkutHd9shVncqkLo0RNw59fDoZNw7IsQupeiLLZEVQHCQYOM4FTOuXD00uaQXhkSs
VITE_GOOGLE_CLIENT_ID=616947441714-1pvasp7lcp2p8r9c8qnmvbmva2snlnll.apps.googleusercontent.com
VITE_BASE_DOMAIN=base2ml.com
EOF
    echo "✅ Created .env file for site builder"
else
    echo "✅ Environment file already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the complete system:"
echo ""
echo "1. Start the backend (in fastapi-backend directory):"
echo "   cd fastapi-backend && source venv/bin/activate && python3 main.py"
echo ""
echo "2. Start the site builder frontend (in site-builder directory):"  
echo "   cd site-builder && npm run dev"
echo ""
echo "3. Visit the site builder at: http://localhost:5173"
echo ""
echo "📋 URLs:"
echo "   - Site Builder: http://localhost:5173"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo ""
echo "🆘 Need help? Check the README or contact support@base2ml.com"