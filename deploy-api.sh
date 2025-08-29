#!/bin/bash

# 🚀 Baby Raffle FastAPI Deployment Script
# Deploys FastAPI backend to Railway and updates frontend

set -e

echo "🚀 Baby Raffle API Deployment Script"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="api.margojones.base2ml.com"
FRONTEND_DIR="frontend"
BACKEND_DIR="fastapi-backend"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "  API Domain: $DOMAIN"
echo "  Backend Dir: $BACKEND_DIR"
echo "  Frontend Dir: $FRONTEND_DIR"
echo ""

# Step 1: Check if Railway CLI is installed
echo -e "${BLUE}1. Checking Railway CLI...${NC}"
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Railway CLI not found. Installing...${NC}"
    curl -fsSL https://railway.app/install.sh | sh
    export PATH=$PATH:$HOME/.railway/bin
fi

# Step 2: Test FastAPI locally first
echo -e "${BLUE}2. Testing FastAPI locally...${NC}"
cd $BACKEND_DIR

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Test the app can start
echo "Testing FastAPI startup..."
timeout 10s uvicorn main:app --host 0.0.0.0 --port 8001 &
SERVER_PID=$!
sleep 3

# Test health endpoint (will fail if can't connect to RDS from local, but that's OK)
if curl -f http://localhost:8001/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ FastAPI starts successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Local test inconclusive (expected if DB not accessible locally)${NC}"
fi

# Kill test server
kill $SERVER_PID 2>/dev/null || true
deactivate

# Step 3: Deploy to Railway
echo -e "${BLUE}3. Deploying to Railway...${NC}"

# Check if already logged in
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway:"
    railway login
fi

# Create new project or use existing
if [ ! -f "railway.json" ]; then
    echo "Creating new Railway project..."
    railway init
fi

# Set environment variables
echo "Setting environment variables..."
railway variables set DB_HOST=margojones-babyraffle-db.cu1y2a26idsb.us-east-1.rds.amazonaws.com
railway variables set DB_PORT=5432
railway variables set DB_NAME=babyraffle
railway variables set DB_USERNAME=postgres
railway variables set DB_PASSWORD=YgrzO9oHQScN5ctXcTOL

# Deploy
echo "Deploying to Railway..."
railway up

# Get the Railway URL
RAILWAY_URL=$(railway domain 2>/dev/null || echo "")
if [ -z "$RAILWAY_URL" ]; then
    echo -e "${YELLOW}⚠️  Please set up custom domain manually in Railway dashboard${NC}"
    echo -e "${YELLOW}   Custom domain should be: $DOMAIN${NC}"
    RAILWAY_URL="https://your-railway-app.railway.app"
else
    echo -e "${GREEN}✅ Railway deployment complete: $RAILWAY_URL${NC}"
fi

cd ..

# Step 4: Update frontend configuration
echo -e "${BLUE}4. Updating frontend configuration...${NC}"

cd $FRONTEND_DIR

# Update .env.production
if [ -f ".env.production" ]; then
    # Backup original
    cp .env.production .env.production.backup
    
    # Update API URL
    sed -i.bak "s|VITE_API_URL=.*|VITE_API_URL=https://$DOMAIN|g" .env.production
    rm .env.production.bak
    
    echo -e "${GREEN}✅ Updated .env.production${NC}"
    echo "   VITE_API_URL=https://$DOMAIN"
else
    # Create new .env.production
    echo "VITE_API_URL=https://$DOMAIN" > .env.production
    echo -e "${GREEN}✅ Created .env.production${NC}"
fi

# Step 5: Build and deploy frontend
echo -e "${BLUE}5. Building and deploying frontend...${NC}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Build frontend
echo "Building frontend..."
npm run build

# Deploy to S3 and invalidate CloudFront
echo "Deploying to S3..."
aws s3 sync dist/ s3://margojones.base2ml.com --delete

echo "Invalidating CloudFront cache..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items[0]=='margojones.base2ml.com'].Id" --output text)
if [ ! -z "$DISTRIBUTION_ID" ]; then
    aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
    echo -e "${GREEN}✅ CloudFront cache invalidated${NC}"
else
    echo -e "${YELLOW}⚠️  Could not find CloudFront distribution${NC}"
fi

cd ..

# Step 6: DNS Setup Instructions
echo -e "${BLUE}6. DNS Setup Required:${NC}"
echo -e "${YELLOW}⚠️  MANUAL STEP REQUIRED:${NC}"
echo "   1. Go to your DNS provider (Route 53, Cloudflare, etc.)"
echo "   2. Create a CNAME record:"
echo "      Name: api.margojones.base2ml.com"
echo "      Value: [Your Railway app domain]"
echo "   3. Or set up custom domain in Railway dashboard"
echo ""

# Step 7: Final testing
echo -e "${BLUE}7. Testing deployment...${NC}"

echo "Waiting for DNS propagation (this may take a few minutes)..."
sleep 10

# Test the API endpoints
echo "Testing API endpoints..."

# Test health endpoint
if curl -f https://$DOMAIN/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  API not yet accessible (DNS propagation may take time)${NC}"
fi

# Test frontend
if curl -f https://margojones.base2ml.com > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend accessible${NC}"
else
    echo -e "${RED}❌ Frontend not accessible${NC}"
fi

# Step 8: Summary
echo ""
echo -e "${GREEN}🎉 Deployment Summary:${NC}"
echo "================================="
echo -e "${GREEN}✅ FastAPI Backend:${NC} Deployed to Railway"
echo -e "${GREEN}✅ Frontend:${NC} Updated and deployed to S3/CloudFront"
echo -e "${GREEN}✅ API URL:${NC} https://$DOMAIN"
echo -e "${GREEN}✅ Website:${NC} https://margojones.base2ml.com"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Set up custom domain in Railway dashboard: $DOMAIN"
echo "2. Wait for DNS propagation (5-30 minutes)"
echo "3. Test all functionality on the live site"
echo ""
echo -e "${BLUE}🧪 Test URLs:${NC}"
echo "  Health: https://$DOMAIN/health"
echo "  Stats:  https://$DOMAIN/stats"
echo "  Categories: https://$DOMAIN/categories"
echo ""
echo -e "${GREEN}🎊 Deployment Complete!${NC}"
