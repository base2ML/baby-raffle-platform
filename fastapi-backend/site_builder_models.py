"""
Site Builder Models and Schemas
Extended models for site customization, themes, and packages
"""
from pydantic import BaseModel, validator, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

# Site Builder Enums
class ThemeType(str, Enum):
    CLASSIC = "classic"
    MODERN = "modern" 
    PLAYFUL = "playful"
    ELEGANT = "elegant"
    MINIMALIST = "minimalist"

class PackageTier(str, Enum):
    STARTER = "starter"
    PROFESSIONAL = "professional"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"

class CustomizationStep(str, Enum):
    THEME = "theme"
    CONTENT = "content"
    IMAGES = "images"
    BETTING_CARDS = "betting_cards"
    PAYMENT_INFO = "payment_info"
    REVIEW = "review"

class BuilderStatus(str, Enum):
    DRAFT = "draft"
    PREVIEW = "preview"
    PUBLISHED = "published"
    ARCHIVED = "archived"

# Package Management Models
class PackageFeature(BaseModel):
    name: str
    description: str
    included: bool = True
    limit: Optional[int] = None  # e.g., max users, storage limit

class HostingPackage(BaseModel):
    id: str
    tier: PackageTier
    name: str
    description: str
    price_monthly: float
    price_yearly: float
    stripe_price_id_monthly: str
    stripe_price_id_yearly: str
    features: List[PackageFeature]
    popular: bool = False
    is_active: bool = True
    display_order: int = 0

class HostingPackageCreate(BaseModel):
    tier: PackageTier
    name: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=10, max_length=500)
    price_monthly: float = Field(..., gt=0, le=10000)
    price_yearly: float = Field(..., gt=0, le=100000)
    stripe_price_id_monthly: str
    stripe_price_id_yearly: str
    features: List[PackageFeature]
    popular: bool = False
    display_order: int = 0

class HostingPackageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_monthly: Optional[float] = None
    price_yearly: Optional[float] = None
    features: Optional[List[PackageFeature]] = None
    popular: Optional[bool] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None

# Theme System Models
class ColorPalette(BaseModel):
    primary: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$')
    secondary: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$')
    accent: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$')
    background: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$')
    text: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$')
    border: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$')

class Typography(BaseModel):
    heading_font: str = "Inter"
    body_font: str = "Inter"
    heading_size: str = "2.5rem"
    body_size: str = "1rem"
    line_height: float = 1.6

class ThemeConfig(BaseModel):
    id: str
    name: str
    theme_type: ThemeType
    description: str
    colors: ColorPalette
    typography: Typography
    border_radius: str = "0.5rem"
    shadow: str = "0 1px 3px rgba(0,0,0,0.1)"
    preview_image_url: str
    is_premium: bool = False

class CustomTheme(BaseModel):
    base_theme: ThemeType
    colors: Optional[ColorPalette] = None
    typography: Optional[Typography] = None
    custom_css: Optional[str] = None

# Site Content Models
class SiteContent(BaseModel):
    site_title: str = Field(..., min_length=2, max_length=100)
    welcome_message: str = Field(..., min_length=10, max_length=500)
    description: str = Field(..., min_length=20, max_length=1000)
    contact_email: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    
    # SEO
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    
    # Social
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    twitter_url: Optional[str] = None

class ImageAsset(BaseModel):
    id: str
    url: str
    alt_text: str
    caption: Optional[str] = None
    width: int
    height: int
    file_size: int
    content_type: str

class SiteImages(BaseModel):
    logo: Optional[ImageAsset] = None
    hero_image: Optional[ImageAsset] = None
    slideshow_images: List[ImageAsset] = []
    gallery_images: List[ImageAsset] = []

# Betting Card Customization
class BettingCardStyle(BaseModel):
    layout: str = "grid"  # grid, list, carousel
    card_style: str = "modern"  # modern, classic, minimal
    show_price: bool = True
    show_description: bool = True
    show_stats: bool = True
    animation_enabled: bool = True

class BettingCategory(BaseModel):
    id: Optional[str] = None
    category_key: str = Field(..., min_length=1, max_length=50)
    category_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    bet_price: float = Field(5.00, gt=0, le=1000)
    options: List[str] = Field(..., min_items=2, max_items=20)
    is_active: bool = True
    display_order: int = 0
    icon: Optional[str] = None  # Icon name or emoji
    color: Optional[str] = None  # Custom color for this category

# Payment Configuration
class PaymentInfo(BaseModel):
    venmo_username: Optional[str] = None
    paypal_email: Optional[str] = None
    cashapp_username: Optional[str] = None
    stripe_enabled: bool = False
    payment_instructions: Optional[str] = None
    minimum_bet_amount: float = 5.00
    maximum_bet_amount: float = 100.00

# Complete Site Builder Configuration
class SiteBuilderConfig(BaseModel):
    # Identification
    id: Optional[str] = None
    user_id: Optional[str] = None  # For anonymous builders before signup
    tenant_id: Optional[str] = None  # After account creation
    
    # Status and Progress
    status: BuilderStatus = BuilderStatus.DRAFT
    current_step: CustomizationStep = CustomizationStep.THEME
    completed_steps: List[CustomizationStep] = []
    
    # Configuration Sections
    theme: Optional[CustomTheme] = None
    content: Optional[SiteContent] = None
    images: Optional[SiteImages] = None
    betting_cards: List[BettingCategory] = []
    betting_style: Optional[BettingCardStyle] = None
    payment_info: Optional[PaymentInfo] = None
    
    # Package Selection
    selected_package: Optional[PackageTier] = None
    billing_cycle: str = "monthly"  # monthly, yearly
    
    # Metadata
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    preview_url: Optional[str] = None
    live_url: Optional[str] = None

class SiteBuilderCreate(BaseModel):
    """Initial site builder creation (anonymous)"""
    theme: CustomTheme
    content: SiteContent
    
class SiteBuilderUpdate(BaseModel):
    """Update any part of the site builder config"""
    current_step: Optional[CustomizationStep] = None
    theme: Optional[CustomTheme] = None
    content: Optional[SiteContent] = None
    images: Optional[SiteImages] = None
    betting_cards: Optional[List[BettingCategory]] = None
    betting_style: Optional[BettingCardStyle] = None
    payment_info: Optional[PaymentInfo] = None
    selected_package: Optional[PackageTier] = None
    billing_cycle: Optional[str] = None

class SiteBuilderResponse(BaseModel):
    """Complete site builder configuration response"""
    id: str
    status: BuilderStatus
    current_step: CustomizationStep
    completed_steps: List[CustomizationStep]
    config: SiteBuilderConfig
    preview_url: Optional[str]
    live_url: Optional[str]
    can_publish: bool
    created_at: datetime
    updated_at: datetime

# Save and Account Creation
class SaveSiteRequest(BaseModel):
    """Request to save site and create account"""
    site_config: SiteBuilderConfig
    subdomain: str = Field(..., min_length=3, max_length=63)
    owner_name: str = Field(..., min_length=2, max_length=255)
    oauth_provider: str  # "google" or "apple"
    oauth_code: str
    selected_package: PackageTier
    billing_cycle: str = "monthly"

class SaveSiteResponse(BaseModel):
    """Response after saving and account creation"""
    tenant_id: str
    site_id: str
    subdomain: str
    preview_url: str
    admin_url: str
    access_token: str
    expires_in: int

# Preview and Publishing
class PreviewRequest(BaseModel):
    config: SiteBuilderConfig

class PreviewResponse(BaseModel):
    preview_url: str
    expires_at: datetime

class PublishRequest(BaseModel):
    site_id: str
    final_config: SiteBuilderConfig

class PublishResponse(BaseModel):
    success: bool
    live_url: str
    admin_url: str
    message: str

# Analytics and Usage
class SiteAnalytics(BaseModel):
    site_id: str
    total_visits: int = 0
    unique_visitors: int = 0
    total_bets: int = 0
    total_revenue: float = 0.0
    popular_categories: List[Dict[str, Any]] = []
    daily_stats: List[Dict[str, Any]] = []
    last_updated: datetime

# Database Record Classes
class HostingPackageRecord:
    def __init__(self, record):
        self.id = str(record['id'])
        self.tier = record['tier']
        self.name = record['name']
        self.description = record['description']
        self.price_monthly = float(record['price_monthly'])
        self.price_yearly = float(record['price_yearly'])
        self.stripe_price_id_monthly = record['stripe_price_id_monthly']
        self.stripe_price_id_yearly = record['stripe_price_id_yearly']
        self.features = record['features'] or []
        self.popular = bool(record['popular'])
        self.is_active = bool(record['is_active'])
        self.display_order = int(record['display_order'])
        self.created_at = record['created_at']
        self.updated_at = record['updated_at']

class SiteBuilderRecord:
    def __init__(self, record):
        self.id = str(record['id'])
        self.user_id = record.get('user_id')
        self.tenant_id = record.get('tenant_id')
        self.status = record['status']
        self.current_step = record['current_step']
        self.completed_steps = record['completed_steps'] or []
        self.config = record['config'] or {}
        self.preview_url = record.get('preview_url')
        self.live_url = record.get('live_url')
        self.created_at = record['created_at']
        self.updated_at = record['updated_at']
        self.published_at = record.get('published_at')

# Default themes configuration
DEFAULT_THEMES = [
    {
        "id": "classic",
        "name": "Classic Baby Blue",
        "theme_type": "classic",
        "description": "Traditional baby raffle theme with soft blue tones",
        "colors": {
            "primary": "#3B82F6",
            "secondary": "#93C5FD",
            "accent": "#F59E0B",
            "background": "#FFFFFF",
            "text": "#1F2937",
            "border": "#E5E7EB"
        },
        "typography": {
            "heading_font": "Georgia",
            "body_font": "Arial",
            "heading_size": "2.5rem",
            "body_size": "1rem",
            "line_height": 1.6
        },
        "border_radius": "0.25rem",
        "shadow": "0 1px 3px rgba(0,0,0,0.1)",
        "preview_image_url": "/themes/classic-preview.png",
        "is_premium": False
    },
    {
        "id": "modern",
        "name": "Modern Pink",
        "theme_type": "modern",
        "description": "Contemporary design with vibrant pink accents",
        "colors": {
            "primary": "#EC4899",
            "secondary": "#F9A8D4",
            "accent": "#8B5CF6",
            "background": "#FFFFFF",
            "text": "#111827",
            "border": "#F3F4F6"
        },
        "typography": {
            "heading_font": "Inter",
            "body_font": "Inter",
            "heading_size": "2.25rem",
            "body_size": "0.875rem",
            "line_height": 1.7
        },
        "border_radius": "0.75rem",
        "shadow": "0 4px 6px rgba(0,0,0,0.05)",
        "preview_image_url": "/themes/modern-preview.png",
        "is_premium": False
    },
    {
        "id": "playful",
        "name": "Playful Rainbow",
        "theme_type": "playful",
        "description": "Fun and colorful theme perfect for celebrations",
        "colors": {
            "primary": "#F59E0B",
            "secondary": "#FDE68A",
            "accent": "#10B981",
            "background": "#FFFBEB",
            "text": "#92400E",
            "border": "#FED7AA"
        },
        "typography": {
            "heading_font": "Fredoka One",
            "body_font": "Open Sans",
            "heading_size": "2.75rem",
            "body_size": "1rem",
            "line_height": 1.6
        },
        "border_radius": "1rem",
        "shadow": "0 8px 25px rgba(245,158,11,0.15)",
        "preview_image_url": "/themes/playful-preview.png",
        "is_premium": True
    }
]