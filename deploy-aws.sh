#!/bin/bash

# 🚀 Deploy FastAPI to AWS App Runner
# Deploys containerized FastAPI to AWS and updates frontend

set -e

echo "🚀 Baby Raffle FastAPI - AWS Deployment"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-east-1"
ECR_REPO_NAME="baby-raffle-api"
APP_RUNNER_SERVICE_NAME="baby-raffle-api"
DOMAIN="api.margojones.base2ml.com"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo -e "${BLUE}📋 Configuration:${NC}"
echo "  AWS Account: $ACCOUNT_ID"
echo "  Region: $AWS_REGION"
echo "  ECR Repo: $ECR_REPO_NAME"
echo "  App Runner Service: $APP_RUNNER_SERVICE_NAME"
echo "  API Domain: $DOMAIN"
echo ""

# Step 1: Create ECR repository
echo -e "${BLUE}1. Setting up ECR repository...${NC}"
if ! aws ecr describe-repositories --repository-names $ECR_REPO_NAME --region $AWS_REGION > /dev/null 2>&1; then
    echo "Creating ECR repository..."
    aws ecr create-repository --repository-name $ECR_REPO_NAME --region $AWS_REGION
    echo -e "${GREEN}✅ ECR repository created${NC}"
else
    echo -e "${GREEN}✅ ECR repository already exists${NC}"
fi

# Get ECR login
echo "Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Step 2: Build and push Docker image
echo -e "${BLUE}2. Building and pushing Docker image...${NC}"
cd fastapi-backend

# Build image
echo "Building Docker image..."
docker build -t $ECR_REPO_NAME .

# Tag for ECR
ECR_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME:latest"
docker tag $ECR_REPO_NAME:latest $ECR_URI

# Push to ECR
echo "Pushing to ECR..."
docker push $ECR_URI
echo -e "${GREEN}✅ Image pushed to ECR: $ECR_URI${NC}"

cd ..

# Step 3: Create App Runner service configuration
echo -e "${BLUE}3. Creating App Runner service...${NC}"

# Create apprunner.yaml for configuration
cat > apprunner.yaml << EOF
version: 1.0
runtime: docker
build:
  commands:
    build:
      - echo "No build commands needed - using pre-built image"
run:
  runtime-version: latest
  command: uvicorn main:app --host 0.0.0.0 --port 8000
  network:
    port: 8000
    env-vars:
      DB_HOST: margojones-babyraffle-db.cu1y2a26idsb.us-east-1.rds.amazonaws.com
      DB_PORT: 5432
      DB_NAME: babyraffle
      DB_USERNAME: postgres
      DB_PASSWORD: YgrzO9oHQScN5ctXcTOL
EOF

# Create App Runner service
cat > app-runner-service.json << EOF
{
  "ServiceName": "$APP_RUNNER_SERVICE_NAME",
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "$ECR_URI",
      "ImageConfiguration": {
        "Port": "8000",
        "RuntimeEnvironmentVariables": {
          "DB_HOST": "margojones-babyraffle-db.cu1y2a26idsb.us-east-1.rds.amazonaws.com",
          "DB_PORT": "5432",
          "DB_NAME": "babyraffle",
          "DB_USERNAME": "postgres",
          "DB_PASSWORD": "YgrzO9oHQScN5ctXcTOL"
        }
      },
      "ImageRepositoryType": "ECR"
    },
    "AutoDeploymentsEnabled": true
  },
  "InstanceConfiguration": {
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB"
  },
  "HealthCheckConfiguration": {
    "Protocol": "HTTP",
    "Path": "/health",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  }
}
EOF

# Check if App Runner service exists
if aws apprunner describe-service --service-arn "arn:aws:apprunner:$AWS_REGION:$ACCOUNT_ID:service/$APP_RUNNER_SERVICE_NAME" --region $AWS_REGION > /dev/null 2>&1; then
    echo "Updating existing App Runner service..."
    # Get current service ARN
    SERVICE_ARN=$(aws apprunner list-services --region $AWS_REGION --query "ServiceSummaryList[?ServiceName=='$APP_RUNNER_SERVICE_NAME'].ServiceArn" --output text)
    
    # Start deployment
    aws apprunner start-deployment --service-arn $SERVICE_ARN --region $AWS_REGION
    echo -e "${GREEN}✅ App Runner service deployment started${NC}"
else
    echo "Creating new App Runner service..."
    aws apprunner create-service --cli-input-json file://app-runner-service.json --region $AWS_REGION
    echo -e "${GREEN}✅ App Runner service created${NC}"
fi

# Wait for service to be running
echo "Waiting for App Runner service to be ready..."
sleep 30

# Get service URL
SERVICE_ARN=$(aws apprunner list-services --region $AWS_REGION --query "ServiceSummaryList[?ServiceName=='$APP_RUNNER_SERVICE_NAME'].ServiceArn" --output text)
SERVICE_URL=$(aws apprunner describe-service --service-arn $SERVICE_ARN --region $AWS_REGION --query "Service.ServiceUrl" --output text)

echo -e "${GREEN}✅ App Runner service URL: https://$SERVICE_URL${NC}"

# Step 4: Set up custom domain (optional)
echo -e "${BLUE}4. Setting up custom domain...${NC}"

# Check if domain association exists
if aws apprunner list-custom-domains --service-arn $SERVICE_ARN --region $AWS_REGION --query "CustomDomains[?DomainName=='$DOMAIN']" --output text | grep -q $DOMAIN; then
    echo -e "${GREEN}✅ Custom domain already configured${NC}"
else
    echo "Creating custom domain association..."
    aws apprunner associate-custom-domain --service-arn $SERVICE_ARN --domain-name $DOMAIN --region $AWS_REGION
    echo -e "${YELLOW}⚠️  Domain association created. You need to add DNS records.${NC}"
fi

# Step 5: Update Route 53 DNS
echo -e "${BLUE}5. Updating Route 53 DNS...${NC}"

# Get hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='base2ml.com.'].Id" --output text | cut -d'/' -f3)

if [ ! -z "$HOSTED_ZONE_ID" ]; then
    # Get the App Runner domain validation records
    VALIDATION_RECORDS=$(aws apprunner describe-custom-domains --service-arn $SERVICE_ARN --region $AWS_REGION --query "CustomDomains[?DomainName=='$DOMAIN'].CertificateValidationRecords" --output json)
    
    echo "Hosted Zone ID: $HOSTED_ZONE_ID"
    echo -e "${YELLOW}⚠️  Please manually add the validation records to Route 53${NC}"
    echo "Validation records: $VALIDATION_RECORDS"
else
    echo -e "${RED}❌ Route 53 hosted zone not found for base2ml.com${NC}"
fi

# Step 6: Update frontend configuration
echo -e "${BLUE}6. Updating frontend configuration...${NC}"
cd frontend

# Update .env.production
if [ -f ".env.production" ]; then
    # Backup original
    cp .env.production .env.production.backup
    
    # Update API URL
    sed -i.bak "s|VITE_API_URL=.*|VITE_API_URL=https://$DOMAIN|g" .env.production
    rm .env.production.bak
    
    echo -e "${GREEN}✅ Updated .env.production${NC}"
else
    # Create new .env.production
    echo "VITE_API_URL=https://$DOMAIN" > .env.production
    echo -e "${GREEN}✅ Created .env.production${NC}"
fi

# Build and deploy frontend
echo "Building frontend..."
npm run build

echo "Deploying to S3..."
aws s3 sync dist/ s3://margojones.base2ml.com --delete

echo "Invalidating CloudFront cache..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items[0]=='margojones.base2ml.com'].Id" --output text)
if [ ! -z "$DISTRIBUTION_ID" ]; then
    aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
    echo -e "${GREEN}✅ CloudFront cache invalidated${NC}"
fi

cd ..

# Step 7: Clean up temporary files
echo -e "${BLUE}7. Cleaning up...${NC}"
rm -f apprunner.yaml app-runner-service.json

# Step 8: Test deployment
echo -e "${BLUE}8. Testing deployment...${NC}"

echo "Testing App Runner URL..."
if curl -f https://$SERVICE_URL/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ App Runner service health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  App Runner service not yet ready${NC}"
fi

# Final summary
echo ""
echo -e "${GREEN}🎉 AWS Deployment Summary:${NC}"
echo "==========================================="
echo -e "${GREEN}✅ ECR Repository:${NC} $ECR_REPO_NAME"
echo -e "${GREEN}✅ App Runner Service:${NC} $APP_RUNNER_SERVICE_NAME"
echo -e "${GREEN}✅ Service URL:${NC} https://$SERVICE_URL"
echo -e "${GREEN}✅ Custom Domain:${NC} https://$DOMAIN (pending DNS)"
echo -e "${GREEN}✅ Frontend:${NC} Updated and deployed"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Add DNS validation records to Route 53"
echo "2. Wait for SSL certificate validation (5-10 minutes)"
echo "3. Test API endpoints at https://$DOMAIN"
echo "4. Test full website functionality"
echo ""
echo -e "${BLUE}🧪 Test URLs:${NC}"
echo "  App Runner: https://$SERVICE_URL/health"
echo "  Custom Domain: https://$DOMAIN/health"
echo "  Website: https://margojones.base2ml.com"
echo ""
echo -e "${GREEN}🎊 AWS Deployment Complete!${NC}"
