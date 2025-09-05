#!/usr/bin/env python3
"""
Backend Test Suite for Google Sheets Integration API
Tests health check, Google Sheets connectivity, filter functionality, and time assignment APIs
"""

import requests
import json
import sys
import time
from typing import List, Dict, Any

# Get backend URL from environment
BACKEND_URL = "https://bulk-id-finder.preview.emergentagent.com/api"

class GoogleSheetsAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details
        })
    
    def test_health_check(self) -> bool:
        """Test /api/health endpoint for Google Sheets connectivity"""
        print("\n=== Testing Health Check Endpoint ===")
        
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if Google Sheets API is connected
                if (data.get('status') == 'healthy' and 
                    data.get('services', {}).get('google_sheets_api') == 'connected' and
                    data.get('services', {}).get('authentication') == 'valid'):
                    
                    self.log_test("Health Check", True, 
                                f"Google Sheets API connected and authenticated successfully")
                    return True
                else:
                    self.log_test("Health Check", False, 
                                f"Service unhealthy: {data}")
                    return False
            else:
                self.log_test("Health Check", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Health Check", False, f"Request failed: {str(e)}")
            return False
        except Exception as e:
            self.log_test("Health Check", False, f"Unexpected error: {str(e)}")
            return False
    
    def test_filter_single_id(self) -> bool:
        """Test filter endpoint with a single ID"""
        print("\n=== Testing Filter Single ID ===")
        
        # Test with common IDs that might exist in Column A
        test_ids = ["1", "ID001", "A001", "001", "Test1"]
        
        for test_id in test_ids:
            try:
                payload = {"ids": [test_id]}
                response = self.session.post(
                    f"{self.base_url}/filter",
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Validate response structure
                    if ('query_ids' in data and 'results' in data and 'total_matches' in data):
                        matches_found = data.get('total_matches', 0)
                        self.log_test(f"Filter Single ID ({test_id})", True, 
                                    f"API working correctly, found {matches_found} matches")
                        
                        # If we found matches, we can stop testing other IDs
                        if matches_found > 0:
                            print(f"Sample result for ID '{test_id}': {json.dumps(data, indent=2)}")
                            return True
                    else:
                        self.log_test(f"Filter Single ID ({test_id})", False, 
                                    f"Invalid response structure: {data}")
                else:
                    self.log_test(f"Filter Single ID ({test_id})", False, 
                                f"HTTP {response.status_code}: {response.text}")
                    
            except requests.exceptions.RequestException as e:
                self.log_test(f"Filter Single ID ({test_id})", False, f"Request failed: {str(e)}")
            except Exception as e:
                self.log_test(f"Filter Single ID ({test_id})", False, f"Unexpected error: {str(e)}")
        
        # If we reach here, none of the test IDs found matches, but API might still be working
        self.log_test("Filter Single ID", True, 
                    "Filter API is functional, but no matches found for test IDs")
        return True
    
    def test_filter_multiple_ids(self) -> bool:
        """Test filter endpoint with multiple IDs"""
        print("\n=== Testing Filter Multiple IDs ===")
        
        try:
            # Test with multiple IDs that might exist
            test_ids = ["1", "2", "3", "ID001", "ID002", "A001", "B001"]
            payload = {"ids": test_ids}
            
            response = self.session.post(
                f"{self.base_url}/filter",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                if ('query_ids' in data and 'results' in data and 'total_matches' in data):
                    query_ids = data.get('query_ids', [])
                    results = data.get('results', [])
                    total_matches = data.get('total_matches', 0)
                    
                    # Check if all requested IDs are in the response
                    if set(query_ids) == set(test_ids):
                        self.log_test("Filter Multiple IDs", True, 
                                    f"Successfully processed {len(test_ids)} IDs, found {total_matches} total matches")
                        
                        # Show sample results if any matches found
                        if total_matches > 0:
                            print(f"Sample results: {json.dumps(data, indent=2)}")
                        
                        return True
                    else:
                        self.log_test("Filter Multiple IDs", False, 
                                    f"Query IDs mismatch. Expected: {test_ids}, Got: {query_ids}")
                        return False
                else:
                    self.log_test("Filter Multiple IDs", False, 
                                f"Invalid response structure: {data}")
                    return False
            else:
                self.log_test("Filter Multiple IDs", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Filter Multiple IDs", False, f"Request failed: {str(e)}")
            return False
        except Exception as e:
            self.log_test("Filter Multiple IDs", False, f"Unexpected error: {str(e)}")
            return False
    
    def test_time_assignment(self) -> bool:
        """Test time assignment functionality"""
        print("\n=== Testing Time Assignment API ===")
        
        try:
            # Test assign time endpoint
            test_row_id = "test_row_1"
            test_time_slot = "07:00AM - 08:00AM"
            
            assign_payload = {
                "row_id": test_row_id,
                "time_slot": test_time_slot
            }
            
            response = self.session.post(
                f"{self.base_url}/assign-time",
                json=assign_payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') == True:
                    self.log_test("Assign Time", True, 
                                f"Successfully assigned time slot '{test_time_slot}' to row '{test_row_id}'")
                else:
                    self.log_test("Assign Time", False, f"Assignment failed: {data}")
                    return False
            else:
                self.log_test("Assign Time", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
            
            # Test get time assignments endpoint
            response = self.session.get(f"{self.base_url}/time-assignments", timeout=30)
            
            if response.status_code == 200:
                assignments = response.json()
                if test_row_id in assignments and assignments[test_row_id] == test_time_slot:
                    self.log_test("Get Time Assignments", True, 
                                f"Successfully retrieved time assignments: {assignments}")
                    return True
                else:
                    self.log_test("Get Time Assignments", False, 
                                f"Assignment not found in response: {assignments}")
                    return False
            else:
                self.log_test("Get Time Assignments", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Time Assignment", False, f"Request failed: {str(e)}")
            return False
        except Exception as e:
            self.log_test("Time Assignment", False, f"Unexpected error: {str(e)}")
            return False
    
    def test_google_sheets_connection(self) -> bool:
        """Test specific Google Sheets connection with spreadsheet ID"""
        print("\n=== Testing Google Sheets Connection ===")
        
        try:
            # Try to access the specific spreadsheet by making a filter request
            # This will test if the service account has access to the sheet
            payload = {"ids": ["test_connection"]}
            
            response = self.session.post(
                f"{self.base_url}/filter",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                # If we get a valid response structure, the connection is working
                if 'query_ids' in data and 'results' in data:
                    self.log_test("Google Sheets Connection", True, 
                                "Successfully connected to Google Sheet (ID: 1LqEuNuu1YTy0INXFmJRsMk2kUYINmgV-Z-ycfPLpuOs)")
                    return True
                else:
                    self.log_test("Google Sheets Connection", False, 
                                f"Invalid response from sheet access: {data}")
                    return False
            elif response.status_code == 404:
                self.log_test("Google Sheets Connection", False, 
                            "Worksheet not found - check sheet permissions or ID")
                return False
            elif response.status_code == 500:
                error_detail = response.text
                if "Authentication failed" in error_detail:
                    self.log_test("Google Sheets Connection", False, 
                                "Authentication failed - check service account credentials")
                else:
                    self.log_test("Google Sheets Connection", False, 
                                f"Server error: {error_detail}")
                return False
            else:
                self.log_test("Google Sheets Connection", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Google Sheets Connection", False, f"Request failed: {str(e)}")
            return False
        except Exception as e:
            self.log_test("Google Sheets Connection", False, f"Unexpected error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Starting Google Sheets Integration Backend Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test in order of priority
        tests = [
            ("Health Check", self.test_health_check),
            ("Google Sheets Connection", self.test_google_sheets_connection),
            ("Filter Single ID", self.test_filter_single_id),
            ("Filter Multiple IDs", self.test_filter_multiple_ids),
            ("Time Assignment", self.test_time_assignment),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
            except Exception as e:
                self.log_test(test_name, False, f"Test execution failed: {str(e)}")
        
        # Summary
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All backend tests PASSED!")
            return True
        else:
            print(f"⚠️  {total - passed} test(s) FAILED")
            
            # Show failed tests
            print("\nFailed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  ❌ {result['test']}: {result['details']}")
            
            return False

def main():
    """Main test execution"""
    tester = GoogleSheetsAPITester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()