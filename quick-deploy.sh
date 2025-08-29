#!/bin/bash

# 🚀 Quick Deploy Script - Railway Alternative
# If Railway doesn't work, this uses Render.com

set -e

echo "🚀 Quick Deploy to Render.com"
echo "=============================="

# Navigate to backend
cd fastapi-backend

# Create Render deployment files
cat > render.yaml << EOF
services:
  - type: web
    name: baby-raffle-api
    env: docker
    dockerfilePath: ./Dockerfile
    plan: free
    envVars:
      - key: DB_HOST
        value: margojones-babyraffle-db.cu1y2a26idsb.us-east-1.rds.amazonaws.com
      - key: DB_PORT
        value: 5432
      - key: DB_NAME
        value: babyraffle
      - key: DB_USERNAME
        value: postgres
      - key: DB_PASSWORD
        sync: false
    healthCheckPath: /health
EOF

echo "✅ Created render.yaml"
echo ""
echo "📋 Next Steps:"
echo "1. Push this code to GitHub"
echo "2. Go to render.com and create account"
echo "3. Connect GitHub repo"
echo "4. Deploy as Docker service"
echo "5. Set DB_PASSWORD environment variable in Render dashboard"
echo "6. Set custom domain: api.margojones.base2ml.com"
echo ""
echo "🔗 GitHub repo should include:"
echo "  - fastapi-backend/ directory"
echo "  - render.yaml file"
echo ""
echo "💡 Alternative: Use the main deploy-api.sh script for Railway deployment"
