"""
Site Builder Service
Manages site customization, themes, and the site building process
"""
import os
import json
import uuid
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import HTTPException, status

from database import db_manager
from site_builder_models import (
    SiteBuilderConfig, SiteBuilderCreate, SiteBuilderUpdate, SiteBuilderResponse,
    SiteBuilderRecord, ThemeConfig, CustomTheme, BuilderStatus, CustomizationStep,
    DEFAULT_THEMES, SaveSiteRequest, SaveSiteResponse, PreviewRequest, PreviewResponse
)
from oauth import oauth_service
from tenant_service import tenant_service

logger = logging.getLogger(__name__)

class SiteBuilderService:
    """Service for managing site building and customization"""
    
    def __init__(self):
        self.base_domain = os.getenv("BASE_DOMAIN", "base2ml.com")
        self.builder_domain = f"builder.{self.base_domain}"
        self.preview_domain = f"preview.{self.base_domain}"
    
    async def get_available_themes(self) -> List[ThemeConfig]:
        """Get all available themes"""
        themes = []
        for theme_data in DEFAULT_THEMES:
            themes.append(ThemeConfig(**theme_data))
        return themes
    
    async def create_anonymous_builder(self, builder_data: SiteBuilderCreate) -> SiteBuilderResponse:
        """Create anonymous site builder session"""
        try:
            builder_id = str(uuid.uuid4())
            
            config = SiteBuilderConfig(
                id=builder_id,
                user_id=None,
                tenant_id=None,
                status=BuilderStatus.DRAFT,
                current_step=CustomizationStep.THEME,
                completed_steps=[],
                theme=builder_data.theme,
                content=builder_data.content,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            async with db_manager.get_connection() as conn:
                await conn.execute("""
                    INSERT INTO site_builders 
                    (id, user_id, tenant_id, status, current_step, completed_steps, 
                     config, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    builder_id, None, None, config.status, config.current_step,
                    json.dumps(config.completed_steps), json.dumps(config.dict()),
                    config.created_at.isoformat(), config.updated_at.isoformat()
                ))
                
                await conn.commit()
            
            # Generate preview URL
            preview_url = await self._generate_preview_url(builder_id)
            
            return SiteBuilderResponse(
                id=builder_id,
                status=config.status,
                current_step=config.current_step,
                completed_steps=config.completed_steps,
                config=config,
                preview_url=preview_url,
                live_url=None,
                can_publish=False,
                created_at=config.created_at,
                updated_at=config.updated_at
            )
            
        except Exception as e:
            logger.error(f"Failed to create anonymous builder: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create site builder session"
            )
    
    async def get_builder(self, builder_id: str) -> SiteBuilderResponse:
        """Get site builder configuration"""
        try:
            async with db_manager.get_connection() as conn:
                result = await conn.execute("""
                    SELECT * FROM site_builders WHERE id = ?
                """, (builder_id,))
                
                row = await result.fetchone()
                if not row:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Site builder not found"
                    )
                
                record = SiteBuilderRecord(row)
                config = SiteBuilderConfig(**record.config)
                
                # Generate URLs
                preview_url = await self._generate_preview_url(builder_id)
                live_url = None
                if record.tenant_id and config.status == BuilderStatus.PUBLISHED:
                    live_url = f"https://{config.content.site_title.lower().replace(' ', '')}.{self.base_domain}"
                
                # Check if can publish
                can_publish = self._can_publish(config)
                
                return SiteBuilderResponse(
                    id=record.id,
                    status=BuilderStatus(record.status),
                    current_step=CustomizationStep(record.current_step),
                    completed_steps=[CustomizationStep(step) for step in record.completed_steps],
                    config=config,
                    preview_url=preview_url,
                    live_url=live_url,
                    can_publish=can_publish,
                    created_at=record.created_at,
                    updated_at=record.updated_at
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get builder {builder_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve site builder"
            )
    
    async def update_builder(self, builder_id: str, update_data: SiteBuilderUpdate) -> SiteBuilderResponse:
        """Update site builder configuration"""
        try:
            # Get current builder
            current = await self.get_builder(builder_id)
            config = current.config
            
            # Update configuration
            if update_data.current_step:
                config.current_step = update_data.current_step
                # Mark previous steps as completed
                self._update_completed_steps(config)
            
            if update_data.theme:
                config.theme = update_data.theme
            
            if update_data.content:
                config.content = update_data.content
            
            if update_data.images:
                config.images = update_data.images
            
            if update_data.betting_cards:
                config.betting_cards = update_data.betting_cards
            
            if update_data.betting_style:
                config.betting_style = update_data.betting_style
            
            if update_data.payment_info:
                config.payment_info = update_data.payment_info
            
            if update_data.selected_package:
                config.selected_package = update_data.selected_package
            
            if update_data.billing_cycle:
                config.billing_cycle = update_data.billing_cycle
            
            config.updated_at = datetime.utcnow()
            
            # Update database
            async with db_manager.get_connection() as conn:
                await conn.execute("""
                    UPDATE site_builders 
                    SET current_step = ?, completed_steps = ?, config = ?, updated_at = ?
                    WHERE id = ?
                """, (
                    config.current_step, json.dumps([step.value for step in config.completed_steps]),
                    json.dumps(config.dict()), config.updated_at.isoformat(), builder_id
                ))
                
                await conn.commit()
            
            # Return updated builder
            return await self.get_builder(builder_id)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to update builder {builder_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update site builder"
            )
    
    async def save_site_and_create_account(self, save_request: SaveSiteRequest) -> SaveSiteResponse:
        """Save site configuration and create user account with OAuth"""
        try:
            # Validate subdomain availability
            if not await tenant_service.is_subdomain_available(save_request.subdomain):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Subdomain is not available"
                )
            
            # Process OAuth authentication
            oauth_data = await oauth_service.handle_callback(
                code=save_request.oauth_code,
                state="site_builder",  # We'll need to modify OAuth service for this
                provider=save_request.oauth_provider
            )
            
            if not oauth_data.get("email"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user email from OAuth provider"
                )
            
            # Create tenant
            tenant_data = {
                "subdomain": save_request.subdomain,
                "name": save_request.site_config.content.site_title,
                "owner_email": oauth_data["email"]
            }
            
            tenant = await tenant_service.create_tenant(tenant_data)
            
            # Create user
            user_data = {
                "email": oauth_data["email"],
                "full_name": save_request.owner_name,
                "role": "owner"
            }
            
            user = await tenant_service.create_user(tenant.id, user_data, oauth_data)
            
            # Update site builder with tenant info
            config = save_request.site_config
            config.tenant_id = tenant.id
            config.status = BuilderStatus.PUBLISHED
            config.selected_package = save_request.selected_package
            config.billing_cycle = save_request.billing_cycle
            config.updated_at = datetime.utcnow()
            config.published_at = datetime.utcnow()
            
            # Save final configuration
            async with db_manager.get_connection() as conn:
                await conn.execute("""
                    UPDATE site_builders 
                    SET tenant_id = ?, status = ?, config = ?, updated_at = ?, published_at = ?
                    WHERE id = ?
                """, (
                    tenant.id, config.status, json.dumps(config.dict()),
                    config.updated_at.isoformat(), config.published_at.isoformat(),
                    config.id
                ))
                
                await conn.commit()
            
            # Generate access token
            access_token = await oauth_service.generate_jwt_token({
                "user_id": user.id,
                "tenant_id": tenant.id,
                "email": user.email,
                "role": user.role
            })
            
            # Generate URLs
            preview_url = f"https://{save_request.subdomain}.{self.base_domain}"
            admin_url = f"https://{save_request.subdomain}.{self.base_domain}/admin"
            
            return SaveSiteResponse(
                tenant_id=tenant.id,
                site_id=config.id,
                subdomain=save_request.subdomain,
                preview_url=preview_url,
                admin_url=admin_url,
                access_token=access_token,
                expires_in=1440 * 60  # 24 hours in seconds
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to save site and create account: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save site and create account"
            )
    
    async def generate_preview(self, builder_id: str) -> PreviewResponse:
        """Generate a temporary preview of the site"""
        try:
            builder = await self.get_builder(builder_id)
            
            # Generate temporary preview URL
            preview_url = await self._generate_preview_url(builder_id)
            expires_at = datetime.utcnow() + timedelta(hours=24)
            
            # Store preview configuration temporarily
            await self._store_preview_config(builder_id, builder.config, expires_at)
            
            return PreviewResponse(
                preview_url=preview_url,
                expires_at=expires_at
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to generate preview for {builder_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate site preview"
            )
    
    def _update_completed_steps(self, config: SiteBuilderConfig):
        """Update completed steps based on current step"""
        step_order = [
            CustomizationStep.THEME,
            CustomizationStep.CONTENT,
            CustomizationStep.IMAGES,
            CustomizationStep.BETTING_CARDS,
            CustomizationStep.PAYMENT_INFO,
            CustomizationStep.REVIEW
        ]
        
        try:
            current_index = step_order.index(config.current_step)
            config.completed_steps = step_order[:current_index]
        except ValueError:
            # Invalid step, don't update
            pass
    
    def _can_publish(self, config: SiteBuilderConfig) -> bool:
        """Check if site is ready for publishing"""
        required_steps = [
            CustomizationStep.THEME,
            CustomizationStep.CONTENT,
            CustomizationStep.BETTING_CARDS,
            CustomizationStep.PAYMENT_INFO
        ]
        
        return all(step in config.completed_steps for step in required_steps)
    
    async def _generate_preview_url(self, builder_id: str) -> str:
        """Generate preview URL for builder"""
        return f"https://{self.preview_domain}/{builder_id}"
    
    async def _store_preview_config(self, builder_id: str, config: SiteBuilderConfig, expires_at: datetime):
        """Store preview configuration temporarily"""
        try:
            async with db_manager.get_connection() as conn:
                await conn.execute("""
                    INSERT OR REPLACE INTO preview_configs 
                    (builder_id, config, expires_at, created_at)
                    VALUES (?, ?, ?, ?)
                """, (
                    builder_id, json.dumps(config.dict()),
                    expires_at.isoformat(), datetime.utcnow().isoformat()
                ))
                
                await conn.commit()
                
        except Exception as e:
            logger.error(f"Failed to store preview config: {e}")
            # Non-critical error, don't fail the request

# Global instance
site_builder_service = SiteBuilderService()