#!/bin/bash

# Baby Raffle Marketing Site Setup Script

set -e

echo "🎉 Setting up Baby Raffle Marketing Site..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "   Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) found"

# Navigate to marketing site directory
cd marketing-site/ || {
    echo "❌ marketing-site directory not found"
    exit 1
}

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "⚙️ Creating environment configuration..."
    cp .env.example .env.local
    echo "✅ Created .env.local - please update with your configuration"
fi

# Build the project to test everything works
echo "🏗️ Testing build..."
npm run build

echo ""
echo "🎉 Marketing site setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your API URLs"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "For production deployment:"
echo "- Run './deploy.sh' for static export"
echo "- Run './deploy.sh --vercel' for Vercel deployment"
echo ""
echo "Happy coding! 🚀"