#!/bin/bash

# Baby Raffle Marketing Site Deployment Script

set -e

echo "🚀 Deploying Baby Raffle Marketing Site..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the marketing-site directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run type checking
echo "🔍 Type checking..."
npm run lint

# Build the application
echo "🏗️ Building application..."
npm run build

# Optional: Run tests if they exist
if npm run test --dry-run 2>/dev/null; then
    echo "🧪 Running tests..."
    npm run test
fi

echo "✅ Build completed successfully!"

# Export static files if needed
if [ "$1" = "--static" ]; then
    echo "📤 Exporting static files..."
    npm run export
    echo "✅ Static export completed!"
fi

# Deploy to Vercel if configured
if command -v vercel &> /dev/null && [ "$1" = "--vercel" ]; then
    echo "🌐 Deploying to Vercel..."
    vercel --prod
    echo "✅ Deployed to Vercel!"
fi

echo "🎉 Deployment completed successfully!"
echo "🌟 Marketing site is ready to convert visitors into customers!"