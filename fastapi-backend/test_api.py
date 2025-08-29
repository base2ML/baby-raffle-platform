#!/usr/bin/env python3
"""
Test script for Baby Raffle FastAPI
Run this to verify the API works before deployment
"""

import requests
import json

# Test locally running API
BASE_URL = "http://localhost:8000"

def test_endpoint(method, endpoint, data=None, expected_status=200):
    """Test an API endpoint"""
    url = f"{BASE_URL}{endpoint}"
    print(f"\n🧪 Testing {method} {endpoint}")
    
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == expected_status:
            print("✅ SUCCESS")
            if response.content:
                result = response.json()
                print(f"Response: {json.dumps(result, indent=2)}")
        else:
            print("❌ FAILED")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

def main():
    print("🚀 Testing Baby Raffle FastAPI")
    print("=" * 40)
    
    # Test health check
    test_endpoint("GET", "/health")
    
    # Test categories
    test_endpoint("GET", "/categories")
    
    # Test stats
    test_endpoint("GET", "/stats")
    
    # Test betting
    bet_data = {
        "userName": "FastAPI Test User",
        "userEmail": "fastapi@test.com",
        "bets": [
            {
                "categoryKey": "birth_date",
                "betValue": "April 10, 2024",
                "amount": 5.0
            }
        ]
    }
    test_endpoint("POST", "/bets", bet_data)
    
    # Test admin validation
    admin_data = {
        "password": "admin123",
        "betIds": [1, 2]  # Assuming these bets exist
    }
    test_endpoint("POST", "/admin/validate", admin_data)
    
    print("\n🎉 Testing complete!")

if __name__ == "__main__":
    main()
