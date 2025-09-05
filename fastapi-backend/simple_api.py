#!/usr/bin/env python3
"""
Simple Baby Raffle SaaS API Server
Simplified version for deployment testing
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import json
from datetime import datetime
from database import DatabaseManager
import uvicorn

# Initialize FastAPI app
app = FastAPI(
    title="Baby Raffle SaaS API",
    description="Multi-tenant baby raffle platform - Simple Version",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Initialize database
db_manager = DatabaseManager()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://*.base2ml.com",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "baby-raffle-saas-api",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Baby Raffle SaaS API is running!",
        "status": "ok",
        "docs": "/docs",
        "health": "/health"
    }

# Basic subdomain availability check
@app.get("/api/subdomains/check-availability/{subdomain}")
async def check_subdomain_availability(subdomain: str):
    """Check if subdomain is available"""
    # Reserved subdomains
    reserved = ["www", "api", "admin", "mail", "ftp", "blog", "shop", "support"]
    
    if subdomain.lower() in reserved:
        return {"available": False, "reason": "Reserved subdomain"}
    
    if len(subdomain) < 3:
        return {"available": False, "reason": "Minimum 3 characters required"}
    
    # For demo, mark all others as available
    # In production, check database
    return {"available": True}

# Mock payment intent creation
@app.post("/api/billing/create-payment-intent")
async def create_payment_intent(request: Request):
    """Create Stripe payment intent (mock for demo)"""
    body = await request.json()
    
    amount = body.get("amount", 8000)  # $80 default
    
    return {
        "client_secret": "pi_mock_client_secret_123",
        "amount": amount,
        "currency": "usd",
        "status": "requires_payment_method"
    }

# Mock site config endpoint
@app.get("/api/site/config/{tenant_id}")
async def get_site_config(tenant_id: str):
    """Get site configuration (mock for demo)"""
    return {
        "tenant_id": tenant_id,
        "subdomain": "demo",
        "site_name": "Demo Baby Raffle",
        "parent_names": "John & Jane Doe",
        "due_date": "2024-12-25",
        "venmo_account": "@johndoe",
        "primary_color": "#ec4899",
        "secondary_color": "#8b5cf6",
        "description": "Guess our baby's details!",
        "slideshow_images": []
    }

# Mock deployment status
@app.get("/api/site/deployment-status/{deployment_id}")
async def get_deployment_status(deployment_id: str):
    """Get deployment status (mock for demo)"""
    return {
        "deployment_id": deployment_id,
        "status": "completed",
        "message": "Site deployed successfully",
        "site_url": f"https://demo.base2ml.com"
    }

# File upload mock
@app.post("/api/files/upload")
async def upload_file():
    """Mock file upload endpoint"""
    return {
        "success": True,
        "file_id": "mock_file_123",
        "url": "https://demo-bucket.s3.amazonaws.com/mock_file_123.jpg"
    }

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        await db_manager.create_connection()
        print("✅ Database connection established")
    except Exception as e:
        print(f"⚠️  Database connection failed: {e}")
        print("🔄 Continuing with mock endpoints...")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        await db_manager.close_connection()
        print("🔒 Database connection closed")
    except Exception as e:
        print(f"⚠️  Database cleanup error: {e}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 Starting Baby Raffle SaaS API on port {port}")
    print(f"📍 Health check: http://localhost:{port}/health")
    print(f"📚 API docs: http://localhost:{port}/docs")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        reload=False
    )