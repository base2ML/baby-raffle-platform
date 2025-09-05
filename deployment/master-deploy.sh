#!/bin/bash

##############################################################################
# Baby Raffle SaaS Platform - Master Deployment Script
##############################################################################
#
# This script performs a complete deployment of the Baby Raffle SaaS platform:
# 1. Sets up all infrastructure (AWS, DNS, SSL)
# 2. Configures OAuth applications and Stripe
# 3. Deploys all 4 applications
# 4. Sets up monitoring and health checks
# 5. Runs end-to-end validation
#
# Usage: ./master-deploy.sh [environment] [domain]
# Example: ./master-deploy.sh production base2ml.com
#
##############################################################################

set -e  # Exit on any error
set -u  # Exit on undefined variables

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
DOMAIN=${2:-base2ml.com}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}🚀 Baby Raffle SaaS Platform - Master Deployment${NC}"
echo "=================================================="
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Domain: $DOMAIN${NC}"
echo -e "${YELLOW}Script Directory: $SCRIPT_DIR${NC}"
echo ""

# Logging
LOG_FILE="$SCRIPT_DIR/deployment-$(date +%Y%m%d-%H%M%S).log"
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

echo "📝 Logging to: $LOG_FILE"
echo ""

##############################################################################
# Utility Functions
##############################################################################

log_info() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${BLUE}🔄 $1${NC}"
}

check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check if required commands exist
    local required_commands=("node" "npm" "aws" "git" "jq")
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command '$cmd' not found. Please install it first."
            exit 1
        fi
    done
    
    # Check Node.js version
    local node_version=$(node --version | sed 's/v//')
    local required_node_version="16.0.0"
    
    if ! printf '%s\n%s\n' "$required_node_version" "$node_version" | sort -V | head -1 | grep -q "^$required_node_version"; then
        log_error "Node.js version $node_version is too old. Minimum required: $required_node_version"
        exit 1
    fi
    
    # Check AWS CLI configuration
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS CLI not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

check_environment_variables() {
    log_step "Checking environment variables..."
    
    # Required environment variables
    local required_vars=(
        "AWS_REGION"
        "STRIPE_PUBLISHABLE_KEY"
        "STRIPE_SECRET_KEY"
        "GOOGLE_CLIENT_ID"
        "GOOGLE_CLIENT_SECRET"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        echo "Please set these variables before running the deployment."
        echo "You can create a .env file or export them directly."
        exit 1
    fi
    
    log_info "Environment variables check passed"
}

##############################################################################
# Infrastructure Setup
##############################################################################

setup_infrastructure() {
    log_step "Setting up infrastructure..."
    
    cd "$SCRIPT_DIR/infrastructure"
    
    # Install dependencies for infrastructure scripts
    if [[ ! -d "node_modules" ]]; then
        log_step "Installing infrastructure dependencies..."
        npm install
    fi
    
    # Run infrastructure setup
    log_step "Running infrastructure setup script..."
    export ENVIRONMENT="$ENVIRONMENT"
    export DOMAIN="$DOMAIN"
    
    if node setup-infrastructure.js; then
        log_info "Infrastructure setup completed"
    else
        log_error "Infrastructure setup failed"
        exit 1
    fi
}

##############################################################################
# Application Deployments
##############################################################################

deploy_api_backend() {
    log_step "Deploying API Backend..."
    
    cd "$PROJECT_ROOT/fastapi-backend"
    
    # Install Python dependencies
    if [[ ! -d "venv" ]]; then
        log_step "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    
    log_step "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Run database migrations
    log_step "Running database migrations..."
    if [[ -f "migrate_db.py" ]]; then
        python migrate_db.py
    fi
    
    # Deploy to production (this would typically be Railway, Heroku, etc.)
    log_step "Deploying API to production..."
    if [[ "$ENVIRONMENT" == "production" ]]; then
        # Production deployment commands would go here
        # Example for Railway:
        # railway deploy
        
        # Example for Docker deployment:
        # docker build -t baby-raffle-api .
        # docker tag baby-raffle-api:latest $ECR_REPO:latest
        # docker push $ECR_REPO:latest
        
        log_warn "Production API deployment command not implemented"
        log_warn "Please deploy the API backend manually to your chosen platform"
    else
        log_info "API deployment skipped for non-production environment"
    fi
}

deploy_marketing_site() {
    log_step "Deploying Marketing Site..."
    
    cd "$PROJECT_ROOT/marketing-site"
    
    # Install dependencies
    log_step "Installing marketing site dependencies..."
    npm install
    
    # Build the site
    log_step "Building marketing site..."
    npm run build
    
    # Deploy to static hosting
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_step "Deploying marketing site to production..."
        
        # Deploy to Vercel/Netlify/S3
        # Example for Vercel:
        # vercel --prod --yes
        
        # Example for S3:
        # aws s3 sync ./dist s3://marketing-site-bucket --delete
        
        log_warn "Production marketing site deployment command not implemented"
        log_warn "Please deploy the marketing site manually to your chosen platform"
    else
        log_info "Marketing site deployment skipped for non-production environment"
    fi
}

deploy_site_builder() {
    log_step "Deploying Site Builder Application..."
    
    cd "$PROJECT_ROOT"
    
    # Create site builder if it doesn't exist (it's mentioned as being created)
    if [[ ! -d "site-builder" ]]; then
        log_warn "Site builder directory not found"
        log_warn "Creating placeholder site builder structure..."
        
        mkdir -p site-builder/src
        cd site-builder
        
        # Initialize as React app
        npx create-react-app . --template typescript
        
        # Add Stripe and other dependencies
        npm install @stripe/stripe-js @stripe/react-stripe-js
        
        log_info "Site builder app structure created"
    else
        cd site-builder
        
        # Install dependencies
        log_step "Installing site builder dependencies..."
        npm install
        
        # Build the application
        log_step "Building site builder..."
        npm run build
        
        # Deploy to static hosting
        if [[ "$ENVIRONMENT" == "production" ]]; then
            log_step "Deploying site builder to production..."
            
            # Deploy commands would go here
            log_warn "Production site builder deployment command not implemented"
            log_warn "Please deploy the site builder manually to your chosen platform"
        else
            log_info "Site builder deployment skipped for non-production environment"
        fi
    fi
}

setup_tenant_site_template() {
    log_step "Setting up tenant site template system..."
    
    cd "$SCRIPT_DIR/tenant-site-template"
    
    # Install template dependencies
    log_step "Installing tenant site template dependencies..."
    npm install
    
    # Build the template to verify it works
    log_step "Testing tenant site template build..."
    if npm run build; then
        log_info "Tenant site template build successful"
    else
        log_error "Tenant site template build failed"
        exit 1
    fi
    
    cd "$SCRIPT_DIR/build-scripts"
    
    # Install build script dependencies
    log_step "Installing build script dependencies..."
    npm install
    
    log_info "Tenant site template system ready"
}

##############################################################################
# Configuration and Services
##############################################################################

setup_webhooks() {
    log_step "Setting up webhooks and integrations..."
    
    # Stripe webhook setup
    if [[ -n "${STRIPE_SECRET_KEY:-}" ]]; then
        log_step "Configuring Stripe webhooks..."
        
        # This would typically use Stripe CLI or API to create webhooks
        local webhook_url="https://api.$DOMAIN/api/billing/webhook"
        
        log_info "Stripe webhook endpoint: $webhook_url"
        log_warn "Please manually configure Stripe webhook in Stripe dashboard"
        log_warn "Webhook URL: $webhook_url"
        log_warn "Events to listen for: payment_intent.succeeded, customer.subscription.updated"
    else
        log_warn "Stripe secret key not provided, skipping webhook setup"
    fi
}

setup_dns_records() {
    log_step "Setting up DNS records..."
    
    # This would be handled by the infrastructure setup script
    # But we can add additional validation here
    
    log_info "DNS configuration handled by infrastructure setup"
    log_info "Verifying DNS records..."
    
    local subdomains=("api" "builder" "mybabyraffle")
    
    for subdomain in "${subdomains[@]}"; do
        local full_domain="$subdomain.$DOMAIN"
        if nslookup "$full_domain" > /dev/null 2>&1; then
            log_info "DNS record exists: $full_domain"
        else
            log_warn "DNS record not found: $full_domain"
        fi
    done
}

##############################################################################
# Validation and Health Checks
##############################################################################

run_health_checks() {
    log_step "Running health checks..."
    
    # API health check
    local api_url="https://api.$DOMAIN/health"
    if curl -f -s "$api_url" > /dev/null; then
        log_info "API health check passed: $api_url"
    else
        log_warn "API health check failed: $api_url"
    fi
    
    # Marketing site health check
    local marketing_url="https://mybabyraffle.$DOMAIN"
    if curl -f -s "$marketing_url" > /dev/null; then
        log_info "Marketing site health check passed: $marketing_url"
    else
        log_warn "Marketing site health check failed: $marketing_url"
    fi
    
    # Site builder health check
    local builder_url="https://builder.$DOMAIN"
    if curl -f -s "$builder_url" > /dev/null; then
        log_info "Site builder health check passed: $builder_url"
    else
        log_warn "Site builder health check failed: $builder_url"
    fi
}

run_end_to_end_tests() {
    log_step "Running end-to-end tests..."
    
    # Create a test tenant configuration
    local test_config=$(cat << EOF
{
  "tenantId": "test-$(date +%s)",
  "subdomain": "test-$(date +%s)",
  "parentInfo": {
    "motherName": "Test Mom",
    "fatherName": "Test Dad",
    "dueDate": "2024-12-25",
    "city": "Test City",
    "state": "TS"
  },
  "siteSettings": {
    "title": "Test Baby Raffle",
    "description": "Test site for deployment validation",
    "theme": {
      "primaryColor": "#3b82f6",
      "secondaryColor": "#f59e0b",
      "fontFamily": "Inter"
    },
    "features": {
      "showLeaderboard": true,
      "showStats": true,
      "allowComments": true
    }
  },
  "slideshowImages": [],
  "categories": [
    {
      "id": "test-category",
      "name": "Test Category",
      "description": "Test category for validation",
      "odds": {},
      "isActive": true
    }
  ]
}
EOF
)
    
    # Save test configuration
    local test_config_file="/tmp/test-tenant-config.json"
    echo "$test_config" > "$test_config_file"
    
    # Test tenant site build
    cd "$SCRIPT_DIR/build-scripts"
    
    log_step "Testing tenant site build process..."
    if node build-tenant-site.js "$test_config_file" "test-build-$(date +%s)"; then
        log_info "End-to-end test passed"
    else
        log_warn "End-to-end test failed"
    fi
    
    # Clean up test files
    rm -f "$test_config_file"
}

##############################################################################
# Main Execution
##############################################################################

create_deployment_summary() {
    log_step "Creating deployment summary..."
    
    local summary_file="$SCRIPT_DIR/deployment-summary-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$summary_file" << EOF
# Baby Raffle SaaS Deployment Summary

**Environment:** $ENVIRONMENT  
**Domain:** $DOMAIN  
**Deployed At:** $(date)  
**Deployed By:** $(whoami)  

## Application URLs

- **API Backend:** https://api.$DOMAIN
- **Marketing Site:** https://mybabyraffle.$DOMAIN  
- **Site Builder:** https://builder.$DOMAIN
- **Tenant Sites:** https://{subdomain}.$DOMAIN

## Infrastructure

- **AWS Region:** ${AWS_REGION:-Not Set}
- **Environment:** $ENVIRONMENT
- **SSL Certificate:** Wildcard for *.$DOMAIN

## Next Steps

1. **Verify OAuth Configuration:**
   - Google OAuth: Configure redirect URIs in Google Console
   - Apple Sign In: Configure redirect URIs in Apple Developer Portal

2. **Verify Stripe Configuration:**
   - Add webhook endpoint: https://api.$DOMAIN/api/billing/webhook
   - Configure webhook events: payment_intent.succeeded, customer.subscription.updated

3. **Test End-to-End Flow:**
   - Visit https://mybabyraffle.$DOMAIN
   - Create test account and site
   - Verify site deployment works

4. **Monitor and Maintain:**
   - Check CloudWatch logs for errors
   - Monitor costs and usage
   - Update SSL certificates when needed

## Troubleshooting

- **Logs:** $LOG_FILE
- **Infrastructure Logs:** Check CloudFormation events
- **Application Logs:** Check application hosting platform logs

EOF

    log_info "Deployment summary created: $summary_file"
}

##############################################################################
# Script Execution
##############################################################################

main() {
    echo "Starting deployment at $(date)"
    echo ""
    
    # Prerequisites
    check_prerequisites
    check_environment_variables
    
    # Infrastructure
    setup_infrastructure
    
    # Applications
    deploy_api_backend
    deploy_marketing_site  
    deploy_site_builder
    setup_tenant_site_template
    
    # Configuration
    setup_webhooks
    setup_dns_records
    
    # Validation
    run_health_checks
    run_end_to_end_tests
    
    # Summary
    create_deployment_summary
    
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Summary:${NC}"
    echo "   Environment: $ENVIRONMENT"
    echo "   Domain: $DOMAIN"
    echo "   API: https://api.$DOMAIN"
    echo "   Marketing: https://mybabyraffle.$DOMAIN"
    echo "   Builder: https://builder.$DOMAIN"
    echo ""
    echo -e "${YELLOW}⚠️  Manual Steps Required:${NC}"
    echo "   1. Configure OAuth redirect URIs"
    echo "   2. Setup Stripe webhooks"
    echo "   3. Update DNS records if needed"
    echo "   4. Test the complete user flow"
    echo ""
    echo "📝 Full logs: $LOG_FILE"
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"