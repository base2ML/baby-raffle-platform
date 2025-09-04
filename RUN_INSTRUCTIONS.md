# 🚀 How to Run the Baby Raffle SaaS Platform

## ⚡ Super Quick Start (30 seconds)

```bash
cd baby-raffle-serverless/
./start.sh
```

**That's it!** The system will automatically:
- ✅ Set up Python virtual environment
- ✅ Install all dependencies 
- ✅ Guide you through configuration
- ✅ Start the multi-tenant SaaS backend
- ✅ Make it available at http://localhost:8000

## 🎯 What You Get

### Multi-Tenant SaaS Backend (Production Ready)
- **API Server**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs  
- **Health Check**: http://localhost:8000/health

### Key Features Working Out of the Box
- ✅ **Multi-tenant architecture** with complete data isolation
- ✅ **OAuth2 authentication** (Google & Apple ready)
- ✅ **Tenant management** (create, configure, manage)  
- ✅ **User management** with role-based permissions
- ✅ **Raffle operations** (categories, bets, validation)
- ✅ **Rate limiting** and security middleware
- ✅ **Comprehensive API** with interactive documentation

## 📁 Clean Repository Structure

```
baby-raffle-serverless/                 # ← You are here
├── 📄 README.md                        # Main documentation
├── 📄 SETUP.md                         # Detailed setup guide  
├── 📄 RUN_INSTRUCTIONS.md             # This file
├── 🚀 start.sh                        # One-click startup
├── 🔒 .gitignore                      # Clean git workflow
│
├── 🏗️ fastapi-backend/                # Multi-tenant SaaS backend
│   ├── 🐍 main.py                     # FastAPI application
│   ├── 🔐 oauth.py                    # Google/Apple authentication  
│   ├── 🏢 tenant_service.py           # Tenant management
│   ├── 🎲 raffle_service.py           # Betting operations
│   ├── 🛡️ middleware.py               # Security & tenant isolation
│   ├── 📊 models.py                   # Data models & validation
│   ├── 🗄️ database.py                 # Database connections
│   ├── 📋 schema.sql                  # Multi-tenant database schema
│   ├── 🔄 migrate_db.py               # Database setup
│   ├── 🧪 test_deployment.py          # Deployment testing
│   ├── 🚀 deploy.sh                   # Production deployment
│   ├── 🐳 Dockerfile                  # Container configuration
│   ├── ⚙️ .env.example                # Environment template
│   └── 📦 requirements.txt            # Python dependencies
│  
└── 🎨 frontend/                       # Legacy single-tenant example
    ├── 🚀 start.sh                    # Frontend startup
    ├── 📦 package.json                # Node.js dependencies
    ├── 📄 index.html                  # HTML entry point
    ├── 📁 src/                        # React TypeScript source
    ├── 📁 public/                     # Static assets
    └── ⚙️ vite.config.ts              # Build configuration
```

## 🎮 How to Use

### 1. Start the Backend (Required)
```bash
./start.sh
```
- Runs the multi-tenant SaaS API
- Available at http://localhost:8000
- Interactive API docs at http://localhost:8000/docs

### 2. Test the System
```bash
# Test health check
curl http://localhost:8000/health

# Test subdomain validation
curl http://localhost:8000/api/tenant/validate-subdomain/test-company

# Or use the interactive API docs
open http://localhost:8000/docs
```

### 3. Start Frontend (Optional - Legacy)
```bash
cd frontend/
./start.sh
```
- Runs the old single-tenant frontend
- Available at http://localhost:5173
- **Note**: This is the legacy version - you'll build new frontends for the multi-tenant system

## 🔧 Configuration Options

### Minimal (Development)
The system works with zero configuration using SQLite:
```env
# Auto-created in .env
DATABASE_URL=sqlite:///./baby_raffle.db
JWT_SECRET=dev-secret-change-for-production
ENVIRONMENT=development
```

### Full Production
Copy `.env.example` to `.env` and configure:
```env
# Production PostgreSQL
DATABASE_URL=postgresql://user:pass@localhost:5432/baby_raffle_saas

# Secure JWT secret
JWT_SECRET=your-super-secret-jwt-key

# OAuth credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APPLE_CLIENT_ID=your-apple-client-id
# ... more Apple configs
```

## 🐳 Alternative: Docker

```bash
cd fastapi-backend/
docker build -t baby-raffle-saas .
docker run -p 8000:8000 --env-file .env baby-raffle-saas
```

## 🚀 Production Deployment

### Railway (Recommended)
```bash
cd fastapi-backend/
./deploy.sh
```

### Manual
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy to your platform of choice

## 🎯 What This Enables

### For SaaS Owners (You)
- **Multi-tenant platform** that can host thousands of baby raffle sites
- **OAuth integration** with Google and Apple for easy user onboarding
- **Complete tenant isolation** with Row-Level Security
- **Subscription management** with rate limiting per tier
- **Comprehensive analytics** across all tenants

### For Tenant Owners (Your Customers)  
- **Create raffle sites** at `{their-name}.base2ml.com`
- **OAuth authentication** for their users
- **Customize raffle categories** and branding
- **Manage users and roles** within their tenant
- **Validate bets and payouts** with admin tools
- **Access detailed analytics** and statistics

### For Raffle Participants (End Users)
- **Visit tenant sites** to place bets
- **Sign in with Google/Apple** for easy registration
- **Place bets** across multiple categories
- **View real-time statistics** and leaderboards
- **Receive notifications** for bet confirmations

## 📊 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Onboarding     │    │  Tenant Sites   │    │  Backend API    │
│  Site           │    │                 │    │                 │
│  mybabyraffle   │◄──►│  {sub}.base2ml  │◄──►│  FastAPI        │
│  .base2ml.com   │    │  .com           │    │  Multi-tenant   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │  PostgreSQL     │
                                              │  with RLS       │
                                              │  Tenant         │
                                              │  Isolation      │
                                              └─────────────────┘
```

## 🎉 Ready to Go!

Your multi-tenant SaaS platform is now running and ready for development or production use!

### Next Steps:
1. **Explore the API** using the interactive docs at `/docs`
2. **Configure OAuth** for Google and Apple authentication  
3. **Plan frontend applications** for onboarding and tenant sites
4. **Set up your domain** and SSL certificates
5. **Start building the user experience** on top of this solid backend

The transformation is complete - you now have a production-ready multi-tenant SaaS backend that can scale to support thousands of baby raffle sites! 🎊