#!/bin/bash

# 🚀 Simple AWS Deployment - ECS Fargate
# Alternative to App Runner using ECS Fargate

set -e

echo "🚀 Deploy FastAPI to AWS ECS Fargate"
echo "===================================="

# Configuration
AWS_REGION="us-east-1"
CLUSTER_NAME="baby-raffle-cluster"
SERVICE_NAME="baby-raffle-api"
TASK_FAMILY="baby-raffle-task"
ECR_REPO="baby-raffle-api"
DOMAIN="api.margojones.base2ml.com"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO"

echo "Account: $ACCOUNT_ID"
echo "ECR: $ECR_URI"
echo ""

# 1. Create ECR and push image
echo "1. Setting up ECR..."
aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION 2>/dev/null || true
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI

cd fastapi-backend
docker build -t $ECR_REPO .
docker tag $ECR_REPO:latest $ECR_URI:latest
docker push $ECR_URI:latest
cd ..

echo "✅ Image pushed to ECR"

# 2. Create ECS cluster
echo "2. Creating ECS cluster..."
aws ecs create-cluster --cluster-name $CLUSTER_NAME --capacity-providers FARGATE --region $AWS_REGION 2>/dev/null || true

# 3. Create task definition
cat > task-definition.json << EOF
{
  "family": "$TASK_FAMILY",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::$ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "baby-raffle-api",
      "image": "$ECR_URI:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "DB_HOST", "value": "margojones-babyraffle-db.cu1y2a26idsb.us-east-1.rds.amazonaws.com"},
        {"name": "DB_PORT", "value": "5432"},
        {"name": "DB_NAME", "value": "babyraffle"},
        {"name": "DB_USERNAME", "value": "postgres"},
        {"name": "DB_PASSWORD", "value": "YgrzO9oHQScN5ctXcTOL"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/$TASK_FAMILY",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# Create log group
aws logs create-log-group --log-group-name "/ecs/$TASK_FAMILY" --region $AWS_REGION 2>/dev/null || true

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json --region $AWS_REGION

echo "✅ Task definition registered"

# 4. Get VPC and subnet info (reuse existing)
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=*database*" --query "Vpcs[0].VpcId" --output text --region $AWS_REGION)
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Name,Values=*Public*" --query "Subnets[*].SubnetId" --output text --region $AWS_REGION)
SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=*database*" --query "SecurityGroups[0].GroupId" --output text --region $AWS_REGION)

echo "VPC: $VPC_ID"
echo "Subnets: $SUBNET_IDS"
echo "Security Group: $SECURITY_GROUP_ID"

# 5. Create ECS service
cat > service-definition.json << EOF
{
  "serviceName": "$SERVICE_NAME",
  "cluster": "$CLUSTER_NAME",
  "taskDefinition": "$TASK_FAMILY",
  "desiredCount": 1,
  "launchType": "FARGATE",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": ["$(echo $SUBNET_IDS | cut -d' ' -f1)"],
      "securityGroups": ["$SECURITY_GROUP_ID"],
      "assignPublicIp": "ENABLED"
    }
  }
}
EOF

aws ecs create-service --cli-input-json file://service-definition.json --region $AWS_REGION 2>/dev/null || \
aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --task-definition $TASK_FAMILY --region $AWS_REGION

echo "✅ ECS service created/updated"

# 6. Wait for service to be running
echo "Waiting for service to be ready..."
aws ecs wait services-stable --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION

# 7. Get public IP
TASK_ARN=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name $SERVICE_NAME --query "taskArns[0]" --output text --region $AWS_REGION)
ENI_ID=$(aws ecs describe-tasks --cluster $CLUSTER_NAME --tasks $TASK_ARN --query "tasks[0].attachments[0].details[?name=='networkInterfaceId'].value" --output text --region $AWS_REGION)
PUBLIC_IP=$(aws ec2 describe-network-interfaces --network-interface-ids $ENI_ID --query "NetworkInterfaces[0].Association.PublicIp" --output text --region $AWS_REGION)

echo ""
echo "✅ Service deployed!"
echo "Public IP: $PUBLIC_IP"
echo "Test URL: http://$PUBLIC_IP:8000/health"
echo ""
echo "🔗 To set up domain:"
echo "1. Create Route 53 A record: $DOMAIN -> $PUBLIC_IP"
echo "2. Set up ALB for SSL (optional)"

# Cleanup
rm -f task-definition.json service-definition.json

echo ""
echo "🎉 ECS Fargate deployment complete!"
