#!/bin/bash

# Baby Raffle Development Script
# Starts both frontend and backend for local development

set -e

echo "🛠️  Starting Baby Raffle Development Environment..."
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to cleanup background processes
cleanup() {
    print_status "Shutting down development servers..."
    jobs -p | xargs -r kill
    exit 0
}

# Trap cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_warning "Node.js is not installed. Please install Node.js to run the frontend."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_warning "Python 3 is not installed. Please install Python 3 to run the backend."
    exit 1
fi

# Install frontend dependencies if needed
cd frontend
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
fi

print_status "Starting frontend development server on http://localhost:5173"
npm run dev &
FRONTEND_PID=$!

cd ../fastapi-backend

# Install backend dependencies if needed
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1

print_status "Starting backend development server on http://localhost:8000"
python main.py &
BACKEND_PID=$!

cd ..

echo "=================================================="
echo "🎉 Development servers started!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🖥️  Backend:  http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "=================================================="

# Wait for both processes
wait $FRONTEND_PID $BACKEND_PID