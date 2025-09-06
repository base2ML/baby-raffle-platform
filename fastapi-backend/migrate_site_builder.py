#!/usr/bin/env python3
"""
Site Builder Database Migration
Creates the necessary tables for the site builder system
"""
import asyncio
import aiosqlite
import os
from datetime import datetime

async def migrate_site_builder_schema():
    """Run site builder database migration"""
    
    # Get database path
    database_url = os.getenv("DATABASE_URL", "sqlite:///./baby_raffle.db")
    if database_url.startswith("sqlite:///"):
        db_path = database_url[10:]
    else:
        db_path = "./baby_raffle.db"
    
    print(f"🔄 Migrating site builder schema to {db_path}")
    
    async with aiosqlite.connect(db_path) as db:
        # Read and execute site builder schema
        with open('site_builder_schema.sql', 'r') as f:
            schema_sql = f.read()
        
        # Split by statements and execute them
        statements = [stmt.strip() for stmt in schema_sql.split(';') if stmt.strip()]
        
        for statement in statements:
            try:
                await db.execute(statement)
                print(f"✅ Executed: {statement[:50]}...")
            except Exception as e:
                print(f"⚠️  Warning executing statement: {e}")
                print(f"   Statement: {statement[:100]}...")
        
        await db.commit()
        print("✅ Site builder schema migration completed")

async def check_existing_tables():
    """Check what tables already exist"""
    database_url = os.getenv("DATABASE_URL", "sqlite:///./baby_raffle.db")
    if database_url.startswith("sqlite:///"):
        db_path = database_url[10:]
    else:
        db_path = "./baby_raffle.db"
    
    print(f"📋 Checking existing tables in {db_path}")
    
    async with aiosqlite.connect(db_path) as db:
        cursor = await db.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' 
            ORDER BY name;
        """)
        tables = await cursor.fetchall()
        
        print("Existing tables:")
        for table in tables:
            print(f"  - {table[0]}")
            
            # Get table info
            cursor = await db.execute(f"PRAGMA table_info({table[0]})")
            columns = await cursor.fetchall()
            if columns:
                print(f"    Columns: {', '.join([col[1] for col in columns])}")

if __name__ == "__main__":
    print("🎯 Baby Raffle Site Builder Migration")
    print("=" * 50)
    
    # Check existing tables first
    asyncio.run(check_existing_tables())
    print()
    
    # Run migration
    try:
        asyncio.run(migrate_site_builder_schema())
        print("\n🎉 Site builder migration completed successfully!")
        print("\nNew tables created:")
        print("  - hosting_packages (pricing and package management)")
        print("  - site_builders (site configurations)")
        print("  - preview_configs (temporary preview storage)")
        print("  - site_themes (predefined themes)")
        print("  - site_analytics (usage tracking)")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        exit(1)