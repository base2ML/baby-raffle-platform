# Baby Raffle Deployment Guide

This guide covers deploying the Baby Raffle application with the frontend on GitHub Pages and the backend on Railway.

## Architecture

- **Frontend**: React + TypeScript + Vite → GitHub Pages
- **Backend**: FastAPI + Python → Railway
- **Database**: In-memory (for demo) - can be upgraded to PostgreSQL on Railway

## Prerequisites

1. **Git** - Version control
2. **Node.js 18+** - For frontend development
3. **Python 3.11+** - For backend development
4. **Railway CLI** - For backend deployment
5. **GitHub Account** - For frontend hosting

## Quick Start

### 1. Install Railway CLI

```bash
# macOS
brew install railway

# Or use npm
npm install -g @railway/cli
```

### 2. Login to Railway

```bash
railway login
```

### 3. Deploy Everything

```bash
./deploy.sh
```

This script will:
- Deploy the backend to Railway
- Push changes to GitHub (triggering GitHub Pages deployment)

## Manual Deployment

### Backend Deployment (Railway)

1. Navigate to backend directory:
   ```bash
   cd fastapi-backend
   ```

2. Deploy to Railway:
   ```bash
   railway deploy
   ```

3. Get your Railway URL:
   ```bash
   railway status
   ```

### Frontend Deployment (GitHub Pages)

1. Enable GitHub Pages in your repository settings
2. Set source to "GitHub Actions"
3. Push to main branch - deployment happens automatically via GitHub Actions

### Environment Variables

Set these in your GitHub repository (Settings → Secrets and variables → Actions → Variables):

- `VITE_API_URL`: Your Railway backend URL

## Development

Start both frontend and backend locally:

```bash
./dev.sh
```

Or manually:

```bash
# Terminal 1 - Backend
cd fastapi-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev
```

## URLs

After deployment:

- **Frontend**: `https://[username].github.io/baby-raffle-serverless/`
- **Backend**: Check Railway dashboard for your unique URL
- **API Docs**: `[backend-url]/docs`

## Troubleshooting

### GitHub Pages Issues

1. Check GitHub Actions tab for deployment status
2. Ensure GitHub Pages is enabled in repository settings
3. Verify the workflow has proper permissions

### Railway Issues

1. Check Railway logs: `railway logs`
2. Verify Dockerfile and requirements.txt are correct
3. Ensure Railway CLI is logged in: `railway whoami`

### CORS Issues

Update the backend's CORS settings in `main.py` if you change domains:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourusername.github.io"],  # Update this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Monitoring

- **Frontend**: GitHub Actions for deployment status
- **Backend**: Railway dashboard for logs and metrics
- **API Health**: Check `[backend-url]/health`

## Scaling

- **Frontend**: GitHub Pages scales automatically
- **Backend**: Railway auto-scales based on traffic
- **Database**: Upgrade to Railway PostgreSQL for production use

## Security Notes

- The backend currently allows all CORS origins (`*`) for demo purposes
- Consider implementing proper authentication for production
- Use environment variables for sensitive configuration