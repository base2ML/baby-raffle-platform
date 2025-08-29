from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
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

# In-memory storage (for demo purposes)
BETS_STORAGE = []
CATEGORIES_STORAGE = [
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
    },
    {
        "categoryKey": "birth_date",
        "categoryName": "Birth Date",
        "description": "When will the baby arrive?",
        "betPrice": "7.50", 
        "options": ["Before due date", "On due date", "1-3 days late", "4-7 days late", "More than a week late"]
    },
    {
        "categoryKey": "eye_color",
        "categoryName": "Eye Color",
        "description": "What color eyes will the baby have?",
        "betPrice": "5.00",
        "options": ["Brown", "Blue", "Green", "Hazel", "Gray"]
    },
    {
        "categoryKey": "hair_color",
        "categoryName": "Hair Color", 
        "description": "What color hair will the baby have?",
        "betPrice": "5.00",
        "options": ["Blonde", "Brown", "Black", "Red", "Light Brown"]
    }
]

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

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Baby Raffle API", "status": "running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/categories")
async def get_categories():
    """Get all betting categories"""
    try:
        logger.info(f"Returning {len(CATEGORIES_STORAGE)} categories")
        return CATEGORIES_STORAGE
    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_stats():
    """Get betting statistics"""
    try:
        total_bets = len(BETS_STORAGE)
        total_amount = sum(bet["amount"] for bet in BETS_STORAGE)
        max_prize = sum(float(cat["betPrice"]) for cat in CATEGORIES_STORAGE)
        
        return {
            "totalBets": total_bets,
            "totalAmount": float(total_amount),
            "maxPrize": float(max_prize)
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
        submitted_bets = []
        
        for bet in bet_submission.bets:
            bet_record = {
                "id": len(BETS_STORAGE) + len(submitted_bets) + 1,
                "name": bet_submission.name,
                "email": bet_submission.email,
                "categoryKey": bet.categoryKey,
                "betValue": bet.betValue,
                "amount": bet.amount,
                "created_at": datetime.now().isoformat()
            }
            submitted_bets.append(bet_record)
            BETS_STORAGE.append(bet_record)
        
        logger.info(f"Successfully submitted {len(submitted_bets)} bets for {bet_submission.name}")
        return {
            "message": "Bets submitted successfully", 
            "count": len(submitted_bets),
            "bets": submitted_bets
        }
        
    except Exception as e:
        logger.error(f"Error submitting bets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/bets")
async def get_all_bets():
    """Get all bets for admin view"""
    try:
        logger.info(f"Returning {len(BETS_STORAGE)} bets for admin")
        return BETS_STORAGE
        
    except Exception as e:
        logger.error(f"Error fetching admin bets: {e}")
        return []

@app.delete("/admin/bets")
async def clear_all_bets():
    """Clear all bets (admin only)"""
    try:
        count = len(BETS_STORAGE)
        BETS_STORAGE.clear()
        logger.info(f"Cleared {count} bets")
        return {"message": f"Cleared {count} bets", "remaining": len(BETS_STORAGE)}
    except Exception as e:
        logger.error(f"Error clearing bets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)