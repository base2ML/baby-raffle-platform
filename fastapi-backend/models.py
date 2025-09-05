"""
Multi-tenant database models and Pydantic schemas
"""
from pydantic import BaseModel, EmailStr, validator, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid
import re

# Enums for type safety
class TenantStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended" 
    TRIAL = "trial"
    INACTIVE = "inactive"

class UserRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    USER = "user"

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class OAuthProvider(str, Enum):
    GOOGLE = "google"
    APPLE = "apple"
    EMAIL = "email"

class SubscriptionPlan(str, Enum):
    TRIAL = "trial"
    BASIC = "basic" 
    PREMIUM = "premium"

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    INCOMPLETE = "incomplete"
    INCOMPLETE_EXPIRED = "incomplete_expired"
    TRIALING = "trialing"
    UNPAID = "unpaid"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELED = "canceled"
    PROCESSING = "processing"
    REQUIRES_ACTION = "requires_action"

# Pydantic Models for API requests/responses

class TenantCreate(BaseModel):
    subdomain: str = Field(..., min_length=3, max_length=63)
    name: str = Field(..., min_length=2, max_length=255)
    owner_email: EmailStr
    
    @validator('subdomain')
    def validate_subdomain(cls, v):
        # Must be valid DNS subdomain
        if not re.match(r'^[a-z0-9]([a-z0-9-]*[a-z0-9])?$', v.lower()):
            raise ValueError('Invalid subdomain format')
        
        # Reserved subdomains
        reserved = {'www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog', 'shop', 'mybabyraffle'}
        if v.lower() in reserved:
            raise ValueError('Subdomain is reserved')
        
        return v.lower()

class TenantResponse(BaseModel):
    id: str
    subdomain: str
    name: str
    owner_email: str
    status: TenantStatus
    subscription_plan: str
    created_at: datetime
    settings: Dict[str, Any]

class TenantSettings(BaseModel):
    # Branding
    primary_color: Optional[str] = "#2196f3"
    secondary_color: Optional[str] = "#f50057"
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    custom_css: Optional[str] = None
    
    # Configuration
    site_title: Optional[str] = "Baby Raffle"
    welcome_message: Optional[str] = "Welcome to our Baby Raffle!"
    footer_text: Optional[str] = None
    
    # Features
    allow_anonymous_betting: bool = True
    require_email_validation: bool = True
    max_bets_per_user: int = 10
    
    # Notifications
    admin_email_notifications: bool = True
    user_confirmation_emails: bool = True
    
    class Config:
        extra = "allow"  # Allow additional settings

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    role: UserRole = UserRole.USER

class UserResponse(BaseModel):
    id: str
    tenant_id: str
    email: str
    full_name: str
    role: UserRole
    status: UserStatus
    oauth_provider: Optional[OAuthProvider]
    created_at: datetime
    last_login: Optional[datetime]

class OAuthLoginRequest(BaseModel):
    provider: OAuthProvider
    tenant_subdomain: Optional[str] = None  # For onboarding flow

class OAuthCallbackRequest(BaseModel):
    code: str
    state: str
    provider: OAuthProvider

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    tenant_id: Optional[str] = None
    user_info: Optional[Dict[str, Any]] = None

# Raffle-specific models
class RaffleCategoryCreate(BaseModel):
    category_key: str = Field(..., min_length=1, max_length=50)
    category_name: str = Field(..., min_length=1, max_length=255) 
    description: Optional[str] = None
    bet_price: float = Field(5.00, gt=0, le=1000)
    options: List[str] = Field(..., min_items=1, max_items=20)
    is_active: bool = True
    display_order: int = 0
    
    @validator('category_key')
    def validate_category_key(cls, v):
        # Must be valid identifier
        if not re.match(r'^[a-z0-9_]+$', v.lower()):
            raise ValueError('Category key must contain only lowercase letters, numbers, and underscores')
        return v.lower()

class RaffleCategoryResponse(BaseModel):
    id: str
    tenant_id: str
    category_key: str
    category_name: str
    description: Optional[str]
    bet_price: float
    options: List[str]
    is_active: bool
    display_order: int
    created_at: datetime
    # Live stats
    total_amount: float = 0
    bet_count: int = 0

class BetCreate(BaseModel):
    category_id: str
    user_name: str = Field(..., min_length=2, max_length=255)
    user_email: EmailStr
    bet_value: str = Field(..., min_length=1, max_length=255)
    amount: float = Field(..., gt=0, le=1000)

class BetSubmission(BaseModel):
    user_name: str = Field(..., min_length=2, max_length=255)
    user_email: EmailStr
    bets: List[BetCreate] = Field(..., min_items=1, max_items=10)
    
    @validator('user_name')
    def validate_name(cls, v):
        # Allow letters, spaces, hyphens, apostrophes
        if not re.match(r"^[a-zA-Z\s\-']+$", v.strip()):
            raise ValueError('Name must contain only letters, spaces, hyphens, and apostrophes')
        return v.strip()

class BetResponse(BaseModel):
    id: str
    tenant_id: str
    category_id: str
    user_name: str
    user_email: str
    bet_value: str
    amount: float
    is_validated: bool
    validated_by: Optional[str]
    validated_at: Optional[datetime]
    created_at: datetime

class BetValidationRequest(BaseModel):
    bet_ids: List[str] = Field(..., min_items=1, max_items=100)
    validated_by: str = Field(..., min_length=1, max_length=100)

# Statistics models
class CategoryStats(BaseModel):
    category_id: str
    category_name: str
    category_key: str
    total_amount: float
    validated_amount: float
    bet_count: int
    validated_count: int

class TenantStats(BaseModel):
    tenant_id: str
    total_bets: int
    validated_bets: int
    total_amount: float
    validated_amount: float
    categories: List[CategoryStats]
    recent_bets: List[BetResponse]

# Onboarding flow models
class OnboardingStep1(BaseModel):
    """Step 1: Basic tenant information"""
    subdomain: str = Field(..., min_length=3, max_length=63)
    site_name: str = Field(..., min_length=2, max_length=255)
    owner_name: str = Field(..., min_length=2, max_length=255)

class OnboardingStep2(BaseModel):
    """Step 2: OAuth authentication"""
    provider: OAuthProvider
    auth_code: str

class OnboardingStep3(BaseModel):
    """Step 3: Raffle configuration"""
    categories: List[RaffleCategoryCreate] = Field(..., min_items=1, max_items=10)
    settings: TenantSettings

class OnboardingComplete(BaseModel):
    """Complete onboarding response"""
    tenant: TenantResponse
    user: UserResponse
    access_token: str
    setup_url: str  # URL to tenant's raffle site

# Error response models
class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    error_id: Optional[str] = None

class ValidationErrorResponse(BaseModel):
    error: str = "Validation failed"
    message: str
    details: List[Dict[str, Any]]

# Database record models (for internal use)
class TenantRecord:
    def __init__(self, record):
        self.id = str(record['id'])
        self.subdomain = record['subdomain']
        self.name = record['name']
        self.owner_email = record['owner_email'] 
        self.status = record['status']
        self.subscription_plan = record['subscription_plan']
        self.created_at = record['created_at']
        self.updated_at = record['updated_at']
        self.settings = record['settings'] or {}

class UserRecord:
    def __init__(self, record):
        self.id = str(record['id'])
        self.tenant_id = str(record['tenant_id'])
        self.email = record['email']
        self.full_name = record['full_name']
        self.oauth_provider = record['oauth_provider']
        self.oauth_id = record['oauth_id']
        self.role = record['role']
        self.status = record['status']
        self.created_at = record['created_at']
        self.updated_at = record['updated_at']
        self.last_login = record['last_login']

# Default categories for new tenants
DEFAULT_CATEGORIES = [
    {
        "category_key": "birth_date",
        "category_name": "Birth Date",
        "description": "What date will the baby arrive?",
        "bet_price": 5.00,
        "options": [
            "January 15", "January 16", "January 17", "January 18", 
            "January 19", "January 20", "Other date"
        ]
    },
    {
        "category_key": "birth_time", 
        "category_name": "Birth Time",
        "description": "What time will the baby arrive?",
        "bet_price": 5.00,
        "options": [
            "12:00 AM - 3:00 AM", "3:00 AM - 6:00 AM", 
            "6:00 AM - 9:00 AM", "9:00 AM - 12:00 PM",
            "12:00 PM - 3:00 PM", "3:00 PM - 6:00 PM",
            "6:00 PM - 9:00 PM", "9:00 PM - 12:00 AM"
        ]
    },
    {
        "category_key": "birth_weight",
        "category_name": "Birth Weight", 
        "description": "How much will the baby weigh?",
        "bet_price": 5.00,
        "options": [
            "Under 6 lbs", "6-7 lbs", "7-8 lbs", "8-9 lbs", "Over 9 lbs"
        ]
    },
    {
        "category_key": "head_circumference",
        "category_name": "Head Circumference",
        "description": "What will be the baby's head circumference?", 
        "bet_price": 5.00,
        "options": [
            "Under 13 inches", "13-14 inches", "14-15 inches", "Over 15 inches"
        ]
    },
    {
        "category_key": "birth_length",
        "category_name": "Birth Length",
        "description": "How long will the baby be?",
        "bet_price": 5.00,
        "options": [
            "Under 18 inches", "18-19 inches", "19-20 inches", 
            "20-21 inches", "Over 21 inches"
        ]
    },
    {
        "category_key": "doctor_initial",
        "category_name": "Doctor's Last Initial",
        "description": "What will be the delivering doctor's last initial?",
        "bet_price": 5.00,
        "options": [
            "A-E", "F-J", "K-O", "P-T", "U-Z"
        ]
    }
]

# Payment and Billing Models
class PaymentIntentCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Payment amount in dollars")
    currency: str = Field(default="usd", description="Payment currency")
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class PaymentIntentResponse(BaseModel):
    id: str
    client_secret: str
    amount: float
    currency: str
    status: PaymentStatus
    created_at: datetime

class SubscriptionCreate(BaseModel):
    plan: SubscriptionPlan
    payment_method_id: str
    trial_days: Optional[int] = None

class SubscriptionResponse(BaseModel):
    id: str
    tenant_id: str
    stripe_subscription_id: str
    plan: SubscriptionPlan
    status: SubscriptionStatus
    current_period_start: datetime
    current_period_end: datetime
    trial_end: Optional[datetime]
    created_at: datetime
    updated_at: datetime

class BillingPortalRequest(BaseModel):
    return_url: str

class BillingPortalResponse(BaseModel):
    url: str

class WebhookEvent(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]
    created: int

# File Upload Models
class FileUploadResponse(BaseModel):
    id: str
    filename: str
    original_filename: str
    url: str
    size: int
    content_type: str
    created_at: datetime

class SlideshowImageCreate(BaseModel):
    title: Optional[str] = None
    caption: Optional[str] = None
    display_order: int = 0
    is_active: bool = True

class SlideshowImageResponse(BaseModel):
    id: str
    tenant_id: str
    file_id: str
    title: Optional[str]
    caption: Optional[str]
    display_order: int
    is_active: bool
    url: str
    created_at: datetime

# Site Configuration Models
class SiteConfigUpdate(BaseModel):
    # Basic Info
    site_title: Optional[str] = None
    welcome_message: Optional[str] = None
    description: Optional[str] = None
    contact_email: Optional[str] = None
    
    # Branding
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    background_color: Optional[str] = None
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    
    # Features
    enable_slideshow: Optional[bool] = None
    enable_social_sharing: Optional[bool] = None
    enable_comments: Optional[bool] = None
    max_bets_per_user: Optional[int] = None
    
    # SEO
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    
    # Analytics
    google_analytics_id: Optional[str] = None
    facebook_pixel_id: Optional[str] = None
    
    class Config:
        extra = "allow"

class SiteConfigResponse(BaseModel):
    id: str
    tenant_id: str
    config: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

class DeploymentRequest(BaseModel):
    force_rebuild: bool = False
    config_only: bool = False

class DeploymentResponse(BaseModel):
    id: str
    tenant_id: str
    status: str
    deployment_url: Optional[str]
    build_log: Optional[str]
    created_at: datetime

# Database Record Models for New Features
class SubscriptionRecord:
    def __init__(self, record):
        self.id = str(record['id'])
        self.tenant_id = str(record['tenant_id'])
        self.stripe_customer_id = record['stripe_customer_id']
        self.stripe_subscription_id = record['stripe_subscription_id']
        self.plan = record['plan']
        self.status = record['status']
        self.current_period_start = record['current_period_start']
        self.current_period_end = record['current_period_end']
        self.trial_end = record['trial_end']
        self.created_at = record['created_at']
        self.updated_at = record['updated_at']

class PaymentRecord:
    def __init__(self, record):
        self.id = str(record['id'])
        self.tenant_id = str(record['tenant_id'])
        self.stripe_payment_intent_id = record['stripe_payment_intent_id']
        self.amount = float(record['amount'])
        self.currency = record['currency']
        self.status = record['status']
        self.description = record['description']
        self.metadata = record['metadata'] or {}
        self.created_at = record['created_at']
        self.updated_at = record['updated_at']

class FileRecord:
    def __init__(self, record):
        self.id = str(record['id'])
        self.tenant_id = str(record['tenant_id'])
        self.filename = record['filename']
        self.original_filename = record['original_filename']
        self.file_path = record['file_path']
        self.url = record['url']
        self.size = record['size']
        self.content_type = record['content_type']
        self.created_at = record['created_at']

class SiteConfigRecord:
    def __init__(self, record):
        self.id = str(record['id'])
        self.tenant_id = str(record['tenant_id'])
        self.config = record['config'] or {}
        self.created_at = record['created_at']
        self.updated_at = record['updated_at']