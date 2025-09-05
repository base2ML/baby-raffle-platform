# Baby Raffle SaaS Platform Design

## System Overview

Transform the existing baby raffle application into a multi-tenant SaaS platform where users can create and deploy their own baby raffle sites at custom subdomains on base2ml.com.

## Architecture Components

### 1. Core API Backend (api.base2ml.com)
**Status**: ✅ Mostly Complete - Needs Extensions
- **Current**: FastAPI with multi-tenant architecture, OAuth2, user/tenant management
- **Extensions Needed**:
  - Stripe payment integration
  - File upload endpoints for images
  - Site configuration storage
  - Deployment trigger endpoints
  - Subscription billing management

### 2. Marketing Site (mybabyraffle.base2ml.com) 
**Status**: 🆕 New Component Required
- **Purpose**: Showcase examples, drive signups
- **Tech Stack**: Next.js/React with static generation
- **Features**:
  - Gallery of example baby raffle sites
  - Pricing information ($20 setup + $10/month)
  - Call-to-action to create own site
  - OAuth login integration

### 3. Site Builder (builder.base2ml.com)
**Status**: 🆕 New Component Required  
- **Purpose**: Post-login site configuration interface
- **Tech Stack**: React with Stripe Elements
- **Features**:
  - Step-by-step site configuration wizard
  - Subdomain availability checker
  - Image upload for slideshow
  - Parent information forms
  - Venmo account configuration
  - Admin password setup
  - Real-time site preview
  - Payment integration
  - Deployment status tracking

### 4. Generated Tenant Sites ({subdomain}.base2ml.com)
**Status**: 🔄 Template System Required
- **Purpose**: Customer-facing baby raffle sites
- **Tech Stack**: Generated React builds from templates
- **Features**:
  - Tenant-specific branding and content
  - Slideshow with uploaded images
  - Betting interface
  - Real-time statistics
  - Mobile-responsive design

## User Journey Flow

```
1. Visit mybabyraffle.base2ml.com
   ↓
2. Browse examples, see pricing
   ↓  
3. Click "Create Your Own" → OAuth login
   ↓
4. Redirect to builder.base2ml.com
   ↓
5. Configure site (subdomain, content, images)
   ↓
6. Preview site, click "Deploy"
   ↓
7. Payment screen: $20 + ($10 × months)
   ↓
8. Payment success → Site deployed to subdomain
   ↓
9. Receive confirmation with site URL
```

## Technical Implementation

### Database Schema Extensions

```sql
-- Billing and payments
CREATE TABLE billing_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Site configuration and deployment
CREATE TABLE site_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) UNIQUE,
    slideshow_images JSONB,
    parent_info JSONB,
    venmo_account VARCHAR(255),
    admin_password_hash VARCHAR(255),
    custom_branding JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    subdomain VARCHAR(63) NOT NULL,
    deployment_status VARCHAR(50) NOT NULL,
    build_id VARCHAR(255),
    deployed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints Extensions

```python
# Payment endpoints
POST /api/billing/create-payment-intent
POST /api/billing/confirm-payment
POST /api/billing/webhook
GET /api/billing/subscription-status

# Site configuration endpoints
POST /api/site/upload-image
PUT /api/site/config
GET /api/site/config
POST /api/site/deploy
GET /api/site/deployment-status

# Subdomain management
GET /api/subdomains/check-availability/{subdomain}
POST /api/subdomains/reserve
```

### Infrastructure Requirements

#### DNS & SSL
- **Wildcard DNS**: `*.base2ml.com` pointing to load balancer
- **SSL**: Let's Encrypt wildcard certificate
- **CDN**: CloudFlare for static site delivery

#### Application Hosting
- **API**: Railway/Heroku for FastAPI backend
- **Marketing Site**: Vercel/Netlify for static Next.js site
- **Site Builder**: Vercel/Netlify for React SPA
- **Tenant Sites**: S3 + CloudFront or Netlify for generated static sites

#### File Storage
- **Images**: S3 bucket with CloudFront CDN
- **Structure**: `/tenants/{tenant_id}/images/{filename}`
- **Processing**: Image optimization and resizing on upload

#### Database
- **Primary**: PostgreSQL with Row-Level Security for tenant isolation
- **Backup**: Automated daily backups
- **Scaling**: Read replicas for high-traffic scenarios

## Pricing Strategy

### Customer Pricing
- **Setup Fee**: $20 (one-time)
- **Hosting**: $10/month
- **Minimum**: 1 month ($30 total)
- **Maximum**: 24 months ($260 total)
- **Payment**: Full amount upfront

### Cost Analysis
- **Hosting**: ~$2-5/month per site (CDN + storage)
- **Database**: Shared PostgreSQL instance
- **Processing**: Minimal compute for static sites
- **Margin**: ~60-75% after costs

## Security Considerations

### Data Protection
- **Tenant Isolation**: Row-Level Security in PostgreSQL
- **File Access**: Pre-signed URLs for uploaded images
- **Authentication**: OAuth2 with JWT tokens
- **API Security**: Rate limiting, CORS, input validation

### Payment Security
- **PCI Compliance**: Stripe handles all card data
- **Webhook Security**: Stripe signature verification
- **Subscription Security**: Server-side validation of all payments

## Deployment Script Phases

### Phase 1: Infrastructure Setup
1. Create PostgreSQL database
2. Configure environment variables
3. Set up OAuth applications
4. Configure Stripe account and webhooks

### Phase 2: Application Deployment  
1. Deploy API backend with extensions
2. Deploy marketing site
3. Deploy site builder application
4. Set up tenant site template repository

### Phase 3: DNS & SSL Configuration
1. Configure wildcard DNS
2. Set up SSL certificates
3. Configure load balancer/proxy
4. Test subdomain routing

### Phase 4: Validation & Monitoring
1. End-to-end flow testing
2. Payment flow validation
3. Site deployment testing
4. Set up monitoring and alerts

This provides a comprehensive roadmap for implementing the SaaS platform transformation.