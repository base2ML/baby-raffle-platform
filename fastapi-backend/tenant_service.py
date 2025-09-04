"""
Tenant management service for multi-tenant SaaS
"""
import re
import secrets
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
from fastapi import HTTPException, status

from .models import (
    TenantCreate, TenantResponse, TenantRecord, UserRecord,
    TenantSettings, DEFAULT_CATEGORIES, TenantStatus
)
from .database import db_manager

logger = logging.getLogger(__name__)

class TenantService:
    """Service for managing tenants and their lifecycle"""
    
    def __init__(self):
        # Reserved subdomains that cannot be used
        self.reserved_subdomains = {
            'www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog', 'shop',
            'mybabyraffle', 'support', 'help', 'docs', 'status', 'cdn',
            'assets', 'static', 'media', 'files', 'images', 'uploads',
            'dashboard', 'portal', 'console', 'manage', 'control'
        }
    
    async def validate_subdomain(self, subdomain: str) -> bool:
        """Validate subdomain availability and format"""
        subdomain = subdomain.lower().strip()
        
        # Format validation
        if not re.match(r'^[a-z0-9]([a-z0-9-]*[a-z0-9])?$', subdomain):
            return False
        
        # Length validation
        if len(subdomain) < 3 or len(subdomain) > 63:
            return False
        
        # Reserved subdomain check
        if subdomain in self.reserved_subdomains:
            return False
        
        # Database availability check
        try:
            async with db_manager.get_connection() as conn:
                existing = await conn.fetchrow("""
                    SELECT id FROM tenants WHERE subdomain = $1
                """, subdomain)
                return existing is None
        except Exception as e:
            logger.error(f"Error checking subdomain availability: {e}")
            return False
    
    async def get_tenant_by_subdomain(self, subdomain: str) -> Optional[TenantRecord]:
        """Get tenant by subdomain"""
        try:
            async with db_manager.get_connection() as conn:
                tenant_row = await conn.fetchrow("""
                    SELECT * FROM get_tenant_by_subdomain($1)
                """, subdomain.lower())
                
                if tenant_row:
                    return TenantRecord(tenant_row)
                return None
                
        except Exception as e:
            logger.error(f"Error getting tenant by subdomain: {e}")
            return None
    
    async def get_tenant_by_id(self, tenant_id: str) -> Optional[TenantRecord]:
        """Get tenant by ID"""
        try:
            async with db_manager.get_connection() as conn:
                tenant_row = await conn.fetchrow("""
                    SELECT * FROM tenants WHERE id = $1
                """, tenant_id)
                
                if tenant_row:
                    return TenantRecord(tenant_row)
                return None
                
        except Exception as e:
            logger.error(f"Error getting tenant by ID: {e}")
            return None
    
    async def create_tenant_with_owner(self,
                                     tenant_data: TenantCreate,
                                     owner_name: str,
                                     oauth_provider: Optional[str] = None,
                                     oauth_id: Optional[str] = None) -> Dict[str, Any]:
        """Create new tenant with owner user and default setup"""
        
        # Validate subdomain
        if not await self.validate_subdomain(tenant_data.subdomain):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subdomain is not available or invalid"
            )
        
        try:
            async with db_manager.get_connection() as conn:
                # Use database function to create tenant with defaults
                result = await conn.fetchrow("""
                    SELECT tenant_id, user_id 
                    FROM create_tenant_with_defaults($1, $2, $3, $4, $5, $6)
                """, 
                tenant_data.subdomain.lower(),
                tenant_data.name,
                tenant_data.owner_email,
                owner_name,
                oauth_provider,
                oauth_id
                )
                
                tenant_id = str(result['tenant_id'])
                user_id = str(result['user_id'])
                
                # Get the created tenant
                tenant = await self.get_tenant_by_id(tenant_id)
                
                # Get the created user
                user_row = await conn.fetchrow("""
                    SELECT * FROM users WHERE id = $1
                """, user_id)
                user = UserRecord(user_row)
                
                logger.info(f"Created tenant '{tenant.subdomain}' with owner '{user.email}'")
                
                return {
                    'tenant': tenant,
                    'user': user,
                    'setup_url': f'https://{tenant.subdomain}.base2ml.com'
                }
                
        except Exception as e:
            logger.error(f"Failed to create tenant: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create tenant"
            )
    
    async def update_tenant_settings(self, 
                                   tenant_id: str, 
                                   settings: TenantSettings) -> TenantRecord:
        """Update tenant settings"""
        try:
            async with db_manager.get_tenant_connection(tenant_id) as conn:
                updated_tenant = await conn.fetchrow("""
                    UPDATE tenants 
                    SET settings = $1, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                    RETURNING *
                """, settings.dict(), tenant_id)
                
                if not updated_tenant:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Tenant not found"
                    )
                
                logger.info(f"Updated settings for tenant {tenant_id}")
                return TenantRecord(updated_tenant)
                
        except Exception as e:
            logger.error(f"Failed to update tenant settings: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update tenant settings"
            )
    
    async def update_tenant_status(self, 
                                 tenant_id: str, 
                                 status: TenantStatus) -> TenantRecord:
        """Update tenant status (activate, suspend, etc.)"""
        try:
            async with db_manager.get_connection() as conn:  # No RLS for super admin operation
                updated_tenant = await conn.fetchrow("""
                    UPDATE tenants 
                    SET status = $1, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                    RETURNING *
                """, status.value, tenant_id)
                
                if not updated_tenant:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Tenant not found"
                    )
                
                logger.info(f"Updated status for tenant {tenant_id} to {status}")
                return TenantRecord(updated_tenant)
                
        except Exception as e:
            logger.error(f"Failed to update tenant status: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update tenant status"
            )
    
    async def get_tenant_users(self, tenant_id: str) -> List[UserRecord]:
        """Get all users for a tenant"""
        try:
            async with db_manager.get_tenant_connection(tenant_id) as conn:
                user_rows = await conn.fetch("""
                    SELECT * FROM users 
                    WHERE tenant_id = $1 
                    ORDER BY role DESC, created_at ASC
                """, tenant_id)
                
                return [UserRecord(row) for row in user_rows]
                
        except Exception as e:
            logger.error(f"Failed to get tenant users: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get tenant users"
            )
    
    async def invite_user_to_tenant(self,
                                  tenant_id: str,
                                  email: str,
                                  full_name: str,
                                  role: str = 'user') -> UserRecord:
        """Invite a new user to a tenant"""
        try:
            async with db_manager.get_tenant_connection(tenant_id) as conn:
                # Check if user already exists
                existing_user = await conn.fetchrow("""
                    SELECT * FROM users WHERE tenant_id = $1 AND email = $2
                """, tenant_id, email)
                
                if existing_user:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="User already exists in this tenant"
                    )
                
                # Create new user
                new_user = await conn.fetchrow("""
                    INSERT INTO users (tenant_id, email, full_name, role, status)
                    VALUES ($1, $2, $3, $4, 'inactive')
                    RETURNING *
                """, tenant_id, email, full_name, role)
                
                user = UserRecord(new_user)
                logger.info(f"Invited user {email} to tenant {tenant_id}")
                
                # TODO: Send invitation email with setup link
                
                return user
                
        except Exception as e:
            logger.error(f"Failed to invite user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to invite user"
            )
    
    async def get_tenant_stats(self, tenant_id: str) -> Dict[str, Any]:
        """Get comprehensive tenant statistics"""
        try:
            async with db_manager.get_tenant_connection(tenant_id) as conn:
                # Get basic stats
                stats = await conn.fetchrow("""
                    SELECT 
                        COUNT(DISTINCT b.id) as total_bets,
                        COUNT(DISTINCT b.id) FILTER (WHERE b.is_validated = true) as validated_bets,
                        COALESCE(SUM(b.amount), 0) as total_amount,
                        COALESCE(SUM(b.amount) FILTER (WHERE b.is_validated = true), 0) as validated_amount,
                        COUNT(DISTINCT b.user_email) as unique_users,
                        COUNT(DISTINCT rc.id) as active_categories
                    FROM tenants t
                    LEFT JOIN bets b ON t.id = b.tenant_id  
                    LEFT JOIN raffle_categories rc ON t.id = rc.tenant_id AND rc.is_active = true
                    WHERE t.id = $1
                    GROUP BY t.id
                """, tenant_id)
                
                # Get category breakdown
                categories = await conn.fetch("""
                    SELECT 
                        rc.id,
                        rc.category_name,
                        rc.category_key,
                        COUNT(b.id) as bet_count,
                        COUNT(b.id) FILTER (WHERE b.is_validated = true) as validated_count,
                        COALESCE(SUM(b.amount), 0) as total_amount,
                        COALESCE(SUM(b.amount) FILTER (WHERE b.is_validated = true), 0) as validated_amount
                    FROM raffle_categories rc
                    LEFT JOIN bets b ON rc.id = b.category_id
                    WHERE rc.tenant_id = $1 AND rc.is_active = true
                    GROUP BY rc.id, rc.category_name, rc.category_key
                    ORDER BY rc.display_order
                """, tenant_id)
                
                # Get recent bets
                recent_bets = await conn.fetch("""
                    SELECT b.*, rc.category_name
                    FROM bets b
                    JOIN raffle_categories rc ON b.category_id = rc.id
                    WHERE b.tenant_id = $1
                    ORDER BY b.created_at DESC
                    LIMIT 10
                """, tenant_id)
                
                return {
                    'total_bets': stats['total_bets'] or 0,
                    'validated_bets': stats['validated_bets'] or 0,
                    'total_amount': float(stats['total_amount'] or 0),
                    'validated_amount': float(stats['validated_amount'] or 0),
                    'unique_users': stats['unique_users'] or 0,
                    'active_categories': stats['active_categories'] or 0,
                    'categories': [
                        {
                            'id': str(cat['id']),
                            'category_name': cat['category_name'],
                            'category_key': cat['category_key'],
                            'bet_count': cat['bet_count'] or 0,
                            'validated_count': cat['validated_count'] or 0,
                            'total_amount': float(cat['total_amount'] or 0),
                            'validated_amount': float(cat['validated_amount'] or 0)
                        } for cat in categories
                    ],
                    'recent_bets': [
                        {
                            'id': str(bet['id']),
                            'user_name': bet['user_name'],
                            'user_email': bet['user_email'],
                            'category_name': bet['category_name'],
                            'bet_value': bet['bet_value'],
                            'amount': float(bet['amount']),
                            'is_validated': bet['is_validated'],
                            'created_at': bet['created_at'].isoformat()
                        } for bet in recent_bets
                    ]
                }
                
        except Exception as e:
            logger.error(f"Failed to get tenant stats: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get tenant statistics"
            )
    
    async def delete_tenant(self, tenant_id: str) -> bool:
        """Delete a tenant and all associated data"""
        try:
            async with db_manager.get_connection() as conn:
                # This will cascade delete all related records
                result = await conn.execute("""
                    DELETE FROM tenants WHERE id = $1
                """, tenant_id)
                
                deleted = result == 'DELETE 1'
                if deleted:
                    logger.info(f"Deleted tenant {tenant_id}")
                
                return deleted
                
        except Exception as e:
            logger.error(f"Failed to delete tenant: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete tenant"
            )
    
    async def list_all_tenants(self, 
                             status_filter: Optional[TenantStatus] = None,
                             limit: int = 100,
                             offset: int = 0) -> List[Dict[str, Any]]:
        """List all tenants (super admin function)"""
        try:
            async with db_manager.get_connection() as conn:
                where_clause = ""
                params = []
                param_count = 0
                
                if status_filter:
                    param_count += 1
                    where_clause = f"WHERE status = ${param_count}"
                    params.append(status_filter.value)
                
                param_count += 1
                params.append(limit)
                limit_param = f"${param_count}"
                
                param_count += 1
                params.append(offset)
                offset_param = f"${param_count}"
                
                query = f"""
                    SELECT t.*, 
                           COUNT(DISTINCT u.id) as user_count,
                           COUNT(DISTINCT b.id) as bet_count,
                           COALESCE(SUM(b.amount), 0) as total_amount
                    FROM tenants t
                    LEFT JOIN users u ON t.id = u.tenant_id
                    LEFT JOIN bets b ON t.id = b.tenant_id
                    {where_clause}
                    GROUP BY t.id, t.subdomain, t.name, t.owner_email, t.status, t.subscription_plan, t.created_at, t.updated_at, t.settings
                    ORDER BY t.created_at DESC
                    LIMIT {limit_param} OFFSET {offset_param}
                """
                
                tenant_rows = await conn.fetch(query, *params)
                
                return [
                    {
                        'id': str(row['id']),
                        'subdomain': row['subdomain'],
                        'name': row['name'],
                        'owner_email': row['owner_email'],
                        'status': row['status'],
                        'subscription_plan': row['subscription_plan'],
                        'created_at': row['created_at'].isoformat(),
                        'user_count': row['user_count'] or 0,
                        'bet_count': row['bet_count'] or 0,
                        'total_amount': float(row['total_amount'] or 0)
                    } for row in tenant_rows
                ]
                
        except Exception as e:
            logger.error(f"Failed to list tenants: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to list tenants"
            )

# Global tenant service instance
tenant_service = TenantService()