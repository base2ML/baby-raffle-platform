#!/usr/bin/env python3
"""
Migration script to add new payment, file upload, and site configuration tables
Run this script to update existing databases with the new schema
"""
import asyncio
import aiosqlite
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./baby_raffle.db")

async def migrate_database():
    """Apply new schema migrations"""
    
    # Extract database path from URL
    if DATABASE_URL.startswith("sqlite:///"):
        db_path = DATABASE_URL[10:]  # Remove sqlite:/// prefix
    else:
        db_path = "./baby_raffle.db"  # Default fallback
    
    if not os.path.exists(db_path):
        logger.error(f"Database file {db_path} does not exist")
        return
    
    try:
        async with aiosqlite.connect(db_path) as conn:
            conn.row_factory = aiosqlite.Row
            
            logger.info("Starting database migration...")
            
            # Add stripe_customer_id to tenants table if it doesn't exist
            try:
                await conn.execute("ALTER TABLE tenants ADD COLUMN stripe_customer_id TEXT")
                logger.info("Added stripe_customer_id column to tenants table")
            except Exception as e:
                if "duplicate column name" in str(e).lower():
                    logger.info("stripe_customer_id column already exists")
                else:
                    logger.error(f"Failed to add stripe_customer_id column: {e}")
            
            # Create payments table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS payments (
                    id TEXT PRIMARY KEY,
                    tenant_id TEXT NOT NULL,
                    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
                    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
                    currency TEXT DEFAULT 'usd',
                    status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled', 'processing', 'requires_action')),
                    description TEXT,
                    metadata TEXT DEFAULT '{}',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
                )
            """)
            logger.info("Created payments table")
            
            # Create subscriptions table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS subscriptions (
                    id TEXT PRIMARY KEY,
                    tenant_id TEXT NOT NULL,
                    stripe_customer_id TEXT NOT NULL,
                    stripe_subscription_id TEXT UNIQUE NOT NULL,
                    plan TEXT NOT NULL CHECK (plan IN ('trial', 'basic', 'premium')),
                    status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid')),
                    current_period_start DATETIME NOT NULL,
                    current_period_end DATETIME NOT NULL,
                    trial_end DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
                )
            """)
            logger.info("Created subscriptions table")
            
            # Create files table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS files (
                    id TEXT PRIMARY KEY,
                    tenant_id TEXT NOT NULL,
                    filename TEXT NOT NULL,
                    original_filename TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    url TEXT NOT NULL,
                    size INTEGER NOT NULL CHECK (size > 0),
                    content_type TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
                )
            """)
            logger.info("Created files table")
            
            # Create slideshow_images table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS slideshow_images (
                    id TEXT PRIMARY KEY,
                    tenant_id TEXT NOT NULL,
                    file_id TEXT NOT NULL,
                    title TEXT,
                    caption TEXT,
                    display_order INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
                    FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
                )
            """)
            logger.info("Created slideshow_images table")
            
            # Create site_configs table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS site_configs (
                    id TEXT PRIMARY KEY,
                    tenant_id TEXT UNIQUE NOT NULL,
                    config TEXT DEFAULT '{}',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
                )
            """)
            logger.info("Created site_configs table")
            
            # Create deployments table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS deployments (
                    id TEXT PRIMARY KEY,
                    tenant_id TEXT NOT NULL,
                    status TEXT NOT NULL CHECK (status IN ('pending', 'building', 'success', 'failed')),
                    deployment_url TEXT,
                    build_log TEXT,
                    force_rebuild BOOLEAN DEFAULT FALSE,
                    config_only BOOLEAN DEFAULT FALSE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
                )
            """)
            logger.info("Created deployments table")
            
            # Create indexes
            indexes = [
                "CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments (tenant_id)",
                "CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments (stripe_payment_intent_id)",
                "CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status)",
                "CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions (tenant_id)",
                "CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions (stripe_subscription_id)",
                "CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (status)",
                "CREATE INDEX IF NOT EXISTS idx_files_tenant ON files (tenant_id)",
                "CREATE INDEX IF NOT EXISTS idx_files_created_at ON files (created_at)",
                "CREATE INDEX IF NOT EXISTS idx_slideshow_tenant_active ON slideshow_images (tenant_id, is_active)",
                "CREATE INDEX IF NOT EXISTS idx_slideshow_display_order ON slideshow_images (display_order)",
                "CREATE INDEX IF NOT EXISTS idx_site_configs_tenant ON site_configs (tenant_id)",
                "CREATE INDEX IF NOT EXISTS idx_deployments_tenant ON deployments (tenant_id)",
                "CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments (status)",
                "CREATE INDEX IF NOT EXISTS idx_deployments_created_at ON deployments (created_at)"
            ]
            
            for index_sql in indexes:
                await conn.execute(index_sql)
            
            logger.info("Created indexes")
            
            await conn.commit()
            logger.info("Database migration completed successfully!")
            
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(migrate_database())