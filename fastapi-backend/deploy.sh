#!/bin/bash
set -e

# Baby Raffle SaaS Deployment Script
echo "🚀 Deploying Baby Raffle SaaS Platform"
echo "========================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Railway CLI is installed
if ! command_exists railway; then
    echo "❌ Railway CLI not found. Installing..."
    if command_exists npm; then
        npm install -g @railway/cli
    elif command_exists curl; then
        curl -fsSL https://railway.app/install.sh | sh
    else
        echo "❌ Please install npm or curl first, then run:"
        echo "   npm install -g @railway/cli"
        echo "   OR"  
        echo "   curl -fsSL https://railway.app/install.sh | sh"
        exit 1
    fi
fi

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "🔐 Logging in to Railway..."
    echo "Please complete the login process in your browser"
    railway login
fi

echo "✅ Railway CLI ready and authenticated"

# Create or link Railway project
echo "📦 Setting up Railway project..."
if [ ! -f ".railway" ] && [ ! -f "railway.toml" ]; then
    echo "🆕 Creating new Railway project..."
    railway init baby-raffle-saas
    echo "✅ Railway project created"
else
    echo "✅ Using existing Railway project"
fi

# Add PostgreSQL database
echo "🗄️  Setting up PostgreSQL database..."
if ! railway plugins | grep -q "postgresql"; then
    railway add postgresql
    echo "✅ PostgreSQL database added"
else
    echo "✅ PostgreSQL already configured"
fi

# Generate secure JWT secret
echo "🔐 Generating secure JWT secret..."
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))" 2>/dev/null || openssl rand -base64 32)

# Set up environment variables
echo "⚙️  Configuring environment variables..."

# Core application settings
railway variables set ENVIRONMENT=production
railway variables set LOG_LEVEL=INFO  
railway variables set DEBUG=false
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set PYTHON_VERSION=3.11

echo "✅ Core environment configured"
echo ""
echo "🔑 IMPORTANT: Configure OAuth in Railway dashboard:"
echo "   railway variables set GOOGLE_CLIENT_ID=your-client-id"
echo "   railway variables set GOOGLE_CLIENT_SECRET=your-secret"

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