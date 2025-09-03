#!/bin/bash

# Frontend Deployment Script for GitHub Pages
# Builds frontend and deploys to GitHub Pages

set -e

echo "🚀 Deploying Frontend to GitHub Pages..."
echo "======================================="

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

# Build frontend
print_status "Building frontend..."
cd frontend
npm run build

# Copy built files to root
print_status "Copying built files to repository root..."
cd ..
cp frontend/dist/index.html ./index.html
cp -r frontend/dist/assets/* ./assets/

# Check for changes
if git diff --quiet && git diff --cached --quiet; then
    print_warning "No changes detected. Nothing to deploy."
    exit 0
fi

# Get commit message
if [ "$#" -eq 0 ]; then
    read -p "Enter commit message (or press Enter for default): " commit_message
    if [ -z "$commit_message" ]; then
        commit_message="Update frontend deployment"
    fi
else
    commit_message="$1"
fi

# Commit and push
print_status "Committing and pushing changes..."
git add index.html assets/
git commit -m "$commit_message"
git push origin main

print_status "Frontend deployed successfully! ✅"
print_status "Site will be live at https://margojones.base2ml.com in ~30 seconds"

echo "======================================="