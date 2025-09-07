#!/bin/bash
set -e

echo "🚀 Force Railway Deployment Script"

echo "📦 Building production site..."
npm run build

echo "🔄 Force git push with empty commit..."
git commit --allow-empty -m "Force Railway redeploy - Fix domain references"
git push origin platform

echo "🚂 Manual Railway up with specific environment..."
RAILWAY_ENVIRONMENT=production railway up --detach || echo "Railway command failed but continuing..."

echo "✅ Deployment commands completed"
echo "🔍 Please check https://babyraffle.base2ml.com in a few minutes"