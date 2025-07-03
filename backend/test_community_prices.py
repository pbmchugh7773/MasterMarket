#!/usr/bin/env python3
"""
Test script for Community Prices endpoints
Run this after starting the backend with Docker
"""

import requests
import json
from datetime import datetime

# Backend URL
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/community-prices"

def test_endpoints():
    print("🧪 Testing Community Prices Endpoints")
    print("=" * 50)
    
    # Test 1: Health check (basic API connectivity)
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ Backend is running")
        else:
            print("❌ Backend not accessible")
            return
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        return
    
    # Test 2: Search by barcode (should work without auth)
    print("\n🔍 Testing barcode search...")
    try:
        response = requests.get(f"{API_URL}/search-barcode/1234567890")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Barcode search endpoint working")
        else:
            print("❌ Barcode search failed")
    except Exception as e:
        print(f"❌ Barcode search error: {e}")
    
    # Test 3: Get trending prices (should work without auth)
    print("\n📈 Testing trending prices...")
    try:
        response = requests.get(f"{API_URL}/trending?limit=5")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Trending prices endpoint working")
        else:
            print("❌ Trending prices failed")
    except Exception as e:
        print(f"❌ Trending prices error: {e}")
    
    # Test 4: Get product prices (should work without auth)
    print("\n💰 Testing product prices...")
    try:
        response = requests.get(f"{API_URL}/product/1/prices")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Product prices endpoint working")
        else:
            print("❌ Product prices failed")
    except Exception as e:
        print(f"❌ Product prices error: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Testing completed!")
    print("\nNOTE: Auth-required endpoints (submit, vote, upload) need authentication")
    print("To test those, first register/login via the mobile app or use Postman")

if __name__ == "__main__":
    test_endpoints()