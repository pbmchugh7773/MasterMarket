#!/usr/bin/env python3
"""
Test script to verify API endpoints are working
"""

import requests
import json

# Configuration
BASE_URL = "http://192.168.1.25:8000"

def test_register_user():
    """Test user registration endpoint"""
    print("🧪 Testing user registration...")
    
    test_user = {
        "email": "test@example.com",
        "password": "testpass123",
        "full_name": "Test User",
        "country": "UK"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=test_user)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Registration successful!")
        elif response.status_code == 400:
            print("⚠️  User might already exist")
        else:
            print("❌ Registration failed")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_login_user():
    """Test user login endpoint"""
    print("\n🧪 Testing user login...")
    
    login_data = {
        "username": "test@example.com",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Login successful!")
            return response.json().get("access_token")
        else:
            print("❌ Login failed")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    return None

def test_products_endpoint():
    """Test products endpoint"""
    print("\n🧪 Testing products endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/products/all-simple")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            products = response.json()
            print(f"✅ Products loaded: {len(products)} products")
            if products:
                print(f"First product: {products[0]['name']}")
        else:
            print("❌ Failed to load products")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_community_prices_endpoint(token=None):
    """Test community prices endpoint"""
    print("\n🧪 Testing community prices endpoint...")
    
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        response = requests.get(f"{BASE_URL}/api/community-prices/trending", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Community prices endpoint working!")
            prices = response.json()
            print(f"Found {len(prices)} trending prices")
        else:
            print("❌ Community prices endpoint failed")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """Run all tests"""
    print("🚀 Starting API endpoint tests...\n")
    
    # Test basic endpoints
    test_products_endpoint()
    
    # Test user registration and login
    test_register_user()
    token = test_login_user()
    
    # Test community prices
    test_community_prices_endpoint(token)
    
    print("\n🏁 Tests completed!")

if __name__ == "__main__":
    main()