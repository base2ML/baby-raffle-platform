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
        "categoryKey": "birth_date",
        "categoryName": "Date",
        "description": "What date will the baby arrive?",
        "betPrice": "5.00",
        "options": ["January 15", "January 16", "January 17", "January 18", "January 19", "January 20", "Other date"]
    },
    {
        "categoryKey": "birth_time",
        "categoryName": "Time",
        "description": "What time will the baby arrive?",
        "betPrice": "5.00",
        "options": ["12:00 AM - 3:00 AM", "3:00 AM - 6:00 AM", "6:00 AM - 9:00 AM", "9:00 AM - 12:00 PM", "12:00 PM - 3:00 PM", "3:00 PM - 6:00 PM", "6:00 PM - 9:00 PM", "9:00 PM - 12:00 AM"]
    },
    {
        "categoryKey": "birth_weight",
        "categoryName": "Weight",
        "description": "How much will the baby weigh?",
        "betPrice": "5.00",
        "options": ["Under 6 lbs", "6-7 lbs", "7-8 lbs", "8-9 lbs", "Over 9 lbs"]
    },
    {
        "categoryKey": "head_circumference",
        "categoryName": "Head Circumference", 
        "description": "What will the baby's head circumference be?",
        "betPrice": "5.00",
        "options": ["Under 13 inches", "13-14 inches", "14-15 inches", "15-16 inches", "Over 16 inches"]
    },
    {
        "categoryKey": "birth_length",
        "categoryName": "Length",
        "description": "How long will the baby be?",
        "betPrice": "5.00",
        "options": ["Under 18 inches", "18-19 inches", "19-20 inches", "20-21 inches", "Over 21 inches"]
    },
    {
        "categoryKey": "doctor_initial",
        "categoryName": "Delivering Doctor's Last Initial",
        "description": "What will be the last initial of the delivering doctor?",
        "betPrice": "5.00",
        "options": ["A-F", "G-L", "M-R", "S-Z"]
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

class BetValidation(BaseModel):
    betIds: List[int]
    validatedBy: str

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
    """Get all betting categories with live stats"""
    try:
        # Create enhanced categories with live stats
        enhanced_categories = []
        
        for category in CATEGORIES_STORAGE:
            # Get bets for this category
            category_bets = [bet for bet in BETS_STORAGE if bet["categoryKey"] == category["categoryKey"]]
            validated_category_bets = [bet for bet in category_bets if bet.get("validated", False)]
            
            # Calculate stats - current pot only includes validated bets
            validated_amount = sum(bet["amount"] for bet in validated_category_bets)
            bet_count = len(category_bets)  # Total bet count (validated + unvalidated)
            
            # Create enhanced category object
            enhanced_category = {
                **category,  # Include all original fields
                "displayName": category["categoryName"],  # Map categoryName to displayName for frontend
                "totalAmount": f"{validated_amount:.0f}",  # Format validated amount only (e.g., "5" not "5.0")
                "betCount": bet_count
            }
            enhanced_categories.append(enhanced_category)
        
        logger.info(f"Returning {len(enhanced_categories)} categories with live stats")
        return {"categories": enhanced_categories}  # Wrap in object as frontend expects
        
    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_stats():
    """Get betting statistics with category breakdown"""
    try:
        # Calculate totals
        total_bets = len(BETS_STORAGE)
        validated_bets = len([bet for bet in BETS_STORAGE if bet.get("validated", False)])
        total_amount = sum(bet["amount"] for bet in BETS_STORAGE)
        validated_amount = sum(bet["amount"] for bet in BETS_STORAGE if bet.get("validated", False))
        
        # Calculate category stats
        categories = []
        for category in CATEGORIES_STORAGE:
            category_bets = [bet for bet in BETS_STORAGE if bet["categoryKey"] == category["categoryKey"]]
            validated_category_bets = [bet for bet in category_bets if bet.get("validated", False)]
            
            category_total = sum(bet["amount"] for bet in category_bets)
            category_validated = sum(bet["amount"] for bet in validated_category_bets)
            bet_price = float(category["betPrice"])
            
            # Winner gets half of the validated amount in that category
            winner_prize = category_validated / 2 if category_validated > 0 else 0
            
            categories.append({
                "categoryKey": category["categoryKey"],
                "displayName": category["categoryName"],
                "totalAmount": float(category_total),
                "betCount": len(category_bets),
                "betPrice": bet_price,
                "winnerPrize": float(winner_prize)
            })
        
        return {
            "totals": {
                "totalBets": total_bets,
                "validatedBets": validated_bets,
                "totalAmount": float(total_amount),
                "validatedAmount": float(validated_amount)
            },
            "categories": categories
        }
        
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        return {
            "totals": {
                "totalBets": 0,
                "validatedBets": 0,
                "totalAmount": 0.0,
                "validatedAmount": 0.0
            },
            "categories": []
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

@app.post("/admin/validate")
async def validate_bets(validation: BetValidation):
    """Validate/authenticate bets (admin only)"""
    try:
        validated_bets = []
        for bet in BETS_STORAGE:
            if bet["id"] in validation.betIds:
                bet["validated"] = True
                bet["validated_by"] = validation.validatedBy
                bet["validated_at"] = datetime.now().isoformat()
                validated_bets.append(bet)
        
        logger.info(f"Validated {len(validated_bets)} bets by {validation.validatedBy}")
        return {
            "message": f"Successfully validated {len(validated_bets)} bets",
            "validated_bets": validated_bets
        }
        
    except Exception as e:
        logger.error(f"Error validating bets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/admin/bets/{bet_id}")
async def delete_bet(bet_id: int):
    """Delete a specific bet (admin only)"""
    try:
        for i, bet in enumerate(BETS_STORAGE):
            if bet["id"] == bet_id:
                deleted_bet = BETS_STORAGE.pop(i)
                logger.info(f"Deleted bet {bet_id} for {deleted_bet['name']}")
                return {"message": f"Bet {bet_id} deleted successfully", "deleted_bet": deleted_bet}
        
        logger.warning(f"Bet {bet_id} not found")
        raise HTTPException(status_code=404, detail=f"Bet with id {bet_id} not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting bet {bet_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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