#!/bin/bash

# Deploy script for FastAPI Baby Raffle API

set -e

echo "🚀 Building and deploying Baby Raffle FastAPI..."

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t baby-raffle-api .

# Tag for registry (adjust registry URL as needed)
docker tag baby-raffle-api:latest registry.digitalocean.com/your-registry/baby-raffle-api:latest

# Push to registry
echo "📤 Pushing to registry..."
docker push registry.digitalocean.com/your-registry/baby-raffle-api:latest

echo "✅ Deployment complete!"
echo "📋 Next steps:"
echo "1. Update your DigitalOcean App to use the new image"
echo "2. Set up domain: api.margojones.base2ml.com"
echo "3. Update frontend API_URL to: https://api.margojones.base2ml.com"
