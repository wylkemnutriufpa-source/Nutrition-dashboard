#!/usr/bin/env python3
"""
Backend API Testing for Nutrition Dashboard Application
Tests the FastAPI backend endpoints as specified in the review request.
"""

import requests
import json
from datetime import datetime
import sys

# Backend URL from frontend .env file
BACKEND_URL = "https://patient-tracker-160.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def test_hello_world_endpoint():
    """Test GET /api/ - Should return Hello World message"""
    print("🧪 Testing GET /api/ - Hello World endpoint")
    
    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "Hello World":
                print("   ✅ PASS: Hello World endpoint working correctly")
                return True
            else:
                print("   ❌ FAIL: Unexpected message content")
                return False
        else:
            print(f"   ❌ FAIL: Expected 200, got {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ FAIL: Request failed with error: {e}")
        return False
    except Exception as e:
        print(f"   ❌ FAIL: Unexpected error: {e}")
        return False

def test_create_status_endpoint():
    """Test POST /api/status - Should create status check with client_name"""
    print("\n🧪 Testing POST /api/status - Create status check")
    
    # Use realistic test data
    test_data = {
        "client_name": "Nutrition Dashboard Web Client"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/status", 
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["id", "client_name", "timestamp"]
            
            # Check if all required fields are present
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                print(f"   ❌ FAIL: Missing fields: {missing_fields}")
                return False, None
            
            # Check if client_name matches
            if data.get("client_name") != test_data["client_name"]:
                print(f"   ❌ FAIL: client_name mismatch. Expected: {test_data['client_name']}, Got: {data.get('client_name')}")
                return False, None
            
            # Check if id is a valid UUID string
            if not data.get("id") or len(data["id"]) != 36:
                print(f"   ❌ FAIL: Invalid ID format: {data.get('id')}")
                return False, None
            
            # Check if timestamp is present and valid
            try:
                datetime.fromisoformat(data["timestamp"].replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                print(f"   ❌ FAIL: Invalid timestamp format: {data.get('timestamp')}")
                return False, None
            
            print("   ✅ PASS: Status check created successfully")
            return True, data["id"]
        else:
            print(f"   ❌ FAIL: Expected 200, got {response.status_code}")
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ FAIL: Request failed with error: {e}")
        return False, None
    except Exception as e:
        print(f"   ❌ FAIL: Unexpected error: {e}")
        return False, None

def test_get_status_endpoint():
    """Test GET /api/status - Should return list of status checks"""
    print("\n🧪 Testing GET /api/status - Get status checks list")
    
    try:
        response = requests.get(f"{API_BASE}/status", timeout=10)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: Found {len(data) if isinstance(data, list) else 'N/A'} status checks")
            
            # Should return a list
            if not isinstance(data, list):
                print(f"   ❌ FAIL: Expected list, got {type(data).__name__}")
                return False
            
            # If there are items, check the structure of the first one
            if len(data) > 0:
                first_item = data[0]
                required_fields = ["id", "client_name", "timestamp"]
                
                missing_fields = [field for field in required_fields if field not in first_item]
                if missing_fields:
                    print(f"   ❌ FAIL: First item missing fields: {missing_fields}")
                    return False
                
                print(f"   📋 Sample item: {first_item}")
            
            print("   ✅ PASS: Status checks list retrieved successfully")
            return True
        else:
            print(f"   ❌ FAIL: Expected 200, got {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ FAIL: Request failed with error: {e}")
        return False
    except Exception as e:
        print(f"   ❌ FAIL: Unexpected error: {e}")
        return False

def test_backend_integration():
    """Run a complete integration test of all backend endpoints"""
    print("=" * 60)
    print("🚀 BACKEND API INTEGRATION TEST")
    print(f"📍 Backend URL: {BACKEND_URL}")
    print("=" * 60)
    
    results = {}
    
    # Test 1: Hello World endpoint
    results['hello_world'] = test_hello_world_endpoint()
    
    # Test 2: Create status check
    results['create_status'], created_id = test_create_status_endpoint()
    
    # Test 3: Get status checks
    results['get_status'] = test_get_status_endpoint()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed_tests = sum(1 for result in results.values() if result)
    total_tests = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
    
    print(f"\n🏁 Results: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 ALL BACKEND TESTS PASSED!")
        return True
    else:
        print("⚠️  SOME BACKEND TESTS FAILED!")
        return False

if __name__ == "__main__":
    success = test_backend_integration()
    sys.exit(0 if success else 1)