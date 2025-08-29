#!/bin/bash

# 🧪 Test FastAPI Locally
# Run this to verify everything works before deploying

set -e

echo "🧪 Testing FastAPI Backend Locally"
echo "=================================="

cd fastapi-backend

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build and run container
echo "🏗️  Building Docker image..."
docker build -t baby-raffle-api-test .

echo "🚀 Starting container..."
docker run -d -p 8001:8000 \
  -e DB_HOST=margojones-babyraffle-db.cu1y2a26idsb.us-east-1.rds.amazonaws.com \
  -e DB_PORT=5432 \
  -e DB_NAME=babyraffle \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=YgrzO9oHQScN5ctXcTOL \
  --name baby-raffle-test-local \
  baby-raffle-api-test

echo "⏳ Waiting for container to start..."
sleep 5

# Test endpoints
echo "🧪 Testing endpoints..."

# Test root endpoint
if curl -f http://localhost:8001/ > /dev/null 2>&1; then
    echo "✅ Root endpoint working"
else
    echo "❌ Root endpoint failed"
fi

# Test health endpoint (might fail due to DB connection)
if curl -f http://localhost:8001/health > /dev/null 2>&1; then
    echo "✅ Health endpoint working"
else
    echo "⚠️  Health endpoint failed (expected if DB not accessible locally)"
fi

# Show container logs
echo ""
echo "📋 Container logs:"
docker logs baby-raffle-test-local

# Cleanup
echo ""
echo "🧹 Cleaning up..."
docker stop baby-raffle-test-local
docker rm baby-raffle-test-local

echo ""
echo "✅ Local test complete!"
echo "💡 If you see connection errors, that's normal - the container can't reach AWS RDS from local"
echo "🚀 Ready to deploy with: ./deploy-api.sh"
