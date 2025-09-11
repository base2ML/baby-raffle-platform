# 🚀 Fresh Baby Raffle Marketing Site Deployment Guide

## 🎯 Critical Issue Resolved
All `.mybabyraffle.com` → `.base2ml.com` domain fixes are complete and ready for deployment.

## ✅ What's Been Fixed
- **GetStartedSection.tsx**: Form now shows `.base2ml.com` 
- **HeroSection.tsx**: Demo site updated to `sarah-and-mike.base2ml.com`
- **PricingSection.tsx**: Subdomain references fixed to `yourname.base2ml.com`
- **GallerySection.tsx**: All example sites updated to `.base2ml.com`
- **Footer.tsx**: Support email updated to `support@base2ml.com`
- **PreviewStep.tsx**: Site builder preview fixed
- **auth/callback/page.tsx**: OAuth callback updated
- **layout.tsx**: Metadata URLs fixed to `babyraffle.base2ml.com`
- **Google Fonts issue**: Fixed with reliable system fonts
- **Build process**: Tested and working locally

## 🆕 Fresh Vercel Deployment Setup

### Option 1: Create Completely New Vercel Project (Recommended)

1. **Delete the old Vercel project** (baby-raffle-marketing) to avoid conflicts

2. **Create a new Vercel project**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import from GitHub: `https://github.com/base2ML/baby-raffle-platform`
   - **Project Name**: `baby-raffle-marketing-fresh`
   - **Framework Preset**: Next.js
   - **Root Directory**: Leave **EMPTY** (very important!)
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave **EMPTY**
   - **Install Command**: `npm ci`

3. **Environment Variables** (Add these in Vercel dashboard):
   ```
   NEXT_PUBLIC_API_URL=https://api.base2ml.com
   NEXT_PUBLIC_SITE_URL=https://babyraffle.base2ml.com
   ```

4. **Custom Domain Setup**:
   - Add domain: `babyraffle.base2ml.com`
   - Update DNS records as instructed by Vercel

### Option 2: Fix Existing Vercel Project

If you want to keep the existing project:

1. **Go to Vercel Dashboard** → Your Project → Settings → General
2. **Root Directory**: Change from `marketing-site` to **EMPTY/BLANK**
3. **Redeploy** from the Deployments tab

## 🔧 Build Configuration Files Created

### `vercel.json`
```json
{
  "version": 2,
  "name": "baby-raffle-marketing-fresh",
  "builds": [{"src": "package.json", "use": "@vercel/next"}],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.base2ml.com",
    "NEXT_PUBLIC_SITE_URL": "https://babyraffle.base2ml.com"
  }
}
```

### `deploy.sh`
Executable script with build instructions and deployment checklist.

## 🧪 Local Testing
```bash
# Clean build (already tested successfully)
./deploy.sh

# Or manually:
npm ci
npm run build
npm start
```

## 🎯 Expected Results

After deployment, `https://babyraffle.base2ml.com` should show:

✅ **Form field**: `.base2ml.com` (instead of `.mybabyraffle.com`)
✅ **Hero section**: `sarah-and-mike.base2ml.com`  
✅ **Gallery examples**: All showing `.base2ml.com`
✅ **Pricing section**: `yourname.base2ml.com`
✅ **Footer email**: `support@base2ml.com`

## 🚨 Previous Issues Resolved

- ❌ **Google Fonts network failure**: Fixed with system fonts
- ❌ **Root directory misconfiguration**: Clear instructions provided  
- ❌ **Build failures**: All dependencies and configurations tested
- ❌ **Domain references**: All 8+ files updated consistently

## 📞 Next Steps

1. Choose deployment option (new project recommended)
2. Follow the setup instructions above
3. Wait 2-3 minutes for deployment
4. Test the live site to confirm all `.base2ml.com` references are working
5. The critical subdomain auto-population issue will be resolved!

---
**Status**: Ready for immediate deployment ✅  
**All code changes**: Committed to `main` branch  
**Build status**: Tested and working locally ✅