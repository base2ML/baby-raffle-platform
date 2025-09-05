# 🚂 Railway Manual Deployment Guide

Since Railway CLI requires interactive mode, here's how to deploy manually:

## Quick Deployment Steps

### 1. Create Railway Project
1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Connect to your GitHub repo (if not already connected)
5. Select this repository
6. Railway will auto-detect it's a Python app

### 2. Configure Build Settings
- **Build Command**: `pip install -r requirements-simple.txt`
- **Start Command**: `python simple_api.py`
- **Root Directory**: `fastapi-backend`

### 3. Set Environment Variables
In Railway dashboard, go to Variables tab and add:

```
PORT=8000
DATABASE_URL=postgresql://user:pass@hostname:5432/baby_raffle_saas
JWT_SECRET=your-generated-jwt-secret
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
STRIPE_PUBLISHABLE_KEY=pk_live_51ABCdef...
STRIPE_SECRET_KEY=sk_live_51ABCdef...
STRIPE_WEBHOOK_SECRET=whsec_1ABCdef...
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=baby-raffle-uploads
AWS_REGION=us-east-1
CORS_ORIGINS=https://*.base2ml.com,https://*.vercel.app
```

### 4. Deploy
1. Click "Deploy" in Railway
2. Wait for deployment to complete
3. Copy the generated Railway URL (e.g., `https://your-app.railway.app`)

## 🎯 Current Status

✅ **Marketing Site**: https://baby-raffle-marketing-j0scnt4s2-slimhindrances-projects.vercel.app
✅ **Site Builder**: https://baby-raffle-builder-hivagvvpb-slimhindrances-projects.vercel.app

⏳ **API Backend**: Needs manual Railway deployment

## ⚡ Quick Alternative: Use Existing API

Your marketing site and site builder are already working! They can temporarily use the local API for development, or you can:

1. Deploy to Railway manually using the guide above
2. Update the frontend environment variables to point to the new Railway URL

## 🔧 After Railway Deployment

1. Update marketing site environment variables in Vercel:
   - `NEXT_PUBLIC_API_URL` → Your Railway URL
   
2. Update site builder environment variables in Vercel:
   - `VITE_API_BASE_URL` → Your Railway URL

Your Baby Raffle SaaS platform will then be fully live! 🚀