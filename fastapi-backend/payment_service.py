"""
Stripe payment integration service
Handles payments, subscriptions, and billing for multi-tenant SaaS
"""
import os
import stripe
import uuid
import json
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from fastapi import HTTPException, status

from database import db_manager
from models import (
    PaymentIntentCreate, PaymentIntentResponse, PaymentStatus,
    SubscriptionCreate, SubscriptionResponse, SubscriptionStatus, SubscriptionPlan,
    PaymentRecord, SubscriptionRecord, WebhookEvent
)

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# Pricing configuration
PRICING_CONFIG = {
    SubscriptionPlan.TRIAL: {
        "setup_fee": 0.00,
        "monthly_fee": 0.00,
        "stripe_price_id": None,
        "trial_days": 14
    },
    SubscriptionPlan.BASIC: {
        "setup_fee": 20.00,
        "monthly_fee": 10.00,
        "stripe_price_id": os.getenv("STRIPE_BASIC_PRICE_ID"),
        "trial_days": 0
    },
    SubscriptionPlan.PREMIUM: {
        "setup_fee": 50.00,
        "monthly_fee": 25.00,
        "stripe_price_id": os.getenv("STRIPE_PREMIUM_PRICE_ID"),
        "trial_days": 0
    }
}

class PaymentService:
    """Service for handling Stripe payments and subscriptions"""
    
    def __init__(self):
        self.webhook_endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    
    async def create_customer(self, email: str, name: str, tenant_id: str) -> str:
        """Create Stripe customer for tenant"""
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata={
                    "tenant_id": tenant_id
                }
            )
            
            # Store customer ID in database
            async with db_manager.get_connection() as conn:
                await conn.execute("""
                    UPDATE tenants 
                    SET stripe_customer_id = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, customer.id, tenant_id)
                await conn.commit()
            
            logger.info(f"Created Stripe customer {customer.id} for tenant {tenant_id}")
            return customer.id
            
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create Stripe customer: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create customer"
            )
    
    async def get_or_create_customer(self, tenant_id: str, email: str, name: str) -> str:
        """Get existing Stripe customer or create new one"""
        try:
            async with db_manager.get_connection() as conn:
                result = await conn.fetchone("""
                    SELECT stripe_customer_id, owner_email, name 
                    FROM tenants WHERE id = ?
                """, tenant_id)
                
                if not result:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Tenant not found"
                    )
                
                if result['stripe_customer_id']:
                    # Verify customer exists in Stripe
                    try:
                        stripe.Customer.retrieve(result['stripe_customer_id'])
                        return result['stripe_customer_id']
                    except stripe.error.InvalidRequestError:
                        # Customer doesn't exist in Stripe, create new one
                        pass
                
                # Create new customer
                return await self.create_customer(email, name, tenant_id)
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get/create customer: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process customer"
            )
    
    async def create_payment_intent(
        self, 
        tenant_id: str, 
        request: PaymentIntentCreate
    ) -> PaymentIntentResponse:
        """Create Stripe PaymentIntent for setup fee"""
        try:
            # Get or create customer
            async with db_manager.get_connection() as conn:
                tenant = await conn.fetchone("""
                    SELECT owner_email, name FROM tenants WHERE id = ?
                """, tenant_id)
                
                if not tenant:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Tenant not found"
                    )
            
            customer_id = await self.get_or_create_customer(
                tenant_id, tenant['owner_email'], tenant['name']
            )
            
            # Create PaymentIntent
            amount_cents = int(request.amount * 100)  # Convert to cents
            
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=request.currency,
                customer=customer_id,
                description=request.description or f"Setup fee for {tenant['name']}",
                metadata={
                    "tenant_id": tenant_id,
                    **(request.metadata or {})
                },
                automatic_payment_methods={"enabled": True}
            )
            
            # Store payment record
            payment_id = str(uuid.uuid4())
            async with db_manager.get_connection() as conn:
                await conn.execute("""
                    INSERT INTO payments (
                        id, tenant_id, stripe_payment_intent_id, amount, 
                        currency, status, description, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, 
                payment_id, tenant_id, payment_intent.id, request.amount,
                request.currency, PaymentStatus.PENDING.value, 
                request.description, json.dumps(request.metadata or {})
                )
                await conn.commit()
            
            return PaymentIntentResponse(
                id=payment_id,
                client_secret=payment_intent.client_secret,
                amount=request.amount,
                currency=request.currency,
                status=PaymentStatus.PENDING,
                created_at=datetime.utcnow()
            )
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating PaymentIntent: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create payment"
            )
        except Exception as e:
            logger.error(f"Failed to create PaymentIntent: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create payment"
            )
    
    async def create_subscription(
        self, 
        tenant_id: str, 
        request: SubscriptionCreate
    ) -> SubscriptionResponse:
        """Create Stripe subscription for tenant"""
        try:
            # Validate plan
            if request.plan not in PRICING_CONFIG:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid subscription plan"
                )
            
            plan_config = PRICING_CONFIG[request.plan]
            
            # Get tenant and customer
            async with db_manager.get_connection() as conn:
                tenant = await conn.fetchone("""
                    SELECT owner_email, name FROM tenants WHERE id = ?
                """, tenant_id)
                
                if not tenant:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Tenant not found"
                    )
            
            customer_id = await self.get_or_create_customer(
                tenant_id, tenant['owner_email'], tenant['name']
            )
            
            # Attach payment method to customer
            stripe.PaymentMethod.attach(
                request.payment_method_id,
                customer=customer_id
            )
            
            # Set as default payment method
            stripe.Customer.modify(
                customer_id,
                invoice_settings={
                    "default_payment_method": request.payment_method_id
                }
            )
            
            # Create subscription
            subscription_params = {
                "customer": customer_id,
                "items": [{"price": plan_config["stripe_price_id"]}],
                "payment_behavior": "default_incomplete",
                "payment_settings": {"save_default_payment_method": "on_subscription"},
                "expand": ["latest_invoice.payment_intent"],
                "metadata": {"tenant_id": tenant_id}
            }
            
            # Add trial period if applicable
            trial_days = request.trial_days or plan_config["trial_days"]
            if trial_days > 0:
                trial_end = datetime.utcnow() + timedelta(days=trial_days)
                subscription_params["trial_end"] = int(trial_end.timestamp())
            
            subscription = stripe.Subscription.create(**subscription_params)
            
            # Store subscription record
            subscription_id = str(uuid.uuid4())
            async with db_manager.get_connection() as conn:
                await conn.execute("""
                    INSERT INTO subscriptions (
                        id, tenant_id, stripe_customer_id, stripe_subscription_id,
                        plan, status, current_period_start, current_period_end,
                        trial_end
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                subscription_id, tenant_id, customer_id, subscription.id,
                request.plan.value, subscription.status,
                datetime.fromtimestamp(subscription.current_period_start),
                datetime.fromtimestamp(subscription.current_period_end),
                datetime.fromtimestamp(subscription.trial_end) if subscription.trial_end else None
                )
                
                # Update tenant subscription plan
                await conn.execute("""
                    UPDATE tenants 
                    SET subscription_plan = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, request.plan.value, tenant_id)
                
                await conn.commit()
            
            return SubscriptionResponse(
                id=subscription_id,
                tenant_id=tenant_id,
                stripe_subscription_id=subscription.id,
                plan=request.plan,
                status=SubscriptionStatus(subscription.status),
                current_period_start=datetime.fromtimestamp(subscription.current_period_start),
                current_period_end=datetime.fromtimestamp(subscription.current_period_end),
                trial_end=datetime.fromtimestamp(subscription.trial_end) if subscription.trial_end else None,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating subscription: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create subscription: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Failed to create subscription: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create subscription"
            )
    
    async def create_billing_portal_session(
        self, 
        tenant_id: str, 
        return_url: str
    ) -> str:
        """Create Stripe billing portal session"""
        try:
            # Get customer
            async with db_manager.get_connection() as conn:
                result = await conn.fetchone("""
                    SELECT stripe_customer_id FROM tenants WHERE id = ?
                """, tenant_id)
                
                if not result or not result['stripe_customer_id']:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No billing account found"
                    )
            
            session = stripe.billing_portal.Session.create(
                customer=result['stripe_customer_id'],
                return_url=return_url
            )
            
            return session.url
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating billing portal: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create billing portal"
            )
    
    async def handle_webhook_event(self, payload: bytes, signature: str) -> Dict[str, Any]:
        """Handle Stripe webhook events"""
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, self.webhook_endpoint_secret
            )
            
            logger.info(f"Received Stripe webhook: {event['type']}")
            
            # Handle specific event types
            if event['type'] == 'payment_intent.succeeded':
                await self._handle_payment_succeeded(event['data']['object'])
            elif event['type'] == 'payment_intent.payment_failed':
                await self._handle_payment_failed(event['data']['object'])
            elif event['type'] == 'invoice.payment_succeeded':
                await self._handle_invoice_payment_succeeded(event['data']['object'])
            elif event['type'] == 'invoice.payment_failed':
                await self._handle_invoice_payment_failed(event['data']['object'])
            elif event['type'] == 'customer.subscription.updated':
                await self._handle_subscription_updated(event['data']['object'])
            elif event['type'] == 'customer.subscription.deleted':
                await self._handle_subscription_deleted(event['data']['object'])
            
            return {"status": "success"}
            
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payload"
            )
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid webhook signature: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid signature"
            )
    
    async def _handle_payment_succeeded(self, payment_intent):
        """Handle successful payment"""
        try:
            async with db_manager.get_connection() as conn:
                await conn.execute("""
                    UPDATE payments 
                    SET status = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE stripe_payment_intent_id = ?
                """, PaymentStatus.SUCCEEDED.value, payment_intent['id'])
                await conn.commit()
                
                logger.info(f"Payment succeeded: {payment_intent['id']}")
                
        except Exception as e:
            logger.error(f"Failed to handle payment success: {e}")
    
    async def _handle_payment_failed(self, payment_intent):
        """Handle failed payment"""
        try:
            async with db_manager.get_connection() as conn:
                await conn.execute("""
                    UPDATE payments 
                    SET status = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE stripe_payment_intent_id = ?
                """, PaymentStatus.FAILED.value, payment_intent['id'])
                await conn.commit()
                
                logger.warning(f"Payment failed: {payment_intent['id']}")
                
        except Exception as e:
            logger.error(f"Failed to handle payment failure: {e}")
    
    async def _handle_subscription_updated(self, subscription):
        """Handle subscription updates"""
        try:
            async with db_manager.get_connection() as conn:
                await conn.execute("""
                    UPDATE subscriptions 
                    SET status = ?, current_period_start = ?, current_period_end = ?,
                        trial_end = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE stripe_subscription_id = ?
                """,
                subscription['status'],
                datetime.fromtimestamp(subscription['current_period_start']),
                datetime.fromtimestamp(subscription['current_period_end']),
                datetime.fromtimestamp(subscription['trial_end']) if subscription['trial_end'] else None,
                subscription['id']
                )
                await conn.commit()
                
                logger.info(f"Subscription updated: {subscription['id']}")
                
        except Exception as e:
            logger.error(f"Failed to handle subscription update: {e}")
    
    async def _handle_subscription_deleted(self, subscription):
        """Handle subscription cancellation"""
        try:
            async with db_manager.get_connection() as conn:
                await conn.execute("""
                    UPDATE subscriptions 
                    SET status = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE stripe_subscription_id = ?
                """, SubscriptionStatus.CANCELED.value, subscription['id'])
                
                # Update tenant status
                await conn.execute("""
                    UPDATE tenants 
                    SET subscription_plan = 'trial', status = 'suspended',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE stripe_customer_id = ?
                """, subscription['customer'])
                
                await conn.commit()
                
                logger.info(f"Subscription canceled: {subscription['id']}")
                
        except Exception as e:
            logger.error(f"Failed to handle subscription cancellation: {e}")
    
    async def _handle_invoice_payment_succeeded(self, invoice):
        """Handle successful invoice payment"""
        logger.info(f"Invoice payment succeeded: {invoice['id']}")
    
    async def _handle_invoice_payment_failed(self, invoice):
        """Handle failed invoice payment"""
        logger.warning(f"Invoice payment failed: {invoice['id']}")
    
    async def get_pricing_config(self) -> Dict[str, Any]:
        """Get pricing configuration"""
        return PRICING_CONFIG
    
    async def get_tenant_subscription(self, tenant_id: str) -> Optional[SubscriptionRecord]:
        """Get tenant's active subscription"""
        try:
            async with db_manager.get_connection() as conn:
                result = await conn.fetchone("""
                    SELECT * FROM subscriptions 
                    WHERE tenant_id = ? AND status IN ('active', 'trialing')
                    ORDER BY created_at DESC LIMIT 1
                """, tenant_id)
                
                return SubscriptionRecord(result) if result else None
                
        except Exception as e:
            logger.error(f"Failed to get tenant subscription: {e}")
            return None

# Global service instance
payment_service = PaymentService()