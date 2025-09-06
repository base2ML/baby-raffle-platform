"""
Centralized Package Management Service
Manages hosting packages, pricing, and features across marketing and builder sites
"""
import os
import json
import uuid
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import HTTPException, status

from database import db_manager
from site_builder_models import (
    HostingPackage, HostingPackageCreate, HostingPackageUpdate, PackageTier,
    PackageFeature, HostingPackageRecord
)

logger = logging.getLogger(__name__)

class PackageService:
    """Service for managing hosting packages and pricing"""
    
    def __init__(self):
        self.stripe_enabled = bool(os.getenv("STRIPE_SECRET_KEY"))
    
    async def initialize_default_packages(self):
        """Initialize default hosting packages if none exist"""
        try:
            async with db_manager.get_connection() as conn:
                # Check if packages exist
                result = await conn.execute("SELECT COUNT(*) as count FROM hosting_packages")
                count = (await result.fetchone())['count']
                
                if count == 0:
                    logger.info("Initializing default hosting packages...")
                    await self._create_default_packages()
                    
        except Exception as e:
            logger.error(f"Failed to initialize default packages: {e}")
    
    async def _create_default_packages(self):
        """Create default hosting packages"""
        default_packages = [
            {
                "tier": "starter",
                "name": "Starter",
                "description": "Perfect for small family raffles with essential features",
                "price_monthly": 9.99,
                "price_yearly": 99.99,
                "stripe_price_id_monthly": "price_starter_monthly",
                "stripe_price_id_yearly": "price_starter_yearly",
                "features": [
                    {"name": "Custom subdomain", "description": "yourname.base2ml.com", "included": True},
                    {"name": "Up to 5 betting categories", "description": "Birth weight, date, time, etc.", "included": True, "limit": 5},
                    {"name": "Basic themes", "description": "3 professional themes", "included": True},
                    {"name": "Email support", "description": "Response within 24 hours", "included": True},
                    {"name": "SSL certificate", "description": "Secure HTTPS connection", "included": True},
                    {"name": "Mobile responsive", "description": "Works on all devices", "included": True},
                    {"name": "Custom logo", "description": "Upload your own logo", "included": False},
                    {"name": "Premium themes", "description": "Access to premium designs", "included": False},
                    {"name": "Custom domain", "description": "Use your own domain name", "included": False},
                    {"name": "Priority support", "description": "Phone and chat support", "included": False}
                ],
                "popular": False,
                "display_order": 1
            },
            {
                "tier": "professional",
                "name": "Professional",
                "description": "Most popular choice with advanced customization and features",
                "price_monthly": 19.99,
                "price_yearly": 199.99,
                "stripe_price_id_monthly": "price_professional_monthly",
                "stripe_price_id_yearly": "price_professional_yearly",
                "features": [
                    {"name": "Custom subdomain", "description": "yourname.base2ml.com", "included": True},
                    {"name": "Up to 15 betting categories", "description": "Unlimited betting options", "included": True, "limit": 15},
                    {"name": "Premium themes", "description": "8+ professional themes", "included": True},
                    {"name": "Custom logo", "description": "Upload your own branding", "included": True},
                    {"name": "Image galleries", "description": "Photo slideshow and galleries", "included": True},
                    {"name": "Priority email support", "description": "Response within 12 hours", "included": True},
                    {"name": "SSL certificate", "description": "Secure HTTPS connection", "included": True},
                    {"name": "Mobile responsive", "description": "Works on all devices", "included": True},
                    {"name": "Custom domain", "description": "Use your own domain name", "included": False},
                    {"name": "Phone support", "description": "Direct phone support", "included": False}
                ],
                "popular": True,
                "display_order": 2
            },
            {
                "tier": "premium",
                "name": "Premium",
                "description": "Everything you need with custom domain and premium support",
                "price_monthly": 39.99,
                "price_yearly": 399.99,
                "stripe_price_id_monthly": "price_premium_monthly",
                "stripe_price_id_yearly": "price_premium_yearly",
                "features": [
                    {"name": "Custom domain", "description": "Use your own domain (babybets.com)", "included": True},
                    {"name": "Custom subdomain", "description": "Alternative subdomain option", "included": True},
                    {"name": "Unlimited betting categories", "description": "No limits on betting options", "included": True},
                    {"name": "All premium themes", "description": "Full theme library access", "included": True},
                    {"name": "Custom logo & branding", "description": "Complete visual customization", "included": True},
                    {"name": "Image galleries", "description": "Unlimited photo uploads", "included": True},
                    {"name": "Priority phone support", "description": "Direct phone line support", "included": True},
                    {"name": "Custom CSS", "description": "Advanced design customization", "included": True},
                    {"name": "SSL certificate", "description": "Secure HTTPS connection", "included": True},
                    {"name": "Mobile responsive", "description": "Works on all devices", "included": True}
                ],
                "popular": False,
                "display_order": 3
            }
        ]
        
        async with db_manager.get_connection() as conn:
            for package_data in default_packages:
                package_id = str(uuid.uuid4())
                await conn.execute("""
                    INSERT INTO hosting_packages 
                    (id, tier, name, description, price_monthly, price_yearly,
                     stripe_price_id_monthly, stripe_price_id_yearly, features, 
                     popular, is_active, display_order, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    package_id, package_data["tier"], package_data["name"],
                    package_data["description"], package_data["price_monthly"],
                    package_data["price_yearly"], package_data["stripe_price_id_monthly"],
                    package_data["stripe_price_id_yearly"], json.dumps(package_data["features"]),
                    package_data["popular"], True, package_data["display_order"],
                    datetime.utcnow().isoformat(), datetime.utcnow().isoformat()
                ))
            
            await conn.commit()
            logger.info(f"Created {len(default_packages)} default hosting packages")
    
    async def get_all_packages(self, active_only: bool = True) -> List[HostingPackage]:
        """Get all hosting packages"""
        try:
            async with db_manager.get_connection() as conn:
                query = """
                    SELECT * FROM hosting_packages 
                    {} ORDER BY display_order ASC, created_at ASC
                """.format("WHERE is_active = 1" if active_only else "")
                
                result = await conn.execute(query)
                rows = await result.fetchall()
                
                packages = []
                for row in rows:
                    record = HostingPackageRecord(row)
                    packages.append(HostingPackage(
                        id=record.id,
                        tier=record.tier,
                        name=record.name,
                        description=record.description,
                        price_monthly=record.price_monthly,
                        price_yearly=record.price_yearly,
                        stripe_price_id_monthly=record.stripe_price_id_monthly,
                        stripe_price_id_yearly=record.stripe_price_id_yearly,
                        features=record.features,
                        popular=record.popular,
                        is_active=record.is_active,
                        display_order=record.display_order
                    ))
                
                return packages
                
        except Exception as e:
            logger.error(f"Failed to get packages: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve hosting packages"
            )
    
    async def get_package_by_tier(self, tier: PackageTier) -> Optional[HostingPackage]:
        """Get package by tier"""
        try:
            async with db_manager.get_connection() as conn:
                result = await conn.execute("""
                    SELECT * FROM hosting_packages 
                    WHERE tier = ? AND is_active = 1
                """, (tier,))
                
                row = await result.fetchone()
                if not row:
                    return None
                
                record = HostingPackageRecord(row)
                return HostingPackage(
                    id=record.id,
                    tier=record.tier,
                    name=record.name,
                    description=record.description,
                    price_monthly=record.price_monthly,
                    price_yearly=record.price_yearly,
                    stripe_price_id_monthly=record.stripe_price_id_monthly,
                    stripe_price_id_yearly=record.stripe_price_id_yearly,
                    features=record.features,
                    popular=record.popular,
                    is_active=record.is_active,
                    display_order=record.display_order
                )
                
        except Exception as e:
            logger.error(f"Failed to get package by tier {tier}: {e}")
            return None
    
    async def create_package(self, package_data: HostingPackageCreate) -> HostingPackage:
        """Create new hosting package"""
        try:
            package_id = str(uuid.uuid4())
            
            async with db_manager.get_connection() as conn:
                await conn.execute("""
                    INSERT INTO hosting_packages 
                    (id, tier, name, description, price_monthly, price_yearly,
                     stripe_price_id_monthly, stripe_price_id_yearly, features, 
                     popular, is_active, display_order, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    package_id, package_data.tier, package_data.name,
                    package_data.description, package_data.price_monthly,
                    package_data.price_yearly, package_data.stripe_price_id_monthly,
                    package_data.stripe_price_id_yearly, 
                    json.dumps([f.dict() for f in package_data.features]),
                    package_data.popular, True, package_data.display_order,
                    datetime.utcnow().isoformat(), datetime.utcnow().isoformat()
                ))
                
                await conn.commit()
                
                # Return the created package
                return HostingPackage(
                    id=package_id,
                    tier=package_data.tier,
                    name=package_data.name,
                    description=package_data.description,
                    price_monthly=package_data.price_monthly,
                    price_yearly=package_data.price_yearly,
                    stripe_price_id_monthly=package_data.stripe_price_id_monthly,
                    stripe_price_id_yearly=package_data.stripe_price_id_yearly,
                    features=package_data.features,
                    popular=package_data.popular,
                    is_active=True,
                    display_order=package_data.display_order
                )
                
        except Exception as e:
            logger.error(f"Failed to create package: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create hosting package"
            )
    
    async def update_package(self, package_id: str, package_data: HostingPackageUpdate) -> HostingPackage:
        """Update existing hosting package"""
        try:
            async with db_manager.get_connection() as conn:
                # First check if package exists
                result = await conn.execute("""
                    SELECT * FROM hosting_packages WHERE id = ?
                """, (package_id,))
                
                existing = await result.fetchone()
                if not existing:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Hosting package not found"
                    )
                
                # Build update query dynamically
                update_fields = []
                update_values = []
                
                for field, value in package_data.dict(exclude_unset=True).items():
                    if field == "features" and value is not None:
                        value = json.dumps([f.dict() for f in value])
                    update_fields.append(f"{field} = ?")
                    update_values.append(value)
                
                if not update_fields:
                    # No fields to update
                    record = HostingPackageRecord(existing)
                    return HostingPackage(
                        id=record.id,
                        tier=record.tier,
                        name=record.name,
                        description=record.description,
                        price_monthly=record.price_monthly,
                        price_yearly=record.price_yearly,
                        stripe_price_id_monthly=record.stripe_price_id_monthly,
                        stripe_price_id_yearly=record.stripe_price_id_yearly,
                        features=record.features,
                        popular=record.popular,
                        is_active=record.is_active,
                        display_order=record.display_order
                    )
                
                # Add updated timestamp
                update_fields.append("updated_at = ?")
                update_values.append(datetime.utcnow().isoformat())
                update_values.append(package_id)
                
                query = f"""
                    UPDATE hosting_packages 
                    SET {', '.join(update_fields)}
                    WHERE id = ?
                """
                
                await conn.execute(query, tuple(update_values))
                await conn.commit()
                
                # Return updated package
                result = await conn.execute("""
                    SELECT * FROM hosting_packages WHERE id = ?
                """, (package_id,))
                
                updated_row = await result.fetchone()
                record = HostingPackageRecord(updated_row)
                
                return HostingPackage(
                    id=record.id,
                    tier=record.tier,
                    name=record.name,
                    description=record.description,
                    price_monthly=record.price_monthly,
                    price_yearly=record.price_yearly,
                    stripe_price_id_monthly=record.stripe_price_id_monthly,
                    stripe_price_id_yearly=record.stripe_price_id_yearly,
                    features=record.features,
                    popular=record.popular,
                    is_active=record.is_active,
                    display_order=record.display_order
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to update package: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update hosting package"
            )
    
    async def delete_package(self, package_id: str) -> bool:
        """Delete (deactivate) hosting package"""
        try:
            async with db_manager.get_connection() as conn:
                # Soft delete by setting is_active = False
                result = await conn.execute("""
                    UPDATE hosting_packages 
                    SET is_active = 0, updated_at = ?
                    WHERE id = ?
                """, (datetime.utcnow().isoformat(), package_id))
                
                await conn.commit()
                return result.rowcount > 0
                
        except Exception as e:
            logger.error(f"Failed to delete package: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete hosting package"
            )
    
    async def get_package_for_marketing(self) -> List[Dict[str, Any]]:
        """Get packages formatted for marketing site"""
        packages = await self.get_all_packages(active_only=True)
        
        marketing_packages = []
        for package in packages:
            # Convert to marketing site format
            marketing_packages.append({
                "id": package.id,
                "name": package.name,
                "price": package.price_monthly,
                "priceYearly": package.price_yearly,
                "description": package.description,
                "popular": package.popular,
                "features": [f.name for f in package.features if f.included],
                "tier": package.tier,
                "stripeMonthlyPriceId": package.stripe_price_id_monthly,
                "stripeYearlyPriceId": package.stripe_price_id_yearly
            })
        
        return marketing_packages

# Global instance
package_service = PackageService()