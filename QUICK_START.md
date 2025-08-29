# 🚀 Quick Start Guide

## 📖 **START HERE**: Complete User Guide
**👉 See [USER_GUIDE.md](USER_GUIDE.md) for the complete guide to managing your baby raffle website.**

## ⚡ Super Quick Actions

### 📸 Add Photos to Slideshow
```bash
# Upload any photo - appears automatically!
aws s3 cp your-photo.jpg s3://margojones-base2ml-com-baby-raffle/slideshow/
```

### 🎨 Change Event Details
Edit: `frontend/src/config/margo-config.ts`
- Update parent names, titles, Venmo username
- Customize betting categories
- Set pricing and percentages

### 🚀 Deploy Changes
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://margojones-base2ml-com-baby-raffle --delete
aws cloudfront create-invalidation --distribution-id ERMQR087RJQMW --paths "/*"
```

## 🌐 Your Links
- **Website**: https://margojones.base2ml.com
- **Admin Panel**: https://margojones.base2ml.com/admin

## 📚 Documentation
- **[USER_GUIDE.md](USER_GUIDE.md)** - Complete user manual
- **[DYNAMIC_SLIDESHOW_GUIDE.md](DYNAMIC_SLIDESHOW_GUIDE.md)** - Slideshow details
- **[SLIDESHOW_IMAGES_GUIDE.md](SLIDESHOW_IMAGES_GUIDE.md)** - Original slideshow guide
- **[SERVERLESS_SUMMARY.md](SERVERLESS_SUMMARY.md)** - Technical overview

**👉 For everything you need to know, start with [USER_GUIDE.md](USER_GUIDE.md)!** 🎯
