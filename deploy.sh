#!/bin/bash

# Baby Raffle Deployment Script
# Deploys frontend to GitHub Pages and backend to Railway

set -e

echo "🚀 Starting Baby Raffle Deployment..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository. Please run this script from the project root."
    exit 1
fi

# Check if we're on the main branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    print_warning "You're not on the main branch. Current branch: $current_branch"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
    print_warning "You have uncommitted changes."
    read -p "Commit and push changes before deployment? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Enter commit message: " commit_message
        git commit -m "$commit_message"
        git push origin main
        print_status "Changes committed and pushed."
    else
        print_warning "Continuing with uncommitted changes..."
    fi
fi

# Deploy Backend to Railway
print_status "Deploying backend to Railway..."
cd fastapi-backend

# Check if Railway is logged in
if ! railway whoami > /dev/null 2>&1; then
    print_error "Railway CLI not logged in. Please run 'railway login' first."
    exit 1
fi

# Check if project exists, if not create it
if ! railway status > /dev/null 2>&1; then
    print_status "Creating new Railway project..."
    railway login
    railway deploy
else
    print_status "Deploying to existing Railway project..."
    railway deploy
fi

cd ..
print_status "Backend deployed to Railway successfully! ✅"

# Deploy Frontend via Git Push (GitHub Actions will handle the deployment)
print_status "Triggering frontend deployment to GitHub Pages..."

# Ensure we're up to date and push to trigger GitHub Actions
git push origin main

print_status "Frontend deployment triggered! ✅"
print_status "GitHub Actions will build and deploy to GitHub Pages automatically."

echo "======================================"
echo "🎉 Deployment Complete!"
echo ""
echo "📱 Frontend: https://[your-username].github.io/baby-raffle-serverless/"
echo "🖥️  Backend: Check Railway dashboard for URL"
echo ""
print_warning "Note: Frontend deployment may take a few minutes to complete via GitHub Actions."
print_warning "Note: Update VITE_API_URL environment variable with your Railway backend URL."
echo ""