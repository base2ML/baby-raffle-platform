"""
Multi-tenant database configuration and connection management
"""
import os
import asyncpg
import asyncio
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.database_url = os.getenv(
            "DATABASE_URL", 
            "postgresql://postgres:password@localhost:5432/baby_raffle_saas"
        )
    
    async def create_pool(self):
        """Create database connection pool"""
        try:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=5,
                max_size=20,
                command_timeout=60,
                server_settings={
                    'application_name': 'baby_raffle_saas',
                    'timezone': 'UTC'
                }
            )
            logger.info("Database connection pool created successfully")
        except Exception as e:
            logger.error(f"Failed to create database pool: {e}")
            raise
    
    async def close_pool(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")
    
    @asynccontextmanager
    async def get_connection(self):
        """Get database connection from pool"""
        if not self.pool:
            await self.create_pool()
        
        async with self.pool.acquire() as connection:
            yield connection
    
    @asynccontextmanager  
    async def get_tenant_connection(self, tenant_id: str):
        """Get database connection with tenant context for RLS"""
        async with self.get_connection() as connection:
            # Set tenant context for Row-Level Security
            await connection.execute(
                "SELECT set_config('app.current_tenant_id', $1, true)",
                tenant_id
            )
            yield connection
    
    async def execute_query(self, query: str, *args, tenant_id: Optional[str] = None) -> Any:
        """Execute query with optional tenant context"""
        if tenant_id:
            async with self.get_tenant_connection(tenant_id) as connection:
                return await connection.fetch(query, *args)
        else:
            async with self.get_connection() as connection:
                return await connection.fetch(query, *args)
    
    async def execute_one(self, query: str, *args, tenant_id: Optional[str] = None) -> Any:
        """Execute query and return single result"""
        if tenant_id:
            async with self.get_tenant_connection(tenant_id) as connection:
                return await connection.fetchrow(query, *args)
        else:
            async with self.get_connection() as connection:
                return await connection.fetchrow(query, *args)

# Global database manager instance
db_manager = DatabaseManager()

# Convenience functions
async def get_db():
    """FastAPI dependency for database connection"""
    async with db_manager.get_connection() as connection:
        yield connection

async def get_tenant_db(tenant_id: str):
    """FastAPI dependency for tenant-aware database connection"""
    async with db_manager.get_tenant_connection(tenant_id) as connection:
        yield connection