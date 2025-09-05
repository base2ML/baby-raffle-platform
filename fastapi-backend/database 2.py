"""
Multi-tenant database configuration and connection management
"""
import os
import aiosqlite
import asyncio
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.connection: Optional[aiosqlite.Connection] = None
        self.database_url = os.getenv(
            "DATABASE_URL", 
            "sqlite:///./baby_raffle.db"
        )
        self._initialized = False
    
    async def create_connection(self):
        """Create database connection"""
        try:
            # Extract database path from URL
            if self.database_url.startswith("sqlite:///"):
                db_path = self.database_url[10:]  # Remove sqlite:/// prefix
            else:
                db_path = "./baby_raffle.db"  # Default fallback
            
            self.connection = await aiosqlite.connect(db_path)
            self.connection.row_factory = aiosqlite.Row
            logger.info("Database connection created successfully")
        except Exception as e:
            logger.error(f"Failed to create database connection: {e}")
            raise
    
    async def close_connection(self):
        """Close database connection"""
        if self.connection:
            await self.connection.close()
            logger.info("Database connection closed")
    
    @asynccontextmanager
    async def get_connection(self):
        """Get database connection"""
        if not self.connection:
            await self.create_connection()
        
        yield self.connection
    
    @asynccontextmanager  
    async def get_tenant_connection(self, tenant_id: str):
        """Get database connection with tenant context"""
        async with self.get_connection() as connection:
            # For SQLite, we'll implement tenant isolation through application logic
            # Store tenant_id in connection for filtering
            connection._tenant_id = tenant_id
            yield connection
    
    async def execute_query(self, query: str, *args, tenant_id: Optional[str] = None) -> Any:
        """Execute query with optional tenant context"""
        async with self.get_connection() as connection:
            if tenant_id:
                # For SQLite, add WHERE clause for tenant isolation
                if "SELECT" in query.upper() and "WHERE" not in query.upper():
                    query = query.replace("FROM", f"FROM") + f" WHERE tenant_id = '{tenant_id}'"
                elif "SELECT" in query.upper() and "WHERE" in query.upper():
                    query = query + f" AND tenant_id = '{tenant_id}'"
            
            cursor = await connection.execute(query, args)
            return await cursor.fetchall()
    
    async def execute_one(self, query: str, *args, tenant_id: Optional[str] = None) -> Any:
        """Execute query and return single result"""
        async with self.get_connection() as connection:
            if tenant_id:
                # For SQLite, add WHERE clause for tenant isolation
                if "SELECT" in query.upper() and "WHERE" not in query.upper():
                    query = query.replace("FROM", f"FROM") + f" WHERE tenant_id = '{tenant_id}'"
                elif "SELECT" in query.upper() and "WHERE" in query.upper():
                    query = query + f" AND tenant_id = '{tenant_id}'"
            
            cursor = await connection.execute(query, args)
            return await cursor.fetchone()

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

# Add new methods to DatabaseManager class
DatabaseManager.initialize = async def initialize(self):
    """Initialize database with schema"""
    if self._initialized:
        return
    
    try:
        await self.create_connection()
        
        # Read and execute schema file
        schema_file = os.path.join(os.path.dirname(__file__), "schema_sqlite.sql")
        if os.path.exists(schema_file):
            with open(schema_file, 'r') as f:
                schema_sql = f.read()
            
            # Split by statements and execute each one
            statements = [stmt.strip() for stmt in schema_sql.split(';') if stmt.strip()]
            
            for statement in statements:
                if statement and not statement.startswith('--'):
                    try:
                        await self.connection.execute(statement)
                    except Exception as e:
                        # Skip errors for ALTER TABLE statements that might already exist
                        if "duplicate column name" not in str(e).lower():
                            logger.warning(f"Schema execution warning: {e}")
            
            await self.connection.commit()
            logger.info("Database schema initialized successfully")
        
        self._initialized = True
        
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

DatabaseManager.close = async def close(self):
    """Close database connection"""
    if self.connection:
        await self.connection.close()
        self.connection = None
        self._initialized = False
        logger.info("Database connection closed")