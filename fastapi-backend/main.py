from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import psycopg2
import psycopg2.extras
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Baby Raffle API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'margojones-babyraffle-db.cu1y2a26idsb.us-east-1.rds.amazonaws.com'),
    'port': int(os.getenv('DB_PORT', '5432')),
    'database': os.getenv('DB_NAME', 'babyraffle'),
    'user': os.getenv('DB_USERNAME', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'YgrzO9oHQScN5ctXcTOL'),
    'sslmode': 'require'
}

def get_db_connection():
    """Get database connection with proper error handling"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Baby Raffle API", "status": "running"}

@app.get("/health")
async def health_check():
    """Health check endpoint - don't test DB here to avoid 502s"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/db-health")
async def db_health_check():
    """Separate DB health check"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        result = cur.fetchone()
        cur.close()
        conn.close()
        return {"status": "db_healthy", "result": result[0]}
    except Exception as e:
        logger.error(f"DB health check failed: {e}")
        return {"status": "db_unhealthy", "error": str(e)}

# Pydantic models
class UserBet(BaseModel):
    categoryKey: str
    betValue: str
    amount: float

class BetSubmission(BaseModel):
    name: str
    email: str
    bets: List[UserBet]

class BetCategory(BaseModel):
    categoryKey: str
    categoryName: str
    description: str
    betPrice: str
    options: List[str]

# Mock data as fallback
MOCK_CATEGORIES = [
    {
        "categoryKey": "baby_gender",
        "categoryName": "Baby's Gender",
        "description": "What gender will the baby be?",
        "betPrice": "5.00",
        "options": ["Boy", "Girl"]
    },
    {
        "categoryKey": "birth_weight",
        "categoryName": "Birth Weight",
        "description": "How much will the baby weigh?",
        "betPrice": "10.00",
        "options": ["Under 6 lbs", "6-7 lbs", "7-8 lbs", "8-9 lbs", "Over 9 lbs"]
    }
]

@app.get("/categories")
async def get_categories():
    """Get all betting categories"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute("""
            SELECT category_key, category_name, description, bet_price, options 
            FROM bet_categories 
            ORDER BY category_key
        """)
        
        categories = cur.fetchall()
        cur.close()
        conn.close()
        
        if not categories:
            logger.info("No categories in DB, returning mock data")
            return MOCK_CATEGORIES
            
        return [dict(category) for category in categories]
        
    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        logger.info("Returning mock categories due to DB error")
        return MOCK_CATEGORIES

@app.get("/stats")
async def get_stats():
    """Get betting statistics"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Get total bets and amount
        cur.execute("SELECT COUNT(*) as total_bets, COALESCE(SUM(amount), 0) as total_amount FROM user_bets")
        totals = cur.fetchone()
        
        # Get max potential prize (sum of all bet prices)
        cur.execute("SELECT COALESCE(SUM(CAST(bet_price AS DECIMAL)), 0) as max_prize FROM bet_categories")
        max_prize_result = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return {
            "totalBets": totals['total_bets'] or 0,
            "totalAmount": float(totals['total_amount'] or 0),
            "maxPrize": float(max_prize_result['max_prize'] or 100)
        }
        
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        return {
            "totalBets": 0,
            "totalAmount": 0.0,
            "maxPrize": 100.0
        }

@app.post("/bets")
async def submit_bets(bet_submission: BetSubmission):
    """Submit betting entries"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        for bet in bet_submission.bets:
            cur.execute("""
                INSERT INTO user_bets (name, email, category_key, bet_value, amount, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                bet_submission.name,
                bet_submission.email,
                bet.categoryKey,
                bet.betValue,
                bet.amount,
                datetime.now()
            ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {"message": "Bets submitted successfully", "count": len(bet_submission.bets)}
        
    except Exception as e:
        logger.error(f"Error submitting bets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/bets")
async def get_all_bets():
    """Get all bets for admin view"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute("""
            SELECT name, email, category_key, bet_value, amount, created_at 
            FROM user_bets 
            ORDER BY created_at DESC
        """)
        
        bets = cur.fetchall()
        cur.close()
        conn.close()
        
        return [dict(bet) for bet in bets]
        
    except Exception as e:
        logger.error(f"Error fetching admin bets: {e}")
        return []

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
