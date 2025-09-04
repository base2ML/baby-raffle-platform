#!/usr/bin/env python3
"""
Database migration script for Baby Raffle SaaS
Sets up the multi-tenant database schema with Row-Level Security
"""
import asyncio
import asyncpg
import os
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_migration():
    """Run the database migration"""
    
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    
    logger.info("Connecting to database...")
    
    try:
        # Connect to database
        conn = await asyncpg.connect(database_url)
        
        # Read schema file
        schema_path = Path(__file__).parent / "schema.sql"
        if not schema_path.exists():
            raise FileNotFoundError(f"Schema file not found: {schema_path}")
        
        logger.info("Reading schema file...")
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        
        # Execute schema
        logger.info("Executing database schema...")
        await conn.execute(schema_sql)
        
        # Verify tables were created
        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        
        logger.info("Created tables:")
        for table in tables:
            logger.info(f"  - {table['table_name']}")
        
        # Verify RLS policies
        policies = await conn.fetch("""
            SELECT schemaname, tablename, policyname
            FROM pg_policies
            WHERE schemaname = 'public'
            ORDER BY tablename, policyname
        """)
        
        logger.info("Row-Level Security policies:")
        for policy in policies:
            logger.info(f"  - {policy['tablename']}: {policy['policyname']}")
        
        # Verify functions
        functions = await conn.fetch("""
            SELECT routine_name
            FROM information_schema.routines
            WHERE routine_schema = 'public' 
            AND routine_type = 'FUNCTION'
            ORDER BY routine_name
        """)
        
        logger.info("Database functions:")
        for func in functions:
            logger.info(f"  - {func['routine_name']}")
        
        # Create a test tenant to verify everything works
        logger.info("Creating test tenant to verify schema...")
        try:
            test_result = await conn.fetchrow("""
                SELECT tenant_id, user_id 
                FROM create_tenant_with_defaults(
                    'test-tenant', 
                    'Test Tenant', 
                    'test@example.com', 
                    'Test Owner',
                    'google',
                    'test-oauth-id'
                )
            """)
            
            if test_result:
                logger.info(f"✅ Test tenant created successfully: {test_result['tenant_id']}")
                
                # Clean up test data
                await conn.execute("DELETE FROM tenants WHERE subdomain = 'test-tenant'")
                logger.info("✅ Test data cleaned up")
            
        except Exception as e:
            logger.warning(f"Test tenant creation failed: {e}")
        
        await conn.close()
        logger.info("🎉 Database migration completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(run_migration())