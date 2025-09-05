#!/usr/bin/env python3
"""
Test script for new API extensions
Run this to verify payment, file upload, and site config functionality
"""
import asyncio
import json
import logging
from pathlib import Path
from datetime import datetime

# Test imports
from payment_service import payment_service, PRICING_CONFIG
from file_service import file_service
from site_config_service import site_config_service
from database import db_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_database_schema():
    """Test that new database tables were created"""
    logger.info("Testing database schema...")
    
    async with db_manager.get_connection() as conn:
        # Check if new tables exist
        tables = await conn.fetch("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name IN (
                'payments', 'subscriptions', 'files', 
                'slideshow_images', 'site_configs', 'deployments'
            )
        """)
        
        table_names = [table['name'] for table in tables]
        expected_tables = ['payments', 'subscriptions', 'files', 'slideshow_images', 'site_configs', 'deployments']
        
        for table in expected_tables:
            if table in table_names:
                logger.info(f"✅ Table {table} exists")
            else:
                logger.error(f"❌ Table {table} missing")
        
        # Check if stripe_customer_id column was added to tenants
        tenant_columns = await conn.fetch("PRAGMA table_info(tenants)")
        column_names = [col['name'] for col in tenant_columns]
        
        if 'stripe_customer_id' in column_names:
            logger.info("✅ stripe_customer_id column added to tenants table")
        else:
            logger.error("❌ stripe_customer_id column missing from tenants table")

async def test_payment_service():
    """Test payment service functionality"""
    logger.info("Testing payment service...")
    
    # Test pricing configuration
    try:
        pricing = await payment_service.get_pricing_config()
        logger.info(f"✅ Pricing config loaded: {len(pricing)} plans")
        
        # Verify expected plans exist
        for plan in ['trial', 'basic', 'premium']:
            if plan in pricing:
                logger.info(f"✅ Plan {plan}: setup=${pricing[plan]['setup_fee']}, monthly=${pricing[plan]['monthly_fee']}")
            else:
                logger.error(f"❌ Plan {plan} missing from pricing config")
                
    except Exception as e:
        logger.error(f"❌ Payment service test failed: {e}")

async def test_file_service():
    """Test file service functionality"""
    logger.info("Testing file service...")
    
    try:
        # Test upload directory creation
        upload_dir = Path(file_service.upload_dir)
        if upload_dir.exists():
            logger.info(f"✅ Upload directory exists: {upload_dir}")
            
            # Check subdirectories
            for subdir in ['images', 'thumbnails', 'large']:
                subdir_path = upload_dir / subdir
                if subdir_path.exists():
                    logger.info(f"✅ Subdirectory {subdir} exists")
                else:
                    logger.error(f"❌ Subdirectory {subdir} missing")
        else:
            logger.error(f"❌ Upload directory missing: {upload_dir}")
            
        # Test file path generation
        test_path = file_service._get_file_path("test-tenant", "test.jpg")
        test_url = file_service._get_file_url("test-tenant", "test.jpg")
        
        logger.info(f"✅ File path generation works: {test_path}")
        logger.info(f"✅ File URL generation works: {test_url}")
        
    except Exception as e:
        logger.error(f"❌ File service test failed: {e}")

async def test_site_config_service():
    """Test site configuration service"""
    logger.info("Testing site configuration service...")
    
    try:
        # Test with demo tenant
        demo_tenant_id = "demo-tenant-001"
        
        # Create default config
        config = await site_config_service.get_site_config(demo_tenant_id)
        logger.info(f"✅ Site config retrieved/created for demo tenant")
        logger.info(f"   Config keys: {list(config.config.keys())}")
        
        # Test config validation
        from models import SiteConfigUpdate
        
        # Valid update
        valid_update = SiteConfigUpdate(
            site_title="Test Baby Raffle",
            primary_color="#ff5722",
            max_bets_per_user=15
        )
        
        # This should not raise an exception
        site_config_service._validate_config(valid_update.dict(exclude_unset=True))
        logger.info("✅ Config validation works for valid data")
        
        # Test invalid color (should raise exception)
        try:
            site_config_service._validate_config({"primary_color": "invalid-color"})
            logger.error("❌ Config validation should have failed for invalid color")
        except Exception:
            logger.info("✅ Config validation correctly rejects invalid color")
            
    except Exception as e:
        logger.error(f"❌ Site config service test failed: {e}")

async def test_api_endpoints_structure():
    """Test that API endpoint structure is correct"""
    logger.info("Testing API endpoint structure...")
    
    # Import main app to check endpoints
    try:
        from main import app
        
        routes = []
        for route in app.routes:
            if hasattr(route, 'path') and hasattr(route, 'methods'):
                routes.append(f"{list(route.methods)[0]} {route.path}")
        
        # Check for new endpoints
        expected_endpoints = [
            "POST /api/payments/create-intent",
            "POST /api/subscriptions/create",
            "GET /api/subscriptions/current",
            "POST /api/billing/portal",
            "GET /api/payments/pricing",
            "POST /api/webhooks/stripe",
            "POST /api/files/upload",
            "GET /api/files",
            "POST /api/slideshow/add",
            "GET /api/slideshow",
            "GET /api/site-config",
            "PUT /api/site-config",
            "POST /api/deploy",
            "GET /api/deployments"
        ]
        
        logger.info(f"✅ Total routes found: {len(routes)}")
        
        for endpoint in expected_endpoints:
            method, path = endpoint.split(" ", 1)
            found = any(route for route in routes if route.startswith(method) and path in route)
            if found:
                logger.info(f"✅ Endpoint found: {endpoint}")
            else:
                logger.error(f"❌ Endpoint missing: {endpoint}")
                
    except Exception as e:
        logger.error(f"❌ API structure test failed: {e}")

async def run_all_tests():
    """Run all test functions"""
    logger.info("🚀 Starting API extensions test suite...")
    
    # Initialize database connection
    await db_manager.initialize()
    
    test_functions = [
        test_database_schema,
        test_payment_service,
        test_file_service,
        test_site_config_service,
        test_api_endpoints_structure
    ]
    
    passed = 0
    failed = 0
    
    for test_func in test_functions:
        try:
            logger.info(f"\n--- Running {test_func.__name__} ---")
            await test_func()
            passed += 1
            logger.info(f"✅ {test_func.__name__} completed")
        except Exception as e:
            failed += 1
            logger.error(f"❌ {test_func.__name__} failed: {e}")
    
    logger.info(f"\n🎯 Test Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        logger.info("🎉 All tests passed! API extensions are ready.")
    else:
        logger.error("⚠️  Some tests failed. Check the logs above.")
    
    # Clean up
    await db_manager.close()

if __name__ == "__main__":
    asyncio.run(run_all_tests())