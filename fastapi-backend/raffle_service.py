"""
Raffle service for managing bets and categories within tenants
"""
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import HTTPException, status

from .database import db_manager
from .models import (
    BetCreate, BetSubmission, BetResponse, BetValidationRequest,
    RaffleCategoryCreate, RaffleCategoryResponse,
    TenantRecord, UserRecord
)

logger = logging.getLogger(__name__)

class RaffleService:
    """Service for managing raffle categories and betting operations"""
    
    async def get_categories_for_tenant(self, tenant_id: str) -> List[Dict[str, Any]]:
        """Get all active categories for a tenant with statistics"""
        try:
            async with db_manager.get_tenant_connection(tenant_id) as conn:
                categories = await conn.fetch("""
                    SELECT 
                        rc.id,
                        rc.category_key,
                        rc.category_name,
                        rc.description,
                        rc.bet_price,
                        rc.options,
                        rc.display_order,
                        rc.created_at,
                        COUNT(b.id) as bet_count,
                        COUNT(b.id) FILTER (WHERE b.is_validated = true) as validated_count,
                        COALESCE(SUM(b.amount), 0) as total_amount,
                        COALESCE(SUM(b.amount) FILTER (WHERE b.is_validated = true), 0) as validated_amount
                    FROM raffle_categories rc
                    LEFT JOIN bets b ON rc.id = b.category_id
                    WHERE rc.tenant_id = $1 AND rc.is_active = true
                    GROUP BY rc.id, rc.category_key, rc.category_name, rc.description,
                             rc.bet_price, rc.options, rc.display_order, rc.created_at
                    ORDER BY rc.display_order
                """, tenant_id)
                
                return [
                    {
                        "id": str(cat['id']),
                        "categoryKey": cat['category_key'],
                        "categoryName": cat['category_name'],
                        "description": cat['description'],
                        "betPrice": str(float(cat['bet_price'])),
                        "options": cat['options'],
                        "displayOrder": cat['display_order'],
                        "betCount": cat['bet_count'] or 0,
                        "validatedCount": cat['validated_count'] or 0,
                        "totalAmount": float(cat['total_amount'] or 0),
                        "validatedAmount": float(cat['validated_amount'] or 0),
                        "createdAt": cat['created_at'].isoformat()
                    } for cat in categories
                ]
                
        except Exception as e:
            logger.error(f"Failed to get categories for tenant {tenant_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get raffle categories"
            )
    
    async def create_category(self, 
                            tenant_id: str, 
                            category_data: RaffleCategoryCreate,
                            created_by: str) -> Dict[str, Any]:
        """Create a new raffle category"""
        try:
            async with db_manager.get_tenant_connection(tenant_id) as conn:
                # Check if category key already exists
                existing = await conn.fetchrow("""
                    SELECT id FROM raffle_categories 
                    WHERE tenant_id = $1 AND category_key = $2
                """, tenant_id, category_data.category_key)
                
                if existing:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Category key '{category_data.category_key}' already exists"
                    )
                
                new_category = await conn.fetchrow("""
                    INSERT INTO raffle_categories (
                        tenant_id, category_key, category_name, description,
                        bet_price, options, is_active, display_order
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING *
                """, 
                tenant_id,
                category_data.category_key,
                category_data.category_name,
                category_data.description,
                category_data.bet_price,
                category_data.options,
                category_data.is_active,
                category_data.display_order
                )
                
                logger.info(f"Created category '{category_data.category_key}' for tenant {tenant_id} by {created_by}")
                
                return {
                    "id": str(new_category['id']),
                    "categoryKey": new_category['category_key'],
                    "categoryName": new_category['category_name'],
                    "description": new_category['description'],
                    "betPrice": str(float(new_category['bet_price'])),
                    "options": new_category['options'],
                    "isActive": new_category['is_active'],
                    "displayOrder": new_category['display_order'],
                    "createdAt": new_category['created_at'].isoformat()
                }
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to create category for tenant {tenant_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create raffle category"
            )
    
    async def submit_bets(self, 
                         tenant_id: str, 
                         submission: BetSubmission) -> Dict[str, Any]:
        """Submit multiple bets for a user"""
        try:
            async with db_manager.get_tenant_connection(tenant_id) as conn:
                async with conn.transaction():
                    bet_records = []
                    total_amount = 0
                    
                    for bet in submission.bets:
                        # Verify category exists and get current price
                        category = await conn.fetchrow("""
                            SELECT id, bet_price, is_active, category_name
                            FROM raffle_categories 
                            WHERE id = $1 AND tenant_id = $2
                        """, bet.category_id, tenant_id)
                        
                        if not category:
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Category not found: {bet.category_id}"
                            )
                        
                        if not category['is_active']:
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Category '{category['category_name']}' is not active"
                            )
                        
                        # Validate bet amount matches category price
                        if float(bet.amount) != float(category['bet_price']):
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Bet amount must be ${category['bet_price']}"
                            )
                        
                        # Create bet record
                        new_bet = await conn.fetchrow("""
                            INSERT INTO bets (
                                tenant_id, category_id, user_name, user_email,
                                bet_value, amount, created_at
                            )
                            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
                            RETURNING id, created_at
                        """, 
                        tenant_id,
                        bet.category_id,
                        submission.user_name,
                        submission.user_email,
                        bet.bet_value,
                        bet.amount
                        )
                        
                        bet_record = {
                            "id": str(new_bet['id']),
                            "categoryId": bet.category_id,
                            "categoryName": category['category_name'],
                            "betValue": bet.bet_value,
                            "amount": float(bet.amount),
                            "createdAt": new_bet['created_at'].isoformat()
                        }
                        
                        bet_records.append(bet_record)
                        total_amount += float(bet.amount)
                    
                    logger.info(f"Submitted {len(bet_records)} bets for {submission.user_name} ({submission.user_email}) in tenant {tenant_id}")
                    
                    return {
                        "success": True,
                        "betCount": len(bet_records),
                        "totalAmount": total_amount,
                        "bets": bet_records,
                        "message": f"Successfully submitted {len(bet_records)} bets"
                    }
                    
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to submit bets for tenant {tenant_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to submit bets"
            )
    
    async def get_bets_for_tenant(self, 
                                 tenant_id: str, 
                                 validated_only: bool = False,
                                 limit: int = 100,
                                 offset: int = 0) -> List[Dict[str, Any]]:
        """Get bets for a tenant with filtering"""
        try:
            async with db_manager.get_tenant_connection(tenant_id) as conn:
                where_clause = "WHERE b.tenant_id = $1"
                params = [tenant_id]
                param_count = 1
                
                if validated_only:
                    where_clause += " AND b.is_validated = true"
                
                param_count += 1
                params.append(limit)
                limit_param = f"${param_count}"
                
                param_count += 1  
                params.append(offset)
                offset_param = f"${param_count}"
                
                bets = await conn.fetch(f"""
                    SELECT 
                        b.id,
                        b.user_name,
                        b.user_email,
                        b.bet_value,
                        b.amount,
                        b.is_validated,
                        b.validated_at,
                        b.created_at,
                        rc.category_key,
                        rc.category_name,
                        u.full_name as validated_by_name
                    FROM bets b
                    JOIN raffle_categories rc ON b.category_id = rc.id
                    LEFT JOIN users u ON b.validated_by = u.id
                    {where_clause}
                    ORDER BY b.created_at DESC
                    LIMIT {limit_param} OFFSET {offset_param}
                """, *params)
                
                return [
                    {
                        "id": str(bet['id']),
                        "userName": bet['user_name'],
                        "userEmail": bet['user_email'],
                        "categoryKey": bet['category_key'],
                        "categoryName": bet['category_name'],
                        "betValue": bet['bet_value'],
                        "amount": float(bet['amount']),
                        "isValidated": bet['is_validated'],
                        "validatedBy": bet['validated_by_name'],
                        "validatedAt": bet['validated_at'].isoformat() if bet['validated_at'] else None,
                        "createdAt": bet['created_at'].isoformat()
                    } for bet in bets
                ]
                
        except Exception as e:
            logger.error(f"Failed to get bets for tenant {tenant_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get bets"
            )
    
    async def validate_bets(self, 
                          tenant_id: str, 
                          bet_ids: List[str], 
                          validated_by_user: UserRecord) -> Dict[str, Any]:
        """Validate/approve bets (admin operation)"""
        try:
            async with db_manager.get_tenant_connection(tenant_id) as conn:
                async with conn.transaction():
                    # Verify all bets exist and belong to tenant
                    existing_bets = await conn.fetch("""
                        SELECT id, user_name, user_email, is_validated
                        FROM bets 
                        WHERE tenant_id = $1 AND id = ANY($2)
                    """, tenant_id, bet_ids)
                    
                    if len(existing_bets) != len(bet_ids):
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Some bet IDs are invalid or don't belong to this tenant"
                        )
                    
                    # Update bets to validated
                    result = await conn.execute("""
                        UPDATE bets 
                        SET is_validated = true,
                            validated_by = $1,
                            validated_at = CURRENT_TIMESTAMP
                        WHERE tenant_id = $2 AND id = ANY($3) AND is_validated = false
                    """, validated_by_user.id, tenant_id, bet_ids)
                    
                    # Parse result to get actual updated count
                    updated_count = int(result.split()[-1]) if result else 0
                    already_validated = len(bet_ids) - updated_count
                    
                    logger.info(f"Validated {updated_count} bets for tenant {tenant_id} by {validated_by_user.full_name}")
                    
                    return {
                        "success": True,
                        "validatedCount": updated_count,
                        "alreadyValidated": already_validated,
                        "validatedBy": validated_by_user.full_name,
                        "validatedAt": datetime.utcnow().isoformat(),
                        "message": f"Validated {updated_count} bets"
                    }
                    
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to validate bets for tenant {tenant_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to validate bets"
            )
    
    async def get_tenant_betting_stats(self, tenant_id: str) -> Dict[str, Any]:
        """Get comprehensive betting statistics for a tenant"""
        try:
            async with db_manager.get_tenant_connection(tenant_id) as conn:
                # Get overall stats
                overall_stats = await conn.fetchrow("""
                    SELECT 
                        COUNT(b.id) as total_bets,
                        COUNT(b.id) FILTER (WHERE b.is_validated = true) as validated_bets,
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
                category_stats = await conn.fetch("""
                    SELECT 
                        rc.category_key,
                        rc.category_name,
                        COUNT(b.id) as bet_count,
                        COUNT(b.id) FILTER (WHERE b.is_validated = true) as validated_count,
                        COALESCE(SUM(b.amount), 0) as total_amount,
                        COALESCE(SUM(b.amount) FILTER (WHERE b.is_validated = true), 0) as validated_amount
                    FROM raffle_categories rc
                    LEFT JOIN bets b ON rc.id = b.category_id
                    WHERE rc.tenant_id = $1 AND rc.is_active = true
                    GROUP BY rc.category_key, rc.category_name
                    ORDER BY rc.display_order
                """, tenant_id)
                
                # Get recent activity
                recent_bets = await conn.fetch("""
                    SELECT 
                        b.user_name,
                        b.user_email,
                        b.bet_value,
                        b.amount,
                        b.is_validated,
                        b.created_at,
                        rc.category_name
                    FROM bets b
                    JOIN raffle_categories rc ON b.category_id = rc.id
                    WHERE b.tenant_id = $1
                    ORDER BY b.created_at DESC
                    LIMIT 10
                """, tenant_id)
                
                return {
                    "overall": {
                        "totalBets": overall_stats['total_bets'] or 0,
                        "validatedBets": overall_stats['validated_bets'] or 0,
                        "totalAmount": float(overall_stats['total_amount'] or 0),
                        "validatedAmount": float(overall_stats['validated_amount'] or 0),
                        "uniqueUsers": overall_stats['unique_users'] or 0,
                        "activeCategories": overall_stats['active_categories'] or 0
                    },
                    "categories": [
                        {
                            "categoryKey": cat['category_key'],
                            "categoryName": cat['category_name'],
                            "betCount": cat['bet_count'] or 0,
                            "validatedCount": cat['validated_count'] or 0,
                            "totalAmount": float(cat['total_amount'] or 0),
                            "validatedAmount": float(cat['validated_amount'] or 0)
                        } for cat in category_stats
                    ],
                    "recentBets": [
                        {
                            "userName": bet['user_name'],
                            "userEmail": bet['user_email'],
                            "categoryName": bet['category_name'],
                            "betValue": bet['bet_value'],
                            "amount": float(bet['amount']),
                            "isValidated": bet['is_validated'],
                            "createdAt": bet['created_at'].isoformat()
                        } for bet in recent_bets
                    ]
                }
                
        except Exception as e:
            logger.error(f"Failed to get betting stats for tenant {tenant_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get betting statistics"
            )

# Global service instance
raffle_service = RaffleService()