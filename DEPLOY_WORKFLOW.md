# 🚀 Simple Deploy Workflow

## Current Status ✅
- **Frontend**: https://margojones.base2ml.com (Working)
- **Backend API**: https://margojones-production.up.railway.app (Working)
- **Database**: AWS RDS PostgreSQL (Connected)
- **All Issues Fixed**: Betting cards, slideshow, live stats

## 📝 How to Make Edits and Deploy

### 1. Frontend Changes
```bash
cd frontend

# Make your edits to React components/pages
# Test locally:
npm run dev

# Deploy:
npm run build
aws s3 sync dist/ s3://margojones-base2ml-com-baby-raffle --delete
aws cloudfront create-invalidation --distribution-id ERMQR087RJQMW --paths "/*"
```

### 2. Backend Changes
```bash
cd fastapi-backend

# Make your edits to main.py
# Test locally:
docker build -t test-api .
docker run -p 8000:8000 test-api

# Deploy:
railway up --detach
```

### 3. Quick Deploy Script
```bash
# For frontend only:
cd frontend && npm run build && aws s3 sync dist/ s3://margojones-base2ml-com-baby-raffle --delete

# For backend only:
cd fastapi-backend && railway up --detach
```

## 🔍 Key URLs for Testing
- **Health Check**: https://margojones-production.up.railway.app/health
- **Categories**: https://margojones-production.up.railway.app/categories  
- **Stats**: https://margojones-production.up.railway.app/stats
- **Admin Bets**: https://margojones-production.up.railway.app/admin/bets

## 📊 What's Working
1. ✅ **Betting Cards**: Fixed individual expansion (no longer opens all cards)
2. ✅ **Dynamic Slideshow**: Uses slideshow-manifest.json automatically  
3. ✅ **Live Stats**: Shows max prize data from backend
4. ✅ **API Endpoints**: All working with fallback data
5. ✅ **CORS**: Configured for cross-origin requests
6. ✅ **Error Handling**: Graceful fallbacks when DB unavailable

## 🛠 Architecture
- **Frontend**: React + Vite → S3 + CloudFront
- **Backend**: FastAPI + Docker → Railway 
- **Database**: PostgreSQL → AWS RDS
- **DNS**: Route 53 + CloudFront distribution

## 💡 Pro Tips
- Railway auto-deploys from this directory when you run `railway up`
- S3 bucket: `margojones-base2ml-com-baby-raffle`
- CloudFront distribution: `ERMQR087RJQMW`
- Use `railway logs` to debug backend issues
- Frontend env: `.env.production` contains API URL

## 🚨 Emergency Reset
If something breaks:
1. **Frontend**: Redeploy last known good build from `dist/`
2. **Backend**: Run `railway up --detach` to redeploy
3. **Check logs**: `railway logs` for backend issues
