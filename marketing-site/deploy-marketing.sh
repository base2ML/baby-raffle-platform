#!/bin/bash
set -e

echo "🚀 Starting marketing site deployment..."

# Build the site
echo "📦 Building Next.js site..."
npm run build

# Try railway deployment with timeout
echo "🚂 Deploying to Railway..."
timeout 120s railway up || echo "❌ Railway deployment timed out or failed"

# Check deployment status
echo "✅ Deployment script completed"
echo "🔍 Check https://babyraffle.base2ml.com to verify deployment"