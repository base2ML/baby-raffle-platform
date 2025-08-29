#!/bin/bash
# Safe Rebuild Commands for Pinegrow Changes

echo "🛡️ SAFE REBUILD PROCESS"
echo "========================"

echo "📁 Current directory: $(pwd)"
echo ""

echo "🔒 Step 1: Create Backup (Safety Net)"
echo "cp -r frontend frontend-backup-$(date +%Y%m%d_%H%M%S)"
echo ""

echo "🧪 Step 2: Test React Version Locally (Zero Risk to Live Site)"
echo "cd frontend"
echo "npm run dev"
echo "# Test at http://localhost:5173"
echo "# Verify everything works before proceeding"
echo ""

echo "🔨 Step 3: Build for Production (Still Safe)"
echo "npm run build"
echo "# This creates dist/ folder but doesn't deploy yet"
echo ""

echo "🚀 Step 4: Deploy to Live Site (Only when ready)"
echo "aws s3 sync dist/ s3://margojones-base2ml-com-baby-raffle --delete"
echo "aws cloudfront create-invalidation --distribution-id ERMQR087RJQMW --paths '/*'"
echo ""

echo "🚨 Emergency Rollback (If something goes wrong)"
echo "rm -rf frontend"
echo "cp -r frontend-backup-[TIMESTAMP] frontend"
echo "cd frontend && npm run build"
echo "aws s3 sync dist/ s3://margojones-base2ml-com-baby-raffle --delete"
echo ""

echo "✅ Your live site is safe until Step 4!"
echo "Edit Pinegrow freely - test locally - deploy when confident"
