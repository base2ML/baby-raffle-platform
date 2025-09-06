#!/usr/bin/env python3
"""
Working Site Builder Server
Simplified server to get the site builder running quickly
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import uuid
import sqlite3
from datetime import datetime

# Initialize FastAPI app
app = FastAPI(
    title="Baby Raffle Site Builder API",
    description="Site builder backend API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001",
        "http://localhost:5173",
        "https://*.base2ml.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Basic models
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

class SiteBuilderCreate(BaseModel):
    theme: Dict[str, Any]
    content: Dict[str, Any]

class SiteBuilderUpdate(BaseModel):
    current_step: Optional[str] = None
    theme: Optional[Dict[str, Any]] = None
    content: Optional[Dict[str, Any]] = None
    images: Optional[Dict[str, Any]] = None
    betting_cards: Optional[List[Dict[str, Any]]] = None
    payment_info: Optional[Dict[str, Any]] = None
    selected_package: Optional[str] = None

# Mock data
THEMES = [
    {
        "id": "sage_terracotta",
        "name": "Sage & Terracotta",
        "theme_type": "earthy",
        "description": "Warm earthy tones with sophisticated sage green and rich terracotta",
        "colors": {
            "primary": "#87A96B",      # Sage Green
            "secondary": "#C65D07",    # Terracotta
            "accent": "#F4A460",       # Sandy Brown
            "background": "#FEFDF7",   # Warm White
            "text": "#2F4F4F",         # Dark Slate Gray
            "border": "#D2D2AA"        # Light Sage
        },
        "typography": {
            "heading_font": "Playfair Display",
            "body_font": "Source Sans Pro"
        },
        "preview_image_url": "/themes/sage-terracotta.png",
        "is_premium": False
    },
    {
        "id": "navy_gold",
        "name": "Navy & Gold",
        "theme_type": "elegant",
        "description": "Timeless elegance with deep navy blue and luxurious gold accents",
        "colors": {
            "primary": "#1E3A8A",      # Navy Blue
            "secondary": "#D4AF37",    # Gold
            "accent": "#F7E98E",       # Light Gold
            "background": "#FFFFFF",   # Pure White
            "text": "#1F2937",         # Charcoal
            "border": "#E5E7EB"        # Light Gray
        },
        "typography": {
            "heading_font": "Cormorant Garamond",
            "body_font": "Inter"
        },
        "preview_image_url": "/themes/navy-gold.png",
        "is_premium": False
    },
    {
        "id": "forest_cream",
        "name": "Forest & Cream",
        "theme_type": "natural",
        "description": "Fresh and natural with deep forest green and warm cream tones",
        "colors": {
            "primary": "#2F4F2F",      # Forest Green
            "secondary": "#F5F5DC",    # Beige/Cream
            "accent": "#8FBC8F",       # Light Forest
            "background": "#FFFEF7",   # Off White
            "text": "#2D3748",         # Dark Gray
            "border": "#E2E8F0"        # Light Border
        },
        "typography": {
            "heading_font": "Merriweather",
            "body_font": "Open Sans"
        },
        "preview_image_url": "/themes/forest-cream.png",
        "is_premium": False
    },
    {
        "id": "plum_silver",
        "name": "Plum & Silver",
        "theme_type": "sophisticated",
        "description": "Rich and sophisticated with deep plum and elegant silver highlights",
        "colors": {
            "primary": "#8E4585",      # Plum
            "secondary": "#C0C0C0",    # Silver
            "accent": "#DDA0DD",       # Light Plum
            "background": "#FAFAFA",   # Light Gray
            "text": "#374151",         # Dark Text
            "border": "#D1D5DB"        # Medium Gray
        },
        "typography": {
            "heading_font": "Lora",
            "body_font": "Nunito Sans"
        },
        "preview_image_url": "/themes/plum-silver.png",
        "is_premium": True
    },
    {
        "id": "sunset_coral",
        "name": "Sunset & Coral",
        "theme_type": "vibrant",
        "description": "Warm and inviting with sunset orange and soft coral pink",
        "colors": {
            "primary": "#FF6B35",      # Sunset Orange
            "secondary": "#FF7F7F",    # Coral Pink
            "accent": "#FFD23F",       # Golden Yellow
            "background": "#FFFCF7",   # Warm White
            "text": "#2D3748",         # Dark Gray
            "border": "#FED7AA"        # Light Peach
        },
        "typography": {
            "heading_font": "Poppins",
            "body_font": "Roboto"
        },
        "preview_image_url": "/themes/sunset-coral.png",
        "is_premium": False
    },
    {
        "id": "midnight_rose",
        "name": "Midnight & Rose Gold",
        "theme_type": "luxury",
        "description": "Luxurious and dramatic with midnight blue and rose gold accents",
        "colors": {
            "primary": "#191970",      # Midnight Blue
            "secondary": "#E8B4B8",    # Rose Gold
            "accent": "#F8C8DC",       # Light Rose
            "background": "#FFFFFF",   # Pure White
            "text": "#1A202C",         # Almost Black
            "border": "#E2E8F0"        # Light Gray
        },
        "typography": {
            "heading_font": "Crimson Text",
            "body_font": "Source Sans Pro"
        },
        "preview_image_url": "/themes/midnight-rose.png",
        "is_premium": True
    }
]

PACKAGES = [
    {
        "id": "starter",
        "tier": "starter",
        "name": "Starter", 
        "description": "Perfect for small family raffles with essential features",
        "price_monthly": 9.99,
        "price_yearly": 99.99,
        "features": [
            {"name": "Custom subdomain", "description": "yourname.base2ml.com", "included": True},
            {"name": "Up to 5 betting categories", "description": "Basic betting options", "included": True},
            {"name": "Basic themes", "description": "3 professional themes", "included": True}
        ],
        "popular": False
    },
    {
        "id": "professional", 
        "tier": "professional",
        "name": "Professional",
        "description": "Most popular choice with advanced customization", 
        "price_monthly": 19.99,
        "price_yearly": 199.99,
        "features": [
            {"name": "Custom subdomain", "description": "yourname.base2ml.com", "included": True},
            {"name": "Up to 15 betting categories", "description": "Advanced betting options", "included": True}, 
            {"name": "Premium themes", "description": "8+ professional themes", "included": True},
            {"name": "Custom logo", "description": "Upload your branding", "included": True}
        ],
        "popular": True
    },
    {
        "id": "premium",
        "tier": "premium", 
        "name": "Premium",
        "description": "Everything you need with custom domain",
        "price_monthly": 39.99,
        "price_yearly": 399.99,
        "features": [
            {"name": "Custom domain", "description": "Use your own domain", "included": True},
            {"name": "Unlimited betting categories", "description": "No limits", "included": True},
            {"name": "All premium themes", "description": "Full theme library", "included": True},
            {"name": "Priority support", "description": "Phone and chat support", "included": True}
        ],
        "popular": False
    }
]

# In-memory storage (replace with database in production)
builders = {}

# Routes
@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.get("/api/builder/themes", response_model=List[ThemeConfig])
async def get_themes():
    return [ThemeConfig(**theme) for theme in THEMES]

@app.get("/api/packages", response_model=List[HostingPackage]) 
async def get_packages():
    return [HostingPackage(**pkg) for pkg in PACKAGES]

@app.post("/api/builder/create")
async def create_builder(data: SiteBuilderCreate):
    builder_id = str(uuid.uuid4())
    
    config = {
        "id": builder_id,
        "status": "draft",
        "current_step": "theme", 
        "completed_steps": [],
        "theme": data.theme,
        "content": data.content,
        "created_at": datetime.now().isoformat()
    }
    
    builders[builder_id] = config
    
    return {
        "id": builder_id,
        "status": "draft",
        "current_step": "theme",
        "completed_steps": [],
        "config": config,
        "can_publish": False,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }

@app.get("/api/builder/{builder_id}")
async def get_builder(builder_id: str):
    if builder_id not in builders:
        raise HTTPException(status_code=404, detail="Builder not found")
    
    config = builders[builder_id]
    return {
        "id": builder_id,
        "status": config["status"],
        "current_step": config["current_step"], 
        "completed_steps": config["completed_steps"],
        "config": config,
        "preview_url": f"https://preview.base2ml.com/{builder_id}",
        "can_publish": False,
        "created_at": config["created_at"],
        "updated_at": datetime.now().isoformat()
    }

@app.put("/api/builder/{builder_id}")
async def update_builder(builder_id: str, data: SiteBuilderUpdate):
    if builder_id not in builders:
        raise HTTPException(status_code=404, detail="Builder not found")
    
    config = builders[builder_id]
    
    # Update fields
    if data.current_step:
        config["current_step"] = data.current_step
    if data.theme:
        config["theme"] = data.theme
    if data.content:
        config["content"] = data.content
    if data.images:
        config["images"] = data.images
    if data.betting_cards:
        config["betting_cards"] = data.betting_cards
    if data.payment_info:
        config["payment_info"] = data.payment_info
    if data.selected_package:
        config["selected_package"] = data.selected_package
    
    config["updated_at"] = datetime.now().isoformat()
    
    return {
        "id": builder_id,
        "status": config["status"],
        "current_step": config["current_step"],
        "completed_steps": config["completed_steps"], 
        "config": config,
        "preview_url": f"https://preview.base2ml.com/{builder_id}",
        "can_publish": True,
        "created_at": config["created_at"],
        "updated_at": config["updated_at"]
    }

@app.post("/api/builder/{builder_id}/preview")
async def generate_preview(builder_id: str):
    if builder_id not in builders:
        raise HTTPException(status_code=404, detail="Builder not found")
    
    return {
        "preview_url": f"https://preview.base2ml.com/{builder_id}",
        "expires_at": datetime.now().isoformat()
    }

@app.post("/api/builder/save-and-create-account")
async def save_and_create_account(data: dict):
    try:
        # Validate subdomain
        subdomain = data.get("subdomain", "").strip()
        if not subdomain:
            raise HTTPException(status_code=400, detail="Subdomain is required")
        
        # Sanitize subdomain
        import re
        subdomain = re.sub(r'[^a-z0-9-]', '', subdomain.lower())
        subdomain = re.sub(r'^-+|-+$', '', subdomain)  # Remove leading/trailing hyphens
        subdomain = re.sub(r'-{2,}', '-', subdomain)  # Replace multiple hyphens
        subdomain = subdomain[:63]  # Max length
        
        if len(subdomain) < 3:
            raise HTTPException(status_code=400, detail="Subdomain must be at least 3 characters after sanitization")
        
        # Generate IDs
        tenant_id = str(uuid.uuid4())
        site_id = str(uuid.uuid4())
        access_token = f"token_{uuid.uuid4().hex[:16]}"
        
        # Get full site configuration
        site_config = data.get("site_config", {})
        
        # Create site data structure
        site_data = {
            "tenant_id": tenant_id,
            "site_id": site_id,
            "subdomain": subdomain,
            "created_at": datetime.now().isoformat(),
            "status": "active",
            "config": {
                "theme": site_config.get("theme", {}),
                "content": site_config.get("content", {}),
                "betting_cards": site_config.get("betting_cards", []),
                "payment_info": site_config.get("payment_info", {}),
                "images": site_config.get("images", {}),
                "package": data.get("selected_package", "starter")
            }
        }
        
        # Save to file system (in production, this would be a database)
        import os
        sites_dir = "generated_sites"
        os.makedirs(sites_dir, exist_ok=True)
        
        site_file = os.path.join(sites_dir, f"{subdomain}.json")
        with open(site_file, 'w') as f:
            json.dump(site_data, f, indent=2)
        
        # Create a simple HTML page for demonstration
        html_content = generate_site_html(site_data)
        html_file = os.path.join(sites_dir, f"{subdomain}.html")
        with open(html_file, 'w') as f:
            f.write(html_content)
        
        print(f"✅ Site created successfully: {subdomain}")
        print(f"📁 Configuration saved: {site_file}")
        print(f"🌐 HTML generated: {html_file}")
        
        return {
            "tenant_id": tenant_id,
            "site_id": site_id,
            "subdomain": subdomain,
            "preview_url": f"https://{subdomain}.base2ml.com",
            "admin_url": f"https://{subdomain}.base2ml.com/admin",
            "access_token": access_token,
            "expires_in": 86400,
            "status": "created",
            "created_at": site_data["created_at"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Site creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create site: {str(e)}")

def generate_site_html(site_data):
    """Generate a simple HTML page for the created site"""
    config = site_data.get("config", {})
    theme = config.get("theme", {})
    content = config.get("content", {})
    betting_cards = config.get("betting_cards", [])
    payment_info = config.get("payment_info", {})
    
    colors = theme.get("colors", {})
    primary = colors.get("primary", "#3B82F6")
    secondary = colors.get("secondary", "#93C5FD")
    background = colors.get("background", "#FFFFFF")
    text = colors.get("text", "#1F2937")
    
    site_title = content.get("siteTitle", "Baby Raffle")
    welcome_message = content.get("welcomeMessage", "Welcome to our Baby Raffle!")
    description = content.get("description", "Join our exciting baby raffle!")
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{site_title}</title>
    <style>
        body {{ 
            font-family: Arial, sans-serif; 
            margin: 0; 
            background: {background}; 
            color: {text};
            line-height: 1.6;
        }}
        .container {{ 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 2rem;
        }}
        .header {{ 
            text-align: center; 
            background: linear-gradient(135deg, {primary}, {secondary}); 
            color: white; 
            padding: 3rem 2rem;
            border-radius: 12px;
            margin-bottom: 3rem;
        }}
        .header h1 {{ 
            margin: 0; 
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }}
        .header p {{ 
            font-size: 1.2rem; 
            margin: 0;
        }}
        .betting-grid {{ 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 2rem; 
            margin: 3rem 0;
        }}
        .betting-card {{ 
            border: 2px solid {primary}; 
            border-radius: 12px; 
            padding: 2rem; 
            background: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }}
        .betting-card h3 {{ 
            color: {primary}; 
            margin-top: 0;
            font-size: 1.3rem;
        }}
        .betting-option {{ 
            background: {secondary}20; 
            padding: 0.5rem 1rem; 
            margin: 0.5rem 0; 
            border-radius: 6px;
        }}
        .price {{ 
            font-weight: bold; 
            color: {primary}; 
            font-size: 1.2rem;
        }}
        .payment-info {{ 
            background: {primary}10; 
            padding: 2rem; 
            border-radius: 12px; 
            margin: 3rem 0;
        }}
        .demo-notice {{
            background: #fef3c7;
            border: 2px solid #f59e0b;
            padding: 1rem;
            border-radius: 8px;
            margin: 2rem 0;
            text-align: center;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="demo-notice">
            🎉 <strong>Site Successfully Created!</strong> This is a demonstration of your configured baby raffle site.
        </div>
        
        <div class="header">
            <h1>{site_title}</h1>
            <p>{welcome_message}</p>
            <p>{description}</p>
        </div>
        
        <div class="betting-grid">
"""
    
    for card in betting_cards:
        html += f"""
            <div class="betting-card">
                <h3>{card.get('category', 'Category')}</h3>
                <div class="price">${card.get('price', 5)} per bet</div>
"""
        for option in card.get('options', []):
            html += f'<div class="betting-option">{option}</div>'
        html += "</div>"
    
    html += f"""
        </div>
        
        <div class="payment-info">
            <h3>Payment Information</h3>
            <p><strong>Instructions:</strong> {payment_info.get('instructions', 'Contact organizer for payment details')}</p>
"""
    
    if payment_info.get('venmo'):
        html += f"<p><strong>Venmo:</strong> {payment_info['venmo']}</p>"
    if payment_info.get('paypal'):
        html += f"<p><strong>PayPal:</strong> {payment_info['paypal']}</p>"
    if payment_info.get('cashapp'):
        html += f"<p><strong>CashApp:</strong> {payment_info['cashapp']}</p>"
    
    html += f"""
        </div>
        
        <div style="text-align: center; margin: 3rem 0; padding: 2rem; border-top: 1px solid #e5e7eb;">
            <p><strong>Site Details:</strong></p>
            <p>Subdomain: {site_data['subdomain']}.base2ml.com</p>
            <p>Created: {site_data['created_at']}</p>
            <p>Theme: {theme.get('name', 'Custom Theme')}</p>
            <p>Package: {config.get('package', 'starter').title()}</p>
        </div>
    </div>
</body>
</html>"""
    
    return html

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)