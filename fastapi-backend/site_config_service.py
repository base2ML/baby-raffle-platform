"""
Site configuration and deployment service
Manages tenant-specific site settings and triggers deployments
"""
import os
import json
import uuid
import logging
import subprocess
from typing import Optional, Dict, Any
from datetime import datetime
from fastapi import HTTPException, status

from database import db_manager
from models import (
    SiteConfigUpdate, SiteConfigResponse, SiteConfigRecord,
    DeploymentRequest, DeploymentResponse
)

logger = logging.getLogger(__name__)

# Default site configuration
DEFAULT_SITE_CONFIG = {
    "site_title": "Baby Raffle",
    "welcome_message": "Welcome to our Baby Raffle!",
    "description": "Place your bets and win amazing prizes!",
    "contact_email": None,
    
    # Branding
    "primary_color": "#2196f3",
    "secondary_color": "#f50057",
    "background_color": "#ffffff",
    "logo_url": None,
    "favicon_url": None,
    
    # Features
    "enable_slideshow": True,
    "enable_social_sharing": True,
    "enable_comments": False,
    "max_bets_per_user": 10,
    
    # SEO
    "meta_description": "Join our baby raffle and win exciting prizes!",
    "meta_keywords": "baby, raffle, betting, prizes, family, fun",
    
    # Analytics
    "google_analytics_id": None,
    "facebook_pixel_id": None,
}

class SiteConfigService:
    """Service for managing site configuration and deployments"""
    
    def __init__(self):
        self.deployment_webhook_url = os.getenv("DEPLOYMENT_WEBHOOK_URL")
        self.base_domain = os.getenv("BASE_DOMAIN", "base2ml.com")
    
    async def get_site_config(self, tenant_id: str) -> SiteConfigRecord:
        """Get site configuration for tenant"""
        try:
            async with db_manager.get_connection() as conn:
                result = await conn.fetchone("""
                    SELECT * FROM site_configs WHERE tenant_id = ?
                """, tenant_id)
                
                if result:
                    return SiteConfigRecord(result)
                
                # Create default config if none exists
                return await self.create_default_config(tenant_id)
                
        except Exception as e:
            logger.error(f"Failed to get site config: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get site configuration"
            )
    
    async def create_default_config(self, tenant_id: str) -> SiteConfigRecord:
        """Create default site configuration for tenant"""
        try:
            config_id = str(uuid.uuid4())
            
            async with db_manager.get_connection() as conn:
                # Get tenant info to populate defaults
                tenant = await conn.fetchone("""
                    SELECT subdomain, name, owner_email FROM tenants WHERE id = ?
                """, tenant_id)
                
                if not tenant:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Tenant not found"
                    )
                
                # Customize default config with tenant info
                config = DEFAULT_SITE_CONFIG.copy()
                config.update({
                    "site_title": f"{tenant['name']} Baby Raffle",
                    "contact_email": tenant['owner_email'],
                    "meta_description": f"Join {tenant['name']}'s baby raffle and win exciting prizes!"
                })
                
                await conn.execute("""
                    INSERT INTO site_configs (id, tenant_id, config)
                    VALUES (?, ?, ?)
                """, config_id, tenant_id, json.dumps(config))
                await conn.commit()
                
                # Return the created record
                result = await conn.fetchone("""
                    SELECT * FROM site_configs WHERE id = ?
                """, config_id)
                
                return SiteConfigRecord(result)
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to create default site config: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create default configuration"
            )
    
    async def update_site_config(
        self, 
        tenant_id: str, 
        updates: SiteConfigUpdate
    ) -> SiteConfigResponse:
        """Update site configuration"""
        try:
            # Get existing config
            current_config = await self.get_site_config(tenant_id)
            
            # Merge updates
            new_config = current_config.config.copy()
            
            # Update only provided fields
            update_dict = updates.dict(exclude_unset=True)
            new_config.update(update_dict)
            
            # Validate configuration
            self._validate_config(new_config)
            
            # Save updated config
            async with db_manager.get_connection() as conn:
                await conn.execute("""
                    UPDATE site_configs 
                    SET config = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE tenant_id = ?
                """, json.dumps(new_config), tenant_id)
                await conn.commit()
                
                # Get updated record
                result = await conn.fetchone("""
                    SELECT * FROM site_configs WHERE tenant_id = ?
                """, tenant_id)
                
                updated_record = SiteConfigRecord(result)
            
            logger.info(f"Updated site config for tenant {tenant_id}")
            
            return SiteConfigResponse(
                id=updated_record.id,
                tenant_id=updated_record.tenant_id,
                config=updated_record.config,
                created_at=updated_record.created_at,
                updated_at=updated_record.updated_at
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to update site config: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update site configuration"
            )
    
    def _validate_config(self, config: Dict[str, Any]) -> None:
        """Validate site configuration"""
        # Validate colors (hex format)
        color_fields = ["primary_color", "secondary_color", "background_color"]
        for field in color_fields:
            if field in config and config[field]:
                color = config[field]
                if not (color.startswith('#') and len(color) == 7):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid color format for {field}. Use hex format like #ff0000"
                    )
        
        # Validate numeric fields
        if "max_bets_per_user" in config:
            max_bets = config["max_bets_per_user"]
            if not isinstance(max_bets, int) or max_bets < 1 or max_bets > 100:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="max_bets_per_user must be between 1 and 100"
                )
        
        # Validate URLs
        url_fields = ["logo_url", "favicon_url"]
        for field in url_fields:
            if field in config and config[field]:
                url = config[field]
                if not (url.startswith('http://') or url.startswith('https://')):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"{field} must be a valid HTTP/HTTPS URL"
                    )
    
    async def trigger_deployment(
        self, 
        tenant_id: str, 
        request: DeploymentRequest
    ) -> DeploymentResponse:
        """Trigger site deployment"""
        try:
            # Get tenant and config info
            async with db_manager.get_connection() as conn:
                tenant = await conn.fetchone("""
                    SELECT subdomain, name, status FROM tenants WHERE id = ?
                """, tenant_id)
                
                if not tenant:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Tenant not found"
                    )
                
                if tenant['status'] != 'active':
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Tenant must be active to deploy"
                    )
            
            # Create deployment record
            deployment_id = str(uuid.uuid4())
            deployment_url = f"https://{tenant['subdomain']}.{self.base_domain}"
            
            async with db_manager.get_connection() as conn:
                await conn.execute("""
                    INSERT INTO deployments (
                        id, tenant_id, status, deployment_url, 
                        force_rebuild, config_only
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                deployment_id, tenant_id, "pending", deployment_url,
                request.force_rebuild, request.config_only
                )
                await conn.commit()
            
            # Trigger deployment process
            try:
                await self._execute_deployment(
                    tenant_id, 
                    tenant['subdomain'], 
                    deployment_id,
                    request
                )
                
                deployment_status = "success"
                build_log = "Deployment completed successfully"
                
            except Exception as e:
                deployment_status = "failed"
                build_log = f"Deployment failed: {str(e)}"
                logger.error(f"Deployment failed for tenant {tenant_id}: {e}")
            
            # Update deployment record
            async with db_manager.get_connection() as conn:
                await conn.execute("""
                    UPDATE deployments 
                    SET status = ?, build_log = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, deployment_status, build_log, deployment_id)
                await conn.commit()
            
            return DeploymentResponse(
                id=deployment_id,
                tenant_id=tenant_id,
                status=deployment_status,
                deployment_url=deployment_url,
                build_log=build_log,
                created_at=datetime.utcnow()
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to trigger deployment: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to trigger deployment"
            )
    
    async def _execute_deployment(
        self, 
        tenant_id: str, 
        subdomain: str, 
        deployment_id: str,
        request: DeploymentRequest
    ) -> None:
        """Execute the actual deployment process"""
        try:
            # Get site config and data for deployment
            site_config = await self.get_site_config(tenant_id)
            
            # If webhook URL is configured, trigger external deployment
            if self.deployment_webhook_url:
                await self._trigger_webhook_deployment(
                    tenant_id, subdomain, site_config.config, request
                )
            else:
                # Local deployment process
                await self._execute_local_deployment(
                    tenant_id, subdomain, site_config.config, request
                )
                
        except Exception as e:
            logger.error(f"Deployment execution failed: {e}")
            raise
    
    async def _trigger_webhook_deployment(
        self, 
        tenant_id: str, 
        subdomain: str, 
        config: Dict[str, Any],
        request: DeploymentRequest
    ) -> None:
        """Trigger deployment via webhook"""
        import httpx
        
        payload = {
            "tenant_id": tenant_id,
            "subdomain": subdomain,
            "config": config,
            "force_rebuild": request.force_rebuild,
            "config_only": request.config_only
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                self.deployment_webhook_url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                raise Exception(f"Webhook deployment failed: {response.text}")
    
    async def _execute_local_deployment(
        self, 
        tenant_id: str, 
        subdomain: str, 
        config: Dict[str, Any],
        request: DeploymentRequest
    ) -> None:
        """Execute local deployment (development/simple hosting)"""
        # This would typically involve:
        # 1. Generate static site files
        # 2. Update configuration files
        # 3. Deploy to hosting platform
        # 4. Update DNS if needed
        
        logger.info(f"Local deployment for {subdomain} (development mode)")
        
        # For now, just log the deployment request
        # In production, this would integrate with your hosting platform
        pass
    
    async def get_deployment_history(
        self, 
        tenant_id: str, 
        limit: int = 20
    ) -> List[DeploymentResponse]:
        """Get deployment history for tenant"""
        try:
            async with db_manager.get_connection() as conn:
                results = await conn.fetch("""
                    SELECT * FROM deployments 
                    WHERE tenant_id = ?
                    ORDER BY created_at DESC
                    LIMIT ?
                """, tenant_id, limit)
                
                return [
                    DeploymentResponse(
                        id=str(result['id']),
                        tenant_id=str(result['tenant_id']),
                        status=result['status'],
                        deployment_url=result['deployment_url'],
                        build_log=result['build_log'],
                        created_at=result['created_at']
                    ) for result in results
                ]
                
        except Exception as e:
            logger.error(f"Failed to get deployment history: {e}")
            return []
    
    async def get_site_preview_data(self, tenant_id: str) -> Dict[str, Any]:
        """Get all data needed for site preview"""
        try:
            # Get site config
            site_config = await self.get_site_config(tenant_id)
            
            # Get raffle categories
            async with db_manager.get_connection() as conn:
                categories = await conn.fetch("""
                    SELECT rc.*, 
                           COALESCE(SUM(b.amount), 0) as total_amount,
                           COUNT(b.id) as bet_count
                    FROM raffle_categories rc
                    LEFT JOIN bets b ON rc.id = b.category_id AND b.is_validated = true
                    WHERE rc.tenant_id = ? AND rc.is_active = true
                    GROUP BY rc.id
                    ORDER BY rc.display_order
                """, tenant_id)
                
                # Get slideshow images
                slideshow_images = await conn.fetch("""
                    SELECT si.*, f.url
                    FROM slideshow_images si
                    JOIN files f ON si.file_id = f.id
                    WHERE si.tenant_id = ? AND si.is_active = 1
                    ORDER BY si.display_order, si.created_at
                """, tenant_id)
                
                # Get tenant info
                tenant = await conn.fetchone("""
                    SELECT subdomain, name, owner_email FROM tenants WHERE id = ?
                """, tenant_id)
            
            return {
                "config": site_config.config,
                "tenant": {
                    "subdomain": tenant['subdomain'],
                    "name": tenant['name'],
                    "owner_email": tenant['owner_email']
                },
                "categories": [dict(cat) for cat in categories],
                "slideshow_images": [dict(img) for img in slideshow_images],
                "deployment_url": f"https://{tenant['subdomain']}.{self.base_domain}"
            }
            
        except Exception as e:
            logger.error(f"Failed to get site preview data: {e}")
            return {}

# Global service instance
site_config_service = SiteConfigService()