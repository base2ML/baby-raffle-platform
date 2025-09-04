#!/bin/bash

# Frontend Startup Script (Legacy Single-Tenant)

set -e

echo "🎯 Baby Raffle Frontend (Legacy Single-Tenant)"
echo "=============================================="
echo ""
echo "⚠️  NOTE: This is the legacy single-tenant frontend."
echo "   The new multi-tenant system requires building new frontends for:"
echo "   - Onboarding site (mybabyraffle.base2ml.com)"
echo "   - Tenant-specific sites ({subdomain}.base2ml.com)"
echo ""

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo "❌ npm is not installed. Please install npm"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "📦 Dependencies already installed"
fi

echo ""
echo "🚀 Starting frontend development server..."
echo "   Frontend: http://localhost:5173"
echo "   Make sure the backend is running at http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the development server
npm run dev