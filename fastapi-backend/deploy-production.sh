#!/bin/bash

# Production Deployment Script for Baby Raffle Site Builder
echo "🚀 Starting production deployment..."

# Check if required environment variables are set
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Copy .env.production to .env and configure it."
    exit 1
fi

# Verify required environment variables
source .env
if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ] || [ -z "$JWT_SECRET" ]; then
    echo "❌ Error: Missing required environment variables. Check your .env file."
    exit 1
fi

echo "✅ Environment configuration validated"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.production.yml down

# Pull latest images
echo "📦 Pulling latest images..."
docker-compose -f docker-compose.production.yml pull

# Build application
echo "🏗️ Building application..."
docker-compose -f docker-compose.production.yml build --no-cache

# Start services
echo "🔄 Starting services..."
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check health
echo "🩺 Checking service health..."
if docker-compose -f docker-compose.production.yml ps | grep -q "healthy"; then
    echo "✅ Services are healthy"
else
    echo "⚠️ Some services may not be fully ready. Check logs:"
    docker-compose -f docker-compose.production.yml logs --tail=50
fi

# Run database migrations (if needed)
echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.production.yml exec -T api python -c "
import sqlite3
import os
if not os.path.exists('baby_raffle.db'):
    from production_server import init_db
    init_db()
    print('Database initialized')
else:
    print('Database already exists')
"

# Test API endpoints
echo "🧪 Testing API endpoints..."
API_URL="http://localhost:8000"

# Test health endpoint
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Health endpoint: OK"
else
    echo "❌ Health endpoint failed: $HEALTH_RESPONSE"
fi

# Test themes endpoint
THEMES_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/builder/themes")
if [ "$THEMES_RESPONSE" = "200" ]; then
    echo "✅ Themes endpoint: OK"
else
    echo "❌ Themes endpoint failed: $THEMES_RESPONSE"
fi

# Test packages endpoint
PACKAGES_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/packages")
if [ "$PACKAGES_RESPONSE" = "200" ]; then
    echo "✅ Packages endpoint: OK"
else
    echo "❌ Packages endpoint failed: $PACKAGES_RESPONSE"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📍 Service URLs:"
echo "  API: http://localhost:8000"
echo "  Docs: http://localhost:8000/docs"
echo "  Health: http://localhost:8000/health"
echo ""
echo "🔧 Management commands:"
echo "  View logs: docker-compose -f docker-compose.production.yml logs -f"
echo "  Stop services: docker-compose -f docker-compose.production.yml down"
echo "  Restart: docker-compose -f docker-compose.production.yml restart"
echo ""
echo "📋 Next steps for production:"
echo "  1. Set up your domain DNS to point to this server"
echo "  2. Configure SSL certificates with certbot"
echo "  3. Update CORS origins in production_server.py"
echo "  4. Set up monitoring and backups"
echo "  5. Configure your Google OAuth app with production URLs"
echo ""

# Show container status
docker-compose -f docker-compose.production.yml ps