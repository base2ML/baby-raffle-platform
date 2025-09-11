#!/bin/bash
set -e

echo "🚀 Automated Baby Raffle Marketing Site Deployment"
echo "================================================="

# Check if logged in to Vercel
if ! vercel whoami > /dev/null 2>&1; then
    echo "🔐 Please login to Vercel first..."
    vercel login
fi

echo "👤 Logged in as: $(vercel whoami)"

# Clean build
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf .vercel

# Set environment variables
echo "⚙️ Setting up environment variables..."
export NEXT_PUBLIC_API_URL="https://api.base2ml.com"
export NEXT_PUBLIC_SITE_URL="https://babyraffle.base2ml.com"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod \
  --build-env NEXT_PUBLIC_API_URL="https://api.base2ml.com" \
  --build-env NEXT_PUBLIC_SITE_URL="https://babyraffle.base2ml.com" \
  --force \
  --yes

echo ""
echo "✅ Deployment completed!"
echo "🌐 Your site should be live at: https://babyraffle.base2ml.com"
echo "🔧 All .mybabyraffle.com → .base2ml.com fixes are now live!"
echo ""
echo "📋 Next steps:"
echo "   1. Test the critical form field shows .base2ml.com"
echo "   2. Verify all gallery examples show .base2ml.com" 
echo "   3. Check that the site is fully functional"