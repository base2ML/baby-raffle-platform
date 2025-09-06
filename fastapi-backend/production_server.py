#!/usr/bin/env python3
"""
Production Site Builder Server
Complete OAuth integration and deployment-ready backend
"""
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, HTMLResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import uuid
import os
import re
import jwt
import httpx
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from urllib.parse import urlencode
import secrets

# Initialize FastAPI app
app = FastAPI(
    title="Baby Raffle Site Builder API",
    description="Production site builder backend API with OAuth",
    version="2.0.0"
)

# Security
security = HTTPBearer()

# Environment configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "616947441714-1pvasp7lcp2p8r9c8qnmvbmva2snlnll.apps.googleusercontent.com")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "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")
JWT_SECRET = os.getenv("JWT_SECRET", "PJ5pL6i6W3iAhwEyY5bJ8jW_PFVZIe0YxT3Zcwk3XyM")
BASE_URL = os.getenv("API_URL", "https://api.base2ml.com")
FRONTEND_URL = os.getenv("BUILDER_URL", "https://builder.base2ml.com")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:kfAcPhUXNArEuZbSHFOZgFsaZEsZEWxk@postgres.railway.internal:5432/railway")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001",
        "http://localhost:5173",
        "https://*.base2ml.com",
        "https://base2ml.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Models
class ThemeConfig(BaseModel):
    id: str
    name: str
    theme_type: str
    description: str
    colors: Dict[str, str]
    typography: Dict[str, Any]
    preview_image_url: str = ""
    is_premium: bool = False

class HostingPackage(BaseModel):
    id: str
    tier: str
    name: str
    description: str
    price_monthly: float
    price_yearly: float
    features: List[Dict[str, Any]]
    popular: bool = False

class SiteBuilderData(BaseModel):
    theme: Dict[str, Any]
    content: Dict[str, Any]
    images: Optional[Dict[str, Any]] = None
    betting_cards: Optional[List[Dict[str, Any]]] = None
    payment_info: Optional[Dict[str, Any]] = None

class CreateAccountData(BaseModel):
    subdomain: str
    selected_package: str
    oauth_code: str
    oauth_provider: str = "google"

class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

# Database setup
def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            picture TEXT,
            provider VARCHAR(50) DEFAULT 'google',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Sites table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sites (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            subdomain VARCHAR(255) UNIQUE NOT NULL,
            package_tier VARCHAR(255) NOT NULL,
            configuration TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            site_id VARCHAR(255),
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (site_id) REFERENCES sites (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database
init_db()

# Create sites directory
os.makedirs('sites', exist_ok=True)
os.makedirs('static/generated', exist_ok=True)

# JWT utilities
def create_jwt_token(user_data: Dict, site_id: Optional[str] = None) -> str:
    payload = {
        'user_id': user_data['id'],
        'email': user_data['email'],
        'name': user_data['name'],
        'site_id': site_id,
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def verify_jwt_token(token: str) -> Dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# OAuth utilities
async def exchange_code_for_token(code: str) -> Dict:
    """Exchange OAuth code for access token"""
    token_url = "https://oauth2.googleapis.com/token"
    redirect_uri = f"{BASE_URL}/auth/callback"
    
    data = {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": redirect_uri
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=data)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")
        return response.json()

async def get_user_info(access_token: str) -> Dict:
    """Get user info from Google"""
    user_info_url = f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(user_info_url)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        return response.json()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    """Get current authenticated user"""
    return verify_jwt_token(credentials.credentials)

# Predefined themes with sophisticated complementary colors
THEMES = [
    {
        "id": "sage-terracotta",
        "name": "Sage & Terracotta",
        "theme_type": "earthy",
        "description": "Warm, natural elegance with sophisticated earth tones",
        "colors": {
            "primary": "#87A96B",    # Sage green
            "secondary": "#D4A574",  # Terracotta
            "accent": "#E6B17A",     # Warm accent
            "background": "#F8F6F3", # Cream white
            "text": "#2F3E2C",       # Deep forest
            "border": "#C4D1B0"      # Light sage
        },
        "typography": {
            "heading_font": "Playfair Display",
            "body_font": "Source Sans Pro"
        },
        "preview_image_url": "",
        "is_premium": False
    },
    {
        "id": "navy-gold",
        "name": "Navy & Gold",
        "theme_type": "luxury",
        "description": "Timeless luxury with deep navy and elegant gold accents",
        "colors": {
            "primary": "#1E3A8A",    # Deep navy
            "secondary": "#F59E0B",  # Rich gold
            "accent": "#FCD34D",     # Light gold
            "background": "#F8FAFC", # Clean white
            "text": "#1F2937",       # Charcoal
            "border": "#E5E7EB"      # Light gray
        },
        "typography": {
            "heading_font": "Merriweather",
            "body_font": "Open Sans"
        },
        "preview_image_url": "",
        "is_premium": False
    },
    {
        "id": "forest-cream",
        "name": "Forest & Cream",
        "theme_type": "natural",
        "description": "Fresh and organic with deep forest greens and soft cream",
        "colors": {
            "primary": "#065F46",    # Forest green
            "secondary": "#FEF7CD",  # Cream
            "accent": "#10B981",     # Emerald
            "background": "#F9FAFB", # Off white
            "text": "#1F2937",       # Dark gray
            "border": "#D1FAE5"      # Light green
        },
        "typography": {
            "heading_font": "Lora",
            "body_font": "Inter"
        },
        "preview_image_url": "",
        "is_premium": False
    },
    {
        "id": "plum-silver",
        "name": "Plum & Silver",
        "theme_type": "modern",
        "description": "Contemporary sophistication with rich plum and cool silver",
        "colors": {
            "primary": "#7C3AED",    # Rich plum
            "secondary": "#9CA3AF",  # Cool silver
            "accent": "#A78BFA",     # Light purple
            "background": "#FFFFFF", # Pure white
            "text": "#374151",       # Slate gray
            "border": "#E5E7EB"      # Light border
        },
        "typography": {
            "heading_font": "Poppins",
            "body_font": "Nunito Sans"
        },
        "preview_image_url": "",
        "is_premium": True
    },
    {
        "id": "sunset-coral",
        "name": "Sunset & Coral",
        "theme_type": "vibrant",
        "description": "Energetic warmth with sunset orange and vibrant coral",
        "colors": {
            "primary": "#EA580C",    # Sunset orange
            "secondary": "#FB7185",  # Coral pink
            "accent": "#FED7AA",     # Peach
            "background": "#FFFBEB", # Warm white
            "text": "#92400E",       # Deep orange
            "border": "#FDE68A"      # Light yellow
        },
        "typography": {
            "heading_font": "Montserrat",
            "body_font": "Roboto"
        },
        "preview_image_url": "",
        "is_premium": False
    },
    {
        "id": "midnight-rose-gold",
        "name": "Midnight & Rose Gold",
        "theme_type": "elegant",
        "description": "Dramatic elegance with midnight blue and rose gold luxury",
        "colors": {
            "primary": "#1E1B4B",    # Midnight blue
            "secondary": "#F472B6",  # Rose gold
            "accent": "#FBBF24",     # Gold accent
            "background": "#F1F5F9", # Light gray
            "text": "#0F172A",       # Almost black
            "border": "#CBD5E1"      # Silver border
        },
        "typography": {
            "heading_font": "Crimson Text",
            "body_font": "Source Serif Pro"
        },
        "preview_image_url": "",
        "is_premium": True
    }
]

# Hosting packages
HOSTING_PACKAGES = [
    {
        "id": "starter",
        "tier": "starter",
        "name": "Starter Package",
        "description": "Perfect for small family raffles",
        "price_monthly": 9.99,
        "price_yearly": 99.99,
        "features": [
            {"name": "Up to 5 betting categories", "description": "Basic betting options", "included": True},
            {"name": "Custom subdomain", "description": "yourname.base2ml.com", "included": True},
            {"name": "Basic themes", "description": "3 color themes", "included": True},
            {"name": "Payment integration", "description": "Venmo, PayPal, CashApp", "included": True},
            {"name": "Email support", "description": "Response within 24 hours", "included": True}
        ],
        "popular": False
    },
    {
        "id": "professional",
        "tier": "professional", 
        "name": "Professional Package",
        "description": "Advanced features for serious raffles",
        "price_monthly": 19.99,
        "price_yearly": 199.99,
        "features": [
            {"name": "Up to 15 betting categories", "description": "Extended betting options", "included": True},
            {"name": "Premium themes", "description": "6 professional themes", "included": True},
            {"name": "Custom branding", "description": "Logo and color customization", "included": True},
            {"name": "Analytics dashboard", "description": "Track participation and payments", "included": True},
            {"name": "Priority support", "description": "Response within 4 hours", "included": True},
            {"name": "Social media integration", "description": "Share on Facebook, Instagram", "included": True}
        ],
        "popular": True
    },
    {
        "id": "premium",
        "tier": "premium",
        "name": "Premium Package", 
        "description": "Everything you need for large-scale raffles",
        "price_monthly": 39.99,
        "price_yearly": 399.99,
        "features": [
            {"name": "Unlimited betting categories", "description": "No limits on betting options", "included": True},
            {"name": "Custom domain", "description": "Use your own domain name", "included": True},
            {"name": "Advanced customization", "description": "Full CSS control", "included": True},
            {"name": "Multi-admin support", "description": "Multiple users can manage", "included": True},
            {"name": "Phone & email support", "description": "Immediate response", "included": True},
            {"name": "White-label options", "description": "Remove Base2ML branding", "included": True},
            {"name": "API access", "description": "Integrate with external systems", "included": True}
        ],
        "popular": False
    }
]

# API Routes

@app.get("/")
async def root():
    return {"message": "Baby Raffle Site Builder API v2.0", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# OAuth endpoints
@app.get("/auth/google")
async def google_login():
    """Initiate Google OAuth login"""
    auth_url = "https://accounts.google.com/o/oauth2/auth"
    redirect_uri = f"{BASE_URL}/auth/callback"
    
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "scope": "email profile",
        "response_type": "code",
        "access_type": "offline"
    }
    
    url = f"{auth_url}?{urlencode(params)}"
    return {"auth_url": url}

@app.get("/auth/callback")
async def oauth_callback(code: str, state: Optional[str] = None):
    """Handle OAuth callback"""
    try:
        # Exchange code for token
        token_data = await exchange_code_for_token(code)
        access_token = token_data["access_token"]
        
        # Get user info
        user_info = await get_user_info(access_token)
        
        # Store user in database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        user_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT INTO users (id, email, name, picture, provider)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            picture = EXCLUDED.picture,
            updated_at = CURRENT_TIMESTAMP
            RETURNING id
        ''', (user_id, user_info['email'], user_info['name'], 
              user_info.get('picture', ''), 'google'))
        
        result = cursor.fetchone()
        user_id = result['id']
        
        conn.commit()
        conn.close()
        
        # Create JWT token
        jwt_token = create_jwt_token({
            'id': user_id,
            'email': user_info['email'],
            'name': user_info['name']
        })
        
        # Redirect to frontend with token
        return RedirectResponse(
            url=f"{FRONTEND_URL}?token={jwt_token}&success=true"
        )
        
    except Exception as e:
        return RedirectResponse(
            url=f"{FRONTEND_URL}?error=auth_failed&message={str(e)}"
        )

@app.get("/auth/user")
async def get_user(current_user: Dict = Depends(get_current_user)):
    """Get current user profile"""
    return {
        "id": current_user["user_id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "site_id": current_user.get("site_id")
    }

# Site builder endpoints
@app.get("/api/builder/themes")
async def get_themes():
    """Get available themes"""
    return THEMES

@app.get("/api/packages")
async def get_packages():
    """Get hosting packages"""
    return HOSTING_PACKAGES

@app.post("/api/builder/create")
async def create_site_session(data: SiteBuilderData):
    """Create site builder session"""
    session_id = str(uuid.uuid4())
    
    # Store session data temporarily
    session_data = {
        "session_id": session_id,
        "theme": data.theme,
        "content": data.content,
        "images": data.images,
        "betting_cards": data.betting_cards,
        "payment_info": data.payment_info,
        "created_at": datetime.utcnow().isoformat()
    }
    
    with open(f'sites/session_{session_id}.json', 'w') as f:
        json.dump(session_data, f, indent=2)
    
    return {"session_id": session_id, "status": "created"}

@app.post("/api/builder/save-and-create-account")
async def save_and_create_account(data: CreateAccountData):
    """Complete site creation with OAuth account"""
    try:
        # Sanitize subdomain
        subdomain = data.subdomain.lower().strip()
        subdomain = re.sub(r'[^a-z0-9-]', '', subdomain)
        subdomain = re.sub(r'^-+|-+$', '', subdomain)
        subdomain = re.sub(r'-{2,}', '-', subdomain)
        
        if len(subdomain) < 3:
            raise HTTPException(status_code=400, detail="Subdomain must be at least 3 characters")
        
        # Exchange OAuth code
        token_data = await exchange_code_for_token(data.oauth_code)
        user_info = await get_user_info(token_data["access_token"])
        
        # Create user
        conn = get_db_connection()
        cursor = conn.cursor()
        
        user_id = str(uuid.uuid4())
        site_id = str(uuid.uuid4())
        
        # Check subdomain availability
        cursor.execute('SELECT id FROM sites WHERE subdomain = %s', (subdomain,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Subdomain already taken")
        
        # Create user
        cursor.execute('''
            INSERT INTO users (id, email, name, picture, provider)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            picture = EXCLUDED.picture,
            updated_at = CURRENT_TIMESTAMP
            RETURNING id
        ''', (user_id, user_info['email'], user_info['name'], 
              user_info.get('picture', ''), 'google'))
        
        result = cursor.fetchone()
        user_id = result['id']
        
        # Create site
        site_config = {
            "subdomain": subdomain,
            "package": data.selected_package,
            "user_id": user_id,
            "status": "active"
        }
        
        cursor.execute('''
            INSERT INTO sites (id, user_id, subdomain, package_tier, configuration, status)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (site_id, user_id, subdomain, data.selected_package, 
              json.dumps(site_config), "active"))
        
        conn.commit()
        conn.close()
        
        # Create site files
        site_dir = f"sites/{subdomain}"
        os.makedirs(site_dir, exist_ok=True)
        
        # Save configuration
        with open(f"{site_dir}/config.json", 'w') as f:
            json.dump(site_config, f, indent=2)
        
        # Generate basic HTML
        html_content = generate_site_html(subdomain, site_config)
        with open(f"{site_dir}/index.html", 'w') as f:
            f.write(html_content)
        
        # Create JWT with site access
        jwt_token = create_jwt_token({
            'id': user_id,
            'email': user_info['email'],
            'name': user_info['name']
        }, site_id)
        
        return {
            "success": True,
            "site_id": site_id,
            "subdomain": subdomain,
            "preview_url": f"https://{subdomain}.base2ml.com",
            "admin_url": f"https://{subdomain}.base2ml.com/admin",
            "access_token": jwt_token,
            "user": {
                "id": user_id,
                "email": user_info['email'],
                "name": user_info['name']
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/admin/{site_id}")
async def admin_portal(site_id: str, current_user: Dict = Depends(get_current_user)):
    """Admin portal access"""
    # Verify user owns this site
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM sites WHERE id = %s AND user_id = %s', 
                   (site_id, current_user["user_id"]))
    site = cursor.fetchone()
    conn.close()
    
    if not site:
        raise HTTPException(status_code=404, detail="Site not found or access denied")
    
    return HTMLResponse(content=generate_admin_html(site_id, site), status_code=200)

def generate_site_html(subdomain: str, config: Dict) -> str:
    """Generate basic site HTML"""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Baby Raffle - {subdomain}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; }}
        .container {{ max-width: 800px; margin: 0 auto; }}
        .header {{ text-align: center; margin-bottom: 40px; }}
        .betting-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }}
        .betting-card {{ border: 1px solid #ddd; padding: 20px; border-radius: 8px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Baby Raffle</h1>
            <p>Created with Base2ML Site Builder</p>
        </div>
        <div class="betting-grid">
            <div class="betting-card">
                <h3>Birth Date</h3>
                <p>Guess when the baby will arrive!</p>
                <button>Place Bet - $5</button>
            </div>
            <div class="betting-card">
                <h3>Birth Weight</h3>
                <p>How much will the little one weigh?</p>
                <button>Place Bet - $5</button>
            </div>
        </div>
    </div>
</body>
</html>"""

def generate_admin_html(site_id: str, site_data: tuple) -> str:
    """Generate admin portal HTML"""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Portal - {site_data[2]}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; }}
        .header {{ background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }}
        .dashboard {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }}
        .card {{ background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Admin Portal</h1>
            <p>Managing: {site_data[2]}.base2ml.com</p>
        </div>
        <div class="dashboard">
            <div class="card">
                <h3>Site Stats</h3>
                <p>Status: Active</p>
                <p>Package: {site_data[3]}</p>
                <p>Created: {site_data[6]}</p>
            </div>
            <div class="card">
                <h3>Quick Actions</h3>
                <button onclick="window.open('/{site_data[2]}', '_blank')">View Site</button>
                <button onclick="editSettings()">Edit Settings</button>
                <button onclick="viewAnalytics()">View Analytics</button>
            </div>
        </div>
    </div>
    <script>
        function editSettings() {{
            alert('Settings panel coming soon!');
        }}
        function viewAnalytics() {{
            alert('Analytics dashboard coming soon!');
        }}
    </script>
</body>
</html>"""

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)