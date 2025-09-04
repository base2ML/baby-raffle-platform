"""
Multi-tenant middleware for request processing and security
"""
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
import logging
import time
import secrets
from typing import Optional, Dict, Any, Callable
from urllib.parse import urlparse
import re

from .database import db_manager
from .models import TenantRecord, UserRecord
from .oauth import oauth_service
from .tenant_service import tenant_service

logger = logging.getLogger(__name__)

class TenantContextMiddleware:
    """Middleware to resolve tenant context from subdomain and set database context"""
    
    def __init__(self, app):
        self.app = app
        self.base_domain = "base2ml.com"
        self.onboarding_subdomain = "mybabyraffle"
    
    async def __call__(self, request: Request, call_next: Callable):
        start_time = time.time()
        
        try:
            # Extract tenant context from request
            tenant_context = await self.resolve_tenant_context(request)
            
            # Add tenant context to request state
            request.state.tenant_context = tenant_context
            
            # Process request
            response = await call_next(request)
            
            # Add response headers
            self.add_security_headers(response, tenant_context)
            
            # Log request
            process_time = time.time() - start_time
            await self.log_request(request, response, process_time, tenant_context)
            
            return response
            
        except HTTPException as e:
            # Handle known HTTP exceptions
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "error": "Request processing failed",
                    "message": e.detail,
                    "request_id": secrets.token_hex(8)
                }
            )
        except Exception as e:
            # Handle unexpected errors
            error_id = secrets.token_hex(8)
            logger.error(f"Unexpected error in middleware [{error_id}]: {e}", exc_info=True)
            
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal server error",
                    "message": "An unexpected error occurred",
                    "error_id": error_id
                }
            )
    
    async def resolve_tenant_context(self, request: Request) -> Dict[str, Any]:
        """Resolve tenant context from request"""
        host = request.headers.get('host', '').lower()
        
        # Parse subdomain from host
        subdomain = self.extract_subdomain(host)
        
        context = {
            'subdomain': subdomain,
            'tenant': None,
            'tenant_id': None,
            'is_onboarding': subdomain == self.onboarding_subdomain,
            'is_api_request': request.url.path.startswith('/api/'),
            'user_agent': request.headers.get('user-agent', ''),
            'ip_address': self.get_client_ip(request)
        }
        
        # Skip tenant resolution for onboarding site and health checks
        if (context['is_onboarding'] or 
            request.url.path in ['/health', '/docs', '/openapi.json', '/'] or
            request.url.path.startswith('/static/')):
            return context
        
        # Resolve tenant for subdomain
        if subdomain and subdomain != self.onboarding_subdomain:
            tenant = await tenant_service.get_tenant_by_subdomain(subdomain)
            
            if not tenant:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Tenant not found for subdomain: {subdomain}"
                )
            
            if tenant.status != 'active':
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Tenant is {tenant.status}"
                )
            
            context['tenant'] = tenant
            context['tenant_id'] = tenant.id
            
            # Set database tenant context for RLS
            try:
                async with db_manager.get_connection() as conn:
                    await conn.execute(
                        "SELECT set_config('app.current_tenant_id', $1, true)",
                        tenant.id
                    )
            except Exception as e:
                logger.error(f"Failed to set tenant context: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to set tenant context"
                )
        
        return context
    
    def extract_subdomain(self, host: str) -> Optional[str]:
        """Extract subdomain from host header"""
        if not host:
            return None
        
        # Remove port if present
        host = host.split(':')[0]
        
        # Check if it's a subdomain of base_domain
        if not host.endswith(f'.{self.base_domain}'):
            # Handle localhost and IP addresses for development
            if host in ['localhost', '127.0.0.1'] or re.match(r'^\d+\.\d+\.\d+\.\d+$', host):
                return None
            return None
        
        # Extract subdomain
        subdomain = host[:-len(f'.{self.base_domain}')]
        
        # Validate subdomain format
        if not re.match(r'^[a-z0-9]([a-z0-9-]*[a-z0-9])?$', subdomain):
            return None
        
        return subdomain
    
    def get_client_ip(self, request: Request) -> str:
        """Get client IP address accounting for proxies"""
        # Check for forwarded headers (behind load balancer/proxy)
        forwarded_for = request.headers.get('x-forwarded-for')
        if forwarded_for:
            # Take the first IP in the chain
            return forwarded_for.split(',')[0].strip()
        
        real_ip = request.headers.get('x-real-ip')
        if real_ip:
            return real_ip
        
        # Fallback to direct client IP
        return getattr(request.client, 'host', 'unknown')
    
    def add_security_headers(self, response: Response, tenant_context: Dict[str, Any]):
        """Add security headers to response"""
        tenant = tenant_context.get('tenant')
        
        # Basic security headers
        response.headers.update({
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
        })
        
        # Tenant-specific CSP if configured
        if tenant and tenant.settings:
            csp = tenant.settings.get('content_security_policy')
            if csp:
                response.headers['Content-Security-Policy'] = csp
    
    async def log_request(self, 
                         request: Request, 
                         response: Response,
                         process_time: float,
                         tenant_context: Dict[str, Any]):
        """Log request for monitoring and analytics"""
        
        log_data = {
            'method': request.method,
            'path': str(request.url.path),
            'status_code': response.status_code,
            'process_time': round(process_time * 1000, 2),  # ms
            'tenant_id': tenant_context.get('tenant_id'),
            'subdomain': tenant_context.get('subdomain'),
            'ip_address': tenant_context.get('ip_address'),
            'user_agent': tenant_context.get('user_agent', '')[:200]  # Truncate
        }
        
        # Log level based on status code
        if response.status_code >= 500:
            logger.error(f"Request failed: {log_data}")
        elif response.status_code >= 400:
            logger.warning(f"Client error: {log_data}")
        else:
            logger.info(f"Request completed: {log_data}")

class AuthenticationMiddleware:
    """Middleware for handling JWT authentication and user context"""
    
    def __init__(self):
        self.public_paths = {
            '/health', '/docs', '/openapi.json', '/',
            '/api/auth/login', '/api/auth/callback', '/api/tenant/create',
            '/api/tenant/validate-subdomain'
        }
    
    async def process_authentication(self, request: Request) -> Optional[UserRecord]:
        """Process authentication and return user context"""
        
        # Skip authentication for public paths
        if request.url.path in self.public_paths:
            return None
        
        # Skip for onboarding site (separate auth flow)
        tenant_context = getattr(request.state, 'tenant_context', {})
        if tenant_context.get('is_onboarding'):
            return None
        
        # Extract token from Authorization header
        auth_header = request.headers.get('authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            # For API endpoints, require authentication
            if request.url.path.startswith('/api/'):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            return None
        
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        
        try:
            # Verify JWT token
            payload = oauth_service.verify_access_token(token)
            
            # Get user from database
            user_id = payload['sub']
            tenant_id = payload.get('tenant_id')
            
            async with db_manager.get_connection() as conn:
                user_row = await conn.fetchrow("""
                    SELECT u.*, t.subdomain, t.status as tenant_status
                    FROM users u
                    JOIN tenants t ON u.tenant_id = t.id  
                    WHERE u.id = $1 AND u.status = 'active'
                """, user_id)
                
                if not user_row:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="User not found or inactive"
                    )
                
                # Verify tenant matches request context
                request_tenant_id = tenant_context.get('tenant_id')
                if request_tenant_id and tenant_id != request_tenant_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Token not valid for this tenant"
                    )
                
                # Update last login
                await conn.execute("""
                    UPDATE users SET last_login = CURRENT_TIMESTAMP 
                    WHERE id = $1
                """, user_id)
                
                return UserRecord(user_row)
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )

class RateLimitMiddleware:
    """Rate limiting middleware per tenant and IP"""
    
    def __init__(self):
        self.rate_limits = {
            'free': {'requests_per_minute': 100, 'requests_per_hour': 1000},
            'premium': {'requests_per_minute': 500, 'requests_per_hour': 5000},
            'enterprise': {'requests_per_minute': 2000, 'requests_per_hour': 20000}
        }
        # In production, use Redis for distributed rate limiting
        self.memory_store = {}  # Temporary in-memory store
    
    async def check_rate_limit(self, request: Request):
        """Check rate limits for tenant and IP"""
        tenant_context = getattr(request.state, 'tenant_context', {})
        
        # Skip rate limiting for health checks
        if request.url.path in ['/health', '/']:
            return
        
        tenant = tenant_context.get('tenant')
        ip_address = tenant_context.get('ip_address', 'unknown')
        
        # Determine rate limit tier
        if tenant:
            plan = tenant.subscription_plan
            limits = self.rate_limits.get(plan, self.rate_limits['free'])
        else:
            limits = {'requests_per_minute': 50, 'requests_per_hour': 200}  # Stricter for non-tenants
        
        # Check IP-based rate limiting
        await self._check_ip_rate_limit(ip_address, limits)
        
        # Check tenant-based rate limiting if applicable
        if tenant:
            await self._check_tenant_rate_limit(tenant.id, limits)
    
    async def _check_ip_rate_limit(self, ip_address: str, limits: Dict[str, int]):
        """Check IP-based rate limits"""
        current_time = int(time.time())
        minute_key = f"ip:{ip_address}:{current_time // 60}"
        hour_key = f"ip:{ip_address}:{current_time // 3600}"
        
        # Simple in-memory rate limiting (use Redis in production)
        minute_count = self.memory_store.get(minute_key, 0)
        hour_count = self.memory_store.get(hour_key, 0)
        
        if minute_count >= limits['requests_per_minute']:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded (per minute)",
                headers={"Retry-After": "60"}
            )
        
        if hour_count >= limits['requests_per_hour']:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded (per hour)",
                headers={"Retry-After": "3600"}
            )
        
        # Increment counters
        self.memory_store[minute_key] = minute_count + 1
        self.memory_store[hour_key] = hour_count + 1
        
        # Clean up old entries (simple TTL simulation)
        if len(self.memory_store) > 10000:  # Prevent memory bloat
            old_keys = [k for k in self.memory_store.keys() 
                       if int(k.split(':')[-1]) < current_time - 3600]
            for key in old_keys:
                self.memory_store.pop(key, None)
    
    async def _check_tenant_rate_limit(self, tenant_id: str, limits: Dict[str, int]):
        """Check tenant-based rate limits"""
        current_time = int(time.time())
        minute_key = f"tenant:{tenant_id}:{current_time // 60}"
        hour_key = f"tenant:{tenant_id}:{current_time // 3600}"
        
        minute_count = self.memory_store.get(minute_key, 0)
        hour_count = self.memory_store.get(hour_key, 0)
        
        if minute_count >= limits['requests_per_minute'] * 2:  # Higher limit for tenant
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Tenant rate limit exceeded (per minute)"
            )
        
        if hour_count >= limits['requests_per_hour'] * 2:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Tenant rate limit exceeded (per hour)"
            )
        
        self.memory_store[minute_key] = minute_count + 1
        self.memory_store[hour_key] = hour_count + 1

# Middleware instances for use in FastAPI app
tenant_context_middleware = TenantContextMiddleware
auth_middleware = AuthenticationMiddleware()
rate_limit_middleware = RateLimitMiddleware()

# Dependency functions for FastAPI
async def get_tenant_context(request: Request) -> Dict[str, Any]:
    """FastAPI dependency to get tenant context"""
    return getattr(request.state, 'tenant_context', {})

async def get_current_tenant(request: Request) -> Optional[TenantRecord]:
    """FastAPI dependency to get current tenant"""
    tenant_context = await get_tenant_context(request)
    return tenant_context.get('tenant')

async def require_tenant(request: Request) -> TenantRecord:
    """FastAPI dependency to require tenant context"""
    tenant = await get_current_tenant(request)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context required"
        )
    return tenant

async def get_current_user(request: Request) -> Optional[UserRecord]:
    """FastAPI dependency to get current authenticated user"""
    return await auth_middleware.process_authentication(request)

async def require_user(request: Request) -> UserRecord:
    """FastAPI dependency to require authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    return user

async def require_role(required_role: str):
    """FastAPI dependency factory to require specific role"""
    async def role_checker(user: UserRecord = require_user) -> UserRecord:
        role_hierarchy = {'owner': 3, 'admin': 2, 'user': 1}
        
        user_level = role_hierarchy.get(user.role, 0)
        required_level = role_hierarchy.get(required_role, 0)
        
        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role}' or higher required"
            )
        
        return user
    
    return role_checker