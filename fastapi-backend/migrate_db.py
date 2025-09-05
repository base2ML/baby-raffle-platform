#!/usr/bin/env python3
"""
Simple database migration script for SQLite
Creates the baby raffle database schema
"""
import asyncio
import aiosqlite
import os

async def run_migrations():
    """Run database migrations"""
    db_path = "./baby_raffle.db"
    
    print(f"🗃️  Creating database at: {db_path}")
    
    try:
        # Read the schema file
        schema_file = "schema_sqlite.sql"
        if not os.path.exists(schema_file):
            print(f"❌ Schema file not found: {schema_file}")
            return False
        
        with open(schema_file, 'r') as f:
            schema_sql = f.read()
        
        # Connect to database and execute schema
        async with aiosqlite.connect(db_path) as db:
            # Split SQL commands and execute them
            commands = [cmd.strip() for cmd in schema_sql.split(';') if cmd.strip()]
            
            for command in commands:
                if command:
                    try:
                        await db.execute(command)
                    except Exception as e:
                        print(f"⚠️  Warning executing command: {e}")
                        continue
            
            await db.commit()
        
        print("✅ Database migration completed successfully!")
        print(f"📍 Database location: {os.path.abspath(db_path)}")
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(run_migrations())
    exit(0 if success else 1)