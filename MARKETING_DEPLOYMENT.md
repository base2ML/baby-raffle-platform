# 🚀 Baby Raffle Marketing Site Deployment Guide

Complete guide for deploying the Baby Raffle marketing website to production.

## 📋 Prerequisites

- Node.js 18+ installed
- Access to your domain DNS settings
- Backend API deployed and accessible
- SSL certificate for your domain

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

Vercel provides excellent Next.js hosting with automatic deployments.

#### Step 1: Prepare the Site

```bash
cd marketing-site/
npm install
npm run build  # Test local build
```

#### Step 2: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Step 3: Configure Environment Variables

In Vercel dashboard:
- Go to Project Settings → Environment Variables
- Add `NEXT_PUBLIC_API_URL=https://your-api-domain.com`
- Add `NEXT_PUBLIC_SITE_URL=https://mybabyraffle.base2ml.com`

#### Step 4: Set Custom Domain

- In Vercel dashboard, go to Domains
- Add `mybabyraffle.base2ml.com`
- Configure DNS records as instructed

### Option 2: Netlify

Great alternative with similar features to Vercel.

#### Step 1: Build Configuration

Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "out"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Step 2: Deploy

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=out
```

### Option 3: AWS S3 + CloudFront

For enterprise deployments with full control.

#### Step 1: Build Static Site

```bash
npm run export
```

#### Step 2: Create S3 Bucket

```bash
aws s3 mb s3://mybabyraffle-marketing
aws s3 website s3://mybabyraffle-marketing --index-document index.html
```

#### Step 3: Upload Files

```bash
aws s3 sync ./out s3://mybabyraffle-marketing --delete
```

#### Step 4: Configure CloudFront

- Create CloudFront distribution
- Point to S3 bucket
- Configure SSL certificate
- Set up custom domain

### Option 4: Digital Ocean App Platform

Cost-effective option with good performance.

#### Step 1: Create App Spec

Create `.do/app.yaml`:
```yaml
name: baby-raffle-marketing
static_sites:
- name: marketing-site
  source_dir: /marketing-site
  github:
    repo: your-repo
    branch: main
  build_command: npm run build && npm run export
  output_dir: /out
  envs:
  - key: NEXT_PUBLIC_API_URL
    value: https://your-api-domain.com
  - key: NEXT_PUBLIC_SITE_URL  
    value: https://mybabyraffle.base2ml.com
```

#### Step 2: Deploy

```bash
doctl apps create .do/app.yaml
```

## 🔧 Configuration

### Environment Variables

Required environment variables for production:

```bash
NEXT_PUBLIC_API_URL=https://api.base2ml.com
NEXT_PUBLIC_SITE_URL=https://mybabyraffle.base2ml.com
```

Optional analytics and monitoring:
```bash
NEXT_PUBLIC_GA_ID=GA_MEASUREMENT_ID
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=mybabyraffle.base2ml.com
```

### DNS Configuration

Set up the following DNS records:

```
Type: A
Name: mybabyraffle
Value: [Your hosting provider's IP]

Type: CNAME  
Name: www.mybabyraffle
Value: mybabyraffle.base2ml.com
```

For CDN/hosting services:
```
Type: CNAME
Name: mybabyraffle
Value: [Your hosting provider's domain]
```

## 🚀 Automated Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Marketing Site

on:
  push:
    branches: [ main ]
    paths: [ 'marketing-site/**' ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: marketing-site/package-lock.json
    
    - name: Install dependencies
      working-directory: ./marketing-site
      run: npm ci
    
    - name: Build
      working-directory: ./marketing-site
      env:
        NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
        NEXT_PUBLIC_SITE_URL: ${{ secrets.SITE_URL }}
      run: npm run build && npm run export
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        working-directory: ./marketing-site
```

### Using the Deploy Script

```bash
# Static export
./deploy.sh --static

# Deploy to Vercel
./deploy.sh --vercel
```

## 🔍 Performance Optimization

### Image Optimization

1. Compress images before deployment:
```bash
npm install -g imagemin-cli
imagemin public/*.{jpg,png} --out-dir=public/optimized
```

2. Use WebP format where supported:
```bash
npm install -g @squoosh/cli
squoosh-cli --webp '{"quality": 80}' public/*.{jpg,png}
```

### Bundle Analysis

```bash
npm run build
npm install -g @next/bundle-analyzer
ANALYZE=true npm run build
```

### Caching Strategy

Configure caching headers:
- Static assets: 1 year cache
- HTML pages: 1 hour cache
- API responses: 5 minutes cache

## 📊 Monitoring & Analytics

### Google Analytics 4

Add to environment variables:
```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Plausible Analytics (Privacy-friendly)

```bash
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=mybabyraffle.base2ml.com
```

### Core Web Vitals Monitoring

Use Vercel Analytics or Google PageSpeed Insights to monitor:
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)

## 🔒 Security Headers

Configure security headers in `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

## 🧪 Testing Deployment

### Local Testing

```bash
# Test production build locally
npm run build
npm run start
```

### Load Testing

```bash
# Install artillery
npm install -g artillery

# Create load test config
echo "config:
  target: 'https://mybabyraffle.base2ml.com'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
      - get:
          url: '/'" > load-test.yml

# Run load test
artillery run load-test.yml
```

### Accessibility Testing

```bash
# Install axe-cli
npm install -g @axe-core/cli

# Test accessibility
axe https://mybabyraffle.base2ml.com
```

## 📱 Mobile Testing

Test on various devices:
- iPhone Safari
- Android Chrome
- iPad Safari
- Desktop browsers (Chrome, Firefox, Safari, Edge)

Use tools:
- BrowserStack for cross-browser testing
- Google Mobile-Friendly Test
- Chrome DevTools device simulation

## 🚨 Troubleshooting

### Build Issues

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Environment Variable Issues

```bash
# Verify variables are loaded
npm run dev
# Check browser console for NEXT_PUBLIC_ variables
```

### SSL Certificate Issues

- Verify DNS propagation: `dig mybabyraffle.base2ml.com`
- Check SSL status: `openssl s_client -connect mybabyraffle.base2ml.com:443`

### Performance Issues

- Check bundle size: `npm run analyze`
- Optimize images: Use next/image component
- Enable gzip compression on server

## 📈 Post-Deployment Checklist

- [ ] Site loads correctly on all devices
- [ ] All forms submit successfully
- [ ] OAuth flow works end-to-end
- [ ] Analytics tracking is working
- [ ] SSL certificate is valid
- [ ] Core Web Vitals scores are good
- [ ] Accessibility score is high
- [ ] Search engine indexing is working

## 🔄 Maintenance

### Regular Updates

- Update dependencies monthly
- Monitor security advisories
- Check performance metrics weekly
- Review analytics data monthly

### Backup Strategy

- Code is in version control (GitHub)
- Static assets backed up to cloud storage
- Configuration documented
- Environment variables stored securely

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review deployment logs
3. Test locally first
4. Contact support with specific error messages

## 🎉 Success!

Your Baby Raffle marketing site is now live and ready to convert visitors into customers!