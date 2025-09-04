#!/bin/bash
set -e

# Baby Raffle SaaS Multi-Tenant Deployment Script
echo "🚀 Deploying Baby Raffle SaaS Multi-Tenant System"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   curl -fsSL https://railway.app/install.sh | sh"
    exit 1
fi

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Please run: railway login"
    exit 1
fi

echo "✅ Railway CLI found and authenticated"

# Create or link Railway project
echo "📦 Setting up Railway project..."
if [ ! -f ".railway" ]; then
    echo "Creating new Railway project for Baby Raffle SaaS..."
    railway up --service fastapi-backend
else
    echo "Using existing Railway project"
fi

# Set up environment variables
echo "🔧 Setting up environment variables..."

# Core application settings
railway variables set ENVIRONMENT=production
railway variables set LOG_LEVEL=INFO
railway variables set DEBUG=false

# Database (Railway PostgreSQL addon)
echo "Setting up PostgreSQL database..."
railway add postgresql

# JWT and security
echo "⚠️  IMPORTANT: You need to set these secrets manually in Railway dashboard:"
echo "   - JWT_SECRET (use a secure random string)"
echo "   - GOOGLE_CLIENT_ID"
echo "   - GOOGLE_CLIENT_SECRET"
echo "   - APPLE_CLIENT_ID"
echo "   - APPLE_TEAM_ID"
echo "   - APPLE_KEY_ID"
echo "   - APPLE_PRIVATE_KEY"

# Domain configuration
railway variables set BASE_DOMAIN=base2ml.com
railway variables set ONBOARDING_SUBDOMAIN=mybabyraffle
railway variables set ALLOWED_ORIGINS="https://*.base2ml.com,https://mybabyraffle.base2ml.com"

# Rate limiting
railway variables set RATE_LIMIT_ENABLED=true
railway variables set FREE_PLAN_REQUESTS_PER_MINUTE=100
railway variables set PREMIUM_PLAN_REQUESTS_PER_MINUTE=500
railway variables set ENTERPRISE_PLAN_REQUESTS_PER_MINUTE=2000

# Security settings
railway variables set SECURE_COOKIES=true
railway variables set SESSION_COOKIE_DOMAIN=".base2ml.com"

# Deploy the application
echo "🚀 Deploying application..."
railway up --detach

# Wait for deployment
echo "⏳ Waiting for deployment to complete..."
sleep 30

# Get deployment URL
DEPLOYMENT_URL=$(railway status --json | jq -r '.deployments[0].url' 2>/dev/null || echo "")

if [ -n "$DEPLOYMENT_URL" ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Backend API URL: $DEPLOYMENT_URL"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Set up your OAuth credentials in Railway dashboard"
    echo "2. Configure DNS for base2ml.com to point to Railway"
    echo "3. Set up wildcard SSL certificate for *.base2ml.com"
    echo "4. Run database migrations: railway run python -c 'from database import db_manager; import asyncio; asyncio.run(db_manager.run_migrations())'"
    echo "5. Deploy frontend applications:"
    echo "   - Onboarding site at mybabyraffle.base2ml.com"
    echo "   - Tenant-specific frontends at {subdomain}.base2ml.com"
    echo ""
    echo "🔧 Railway Dashboard: https://railway.app/dashboard"
    echo "🏥 Health Check: $DEPLOYMENT_URL/health"
    echo "📖 API Docs: $DEPLOYMENT_URL/docs"
else
    echo "⚠️  Deployment completed but couldn't get URL"
    echo "Check Railway dashboard: https://railway.app/dashboard"
fi

echo "🎉 Multi-tenant Baby Raffle SaaS backend deployment complete!"