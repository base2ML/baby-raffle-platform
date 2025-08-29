#!/bin/bash

# Serverless Baby Raffle Deployment Script
# Usage: ./deploy-serverless.sh <subdomain> [domain] [database-password]

set -e

# Configuration
SUBDOMAIN_NAME="${1:-margojones}"
DOMAIN_NAME="${2:-base2ml.com}"
DATABASE_PASSWORD="${3}"
AWS_REGION="us-east-1"
ENVIRONMENT="production"

# Create safe stack names
DOMAIN_SAFE=$(echo "$DOMAIN_NAME" | sed 's/\./-/g')
FRONTEND_STACK="${SUBDOMAIN_NAME}-${DOMAIN_SAFE}-frontend"
BACKEND_STACK="${SUBDOMAIN_NAME}-${DOMAIN_SAFE}-backend"
DATABASE_STACK="${SUBDOMAIN_NAME}-${DOMAIN_SAFE}-database"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying Serverless Baby Raffle Framework${NC}"
echo -e "${BLUE}Subdomain: ${SUBDOMAIN_NAME}.${DOMAIN_NAME}${NC}"
echo -e "${BLUE}Frontend Stack: ${FRONTEND_STACK}${NC}"
echo -e "${BLUE}Backend Stack: ${BACKEND_STACK}${NC}"
echo -e "${BLUE}Database Stack: ${DATABASE_STACK}${NC}"
echo -e "${BLUE}================================${NC}"

# Validate inputs
if [ -z "$SUBDOMAIN_NAME" ]; then
    echo -e "${RED}❌ Error: Subdomain name required${NC}"
    echo "Usage: $0 <subdomain> [domain] [database-password]"
    exit 1
fi

if [ -z "$DATABASE_PASSWORD" ]; then
    echo -e "${YELLOW}⚠️  Database password not provided. Generating secure password...${NC}"
    DATABASE_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-20)
    echo -e "${YELLOW}Generated password: ${DATABASE_PASSWORD}${NC}"
    echo -e "${YELLOW}Please save this password securely!${NC}"
fi

# Validate subdomain name
if ! [[ "$SUBDOMAIN_NAME" =~ ^[a-zA-Z][a-zA-Z0-9-]*$ ]]; then
    echo -e "${RED}❌ Error: Subdomain name must start with a letter and contain only letters, numbers, and hyphens${NC}"
    exit 1
fi

# Check dependencies
echo -e "${YELLOW}🔧 Checking dependencies...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

if ! command -v serverless &> /dev/null; then
    echo -e "${YELLOW}⚠️  Serverless Framework not found. Installing...${NC}"
    npm install -g serverless
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies checked${NC}"

# Get hosted zone ID
echo -e "${YELLOW}🔍 Getting hosted zone ID...${NC}"
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='${DOMAIN_NAME}.'].Id" --output text | cut -d'/' -f3)

if [ -z "$HOSTED_ZONE_ID" ]; then
    echo -e "${RED}❌ Hosted zone not found for ${DOMAIN_NAME}${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Hosted zone ID: ${HOSTED_ZONE_ID}${NC}"

# Get SSL certificate ARN
echo -e "${YELLOW}🔍 Getting SSL certificate...${NC}"
CERT_ARN=$(aws acm list-certificates --region us-east-1 --query "CertificateSummaryList[?DomainName=='*.${DOMAIN_NAME}' || DomainName=='${DOMAIN_NAME}'].CertificateArn" --output text)

if [ -z "$CERT_ARN" ]; then
    echo -e "${RED}❌ SSL certificate not found for *.${DOMAIN_NAME}${NC}"
    echo -e "${YELLOW}Please create a wildcard certificate in ACM (us-east-1)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ SSL certificate found${NC}"

# Step 1: Deploy Database Infrastructure
echo -e "${YELLOW}📋 Step 1: Deploying database infrastructure...${NC}"

aws cloudformation deploy \
    --template-file infrastructure/database-infrastructure.yml \
    --stack-name "$DATABASE_STACK" \
    --parameter-overrides \
        SubdomainName="$SUBDOMAIN_NAME" \
        DomainName="$DOMAIN_NAME" \
        Environment="$ENVIRONMENT" \
        DatabasePassword="$DATABASE_PASSWORD" \
    --capabilities CAPABILITY_IAM \
    --region "$AWS_REGION"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database infrastructure deployed${NC}"
else
    echo -e "${RED}❌ Database infrastructure deployment failed${NC}"
    exit 1
fi

# Get database outputs
DATABASE_ENDPOINT=$(aws cloudformation describe-stacks --stack-name "$DATABASE_STACK" --region "$AWS_REGION" --query "Stacks[0].Outputs[?OutputKey=='DatabaseEndpoint'].OutputValue" --output text)
DATABASE_SECRET_ARN=$(aws cloudformation describe-stacks --stack-name "$DATABASE_STACK" --region "$AWS_REGION" --query "Stacks[0].Outputs[?OutputKey=='DatabaseSecretArn'].OutputValue" --output text)

# Step 2: Deploy Backend (Lambda + API Gateway)
echo -e "${YELLOW}📋 Step 2: Deploying backend services...${NC}"

cd backend

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
npm install

# Deploy serverless backend
echo -e "${YELLOW}🚀 Deploying Lambda functions...${NC}"
serverless deploy --stage prod --subdomain "$SUBDOMAIN_NAME"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend services deployed${NC}"
else
    echo -e "${RED}❌ Backend deployment failed${NC}"
    exit 1
fi

# Get API Gateway URL
API_URL=$(serverless info --stage prod --subdomain "$SUBDOMAIN_NAME" | grep "endpoint:" | awk '{print $2}')

cd ..

# Step 3: Deploy Frontend Infrastructure (S3 + CloudFront)
echo -e "${YELLOW}📋 Step 3: Deploying frontend infrastructure...${NC}"

aws cloudformation deploy \
    --template-file infrastructure/frontend-infrastructure.yml \
    --stack-name "$FRONTEND_STACK" \
    --parameter-overrides \
        SubdomainName="$SUBDOMAIN_NAME" \
        DomainName="$DOMAIN_NAME" \
        CertificateArn="$CERT_ARN" \
        HostedZoneId="$HOSTED_ZONE_ID" \
        Environment="$ENVIRONMENT" \
    --capabilities CAPABILITY_IAM \
    --region "$AWS_REGION"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend infrastructure deployed${NC}"
else
    echo -e "${RED}❌ Frontend infrastructure deployment failed${NC}"
    exit 1
fi

# Get frontend outputs
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "$FRONTEND_STACK" --region "$AWS_REGION" --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" --output text)
DISTRIBUTION_ID=$(aws cloudformation describe-stacks --stack-name "$FRONTEND_STACK" --region "$AWS_REGION" --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" --output text)
WEBSITE_URL=$(aws cloudformation describe-stacks --stack-name "$FRONTEND_STACK" --region "$AWS_REGION" --query "Stacks[0].Outputs[?OutputKey=='WebsiteURL'].OutputValue" --output text)

# Step 4: Build and Deploy Frontend
echo -e "${YELLOW}📋 Step 4: Building and deploying frontend...${NC}"

cd frontend

# Install frontend dependencies
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
npm install

# Set environment variables for build
export VITE_API_URL="$API_URL"

# Build the frontend
echo -e "${YELLOW}🏗️  Building frontend application...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Deploy to S3
echo -e "${YELLOW}📤 Deploying frontend to S3...${NC}"
aws s3 sync dist/ s3://$BUCKET_NAME --delete --region "$AWS_REGION"

# Invalidate CloudFront cache
echo -e "${YELLOW}🔄 Invalidating CloudFront cache...${NC}"
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" --region "$AWS_REGION"

cd ..

# Step 5: Create environment configuration
echo -e "${YELLOW}📝 Creating environment configuration...${NC}"

cat > ".env.${SUBDOMAIN_NAME}" << EOF
# Serverless Baby Raffle Environment - ${SUBDOMAIN_NAME}.${DOMAIN_NAME}
SUBDOMAIN_NAME=${SUBDOMAIN_NAME}
DOMAIN_NAME=${DOMAIN_NAME}
WEBSITE_URL=${WEBSITE_URL}
API_URL=${API_URL}
AWS_REGION=${AWS_REGION}
BUCKET_NAME=${BUCKET_NAME}
CLOUDFRONT_DISTRIBUTION_ID=${DISTRIBUTION_ID}
DATABASE_SECRET_NAME=${SUBDOMAIN_NAME}/database/connection
DATABASE_SECRET_ARN=${DATABASE_SECRET_ARN}
DB_HOST=${DATABASE_ENDPOINT}
DB_PORT=5432
DB_NAME=babyraffle
DB_USERNAME=postgres
DB_PASSWORD=${DATABASE_PASSWORD}
ENVIRONMENT=${ENVIRONMENT}
ADMIN_TOKEN=$(openssl rand -hex 32)

# Stack Names
FRONTEND_STACK=${FRONTEND_STACK}
BACKEND_STACK=${BACKEND_STACK}
DATABASE_STACK=${DATABASE_STACK}
EOF

echo -e "${GREEN}🎉 Serverless deployment completed successfully!${NC}"
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}🌐 Website URL: ${WEBSITE_URL}${NC}"
echo -e "${GREEN}🔗 API URL: ${API_URL}${NC}"
echo -e "${GREEN}📦 S3 Bucket: ${BUCKET_NAME}${NC}"
echo -e "${GREEN}🔄 CloudFront Distribution: ${DISTRIBUTION_ID}${NC}"
echo -e "${GREEN}🗄️  Database Endpoint: ${DATABASE_ENDPOINT}${NC}"

echo -e "\n${BLUE}📊 Architecture Summary:${NC}"
echo -e "${BLUE}Frontend: React SPA on S3 + CloudFront${NC}"
echo -e "${BLUE}Backend: Lambda functions + API Gateway${NC}"
echo -e "${BLUE}Database: PostgreSQL RDS${NC}"
echo -e "${BLUE}Deployment: Fully serverless and scalable${NC}"

echo -e "\n${BLUE}💰 Cost Benefits:${NC}"
echo -e "${BLUE}- Pay only when users access the site${NC}"
echo -e "${BLUE}- Auto-scaling from 0 to thousands of users${NC}"
echo -e "${BLUE}- Estimated cost: \$1-5/month for typical usage${NC}"

echo -e "\n${BLUE}📝 Next Steps:${NC}"
echo -e "${BLUE}1. Test the application at: ${WEBSITE_URL}${NC}"
echo -e "${BLUE}2. Admin panel: ${WEBSITE_URL}/admin${NC}"
echo -e "${BLUE}3. Configure event details in the app${NC}"
echo -e "${BLUE}4. Share with friends and family!${NC}"

echo -e "\n${GREEN}✅ Environment file created: .env.${SUBDOMAIN_NAME}${NC}"
echo -e "${YELLOW}⚠️  Keep your admin token and database password secure!${NC}"
