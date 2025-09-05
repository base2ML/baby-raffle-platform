#!/usr/bin/env python3
"""
Simple test server to verify the basic setup works
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title="Baby Raffle SaaS - Simple Test",
    description="Basic test server to verify setup",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Baby Raffle SaaS API is running!", "status": "ok"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "baby-raffle-saas"}

if __name__ == "__main__":
    uvicorn.run("simple_server:app", host="0.0.0.0", port=8000, reload=True)