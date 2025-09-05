# Baby Raffle SaaS - API Extensions Documentation

This document describes the new API endpoints added for Stripe payment integration, file uploads, and site configuration management.

## Table of Contents

1. [Payment and Billing Endpoints](#payment-and-billing-endpoints)
2. [File Upload Endpoints](#file-upload-endpoints)
3. [Slideshow Management](#slideshow-management)
4. [Site Configuration](#site-configuration)
5. [Deployment Management](#deployment-management)
6. [Environment Variables](#environment-variables)
7. [Database Schema Changes](#database-schema-changes)

## Payment and Billing Endpoints

### Create Payment Intent
**POST** `/api/payments/create-intent`

Create a Stripe PaymentIntent for setup fees.

**Authorization**: Admin+ required
**Request Body**:
```json
{
  "amount": 20.00,
  "currency": "usd",
  "description": "Setup fee for Baby Raffle",
  "metadata": {
    "tenant_id": "tenant-123",
    "setup_type": "initial"
  }
}
```

**Response**:
```json
{
  "id": "payment-intent-123",
  "client_secret": "pi_1234_secret_5678",
  "amount": 20.00,
  "currency": "usd",
  "status": "pending",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Create Subscription
**POST** `/api/subscriptions/create`

Create a Stripe subscription for ongoing billing.

**Authorization**: Admin+ required
**Request Body**:
```json
{
  "plan": "basic",
  "payment_method_id": "pm_1234567890",
  "trial_days": 14
}
```

**Response**:
```json
{
  "id": "subscription-123",
  "tenant_id": "tenant-123",
  "stripe_subscription_id": "sub_1234567890",
  "plan": "basic",
  "status": "active",
  "current_period_start": "2024-01-01T00:00:00Z",
  "current_period_end": "2024-02-01T00:00:00Z",
  "trial_end": "2024-01-15T00:00:00Z",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Get Current Subscription
**GET** `/api/subscriptions/current`

Get the tenant's active subscription.

**Authorization**: User+ required
**Response**: Same as Create Subscription response, or `null` if no active subscription.

### Create Billing Portal Session
**POST** `/api/billing/portal`

Create a Stripe Customer Portal session for subscription management.

**Authorization**: Admin+ required
**Request Body**:
```json
{
  "return_url": "https://yoursite.base2ml.com/billing"
}
```

**Response**:
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

### Get Pricing Configuration
**GET** `/api/payments/pricing`

Get current pricing plans and configuration.

**Authorization**: None required
**Response**:
```json
{
  "trial": {
    "setup_fee": 0.00,
    "monthly_fee": 0.00,
    "stripe_price_id": null,
    "trial_days": 14
  },
  "basic": {
    "setup_fee": 20.00,
    "monthly_fee": 10.00,
    "stripe_price_id": "price_1234567890",
    "trial_days": 0
  },
  "premium": {
    "setup_fee": 50.00,
    "monthly_fee": 25.00,
    "stripe_price_id": "price_0987654321",
    "trial_days": 0
  }
}
```

### Stripe Webhook Handler
**POST** `/api/webhooks/stripe`

Handle Stripe webhook events for payment processing.

**Headers**: `stripe-signature` required
**Request Body**: Raw Stripe webhook payload

## File Upload Endpoints

### Upload File
**POST** `/api/files/upload`

Upload an image file for slideshow or other purposes.

**Authorization**: Admin+ required
**Content-Type**: `multipart/form-data`
**Form Data**:
- `file`: Image file (JPEG, PNG, GIF, WebP, max 10MB)

**Response**:
```json
{
  "id": "file-123",
  "filename": "abc123.jpg",
  "original_filename": "baby_photo.jpg",
  "url": "https://api.base2ml.com/files/images/tenant-123/abc123.jpg",
  "size": 1024576,
  "content_type": "image/jpeg",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Get Files
**GET** `/api/files`

Get all uploaded files for the tenant.

**Authorization**: User+ required
**Query Parameters**:
- `limit`: Number of files to return (default: 50)
- `offset`: Number of files to skip (default: 0)

**Response**: Array of file objects (same structure as upload response)

### Delete File
**DELETE** `/api/files/{file_id}`

Delete an uploaded file and remove it from any slideshows.

**Authorization**: Admin+ required
**Response**:
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

## Slideshow Management

### Add to Slideshow
**POST** `/api/slideshow/add`

Add an uploaded image to the slideshow.

**Authorization**: Admin+ required
**Content-Type**: `application/x-www-form-urlencoded`
**Form Data**:
- `file_id`: ID of uploaded file (required)
- `title`: Image title (optional)
- `caption`: Image caption (optional)
- `display_order`: Display order (default: 0)
- `is_active`: Whether image is active (default: true)

**Response**:
```json
{
  "id": "slideshow-123",
  "tenant_id": "tenant-123",
  "file_id": "file-123",
  "title": "Baby's First Smile",
  "caption": "Such a happy moment!",
  "display_order": 1,
  "is_active": true,
  "url": "https://api.base2ml.com/files/images/tenant-123/abc123.jpg",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Get Slideshow Images
**GET** `/api/slideshow`

Get all active slideshow images for the tenant.

**Authorization**: Tenant context required
**Response**: Array of slideshow image objects

### Update Slideshow Image
**PUT** `/api/slideshow/{slideshow_id}`

Update slideshow image details.

**Authorization**: Admin+ required
**Form Data**: Same as Add to Slideshow
**Response**: Updated slideshow image object

### Remove from Slideshow
**DELETE** `/api/slideshow/{slideshow_id}`

Remove image from slideshow (keeps the uploaded file).

**Authorization**: Admin+ required
**Response**:
```json
{
  "success": true,
  "message": "Image removed from slideshow"
}
```

## Site Configuration

### Get Site Configuration
**GET** `/api/site-config`

Get current site configuration for the tenant.

**Authorization**: Tenant context required
**Response**:
```json
{
  "id": "config-123",
  "tenant_id": "tenant-123",
  "config": {
    "site_title": "John & Jane's Baby Raffle",
    "welcome_message": "Welcome to our baby raffle!",
    "primary_color": "#2196f3",
    "secondary_color": "#f50057",
    "logo_url": "https://api.base2ml.com/files/images/tenant-123/logo.jpg",
    "enable_slideshow": true,
    "max_bets_per_user": 10,
    "google_analytics_id": "GA-123456789"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Update Site Configuration
**PUT** `/api/site-config`

Update site configuration settings.

**Authorization**: Admin+ required
**Request Body**:
```json
{
  "site_title": "Updated Baby Raffle",
  "primary_color": "#ff5722",
  "enable_slideshow": false,
  "meta_description": "Join our exciting baby raffle!"
}
```

**Response**: Updated site configuration object

### Get Site Preview Data
**GET** `/api/site-config/preview`

Get all data needed for site preview/rendering.

**Authorization**: Tenant context required
**Response**:
```json
{
  "config": { /* site configuration */ },
  "tenant": {
    "subdomain": "johnbaby",
    "name": "John & Jane's Baby Raffle",
    "owner_email": "john@example.com"
  },
  "categories": [ /* raffle categories with stats */ ],
  "slideshow_images": [ /* active slideshow images */ ],
  "deployment_url": "https://johnbaby.base2ml.com"
}
```

## Deployment Management

### Trigger Deployment
**POST** `/api/deploy`

Trigger a site deployment/rebuild.

**Authorization**: Admin+ required
**Request Body**:
```json
{
  "force_rebuild": false,
  "config_only": true
}
```

**Response**:
```json
{
  "id": "deployment-123",
  "tenant_id": "tenant-123",
  "status": "success",
  "deployment_url": "https://johnbaby.base2ml.com",
  "build_log": "Deployment completed successfully",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Get Deployment History
**GET** `/api/deployments`

Get deployment history for the tenant.

**Authorization**: Admin+ required
**Query Parameters**:
- `limit`: Number of deployments to return (default: 20)

**Response**: Array of deployment objects

## Environment Variables

Add these to your `.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_endpoint_secret
STRIPE_BASIC_PRICE_ID=price_your_basic_plan_price_id
STRIPE_PREMIUM_PRICE_ID=price_your_premium_plan_price_id

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes
BASE_URL=https://api.base2ml.com

# Deployment Configuration
DEPLOYMENT_WEBHOOK_URL=https://your-deployment-service.com/webhook
BASE_DOMAIN=base2ml.com
```

## Database Schema Changes

The following tables have been added:

### payments
- `id`: Primary key
- `tenant_id`: Foreign key to tenants
- `stripe_payment_intent_id`: Stripe PaymentIntent ID
- `amount`: Payment amount
- `currency`: Payment currency
- `status`: Payment status
- `description`: Payment description
- `metadata`: JSON metadata
- `created_at`, `updated_at`: Timestamps

### subscriptions
- `id`: Primary key
- `tenant_id`: Foreign key to tenants
- `stripe_customer_id`: Stripe Customer ID
- `stripe_subscription_id`: Stripe Subscription ID
- `plan`: Subscription plan
- `status`: Subscription status
- `current_period_start`, `current_period_end`: Billing period
- `trial_end`: Trial end date
- `created_at`, `updated_at`: Timestamps

### files
- `id`: Primary key
- `tenant_id`: Foreign key to tenants
- `filename`: Generated filename
- `original_filename`: Original uploaded filename
- `file_path`: Server file path
- `url`: Public URL
- `size`: File size in bytes
- `content_type`: MIME type
- `created_at`: Timestamp

### slideshow_images
- `id`: Primary key
- `tenant_id`: Foreign key to tenants
- `file_id`: Foreign key to files
- `title`: Image title
- `caption`: Image caption
- `display_order`: Sort order
- `is_active`: Active status
- `created_at`, `updated_at`: Timestamps

### site_configs
- `id`: Primary key
- `tenant_id`: Foreign key to tenants (unique)
- `config`: JSON configuration data
- `created_at`, `updated_at`: Timestamps

### deployments
- `id`: Primary key
- `tenant_id`: Foreign key to tenants
- `status`: Deployment status
- `deployment_url`: Site URL
- `build_log`: Build output
- `force_rebuild`: Force rebuild flag
- `config_only`: Config-only deployment flag
- `created_at`, `updated_at`: Timestamps

### tenants (added column)
- `stripe_customer_id`: Stripe Customer ID

## Migration

To apply the new schema to an existing database, run:

```bash
cd /path/to/fastapi-backend
source venv/bin/activate  # if using virtual environment
python migrate_payments_schema.py
```

## Usage Examples

### Complete Setup Flow

1. **Create PaymentIntent for setup fee**:
```bash
curl -X POST "/api/payments/create-intent" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"amount": 20.00, "description": "Baby Raffle setup fee"}'
```

2. **Create subscription after payment**:
```bash
curl -X POST "/api/subscriptions/create" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"plan": "basic", "payment_method_id": "pm_1234567890"}'
```

3. **Upload slideshow images**:
```bash
curl -X POST "/api/files/upload" \
  -H "Authorization: Bearer your-jwt-token" \
  -F "file=@baby_photo.jpg"
```

4. **Add to slideshow**:
```bash
curl -X POST "/api/slideshow/add" \
  -H "Authorization: Bearer your-jwt-token" \
  -d "file_id=file-123&title=Baby's First Photo&display_order=1"
```

5. **Configure site**:
```bash
curl -X PUT "/api/site-config" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"site_title": "Our Baby Raffle", "primary_color": "#ff5722"}'
```

6. **Deploy site**:
```bash
curl -X POST "/api/deploy" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"force_rebuild": true}'
```

This completes the SaaS platform functionality with payment processing, file management, and site customization capabilities.