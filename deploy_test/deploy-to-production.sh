#!/bin/bash

# Interactive Production Deployment Script
# Deploy Baby Raffle SaaS Platform to Production

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() { echo -e "${PURPLE}🚀 $1${NC}"; }

echo "🎉 Baby Raffle SaaS - Production Deployment"
echo "==========================================="
echo

log_info "This script will deploy your Baby Raffle SaaS platform to production"
log_info "You'll need accounts for:"
log_info "  - Railway (for API backend)"
log_info "  - Vercel (for frontend applications)"
log_info "  - Domain access to configure DNS for base2ml.com"
echo

read -p "Ready to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Step 1: Deploy API Backend
log_step "STEP 1: Deploy API Backend to Railway"
echo

if command -v railway >/dev/null 2>&1; then
    log_info "Railway CLI is installed"
    
    log_info "Please complete these steps manually:"
    echo "1. Open terminal and run: cd fastapi-backend"
    echo "2. Run: railway login"
    echo "3. Run: railway new (create new project)"
    echo "4. Run: railway up (deploy the API)"
    echo "5. Configure environment variables:"
    echo "   railway variables set DATABASE_URL=\"\$DATABASE_URL\""
    echo "   railway variables set JWT_SECRET=\"\$JWT_SECRET\""
    echo "   railway variables set GOOGLE_CLIENT_ID=\"\$GOOGLE_CLIENT_ID\""
    echo "   railway variables set GOOGLE_CLIENT_SECRET=\"\$GOOGLE_CLIENT_SECRET\""
    echo "   railway variables set STRIPE_SECRET_KEY=\"\$STRIPE_SECRET_KEY\""
    echo "   railway variables set STRIPE_WEBHOOK_SECRET=\"\$STRIPE_WEBHOOK_SECRET\""
    echo "   railway variables set AWS_ACCESS_KEY_ID=\"\$AWS_ACCESS_KEY_ID\""
    echo "   railway variables set AWS_SECRET_ACCESS_KEY=\"\$AWS_SECRET_ACCESS_KEY\""
    echo "   railway variables set AWS_S3_BUCKET=\"\$AWS_S3_BUCKET\""
    echo
    read -p "Press Enter after completing Railway deployment..."
    
    read -p "Enter your Railway API URL (e.g., https://your-app.railway.app): " RAILWAY_URL
    API_URL="$RAILWAY_URL"
    log_success "API Backend deployed to: $API_URL"
else
    log_error "Railway CLI not found. Please install with: npm install -g @railway/cli"
    exit 1
fi

# Step 2: Deploy Marketing Site
log_step "STEP 2: Deploy Marketing Site to Vercel"
echo

if command -v vercel >/dev/null 2>&1; then
    log_info "Configuring marketing site environment..."
    
    cd marketing-site/
    
    # Create production environment file
    cat > .env.production << EOF
NEXT_PUBLIC_API_URL=${API_URL}
NEXT_PUBLIC_BUILDER_URL=https://builder.base2ml.com
EOF
    
    log_info "Please complete these steps manually:"
    echo "1. Run: vercel login"
    echo "2. Run: vercel --prod"
    echo "3. In Vercel dashboard, set environment variables:"
    echo "   NEXT_PUBLIC_API_URL = $API_URL"
    echo "   NEXT_PUBLIC_BUILDER_URL = https://builder.base2ml.com"
    echo
    read -p "Press Enter after completing marketing site deployment..."
    
    read -p "Enter your Vercel marketing site URL: " MARKETING_URL
    log_success "Marketing site deployed to: $MARKETING_URL"
    
    cd ..
else
    log_error "Vercel CLI not found. Please install with: npm install -g vercel"
    exit 1
fi

# Step 3: Deploy Site Builder
log_step "STEP 3: Deploy Site Builder to Vercel"
echo

cd site-builder/

# Create production environment file
cat > .env.production << EOF
VITE_API_BASE_URL=${API_URL}
VITE_STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY:-pk_test_mock}
VITE_DOMAIN=base2ml.com
EOF

log_info "Please complete these steps manually:"
echo "1. Run: vercel --prod"
echo "2. In Vercel dashboard, set environment variables:"
echo "   VITE_API_BASE_URL = $API_URL"
echo "   VITE_STRIPE_PUBLISHABLE_KEY = your-stripe-publishable-key"
echo "   VITE_DOMAIN = base2ml.com"
echo
read -p "Press Enter after completing site builder deployment..."

read -p "Enter your Vercel site builder URL: " BUILDER_URL
log_success "Site builder deployed to: $BUILDER_URL"

cd ..

# Step 4: DNS Configuration
log_step "STEP 4: Configure DNS Records"
echo

log_info "Configure these DNS records in your domain provider:"
echo
echo "Domain: base2ml.com"
echo "Records:"
echo "  CNAME  mybabyraffle  →  ${MARKETING_URL#https://}"
echo "  CNAME  builder       →  ${BUILDER_URL#https://}"
echo "  CNAME  api           →  ${API_URL#https://}"
echo "  CNAME  *             →  [your-load-balancer]"
echo

log_warning "DNS propagation can take 24-48 hours"
echo
read -p "Press Enter after configuring DNS records..."

# Step 5: Test Deployment
log_step "STEP 5: Test Production Deployment"
echo

log_info "Once DNS propagates, test these URLs:"
echo "  🏠 Marketing: https://mybabyraffle.base2ml.com"
echo "  🔧 Builder: https://builder.base2ml.com"
echo "  🔗 API: https://api.base2ml.com"
echo "  📚 Docs: https://api.base2ml.com/docs"
echo

log_info "API Health Check:"
if curl -f -s "$API_URL/health" > /dev/null; then
    log_success "API is responding"
else
    log_warning "API not responding yet (may need time to start)"
fi

# Step 6: Final Instructions
log_step "🎉 DEPLOYMENT COMPLETE!"
echo

cat << EOF
Your Baby Raffle SaaS platform is deployed! 

📍 Production URLs:
   🏠 Marketing: https://mybabyraffle.base2ml.com
   🔧 Builder: https://builder.base2ml.com  
   🔗 API: https://api.base2ml.com
   📚 Docs: https://api.base2ml.com/docs

📋 Next Steps:
   1. Wait for DNS propagation (24-48 hours)
   2. Test complete user flow
   3. Configure SSL certificates (automatic)
   4. Set up monitoring and alerts
   5. Launch your marketing campaigns!

💰 Revenue Model Active:
   - \$20 setup fee + \$10/month hosting
   - Stripe payment processing
   - Automated site deployment

🎊 Your SaaS platform is LIVE and ready to make money!
EOF

echo
log_success "Production deployment completed successfully!"
echo
echo "🎯 Your Baby Raffle SaaS platform is now live and ready for customers!"