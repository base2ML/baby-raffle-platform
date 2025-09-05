# 🚀 Production Deployment Guide

## 🎯 Your Platform is Ready - Here's How to Go Live!

Your Baby Raffle SaaS platform is built and tested locally. Now let's deploy it to production domains.

## 📋 Pre-Deployment Checklist

- ✅ Local platform tested and working
- ✅ `.env.platform` configured with real credentials
- ✅ Railway CLI and Vercel CLI installed
- ⏳ Need to login to deployment services
- ⏳ Need to configure DNS records

## 🚀 Step 1: Deploy API Backend to Railway

```bash
# Navigate to backend directory
cd fastapi-backend/

# Login to Railway (opens browser)
railway login

# Create new Railway project
railway new

# Deploy the API
railway up

# Set environment variables
railway variables set DATABASE_URL="your-postgres-url"
railway variables set JWT_SECRET="your-jwt-secret"
railway variables set GOOGLE_CLIENT_ID="your-google-client-id"
railway variables set GOOGLE_CLIENT_SECRET="your-google-client-secret"
railway variables set STRIPE_SECRET_KEY="your-stripe-secret"
railway variables set STRIPE_WEBHOOK_SECRET="your-webhook-secret"
railway variables set AWS_ACCESS_KEY_ID="your-aws-key"
railway variables set AWS_SECRET_ACCESS_KEY="your-aws-secret"
railway variables set AWS_S3_BUCKET="your-bucket-name"

# Get your API URL
railway status
```

## 🌐 Step 2: Deploy Marketing Site to Vercel

```bash
# Navigate to marketing site
cd ../marketing-site/

# Login to Vercel (opens browser)
vercel login

# Deploy to production
vercel --prod

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_API_URL = your-railway-api-url
# NEXT_PUBLIC_BUILDER_URL = https://builder.base2ml.com
```

## 🔧 Step 3: Deploy Site Builder to Vercel

```bash
# Navigate to site builder
cd ../site-builder/

# Deploy to production
vercel --prod

# Set environment variables in Vercel dashboard:
# VITE_API_BASE_URL = your-railway-api-url
# VITE_STRIPE_PUBLISHABLE_KEY = your-stripe-publishable-key
```

## 🌍 Step 4: Configure DNS Records

In your domain provider (where you registered base2ml.com), add these DNS records:

```dns
Type    Name                Value
----    ----                -----
CNAME   mybabyraffle       [vercel-marketing-url].vercel.app
CNAME   builder            [vercel-builder-url].vercel.app  
CNAME   api                [railway-api-url].railway.app
CNAME   *                  [load-balancer-for-tenant-sites]
```

## 🧪 Step 5: Test Production Deployment

```bash
# Test API
curl https://api.base2ml.com/health

# Test Marketing Site
curl https://mybabyraffle.base2ml.com

# Test Site Builder  
curl https://builder.base2ml.com

# Test Subdomain Check
curl https://api.base2ml.com/api/subdomains/check-availability/test
```

## 🎉 Step 6: Go Live!

Once DNS propagates (24-48 hours), your platform will be live at:

- **Marketing**: https://mybabyraffle.base2ml.com
- **Site Builder**: https://builder.base2ml.com
- **API**: https://api.base2ml.com
- **Docs**: https://api.base2ml.com/docs

## 📞 Interactive Deployment Script

Run this for guided deployment:

```bash
./deploy-to-production.sh
```

## 🔐 Security Notes

- Keep all API keys secure
- Enable 2FA on Railway and Vercel accounts
- Set up monitoring and alerts
- Configure SSL certificates (automatic with Vercel/Railway)

## 💡 Pro Tips

1. **Start with Staging**: Deploy to staging URLs first
2. **Test Payments**: Use Stripe test mode initially
3. **Monitor Logs**: Check Railway and Vercel logs for issues
4. **Backup Data**: Set up database backups
5. **DNS Propagation**: Can take 24-48 hours globally

Your platform is production-ready - just needs the final deployment push! 🚀