# 🚀 Baby Raffle SaaS Setup Guide

Complete setup instructions for the Baby Raffle Multi-Tenant SaaS platform.

## 🎯 Quick Start (2 Minutes)

```bash
# 1. Clone and navigate to the repository
cd baby-raffle-serverless/

# 2. Run the automated startup script
./start.sh
```

That's it! The system will guide you through setup and start the backend API at `http://localhost:8000`.

## 📋 Detailed Setup Instructions

### Prerequisites

Before starting, ensure you have:

- **Python 3.11+** ([Download](https://python.org/downloads/))
- **PostgreSQL 15+** ([Download](https://postgresql.org/download/)) - Optional for development
- **Git** for version control
- **A code editor** (VS Code recommended)

### Step 1: Environment Setup

1. **Copy the environment template:**
   ```bash
   cd fastapi-backend/
   cp .env.example .env
   ```

2. **Configure the .env file:**
   ```env
   # Minimum required for development
   DATABASE_URL=postgresql://localhost:5432/baby_raffle_dev  # Or use SQLite
   JWT_SECRET=your-secret-key-change-this
   
   # OAuth (optional for testing)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

3. **For development only**, you can use these minimal settings:
   ```env
   DATABASE_URL=sqlite:///./baby_raffle.db
   JWT_SECRET=dev-secret-change-for-production
   ENVIRONMENT=development
   DEBUG=true
   ```

### Step 2: Database Setup

#### Option A: SQLite (Development)
No setup needed - SQLite will create the file automatically.

#### Option B: PostgreSQL (Recommended)
```bash
# Install PostgreSQL and create database
createdb baby_raffle_dev

# Run migrations
python migrate_db.py
```

### Step 3: Start the Backend

```bash
# Using the startup script (recommended)
./start.sh

# Or manually
cd fastapi-backend/
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Step 4: Test the System

Visit these URLs to verify everything is working:

- **API Health Check**: http://localhost:8000/health
- **API Documentation**: http://localhost:8000/docs
- **Interactive API**: Try the endpoints in the docs!

## 🧪 Testing the Multi-Tenant Features

### 1. Test Subdomain Validation
```bash
curl http://localhost:8000/api/tenant/validate-subdomain/test-company
```

### 2. Test Health Check
```bash
curl http://localhost:8000/health
```

### 3. Use the Interactive API Docs
1. Open http://localhost:8000/docs
2. Try the `/api/tenant/validate-subdomain/{subdomain}` endpoint
3. Test other endpoints to see the full API

## 🌐 OAuth Configuration (Optional)

### Google OAuth Setup

1. **Go to the [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create a new project** or select existing one
3. **Enable the Google+ API**
4. **Create OAuth 2.0 credentials**:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:8000/api/auth/callback`
5. **Copy the Client ID and Secret to your .env file**

### Apple OAuth Setup

1. **Go to [Apple Developer Console](https://developer.apple.com/)**
2. **Create an App ID** with Sign In with Apple enabled
3. **Create a Service ID** for your web app
4. **Generate a private key** and note the Key ID
5. **Configure your .env file** with all Apple credentials

## 🐳 Docker Setup (Optional)

### Build and Run with Docker
```bash
cd fastapi-backend/

# Build the image
docker build -t baby-raffle-saas .

# Run with environment file
docker run -p 8000:8000 --env-file .env baby-raffle-saas
```

### Docker Compose (Coming Soon)
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./fastapi-backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/baby_raffle
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=baby_raffle
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🚀 Production Deployment

### Railway Deployment (Recommended)

1. **Install Railway CLI:**
   ```bash
   curl -fsSL https://railway.app/install.sh | sh
   railway login
   ```

2. **Deploy:**
   ```bash
   cd fastapi-backend/
   ./deploy.sh
   ```

### Manual Production Setup

1. **Set production environment variables**
2. **Set up PostgreSQL database**
3. **Configure OAuth credentials**
4. **Set up domain and SSL**
5. **Deploy with your preferred platform**

## 🎨 Frontend Development (Future)

The current frontend is the legacy single-tenant version. For the multi-tenant system, you'll need to build:

### 1. Onboarding Site (`mybabyraffle.base2ml.com`)
- User registration with OAuth
- Tenant creation flow
- Subdomain selection
- Initial configuration

### 2. Tenant Dashboard
- Raffle category management
- User management
- Bet validation
- Analytics dashboard

### 3. Participant Interface
- Betting forms
- Real-time statistics
- User registration
- Payment processing

## 🔧 Development Workflow

### Daily Development
```bash
# Start backend
./start.sh

# In another terminal, make changes to code
# The server will auto-reload on file changes
```

### Database Changes
```bash
# After modifying schema.sql
python migrate_db.py
```

### Testing Changes
```bash
# Run deployment tests
python test_deployment.py http://localhost:8000

# Check API documentation
open http://localhost:8000/docs
```

## 📊 Monitoring & Logs

### View Logs
```bash
# Backend logs are printed to console
# In production, configure proper logging

# Health monitoring
curl http://localhost:8000/health
```

### Database Access
```bash
# Connect to your database
psql $DATABASE_URL

# View tenant data
SELECT * FROM tenants;
SELECT * FROM users;
```

## 🆘 Troubleshooting

### Common Issues

#### "Module not found" errors
```bash
# Make sure you're in the virtual environment
source fastapi-backend/venv/bin/activate
pip install -r requirements.txt
```

#### "Database connection failed"
```bash
# Check your DATABASE_URL in .env
# For development, use SQLite:
DATABASE_URL=sqlite:///./baby_raffle.db
```

#### "OAuth not configured" errors
```bash
# OAuth is optional for development
# The system will show warnings but still work
# Configure OAuth credentials in .env for full functionality
```

#### Port already in use
```bash
# Kill the process using port 8000
lsof -ti:8000 | xargs kill -9

# Or use a different port
uvicorn main:app --reload --port 8001
```

### Getting Help

1. **Check the logs** for specific error messages
2. **Review the .env configuration**
3. **Test with the interactive API docs** at `/docs`
4. **Verify database connectivity**
5. **Check the repository issues** for known problems

## 🎉 You're Ready!

Once you see this message, your multi-tenant SaaS platform is running:

```
✅ Health check passed
🌐 Backend API: http://localhost:8000
📖 API Docs: http://localhost:8000/docs
🏥 Health Check: http://localhost:8000/health
```

You now have a complete multi-tenant SaaS backend that can support thousands of tenants with OAuth authentication, complete data isolation, and comprehensive management features!

## 🚀 Next Steps

1. **Explore the API** using the interactive docs
2. **Plan your frontend architecture** for the onboarding and tenant sites
3. **Configure OAuth providers** for production authentication
4. **Set up your production domain** and SSL certificates
5. **Start building the user-facing applications**

The backend is complete and production-ready – time to build amazing user experiences on top of it! 🎊