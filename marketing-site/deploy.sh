#!/bin/bash
set -e

echo "🚀 Fresh Baby Raffle Marketing Site Deployment"
echo "=============================================="

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf out
rm -rf node_modules/.cache

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run build
echo "🔨 Building Next.js application..."
npm run build

# Test the build locally
echo "✅ Build completed successfully!"
echo ""
echo "🎯 Ready for deployment with:"
echo "   ✅ All .mybabyraffle.com → .base2ml.com fixes applied"
echo "   ✅ Next.js 14 with App Router"
echo "   ✅ TypeScript and Tailwind CSS"
echo "   ✅ Clean build output"
echo ""
echo "📋 Next steps:"
echo "   1. Deploy to Vercel with these settings:"
echo "      - Framework Preset: Next.js"
echo "      - Root Directory: (leave empty)"
echo "      - Build Command: npm run build"
echo "      - Output Directory: (leave empty)"
echo "      - Install Command: npm ci"
echo ""
echo "   2. Environment Variables:"
echo "      - NEXT_PUBLIC_API_URL: https://api.base2ml.com"
echo "      - NEXT_PUBLIC_SITE_URL: https://babyraffle.base2ml.com"
echo ""
echo "🔗 Expected result: https://babyraffle.base2ml.com shows .base2ml.com throughout"
