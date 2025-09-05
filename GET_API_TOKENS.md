# 🔑 How to Get API Tokens for Automated Deployment

To use the automated deployment script (`auto-deploy-production.sh`), you need API tokens from Railway and Vercel.

## 🚂 Railway API Token

### Method 1: CLI (Mac Users)
```bash
# Login to Railway
railway login

# The token is stored in Railway's config file
# Check if you're logged in
railway whoami

# For Mac users, manually get token from dashboard (Method 2 below)
# CLI token extraction is complex due to Railway's storage method
```

### Method 1B: Mac CLI Token (Alternative)
```bash
# If you want to try extracting from config (advanced users)
ls -la ~/Library/Application\ Support/railway/
# Token is in the user.json file but requires parsing

# Simpler approach: Use dashboard method below
```

### Method 2: Dashboard (Recommended for Mac)
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click your profile (top right)
3. Go to "Account Settings"
4. Click "Tokens" tab
5. Create new token
6. Copy the token

## ▲ Vercel API Token

### Method 1: Dashboard (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your profile (top right)
3. Go to "Settings"
4. Click "Tokens" in sidebar
5. Click "Create Token"
6. Name it "Baby Raffle Deployment"
7. Set scope to your account
8. Click "Create"
9. Copy the token immediately (shown once)

### Method 2: CLI
```bash
# Login to Vercel (if not already)
vercel login

# Tokens are managed in dashboard only
```

## 📝 Add Tokens to .env.platform

Add these lines to your `.env.platform` file:

```env
# Deployment API Tokens
RAILWAY_TOKEN=your-railway-token-here
VERCEL_TOKEN=your-vercel-token-here

# Optional: Existing Railway Project ID (if you have one)
RAILWAY_PROJECT_ID=your-existing-project-id
```

## 🔒 Security Notes

- **Keep tokens secret** - Never commit to git
- **Use environment variables** - Don't hardcode in scripts
- **Rotate regularly** - Generate new tokens periodically
- **Scope appropriately** - Use minimum required permissions

## 📋 Complete .env.platform Template

Here's what your complete `.env.platform` should look like:

```env
# Domain Configuration
DOMAIN=base2ml.com
API_URL=https://api.base2ml.com
MARKETING_URL=https://mybabyraffle.base2ml.com
BUILDER_URL=https://builder.base2ml.com

# Database
DATABASE_URL=postgresql://user:pass@hostname:5432/baby_raffle_saas

# JWT Secret
JWT_SECRET=your-generated-jwt-secret

# Google OAuth
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_51ABCdef...
STRIPE_SECRET_KEY=sk_live_51ABCdef...
STRIPE_WEBHOOK_SECRET=whsec_1ABCdef...

# AWS S3
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=baby-raffle-uploads
AWS_REGION=us-east-1

# Deployment API Tokens (ADD THESE)
RAILWAY_TOKEN=your-railway-token-here
VERCEL_TOKEN=your-vercel-token-here

# Optional: Existing Railway Project
RAILWAY_PROJECT_ID=your-project-id-if-exists

# Platform Settings
ENVIRONMENT=production
LOG_LEVEL=info
CORS_ORIGINS=https://*.base2ml.com
```

## 🚀 Ready to Deploy

Once you have the tokens configured:

```bash
./auto-deploy-production.sh
```

The script will:
1. ✅ Load your `.env.platform` configuration
2. ✅ Deploy API to Railway using your token
3. ✅ Deploy frontends to Vercel using your token
4. ✅ Configure environment variables automatically
5. ✅ Generate DNS configuration
6. ✅ Create deployment summary

## 🔧 Troubleshooting

### "Authentication failed"
- Check token is correct and not expired
- Ensure token has required permissions
- Try regenerating the token

### "Project not found" 
- Remove `RAILWAY_PROJECT_ID` to create new project
- Or verify the project ID is correct

### "Deployment failed"
- Check environment variables are valid
- Ensure all required vars are set in `.env.platform`
- Check Railway/Vercel service status

Your automated deployment system is ready! 🎯