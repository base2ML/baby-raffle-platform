# 🎉 Baby Raffle SaaS Multi-Tenant Platform

A complete multi-tenant SaaS platform that allows users to create and deploy their own baby betting sites with OAuth authentication, tenant isolation, and comprehensive management features.

## 🏗️ Architecture

- **Backend**: FastAPI with PostgreSQL and Row-Level Security for tenant isolation
- **Frontend**: React + TypeScript with Vite (legacy single-tenant example)
- **Authentication**: OAuth2 with Google and Apple Sign-In
- **Database**: PostgreSQL with advanced multi-tenant isolation
- **Deployment**: Docker + Railway.app ready

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**
- **PostgreSQL 15+** 
- **Node.js 18+** (optional, for frontend)
- **Docker** (optional, for containerized deployment)

### 1. Backend Setup (Multi-Tenant SaaS)

```bash
# Navigate to backend directory
cd fastapi-backend/

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration (see Environment Configuration below)

# Initialize database
python migrate_db.py

# Run the development server
uvicorn main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### 2. Frontend Setup (Optional - Legacy Single-Tenant)

> **Note**: The current frontend is the old single-tenant version. You'll need to build new frontends for the multi-tenant system.

```bash
# Navigate to frontend directory
cd frontend/

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🔧 Environment Configuration

Create `.env` in the `fastapi-backend/` directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/baby_raffle_saas

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# OAuth - Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OAuth - Apple
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key

# Domain Configuration
BASE_DOMAIN=base2ml.com
ONBOARDING_SUBDOMAIN=mybabyraffle

# CORS
ALLOWED_ORIGINS=https://*.base2ml.com,https://mybabyraffle.base2ml.com,http://localhost:3000

# Environment
ENVIRONMENT=development
DEBUG=True
```

## 🐳 Docker Deployment

### Build and Run with Docker

```bash
cd fastapi-backend/

# Build the Docker image
docker build -t baby-raffle-saas .

# Run the container
docker run -p 8000:8000 --env-file .env baby-raffle-saas
```

### Deploy to Railway

```bash
cd fastapi-backend/

# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Login to Railway
railway login

# Deploy using the automated script
./deploy.sh

# Or deploy manually
railway up
```

## 📊 Database Schema

The system uses PostgreSQL with Row-Level Security for complete tenant isolation:

### Core Tables
- **`tenants`** - Tenant information with settings and subscriptions
- **`users`** - User accounts with tenant association and roles  
- **`raffle_categories`** - Betting categories per tenant
- **`bets`** - Individual betting records with validation
- **`oauth_sessions`** - OAuth token management
- **`audit_logs`** - Comprehensive audit trail

### Security Features
- **Row-Level Security (RLS)** for complete tenant data isolation
- **Foreign Key Constraints** ensuring data integrity
- **Optimized Indexes** for multi-tenant query performance
- **Materialized Views** for real-time analytics

## 🔐 Authentication Flow

1. User visits onboarding site (`mybabyraffle.base2ml.com`)
2. Selects OAuth provider (Google/Apple)
3. Completes OAuth flow with secure token exchange
4. Creates or links account in selected tenant
5. Receives JWT token with tenant context
6. Accesses tenant-specific resources with automatic RLS isolation

## 🌐 Multi-Tenant Architecture

### Domain Structure
- **`mybabyraffle.base2ml.com`** - Onboarding and tenant creation
- **`{subdomain}.base2ml.com`** - Individual tenant raffle sites
- **`api.base2ml.com`** - Backend API (alternative routing)

### Tenant Capabilities
- **Create and manage** raffle categories
- **Customize branding** and settings
- **User management** with role-based permissions
- **Bet validation** and approval workflows
- **Comprehensive analytics** and statistics
- **Rate limiting** per tenant tier

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Generate OAuth authorization URL
- `POST /api/auth/callback` - Handle OAuth callback

### Tenant Management  
- `POST /api/tenant/create` - Create new tenant
- `GET /api/tenant/validate-subdomain/{subdomain}` - Check availability
- `GET /api/tenant/info` - Get tenant information
- `PUT /api/tenant/settings` - Update tenant settings
- `GET /api/tenant/stats` - Get tenant statistics

### Raffle Operations
- `GET /api/categories` - Get raffle categories
- `POST /api/categories` - Create category (admin)
- `POST /api/bets/submit` - Submit bets
- `GET /api/bets` - Get bets (admin)
- `POST /api/bets/validate` - Validate bets (admin)

### System Administration
- `GET /api/admin/tenants` - List all tenants (super admin)
- `GET /health` - Health check
- `GET /docs` - API documentation

## 🧪 Testing

### Test the Deployment
```bash
cd fastapi-backend/

# Test local deployment
python test_deployment.py http://localhost:8000

# Test production deployment  
python test_deployment.py https://your-app.railway.app
```

### Manual API Testing
```bash
# Health check
curl http://localhost:8000/health

# Check subdomain availability
curl http://localhost:8000/api/tenant/validate-subdomain/test-tenant

# API documentation
open http://localhost:8000/docs
```

## 📁 Repository Structure

```
baby-raffle-serverless/
├── fastapi-backend/              # Multi-tenant SaaS backend
│   ├── main.py                   # FastAPI application
│   ├── models.py                 # Pydantic models
│   ├── database.py               # Database connection manager
│   ├── oauth.py                  # OAuth2 authentication
│   ├── tenant_service.py         # Tenant management
│   ├── middleware.py             # Security & context middleware
│   ├── raffle_service.py         # Raffle operations
│   ├── schema.sql                # Database schema
│   ├── migrate_db.py             # Database migrations
│   ├── deploy.sh                 # Automated deployment
│   ├── test_deployment.py        # Deployment testing
│   ├── requirements.txt          # Python dependencies
│   ├── Dockerfile                # Container configuration
│   ├── railway.json              # Railway deployment config
│   └── .env.example              # Environment template
└── frontend/                     # Legacy single-tenant frontend
    ├── src/                      # React TypeScript source
    ├── public/                   # Static assets
    ├── package.json              # Node.js dependencies
    └── vite.config.ts            # Vite configuration
```

## 🎯 Current Status

### ✅ Completed (Production Ready)
- **Multi-tenant backend** with complete tenant isolation
- **OAuth2 authentication** with Google and Apple
- **Database schema** with Row-Level Security
- **Rate limiting** and security middleware  
- **API documentation** and health monitoring
- **Docker deployment** configuration
- **Railway deployment** automation

### 🚧 Next Steps (Frontend Development)
- **Onboarding frontend** for tenant creation at `mybabyraffle.base2ml.com`
- **Tenant dashboard** for raffle management
- **Participant interface** for placing bets  
- **Real-time updates** with WebSocket/polling
- **Payment processing** integration
- **Mobile app** development

## 📝 Development

### Running in Development Mode
```bash
# Backend with auto-reload
cd fastapi-backend/
uvicorn main:app --reload --port 8000

# Frontend with hot reload
cd frontend/
npm run dev
```

### Database Management
```bash
# Run migrations
python migrate_db.py

# Connect to database
psql $DATABASE_URL

# View RLS policies
\d+ tenants
```

## 🔒 Security Features

- **Row-Level Security** for complete tenant data isolation
- **JWT tokens** with tenant context and expiration
- **OAuth2 integration** with secure state management
- **Rate limiting** with per-tenant quotas
- **CORS configuration** for domain security
- **Input validation** with Pydantic models
- **Comprehensive error handling** with unique error IDs

## 📊 Monitoring & Logging

- **Health check endpoints** for load balancers
- **Request logging** with tenant context
- **Error tracking** with unique error IDs
- **Performance metrics** through middleware
- **Rate limit monitoring** for abuse detection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎉 Success!

The Baby Raffle application has been successfully transformed into a complete, production-ready multi-tenant SaaS platform! Users can now create their own raffle sites with OAuth authentication, complete tenant isolation, and comprehensive management features.