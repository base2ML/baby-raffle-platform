# 🚀 Baby Raffle SaaS Platform - Complete Deployment Guide

## Platform Overview

Your complete Baby Raffle SaaS platform consists of 4 integrated applications:

1. **API Backend** (api.base2ml.com) - FastAPI with Stripe, OAuth, file uploads
2. **Marketing Site** (mybabyraffle.base2ml.com) - Next.js showcase site  
3. **Site Builder** (builder.base2ml.com) - React configuration app
4. **Tenant Sites** ({subdomain}.base2ml.com) - Generated customer sites

## 🎯 One-Command Deployment

```bash
cd baby-raffle-serverless/
./deploy-platform.sh
```

This script orchestrates the complete platform deployment including:
- ✅ Database setup and migrations
- ✅ API backend deployment with all extensions
- ✅ Marketing site deployment 
- ✅ Site builder deployment
- ✅ Tenant site template system
- ✅ DNS and SSL configuration guidance

## 📋 Prerequisites

### Required Tools
- **Git** - Version control
- **Node.js 18+** - Frontend applications
- **Python 3.11+** - Backend API (3.13 compatible but limited features)
- **Docker** - Containerization (optional)

### Required Services
- **PostgreSQL Database** - Production data storage
- **Google OAuth App** - User authentication
- **Apple OAuth App** - User authentication (optional)
- **Stripe Account** - Payment processing
- **AWS S3 Bucket** - File storage
- **Domain Access** - For base2ml.com DNS configuration

## ⚙️ Configuration

### 1. Environment Setup
The deployment script creates `.env.platform` with all required variables:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/baby_raffle_saas

# Authentication  
JWT_SECRET=your-secure-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Payments
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# File Storage
AWS_S3_BUCKET=baby-raffle-uploads
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
```

### 2. OAuth Applications

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://mybabyraffle.base2ml.com/auth/callback`
   - `https://builder.base2ml.com/auth/callback`

#### Apple OAuth Setup (Optional)
1. Go to [Apple Developer](https://developer.apple.com/)
2. Create Sign in with Apple service
3. Configure domains and redirect URIs
4. Download private key file

### 3. Stripe Configuration
1. Create [Stripe account](https://stripe.com/)
2. Get API keys from dashboard
3. Create webhook endpoint: `https://api.base2ml.com/api/billing/webhook`
4. Subscribe to events: `payment_intent.succeeded`, `invoice.payment_failed`

### 4. AWS S3 Setup
1. Create S3 bucket for file uploads
2. Configure CORS policy for web uploads
3. Set up CloudFront distribution (optional)
4. Create IAM user with S3 access

## 🏗️ Infrastructure Setup

### DNS Configuration
Configure these DNS records for base2ml.com:

```
A     api          → [API server IP]
A     mybabyraffle → [Marketing site IP/CDN]  
A     builder      → [Builder app IP/CDN]
CNAME *            → [Load balancer for tenant sites]
```

### SSL Certificates
- Obtain wildcard SSL certificate for `*.base2ml.com`
- Configure SSL termination in load balancer
- Enable automatic certificate renewal

### Load Balancer Rules
```nginx
# API Backend
server {
    server_name api.base2ml.com;
    location / {
        proxy_pass http://fastapi-backend:8000;
    }
}

# Marketing Site  
server {
    server_name mybabyraffle.base2ml.com;
    location / {
        proxy_pass http://marketing-site:3000;
    }
}

# Site Builder
server {
    server_name builder.base2ml.com;
    location / {
        proxy_pass http://site-builder:3000;
    }
}

# Tenant Sites (wildcard)
server {
    server_name ~^(?<subdomain>[^.]+)\.base2ml\.com$;
    location / {
        proxy_pass http://s3-bucket/sites/$subdomain/;
    }
}
```

## 🚀 Deployment Options

### Option 1: Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
cd fastapi-backend/
railway login
railway up

# Configure custom domain in Railway dashboard
```

### Option 2: Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or individual containers
cd fastapi-backend/
docker build -t baby-raffle-api .
docker run -p 8000:8000 --env-file .env baby-raffle-api
```

### Option 3: Traditional VPS
```bash
# Set up systemd service
sudo cp deployment/baby-raffle-api.service /etc/systemd/system/
sudo systemctl enable baby-raffle-api
sudo systemctl start baby-raffle-api
```

## 📊 Platform Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Marketing     │    │   Site Builder  │    │   API Backend   │
│   Next.js       │    │   React + Stripe│    │   FastAPI       │
│   mybabyraffle  │    │   builder       │    │   api           │
│   .base2ml.com  │    │   .base2ml.com  │    │   .base2ml.com  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Tenant Sites  │
                    │   Generated     │
                    │   React Apps    │
                    │   {sub}.base2ml │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Multi-tenant  │
                    │   with RLS      │
                    └─────────────────┘
```

## 🎯 User Flow

1. **Discovery**: Visit `mybabyraffle.base2ml.com` → Browse examples
2. **Registration**: Click "Create Your Own" → OAuth login
3. **Configuration**: Redirect to `builder.base2ml.com` → Configure site
4. **Payment**: Pay $20 + hosting months → Stripe processing  
5. **Deployment**: Automated site generation → Live at `{subdomain}.base2ml.com`
6. **Management**: Access admin features → Manage raffle and users

## 🧪 Testing

### API Testing
```bash
# Health check
curl https://api.base2ml.com/health

# Test subdomain availability  
curl https://api.base2ml.com/api/subdomains/check-availability/testsite

# Test file upload
curl -X POST -F "file=@test.jpg" https://api.base2ml.com/api/files/upload
```

### End-to-End Testing
1. Complete user registration flow
2. Build and configure a test site
3. Process test payment (use Stripe test mode)
4. Verify site deployment
5. Test betting functionality on deployed site

## 📈 Monitoring

### Health Checks
- API: `https://api.base2ml.com/health`
- Marketing: `https://mybabyraffle.base2ml.com/`
- Builder: `https://builder.base2ml.com/`

### Key Metrics
- User registrations per day
- Site deployments per day  
- Payment conversion rate
- Average revenue per user
- Site uptime and performance

## 🔒 Security

### API Security
- JWT token authentication
- Role-based access control
- Rate limiting per tenant
- Input validation and sanitization
- SQL injection protection

### Payment Security
- PCI compliance via Stripe
- Webhook signature verification  
- Secure token handling
- Payment intent validation

### File Security
- Type validation for uploads
- Size limits and scanning
- Secure S3 bucket policies
- Pre-signed URLs for access

## 💾 Backup & Recovery

### Database Backups
```bash
# Automated daily backups
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup  
psql $DATABASE_URL < backup-20240904.sql
```

### File Backups
- S3 versioning enabled
- Cross-region replication
- Regular backup validation

## 🚨 Troubleshooting

### Common Issues

1. **OAuth not working**
   - Check redirect URIs match exactly
   - Verify client ID/secret configuration
   - Check CORS settings

2. **Payments failing**
   - Verify Stripe webhook endpoints
   - Check webhook secret configuration
   - Test in Stripe dashboard

3. **Site deployments failing**
   - Check S3 permissions
   - Verify DNS configuration
   - Check build logs for errors

4. **Subdomain not accessible**
   - Verify DNS propagation (24-48 hours)
   - Check SSL certificate coverage
   - Test load balancer rules

### Support Contacts
- **Technical Issues**: support@base2ml.com
- **Payment Issues**: billing@base2ml.com  
- **Emergency**: Use admin dashboard alerts

## 🎉 Launch Checklist

### Pre-Launch
- [ ] All environment variables configured
- [ ] OAuth applications tested
- [ ] Stripe webhooks working
- [ ] S3 bucket and permissions set
- [ ] DNS records propagated
- [ ] SSL certificates active
- [ ] End-to-end flow tested

### Go-Live
- [ ] Marketing site live and optimized
- [ ] Site builder fully functional
- [ ] Payment processing tested
- [ ] Site deployment working
- [ ] Monitoring and alerts active
- [ ] Backup procedures tested

### Post-Launch
- [ ] Customer support processes
- [ ] Marketing campaigns active
- [ ] Performance monitoring
- [ ] Regular backup verification
- [ ] Security audit scheduled

Your Baby Raffle SaaS platform is now ready to serve customers and generate revenue! 🎊