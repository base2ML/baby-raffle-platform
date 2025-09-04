"""
Multi-tenant Baby Raffle SaaS Application
FastAPI backend with OAuth2 authentication and tenant isolation
"""
from fastapi import FastAPI, HTTPException, status, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.security import HTTPBearer
import logging
import os
from typing import List, Optional, Dict, Any
from datetime import datetime

from .database import db_manager
from .middleware import (
    tenant_context_middleware, auth_middleware, rate_limit_middleware,
    get_tenant_context, get_current_tenant, require_tenant,
    get_current_user, require_user, require_role
)
from .oauth import oauth_service
from .tenant_service import tenant_service
from .models import (
    TenantCreate, TenantResponse, TenantSettings, UserCreate, UserResponse,
    OAuthLoginRequest, OAuthCallbackRequest, TokenResponse,
    RaffleCategoryCreate, RaffleCategoryResponse,
    BetCreate, BetSubmission, BetResponse, BetValidationRequest,
    TenantStats, ErrorResponse, OAuthProvider,
    TenantRecord, UserRecord
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Baby Raffle SaaS",
    description="Multi-tenant baby betting platform with OAuth2 authentication",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Security
security = HTTPBearer()

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://*.base2ml.com",
        "https://mybabyraffle.base2ml.com",
        "http://localhost:3000",  # Development frontend
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Custom middleware
@app.middleware("http")
async def tenant_middleware(request: Request, call_next):
    return await tenant_context_middleware(app)(request, call_next)

@app.middleware("http") 
async def auth_middleware_handler(request: Request, call_next):
    # Process authentication and add user to request state
    try:
        user = await auth_middleware.process_authentication(request)
        request.state.user = user
    except HTTPException:
        request.state.user = None
    
    response = await call_next(request)
    return response

@app.middleware("http")
async def rate_limit_middleware_handler(request: Request, call_next):
    await rate_limit_middleware.check_rate_limit(request)
    response = await call_next(request)
    return response

# Health check endpoint
@app.get("/health", include_in_schema=False)
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Root endpoint
@app.get("/", include_in_schema=False)
async def root():
    return {"message": "Baby Raffle SaaS API", "version": "2.0.0"}

# ============================================================================
# OAUTH AUTHENTICATION ENDPOINTS
# ============================================================================

@app.post("/api/auth/login", response_model=Dict[str, str])
async def oauth_login(request: OAuthLoginRequest):
    """Generate OAuth authorization URL for login"""
    try:
        # Build redirect URI based on tenant context
        if request.tenant_subdomain:
            redirect_uri = f"https://mybabyraffle.base2ml.com/auth/callback"
        else:
            redirect_uri = f"https://api.base2ml.com/api/auth/callback"
        
        auth_url = oauth_service.get_authorization_url(
            provider=request.provider,
            redirect_uri=redirect_uri,
            tenant_subdomain=request.tenant_subdomain
        )
        
        return {"authorization_url": auth_url}
        
    except Exception as e:
        logger.error(f"OAuth login failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate authorization URL"
        )

@app.post("/api/auth/callback", response_model=TokenResponse)
async def oauth_callback(request: OAuthCallbackRequest):
    """Handle OAuth callback and create/authenticate user"""
    try:
        # Determine redirect URI based on provider flow
        redirect_uri = "https://mybabyraffle.base2ml.com/auth/callback"
        
        # Complete OAuth flow
        result = await oauth_service.handle_oauth_callback(
            provider=request.provider,
            code=request.code,
            state=request.state,
            redirect_uri=redirect_uri
        )
        
        return TokenResponse(
            access_token=result["access_token"],
            token_type=result["token_type"],
            expires_in=result["expires_in"],
            tenant_id=result["tenant"]["id"] if result["tenant"] else None,
            user_info={
                "user": result["user"],
                "tenant": result["tenant"],
                "is_new_user": result["is_new_user"]
            }
        )
        
    except Exception as e:
        logger.error(f"OAuth callback failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth authentication failed"
        )

# ============================================================================
# TENANT MANAGEMENT ENDPOINTS
# ============================================================================

@app.post("/api/tenant/create", response_model=Dict[str, Any])
async def create_tenant(
    tenant_data: TenantCreate,
    owner_name: str,
    oauth_provider: Optional[str] = None,
    oauth_id: Optional[str] = None
):
    """Create new tenant with owner user"""
    try:
        result = await tenant_service.create_tenant_with_owner(
            tenant_data=tenant_data,
            owner_name=owner_name,
            oauth_provider=oauth_provider,
            oauth_id=oauth_id
        )
        
        tenant = result["tenant"]
        user = result["user"]
        
        return {
            "success": True,
            "tenant": {
                "id": tenant.id,
                "subdomain": tenant.subdomain,
                "name": tenant.name,
                "status": tenant.status
            },
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role
            },
            "setup_url": result["setup_url"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Tenant creation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create tenant"
        )

@app.get("/api/tenant/validate-subdomain/{subdomain}")
async def validate_subdomain(subdomain: str):
    """Check if subdomain is available"""
    try:
        is_available = await tenant_service.validate_subdomain(subdomain)
        return {"available": is_available}
        
    except Exception as e:
        logger.error(f"Subdomain validation failed: {e}")
        return {"available": False}

@app.get("/api/tenant/info", response_model=TenantResponse)
async def get_tenant_info(tenant: TenantRecord = Depends(require_tenant)):
    """Get current tenant information"""
    return TenantResponse(
        id=tenant.id,
        subdomain=tenant.subdomain,
        name=tenant.name,
        owner_email=tenant.owner_email,
        status=tenant.status,
        subscription_plan=tenant.subscription_plan,
        created_at=tenant.created_at,
        settings=tenant.settings
    )

@app.put("/api/tenant/settings", response_model=TenantResponse)
async def update_tenant_settings(
    settings: TenantSettings,
    tenant: TenantRecord = Depends(require_tenant),
    user: UserRecord = Depends(require_role("admin"))
):
    """Update tenant settings (admin+ required)"""
    updated_tenant = await tenant_service.update_tenant_settings(
        tenant_id=tenant.id,
        settings=settings
    )
    
    return TenantResponse(
        id=updated_tenant.id,
        subdomain=updated_tenant.subdomain,
        name=updated_tenant.name,
        owner_email=updated_tenant.owner_email,
        status=updated_tenant.status,
        subscription_plan=updated_tenant.subscription_plan,
        created_at=updated_tenant.created_at,
        settings=updated_tenant.settings
    )

@app.get("/api/tenant/stats", response_model=TenantStats)
async def get_tenant_stats(
    tenant: TenantRecord = Depends(require_tenant),
    user: UserRecord = Depends(require_user)
):
    """Get tenant statistics and analytics"""
    stats = await tenant_service.get_tenant_stats(tenant.id)
    return TenantStats(**stats)

@app.get("/api/tenant/users", response_model=List[UserResponse])
async def get_tenant_users(
    tenant: TenantRecord = Depends(require_tenant),
    user: UserRecord = Depends(require_role("admin"))
):
    """Get all users in tenant (admin+ required)"""
    users = await tenant_service.get_tenant_users(tenant.id)
    return [
        UserResponse(
            id=u.id,
            tenant_id=u.tenant_id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            status=u.status,
            oauth_provider=u.oauth_provider,
            created_at=u.created_at,
            last_login=u.last_login
        ) for u in users
    ]

# ============================================================================
# RAFFLE CATEGORY ENDPOINTS
# ============================================================================

@app.get("/api/categories", response_model=List[RaffleCategoryResponse])
async def get_raffle_categories(tenant: TenantRecord = Depends(require_tenant)):
    """Get all active raffle categories for tenant"""
    try:
        async with db_manager.get_tenant_connection(tenant.id) as conn:
            categories = await conn.fetch("""
                SELECT rc.*, 
                       COALESCE(SUM(b.amount), 0) as total_amount,
                       COUNT(b.id) as bet_count
                FROM raffle_categories rc
                LEFT JOIN bets b ON rc.id = b.category_id AND b.is_validated = true
                WHERE rc.tenant_id = $1 AND rc.is_active = true
                GROUP BY rc.id, rc.tenant_id, rc.category_key, rc.category_name, 
                         rc.description, rc.bet_price, rc.options, rc.is_active,
                         rc.display_order, rc.created_at, rc.updated_at
                ORDER BY rc.display_order
            """, tenant.id)
            
            return [
                RaffleCategoryResponse(
                    id=str(cat['id']),
                    tenant_id=str(cat['tenant_id']),
                    category_key=cat['category_key'],
                    category_name=cat['category_name'],
                    description=cat['description'],
                    bet_price=float(cat['bet_price']),
                    options=cat['options'],
                    is_active=cat['is_active'],
                    display_order=cat['display_order'],
                    created_at=cat['created_at'],
                    total_amount=float(cat['total_amount'] or 0),
                    bet_count=cat['bet_count'] or 0
                ) for cat in categories
            ]
            
    except Exception as e:
        logger.error(f"Failed to get categories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get raffle categories"
        )

@app.post("/api/categories", response_model=RaffleCategoryResponse)
async def create_raffle_category(
    category: RaffleCategoryCreate,
    tenant: TenantRecord = Depends(require_tenant),
    user: UserRecord = Depends(require_role("admin"))
):
    """Create new raffle category (admin+ required)"""
    try:
        async with db_manager.get_tenant_connection(tenant.id) as conn:
            new_category = await conn.fetchrow("""
                INSERT INTO raffle_categories (
                    tenant_id, category_key, category_name, description,
                    bet_price, options, is_active, display_order
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            """, 
            tenant.id, 
            category.category_key,
            category.category_name,
            category.description,
            category.bet_price,
            category.options,
            category.is_active,
            category.display_order
            )
            
            return RaffleCategoryResponse(
                id=str(new_category['id']),
                tenant_id=str(new_category['tenant_id']),
                category_key=new_category['category_key'],
                category_name=new_category['category_name'],
                description=new_category['description'],
                bet_price=float(new_category['bet_price']),
                options=new_category['options'],
                is_active=new_category['is_active'],
                display_order=new_category['display_order'],
                created_at=new_category['created_at'],
                total_amount=0,
                bet_count=0
            )
            
    except Exception as e:
        logger.error(f"Failed to create category: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create raffle category"
        )

# ============================================================================
# BETTING ENDPOINTS
# ============================================================================

@app.post("/api/bets/submit", response_model=Dict[str, Any])
async def submit_bets(
    submission: BetSubmission,
    tenant: TenantRecord = Depends(require_tenant)
):
    """Submit multiple bets for a user"""
    try:
        async with db_manager.get_tenant_connection(tenant.id) as conn:
            async with conn.transaction():
                bet_ids = []
                total_amount = 0
                
                for bet in submission.bets:
                    # Verify category exists and is active
                    category = await conn.fetchrow("""
                        SELECT id, bet_price, is_active 
                        FROM raffle_categories 
                        WHERE id = $1 AND tenant_id = $2 AND is_active = true
                    """, bet.category_id, tenant.id)
                    
                    if not category:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Invalid or inactive category: {bet.category_id}"
                        )
                    
                    # Validate bet amount matches category price
                    if bet.amount != category['bet_price']:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Bet amount must be {category['bet_price']}"
                        )
                    
                    # Create bet record
                    new_bet = await conn.fetchrow("""
                        INSERT INTO bets (
                            tenant_id, category_id, user_name, user_email,
                            bet_value, amount
                        )
                        VALUES ($1, $2, $3, $4, $5, $6)
                        RETURNING id, created_at
                    """, 
                    tenant.id,
                    bet.category_id,
                    submission.user_name,
                    submission.user_email,
                    bet.bet_value,
                    bet.amount
                    )
                    
                    bet_ids.append(str(new_bet['id']))
                    total_amount += bet.amount
                
                return {
                    "success": True,
                    "bet_ids": bet_ids,
                    "total_amount": total_amount,
                    "message": f"Successfully submitted {len(bet_ids)} bets"
                }
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to submit bets: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit bets"
        )

@app.get("/api/bets", response_model=List[BetResponse])
async def get_bets(
    tenant: TenantRecord = Depends(require_tenant),
    user: UserRecord = Depends(require_role("admin")),
    validated_only: bool = False,
    limit: int = 100
):
    """Get bets for tenant (admin+ required)"""
    try:
        async with db_manager.get_tenant_connection(tenant.id) as conn:
            where_clause = "WHERE b.tenant_id = $1"
            params = [tenant.id]
            
            if validated_only:
                where_clause += " AND b.is_validated = true"
            
            bets = await conn.fetch(f"""
                SELECT b.*, rc.category_name, u.full_name as validated_by_name
                FROM bets b
                JOIN raffle_categories rc ON b.category_id = rc.id
                LEFT JOIN users u ON b.validated_by = u.id
                {where_clause}
                ORDER BY b.created_at DESC
                LIMIT $2
            """, *params, limit)
            
            return [
                BetResponse(
                    id=str(bet['id']),
                    tenant_id=str(bet['tenant_id']),
                    category_id=str(bet['category_id']),
                    user_name=bet['user_name'],
                    user_email=bet['user_email'],
                    bet_value=bet['bet_value'],
                    amount=float(bet['amount']),
                    is_validated=bet['is_validated'],
                    validated_by=bet.get('validated_by_name'),
                    validated_at=bet['validated_at'],
                    created_at=bet['created_at']
                ) for bet in bets
            ]
            
    except Exception as e:
        logger.error(f"Failed to get bets: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get bets"
        )

@app.post("/api/bets/validate", response_model=Dict[str, Any])
async def validate_bets(
    request: BetValidationRequest,
    tenant: TenantRecord = Depends(require_tenant),
    user: UserRecord = Depends(require_role("admin"))
):
    """Validate bets (admin+ required)"""
    try:
        async with db_manager.get_tenant_connection(tenant.id) as conn:
            result = await conn.execute("""
                UPDATE bets 
                SET is_validated = true,
                    validated_by = $1,
                    validated_at = CURRENT_TIMESTAMP
                WHERE tenant_id = $2 AND id = ANY($3)
            """, user.id, tenant.id, request.bet_ids)
            
            # Extract number of updated rows
            updated_count = int(result.split()[-1]) if result else 0
            
            return {
                "success": True,
                "validated_count": updated_count,
                "validated_by": user.full_name
            }
            
    except Exception as e:
        logger.error(f"Failed to validate bets: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to validate bets"
        )

# ============================================================================
# SUPER ADMIN ENDPOINTS
# ============================================================================

@app.get("/api/admin/tenants", response_model=List[Dict[str, Any]])
async def list_all_tenants(
    user: UserRecord = Depends(require_user),
    limit: int = 50,
    offset: int = 0
):
    """List all tenants (super admin only)"""
    # Super admin check (would need to implement super admin role)
    if user.role != "owner" or user.tenant_id != "super":  # Placeholder logic
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    try:
        return await tenant_service.list_all_tenants(
            limit=limit,
            offset=offset
        )
    except Exception as e:
        logger.error(f"Failed to list tenants: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list tenants"
        )

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "Request failed",
            "message": exc.detail,
            "status_code": exc.status_code
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred"
        }
    )

# ============================================================================
# STARTUP/SHUTDOWN EVENTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize database connections and resources"""
    logger.info("Starting Baby Raffle SaaS API...")
    
    # Initialize database manager
    await db_manager.initialize()
    
    logger.info("Baby Raffle SaaS API started successfully")

@app.on_event("shutdown") 
async def shutdown_event():
    """Cleanup resources"""
    logger.info("Shutting down Baby Raffle SaaS API...")
    
    # Cleanup database connections
    await db_manager.close()
    
    logger.info("Baby Raffle SaaS API shutdown complete")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )