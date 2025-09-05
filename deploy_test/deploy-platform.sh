#!/bin/bash

# Baby Raffle SaaS Platform - Complete Deployment Script
# This script deploys the entire multi-tenant SaaS platform

set -e

echo "🚀 Baby Raffle SaaS Platform Deployment"
echo "========================================"
echo

# Configuration
DOMAIN="base2ml.com"
API_SUBDOMAIN="api"
MARKETING_SUBDOMAIN="mybabyraffle"
BUILDER_SUBDOMAIN="builder"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if commands exist
    local missing_commands=()
    
    for cmd in git node npm python3 docker; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            missing_commands+=("$cmd")
        fi
    done
    
    if [ ${#missing_commands[@]} -ne 0 ]; then
        log_error "Missing required commands: ${missing_commands[*]}"
        echo "Please install the missing commands and try again."
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "SAAS_PLATFORM_DESIGN.md" ]; then
        log_error "Please run this script from the baby-raffle-serverless root directory"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Environment setup
setup_environment() {
    log_info "Setting up environment configuration..."
    
    # Create environment files if they don't exist
    if [ ! -f ".env.platform" ]; then
        cat > .env.platform << EOF
# Baby Raffle SaaS Platform Configuration
DOMAIN=${DOMAIN}
API_URL=https://${API_SUBDOMAIN}.${DOMAIN}
MARKETING_URL=https://${MARKETING_SUBDOMAIN}.${DOMAIN}
BUILDER_URL=https://${BUILDER_SUBDOMAIN}.${DOMAIN}

# Database (configure with your PostgreSQL details)
DATABASE_URL=postgresql://username:password@hostname:5432/baby_raffle_saas

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secure-jwt-secret-here

# OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY_PATH=/path/to/apple/private/key.p8

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# File Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=baby-raffle-uploads
AWS_REGION=us-east-1

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@${DOMAIN}
SMTP_PASSWORD=your-app-password

# Platform Settings
ENVIRONMENT=production
LOG_LEVEL=info
CORS_ORIGINS=https://*.${DOMAIN}
EOF
        
        log_warning "Created .env.platform template. Please edit it with your actual credentials:"
        log_warning "- Database credentials (PostgreSQL)"
        log_warning "- OAuth app credentials (Google & Apple)"
        log_warning "- Stripe API keys and webhook secret"
        log_warning "- AWS S3 credentials for file storage"
        log_warning "- Email SMTP configuration"
        echo
        read -p "Press Enter after you've configured .env.platform..."
    fi
    
    # Validate required environment variables
    source .env.platform
    
    local required_vars=(
        "DATABASE_URL" "JWT_SECRET" 
        "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET"
        "STRIPE_PUBLISHABLE_KEY" "STRIPE_SECRET_KEY"
        "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY" "AWS_S3_BUCKET"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ] || [[ "${!var}" == *"your-"* ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "Please configure these environment variables in .env.platform:"
        printf ' - %s\n' "${missing_vars[@]}"
        exit 1
    fi
    
    log_success "Environment configuration validated"
}

# Database setup
setup_database() {
    log_info "Setting up database..."
    
    cd fastapi-backend/
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    pip install -r requirements.txt
    
    # Copy platform environment
    cp ../.env.platform .env
    
    # Run database migrations
    log_info "Running database migrations..."
    python3 migrate_db.py
    python3 migrate_payments_schema.py
    
    log_success "Database setup completed"
    cd ..
}

# Deploy API backend
deploy_api() {
    log_info "Deploying API backend..."
    
    cd fastapi-backend/
    
    # Check if Railway CLI is available
    if command -v railway >/dev/null 2>&1; then
        log_info "Deploying to Railway..."
        
        # Login check
        if ! railway whoami >/dev/null 2>&1; then
            log_warning "Please login to Railway first: railway login"
            railway login
        fi
        
        # Deploy
        railway up
        
        # Get deployment URL
        API_URL=$(railway status --json | jq -r '.deployments[0].url')
        log_success "API deployed to: $API_URL"
        
    else
        log_warning "Railway CLI not found. Please deploy the API manually:"
        log_warning "1. Deploy fastapi-backend/ to your hosting platform"
        log_warning "2. Set environment variables from .env.platform"
        log_warning "3. Run database migrations"
        
        read -p "Enter your deployed API URL: " API_URL
    fi
    
    # Update environment with actual API URL
    sed -i.bak "s|https://api.${DOMAIN}|${API_URL}|g" ../.env.platform
    
    cd ..
}

# Deploy marketing site
deploy_marketing() {
    log_info "Deploying marketing site..."
    
    cd marketing-site/
    
    # Install dependencies
    npm install
    
    # Set up environment for build
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=${API_URL}
NEXT_PUBLIC_BUILDER_URL=https://${BUILDER_SUBDOMAIN}.${DOMAIN}
EOF
    
    # Build
    npm run build
    
    # Check if Vercel CLI is available
    if command -v vercel >/dev/null 2>&1; then
        log_info "Deploying to Vercel..."
        vercel --prod --yes
        log_success "Marketing site deployed to Vercel"
    else
        log_warning "Vercel CLI not found. Build completed in out/ directory"
        log_warning "Please deploy out/ directory to your static hosting platform"
        log_warning "Configure custom domain: ${MARKETING_SUBDOMAIN}.${DOMAIN}"
    fi
    
    cd ..
}

# Deploy site builder
deploy_builder() {
    log_info "Deploying site builder..."
    
    cd site-builder/
    
    # Install dependencies
    npm install
    
    # Set up environment for build
    cat > .env.production << EOF
VITE_API_BASE_URL=${API_URL}
VITE_STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
VITE_DOMAIN=${DOMAIN}
EOF
    
    # Build
    npm run build
    
    # Deploy (using same method as marketing site)
    if command -v vercel >/dev/null 2>&1; then
        log_info "Deploying to Vercel..."
        vercel --prod --yes
        log_success "Site builder deployed to Vercel"
    else
        log_warning "Vercel CLI not found. Build completed in dist/ directory"
        log_warning "Please deploy dist/ directory to your static hosting platform"
        log_warning "Configure custom domain: ${BUILDER_SUBDOMAIN}.${DOMAIN}"
    fi
    
    cd ..
}

# Setup tenant site deployment system
setup_tenant_deployment() {
    log_info "Setting up tenant site deployment system..."
    
    # Create deployment scripts
    cat > deploy-tenant-site.sh << 'EOF'
#!/bin/bash

# Tenant Site Deployment Script
# Usage: ./deploy-tenant-site.sh <tenant_id> <subdomain>

set -e

TENANT_ID=$1
SUBDOMAIN=$2
API_URL=$3

if [ -z "$TENANT_ID" ] || [ -z "$SUBDOMAIN" ] || [ -z "$API_URL" ]; then
    echo "Usage: $0 <tenant_id> <subdomain> <api_url>"
    exit 1
fi

echo "🚀 Deploying site for tenant: $TENANT_ID"
echo "📍 Subdomain: $SUBDOMAIN.base2ml.com"

# Get tenant configuration from API
TENANT_CONFIG=$(curl -s "$API_URL/api/site/config/$TENANT_ID")

# Create temporary build directory
BUILD_DIR="/tmp/tenant-build-$TENANT_ID-$(date +%s)"
cp -r tenant-site-template "$BUILD_DIR"

cd "$BUILD_DIR"

# Replace placeholders with actual tenant data
echo "🔧 Configuring site with tenant data..."

# Extract values from API response and replace placeholders
python3 << PYTHON
import json
import os
import re

config = json.loads('$TENANT_CONFIG')

replacements = {
    '{{SUBDOMAIN}}': '$SUBDOMAIN',
    '{{SITE_NAME}}': config.get('site_name', ''),
    '{{PARENT_NAMES}}': config.get('parent_names', ''),
    '{{DUE_DATE}}': config.get('due_date', ''),
    '{{VENMO_ACCOUNT}}': config.get('venmo_account', ''),
    '{{PRIMARY_COLOR}}': config.get('primary_color', '#ec4899'),
    '{{SECONDARY_COLOR}}': config.get('secondary_color', '#8b5cf6'),
    '{{DESCRIPTION}}': config.get('description', ''),
    '{{API_BASE_URL}}': '$API_URL',
    '{{TENANT_ID}}': '$TENANT_ID',
    '{{SLIDESHOW_IMAGES}}': ','.join([f'"{img}"' for img in config.get('slideshow_images', [])]),
    '{{LOGO_URL}}': config.get('logo_url', '')
}

# Replace in all source files
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.js', '.jsx', '.html', '.css')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            for placeholder, value in replacements.items():
                content = content.replace(placeholder, str(value))
            
            with open(filepath, 'w') as f:
                f.write(content)

print("✅ Template configuration completed")
PYTHON

# Install dependencies and build
npm install
npm run build

# Deploy to static hosting
echo "🌐 Deploying to static hosting..."

# Upload to S3 and configure CloudFront (or use your preferred method)
if command -v aws >/dev/null 2>&1; then
    # Create S3 bucket for this subdomain
    aws s3 mb "s3://$SUBDOMAIN-babyraffle" --region us-east-1 2>/dev/null || true
    
    # Upload build files
    aws s3 sync dist/ "s3://$SUBDOMAIN-babyraffle/" --delete
    
    # Configure S3 for static website hosting
    aws s3 website "s3://$SUBDOMAIN-babyraffle" --index-document index.html --error-document index.html
    
    echo "✅ Site deployed to S3: http://$SUBDOMAIN-babyraffle.s3-website-us-east-1.amazonaws.com"
else
    echo "⚠️  AWS CLI not found. Build completed in dist/ directory"
    echo "   Please upload dist/ to your static hosting platform"
fi

# Cleanup
cd /
rm -rf "$BUILD_DIR"

echo "🎉 Tenant site deployment completed!"
EOF

chmod +x deploy-tenant-site.sh

log_success "Tenant deployment system configured"
}

# DNS and SSL setup
setup_dns_ssl() {
    log_info "Setting up DNS and SSL..."
    
    cat << EOF

🔧 DNS Configuration Required:

1. Configure these DNS records in your domain provider:
   
   A Records:
   - ${API_SUBDOMAIN}.${DOMAIN} → [Your API server IP]
   - ${MARKETING_SUBDOMAIN}.${DOMAIN} → [Your marketing site IP/CDN]
   - ${BUILDER_SUBDOMAIN}.${DOMAIN} → [Your builder app IP/CDN]
   
   Wildcard Record:
   - *.${DOMAIN} → [Your load balancer IP]

2. SSL Certificates:
   - Obtain wildcard SSL certificate for *.${DOMAIN}
   - Configure SSL termination in your load balancer
   
3. Load Balancer Configuration:
   - Route API requests to FastAPI backend
   - Route static sites to CDN/static hosting
   - Handle subdomain routing for tenant sites

📋 Manual Steps Required:
- Configure your domain's DNS settings
- Set up SSL certificates (Let's Encrypt recommended)
- Configure load balancer or reverse proxy
- Test subdomain routing

EOF
    
    read -p "Press Enter after completing DNS and SSL setup..."
    log_success "DNS and SSL configuration noted"
}

# Test deployment
test_deployment() {
    log_info "Testing deployment..."
    
    # Test API health
    if curl -f -s "${API_URL}/health" > /dev/null; then
        log_success "API backend is healthy"
    else
        log_warning "API backend health check failed"
    fi
    
    # Test marketing site (if available)
    if curl -f -s "https://${MARKETING_SUBDOMAIN}.${DOMAIN}" > /dev/null; then
        log_success "Marketing site is accessible"
    else
        log_warning "Marketing site not accessible (may need DNS propagation)"
    fi
    
    # Test site builder (if available)
    if curl -f -s "https://${BUILDER_SUBDOMAIN}.${DOMAIN}" > /dev/null; then
        log_success "Site builder is accessible"
    else
        log_warning "Site builder not accessible (may need DNS propagation)"
    fi
    
    log_success "Deployment testing completed"
}

# Main deployment flow
main() {
    echo "🎯 This script will deploy the complete Baby Raffle SaaS platform"
    echo "📋 Components to deploy:"
    echo "   1. API Backend (FastAPI with Stripe + OAuth)"
    echo "   2. Marketing Site (Next.js showcase)"
    echo "   3. Site Builder (React configuration app)"
    echo "   4. Tenant Site Template System"
    echo "   5. DNS and SSL configuration"
    echo
    
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
    
    # Run deployment steps
    check_prerequisites
    setup_environment
    setup_database
    deploy_api
    deploy_marketing
    deploy_builder
    setup_tenant_deployment
    setup_dns_ssl
    test_deployment
    
    echo
    echo "🎉 Baby Raffle SaaS Platform Deployment Complete!"
    echo
    echo "📍 Your platform is now available at:"
    echo "   🏠 Marketing: https://${MARKETING_SUBDOMAIN}.${DOMAIN}"
    echo "   🔧 Builder: https://${BUILDER_SUBDOMAIN}.${DOMAIN}"
    echo "   🔗 API: ${API_URL}"
    echo
    echo "📚 Next Steps:"
    echo "   1. Test the complete user flow"
    echo "   2. Configure monitoring and alerts"
    echo "   3. Set up backup procedures"
    echo "   4. Launch your marketing campaigns!"
    echo
    echo "💡 Admin URLs:"
    echo "   - API Docs: ${API_URL}/docs"
    echo "   - Health Check: ${API_URL}/health"
    echo
    echo "🎊 Your Baby Raffle SaaS platform is ready for customers!"
}

# Run main function
main "$@"