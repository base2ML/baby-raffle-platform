# 🚀 Baby Raffle SaaS Deployment Guide

Complete guide to deploy your multi-tenant Baby Raffle platform to production.

## 🎯 Deployment Options

### Option 1: Railway (Recommended - Easiest)
- ✅ **Zero-config deployment** with Git integration
- ✅ **PostgreSQL database** included
- ✅ **Custom domains** and SSL certificates
- ✅ **Environment variables** management
- ✅ **Auto-scaling** and monitoring

### Option 2: Vercel + Supabase
- ✅ **Serverless** deployment
- ✅ **PostgreSQL** with Supabase
- ✅ **Global CDN** distribution
- ✅ **Custom domains** included

### Option 3: DigitalOcean App Platform
- ✅ **Container deployment**
- ✅ **Managed database** options
- ✅ **Load balancing**
- ✅ **Auto-scaling**

### Option 4: AWS/Google Cloud (Advanced)
- ✅ **Enterprise-grade** infrastructure
- ✅ **Custom scaling** configurations
- ✅ **Advanced monitoring**
- ✅ **Multiple regions**

---

## 🚀 Railway Deployment (Recommended)

### Step 1: Prepare Your Code

```bash
# Make sure you're in the project root
cd baby-raffle-serverless/

# Create production environment file
cp fastapi-backend/.env.example fastapi-backend/.env
```

### Step 2: Install Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Or with curl
curl -fsSL https://railway.app/install.sh | sh
```

### Step 3: Login and Initialize

```bash
# Login to Railway
railway login

# Navigate to backend directory
cd fastapi-backend/

# Initialize Railway project
railway init
```

### Step 4: Add PostgreSQL Database

```bash
# Add PostgreSQL service
railway add postgresql

# Get database URL (automatically added to environment)
railway variables
```

### Step 5: Configure Environment Variables

```bash
# Set essential environment variables
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set ENVIRONMENT=production
railway variables set PYTHON_VERSION=3.11

# Optional: Add OAuth credentials
railway variables set GOOGLE_CLIENT_ID=your-google-client-id
railway variables set GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Step 6: Deploy

```bash
# Deploy to Railway
railway up

# Get your deployment URL
railway status
```

### Step 7: Run Database Migration

```bash
# Connect to your Railway deployment and run migration
railway run python migrate_db.py
```

### Step 8: Configure Custom Domain (Optional)

```bash
# Add custom domain
railway domain add yourdomain.com

# Railway will provide DNS instructions
railway domains
```

---

## 🌐 Vercel + Supabase Deployment

### Step 1: Setup Supabase Database

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy connection string

### Step 2: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from backend directory
cd fastapi-backend/
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add ENVIRONMENT
```

### Step 3: Configure Vercel Settings

Create `vercel.json` in `fastapi-backend/`:

```json
{
  "builds": [
    {
      "src": "main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "main.py"
    }
  ]
}
```

---

## 🐳 Docker Deployment

### For Any Cloud Provider

```bash
cd fastapi-backend/

# Build production image
docker build -t baby-raffle-saas .

# Test locally
docker run -p 8000:8000 \
  -e DATABASE_URL=your-db-url \
  -e JWT_SECRET=your-secret \
  baby-raffle-saas

# Push to registry (Docker Hub, AWS ECR, etc.)
docker tag baby-raffle-saas your-registry/baby-raffle-saas
docker push your-registry/baby-raffle-saas
```

---

## 🔐 Production Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Security
JWT_SECRET=your-super-secure-secret-key-here
ENVIRONMENT=production

# OAuth (Optional but recommended)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APPLE_CLIENT_ID=your-apple-client-id
APPLE_CLIENT_SECRET=your-apple-client-secret

# CORS Origins
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### Generate Secure JWT Secret

```bash
# Generate a secure JWT secret
openssl rand -base64 32
# Or
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 🌍 Domain and SSL Setup

### Custom Domain Configuration

1. **Point DNS to your deployment**:
   ```
   Type: CNAME
   Name: api (for api.yourdomain.com)
   Value: your-deployment-url
   ```

2. **Configure SSL** (most platforms handle this automatically)

3. **Update CORS settings** in your environment variables

### Multi-Tenant Domain Setup

For full multi-tenant functionality:

```
Main API: api.yourdomain.com
Tenant sites: *.yourdomain.com (wildcard subdomain)
Admin panel: admin.yourdomain.com
```

---

## 📊 Production Monitoring

### Health Check Endpoints

Your deployment should respond to:
- `GET /health` - Basic health check
- `GET /metrics` - Application metrics (if implemented)

### Monitoring Setup

```bash
# Add monitoring services (optional)
# - Railway provides built-in monitoring
# - For others, consider: New Relic, DataDog, Sentry

# Example: Add Sentry for error tracking
pip install sentry-sdk[fastapi]
```

---

## 🔄 Continuous Deployment

### GitHub Actions (for any platform)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Deploy to Railway
      run: |
        npm install -g @railway/cli
        railway login --service-token ${{ secrets.RAILWAY_TOKEN }}
        cd fastapi-backend && railway up
```

### Railway Auto-Deploy

Railway automatically deploys on Git push:
```bash
# Connect GitHub repository
railway connect

# Every push to main branch auto-deploys
git push origin main
```

---

## 🧪 Pre-Deployment Checklist

### Security
- [ ] JWT_SECRET is secure and random
- [ ] Database credentials are secure
- [ ] CORS origins are properly configured
- [ ] OAuth credentials are set up
- [ ] Environment is set to 'production'

### Database
- [ ] PostgreSQL database is provisioned
- [ ] Database migrations run successfully
- [ ] Connection string is correct
- [ ] Backup strategy is in place

### Application
- [ ] Health check endpoint responds
- [ ] All API endpoints work correctly
- [ ] Error handling is implemented
- [ ] Logging is configured

### Domain & SSL
- [ ] Custom domain is configured (if applicable)
- [ ] SSL certificate is active
- [ ] DNS propagation is complete

---

## 🎉 Go Live Commands

### Quick Railway Deployment

```bash
# One-command deployment to Railway
cd fastapi-backend/
railway login
railway init
railway add postgresql  
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway up
railway run python migrate_db.py

# Get your live URL
railway status
```

### Verify Deployment

```bash
# Test your live API
curl https://your-deployment-url.railway.app/health
curl https://your-deployment-url.railway.app/api/tenant/validate-subdomain/test

# Expected: JSON responses confirming API is live
```

---

## 🛠️ Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check DATABASE_URL format
railway variables get DATABASE_URL
# Should be: postgresql://user:pass@host:port/dbname
```

**Build Failed**
```bash
# Check Python version
railway variables set PYTHON_VERSION=3.11
# Ensure requirements.txt is correct
```

**Health Check Failed**
```bash
# Check if server is running on correct port
railway logs
# Look for "Uvicorn running on..."
```

### Getting Help

- **Railway**: [railway.app/help](https://railway.app/help)
- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Project Issues**: Create issue in your repository

---

## 🚀 Your Baby Raffle SaaS is Now LIVE!

After deployment, your platform will be available with:
- ✅ **Multi-tenant architecture** with complete isolation
- ✅ **OAuth2 authentication** ready for users
- ✅ **Scalable infrastructure** that grows with demand
- ✅ **Production-ready** monitoring and security
- ✅ **Custom domain** capability
- ✅ **HTTPS/SSL** encryption

**Next Steps**: Build frontend applications, configure OAuth providers, and start onboarding tenants! 🎊