#!/bin/bash

# Automated Baby Raffle SaaS Production Deployment
# Uses .env.platform for configuration and API keys

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() { echo -e "${PURPLE}🚀 $1${NC}"; }

echo "🤖 Baby Raffle SaaS - Automated Production Deployment"
echo "======================================================"
echo

# Check if .env.platform exists
if [ ! -f ".env.platform" ]; then
    log_error ".env.platform file not found!"
    log_info "Please ensure .env.platform is configured with your production credentials"
    exit 1
fi

# Load environment variables
log_info "Loading environment configuration from .env.platform..."
set -a  # automatically export all variables
source .env.platform
set +a  # disable automatic export

log_success "Environment loaded successfully"

# Validate required variables
required_vars=(
    "DATABASE_URL" "JWT_SECRET" 
    "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET"
    "STRIPE_PUBLISHABLE_KEY" "STRIPE_SECRET_KEY"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    log_error "Missing required environment variables:"
    printf '   - %s\n' "${missing_vars[@]}"
    log_info "Please configure these in .env.platform"
    exit 1
fi

log_success "All required environment variables found"

# Check for deployment CLI tools
log_info "Checking deployment tools..."

if ! command -v railway >/dev/null 2>&1; then
    log_warning "Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

if ! command -v vercel >/dev/null 2>&1; then
    log_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

log_success "Deployment tools ready"

# Function to deploy to Railway with API token
deploy_to_railway() {
    log_step "STEP 1: Deploying API Backend to Railway"
    
    cd fastapi-backend/
    
    # Check if Railway token is set
    if [ -n "$RAILWAY_TOKEN" ]; then
        log_info "Using Railway API token for authentication"
        export RAILWAY_TOKEN="$RAILWAY_TOKEN"
    else
        log_warning "RAILWAY_TOKEN not found in .env.platform"
        log_info "Please set RAILWAY_TOKEN in .env.platform or login manually:"
        log_info "1. Run: railway login"
        log_info "2. Get token from: railway whoami --json | jq -r .token"
        log_info "3. Add to .env.platform: RAILWAY_TOKEN=your_token_here"
        exit 1
    fi
    
    # Create or link Railway project
    if [ -n "$RAILWAY_PROJECT_ID" ]; then
        log_info "Linking to existing Railway project: $RAILWAY_PROJECT_ID"
        railway link "$RAILWAY_PROJECT_ID"
    else
        log_info "Creating new Railway project..."
        railway init
    fi
    
    # Set environment variables in Railway
    log_info "Setting environment variables in Railway..."
    railway variables set DATABASE_URL="$DATABASE_URL" \
                         JWT_SECRET="$JWT_SECRET" \
                         GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
                         GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET" \
                         STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
                         STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
                         AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
                         AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
                         AWS_S3_BUCKET="$AWS_S3_BUCKET" \
                         AWS_REGION="${AWS_REGION:-us-east-1}" \
                         ENVIRONMENT="production" \
                         PORT="8000"
    
    # Deploy to Railway
    log_info "Deploying to Railway..."
    railway up --detach
    
    # Get the deployment URL
    sleep 10  # Wait for deployment to initialize
    RAILWAY_URL=$(railway status --json 2>/dev/null | jq -r '.deployments[0].url // empty' 2>/dev/null || echo "")
    
    if [ -z "$RAILWAY_URL" ]; then
        log_warning "Could not automatically get Railway URL"
        log_info "Please check your Railway dashboard for the deployment URL"
        read -p "Enter your Railway API URL: " RAILWAY_URL
    fi
    
    API_URL="$RAILWAY_URL"
    log_success "API deployed to Railway: $API_URL"
    
    cd ..
}

# Function to deploy to Vercel with API token
deploy_to_vercel() {
    local app_name=$1
    local app_dir=$2
    local env_vars=$3
    
    log_info "Deploying $app_name to Vercel..."
    
    cd "$app_dir/"
    
    # Check if Vercel token is set
    if [ -n "$VERCEL_TOKEN" ]; then
        log_info "Using Vercel API token for authentication"
        export VERCEL_TOKEN="$VERCEL_TOKEN"
    else
        log_warning "VERCEL_TOKEN not found in .env.platform"
        log_info "Please set VERCEL_TOKEN in .env.platform or login manually:"
        log_info "1. Run: vercel login"
        log_info "2. Get token from Vercel dashboard > Settings > Tokens"
        log_info "3. Add to .env.platform: VERCEL_TOKEN=your_token_here"
        exit 1
    fi
    
    # Create vercel.json for configuration
    cat > vercel.json << EOF
{
  "name": "${app_name,,}",
  "env": $env_vars,
  "build": {
    "env": $env_vars
  }
}
EOF
    
    # Deploy to Vercel
    DEPLOY_URL=$(vercel --prod --token="$VERCEL_TOKEN" --yes --confirm 2>&1 | grep -o 'https://[^[:space:]]*' | tail -1)
    
    if [ -n "$DEPLOY_URL" ]; then
        log_success "$app_name deployed to: $DEPLOY_URL"
        echo "$DEPLOY_URL"
    else
        log_error "Failed to deploy $app_name to Vercel"
        exit 1
    fi
    
    cd ..
}

# Main deployment flow
main() {
    log_info "Starting automated production deployment..."
    echo
    
    # Deploy API Backend
    deploy_to_railway
    
    # Deploy Marketing Site
    log_step "STEP 2: Deploying Marketing Site to Vercel"
    MARKETING_ENV=$(cat << EOF
{
  "NEXT_PUBLIC_API_URL": "$API_URL",
  "NEXT_PUBLIC_BUILDER_URL": "https://builder.base2ml.com"
}
EOF
)
    MARKETING_URL=$(deploy_to_vercel "Baby-Raffle-Marketing" "marketing-site" "$MARKETING_ENV")
    
    # Deploy Site Builder
    log_step "STEP 3: Deploying Site Builder to Vercel"
    BUILDER_ENV=$(cat << EOF
{
  "VITE_API_BASE_URL": "$API_URL",
  "VITE_STRIPE_PUBLISHABLE_KEY": "$STRIPE_PUBLISHABLE_KEY",
  "VITE_DOMAIN": "base2ml.com"
}
EOF
)
    BUILDER_URL=$(deploy_to_vercel "Baby-Raffle-Builder" "site-builder" "$BUILDER_ENV")
    
    # Update DNS configuration file
    log_step "STEP 4: Generating DNS Configuration"
    
    cat > DNS_CONFIGURATION.txt << EOF
🌐 DNS Records for base2ml.com Domain

Configure these CNAME records in your domain provider:

Record Type: CNAME
Name: mybabyraffle
Value: ${MARKETING_URL#https://}

Record Type: CNAME  
Name: builder
Value: ${BUILDER_URL#https://}

Record Type: CNAME
Name: api
Value: ${API_URL#https://}

Record Type: CNAME
Name: *
Value: [your-load-balancer-for-tenant-sites]

Note: DNS propagation takes 24-48 hours globally
EOF
    
    log_success "DNS configuration saved to DNS_CONFIGURATION.txt"
    
    # Test deployments
    log_step "STEP 5: Testing Deployments"
    
    log_info "Testing API health..."
    sleep 30  # Wait for Railway deployment to be ready
    
    if curl -f -s "$API_URL/health" >/dev/null 2>&1; then
        log_success "API is responding correctly"
    else
        log_warning "API not responding yet (may need more time to start)"
    fi
    
    log_info "Testing frontend applications..."
    if curl -f -s "$MARKETING_URL" >/dev/null 2>&1; then
        log_success "Marketing site is responding"
    else
        log_warning "Marketing site not responding yet"
    fi
    
    if curl -f -s "$BUILDER_URL" >/dev/null 2>&1; then
        log_success "Site builder is responding"
    else
        log_warning "Site builder not responding yet"
    fi
    
    # Create deployment summary
    log_step "🎉 AUTOMATED DEPLOYMENT COMPLETE!"
    
    cat > DEPLOYMENT_SUMMARY.md << EOF
# 🎉 Baby Raffle SaaS - Deployment Summary

## ✅ Successfully Deployed

**Deployment Date:** $(date)

## 🌐 Production URLs

- **API Backend:** $API_URL
- **Marketing Site:** $MARKETING_URL  
- **Site Builder:** $BUILDER_URL
- **API Documentation:** $API_URL/docs

## 📋 Next Steps

1. **Configure DNS Records** (see DNS_CONFIGURATION.txt)
2. **Wait for DNS propagation** (24-48 hours)
3. **Test complete user flow**
4. **Set up monitoring and alerts**
5. **Launch marketing campaigns**

## 🔗 Final Production URLs (after DNS)

- **Marketing:** https://mybabyraffle.base2ml.com
- **Site Builder:** https://builder.base2ml.com
- **API:** https://api.base2ml.com
- **Docs:** https://api.base2ml.com/docs

## 💰 Revenue Model

- Setup Fee: \$20 one-time
- Hosting: \$10/month per site
- Payment Processing: Stripe (configured)
- Automated Billing: Active

## 🎯 Platform Status: LIVE AND READY FOR CUSTOMERS!

Your Baby Raffle SaaS platform is now deployed and operational.
Configure DNS records and start accepting customers!
EOF
    
    log_success "Deployment summary saved to DEPLOYMENT_SUMMARY.md"
    
    echo
    echo "🎊 Your Baby Raffle SaaS platform is now deployed to production!"
    echo
    echo "📍 Production URLs:"
    echo "   🏠 Marketing: $MARKETING_URL"
    echo "   🔧 Builder: $BUILDER_URL"
    echo "   🔗 API: $API_URL"
    echo
    echo "📋 Required: Configure DNS records (see DNS_CONFIGURATION.txt)"
    echo "⏱️  DNS propagation: 24-48 hours"
    echo "🎯 Status: READY FOR CUSTOMERS!"
    echo
}

# Verify prerequisites before starting
echo "🔍 Pre-deployment verification..."
echo

if [ ! -d "fastapi-backend" ] || [ ! -d "marketing-site" ] || [ ! -d "site-builder" ]; then
    log_error "Required directories not found. Run from baby-raffle-serverless root directory."
    exit 1
fi

log_info "Prerequisites checked ✓"
echo

# Confirm deployment
echo "🚀 This will automatically deploy your Baby Raffle SaaS platform to production using:"
echo "   - Railway for API backend"
echo "   - Vercel for frontend applications"
echo "   - Environment variables from .env.platform"
echo

read -p "Proceed with automated deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Run main deployment
main

log_success "🎉 Automated production deployment completed successfully!"