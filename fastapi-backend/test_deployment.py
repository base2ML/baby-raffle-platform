#!/usr/bin/env python3
"""
Test script for Baby Raffle SaaS deployment
Verifies that the multi-tenant API is working correctly
"""
import asyncio
import httpx
import sys
import json
from typing import Dict, Any

class DeploymentTester:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def test_health_check(self) -> bool:
        """Test the health check endpoint"""
        try:
            response = await self.client.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Health check passed: {data}")
                return True
            else:
                print(f"❌ Health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Health check error: {e}")
            return False
    
    async def test_root_endpoint(self) -> bool:
        """Test the root endpoint"""
        try:
            response = await self.client.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Root endpoint working: {data}")
                return True
            else:
                print(f"❌ Root endpoint failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Root endpoint error: {e}")
            return False
    
    async def test_docs_endpoint(self) -> bool:
        """Test that API docs are accessible"""
        try:
            response = await self.client.get(f"{self.base_url}/docs")
            if response.status_code == 200:
                print("✅ API documentation accessible")
                return True
            else:
                print(f"❌ API docs failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ API docs error: {e}")
            return False
    
    async def test_subdomain_validation(self) -> bool:
        """Test subdomain validation endpoint"""
        try:
            test_subdomain = "test-validation-12345"
            response = await self.client.get(
                f"{self.base_url}/api/tenant/validate-subdomain/{test_subdomain}"
            )
            if response.status_code == 200:
                data = response.json()
                if data.get("available") is True:
                    print(f"✅ Subdomain validation working: {test_subdomain} is available")
                    return True
                else:
                    print(f"✅ Subdomain validation working: {test_subdomain} is not available")
                    return True
            else:
                print(f"❌ Subdomain validation failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Subdomain validation error: {e}")
            return False
    
    async def test_oauth_endpoints(self) -> bool:
        """Test OAuth endpoint structure (without actual OAuth flow)"""
        try:
            # Test login endpoint with invalid data to check structure
            response = await self.client.post(
                f"{self.base_url}/api/auth/login",
                json={"provider": "google", "tenant_subdomain": None}
            )
            
            # We expect this to fail due to missing OAuth config, but endpoint should exist
            if response.status_code in [400, 500, 422]:
                print("✅ OAuth login endpoint exists and responding")
                return True
            else:
                print(f"❌ Unexpected OAuth response: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ OAuth endpoints error: {e}")
            return False
    
    async def test_tenant_endpoints_without_auth(self) -> bool:
        """Test tenant endpoints return proper auth errors"""
        try:
            response = await self.client.get(f"{self.base_url}/api/tenant/info")
            if response.status_code in [401, 403]:
                print("✅ Tenant endpoints properly protected")
                return True
            else:
                print(f"❌ Tenant endpoint security issue: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Tenant endpoints error: {e}")
            return False
    
    async def run_all_tests(self) -> Dict[str, bool]:
        """Run all deployment tests"""
        print(f"🧪 Testing deployment at: {self.base_url}")
        print("=" * 50)
        
        tests = {
            "health_check": self.test_health_check,
            "root_endpoint": self.test_root_endpoint,
            "docs_endpoint": self.test_docs_endpoint,
            "subdomain_validation": self.test_subdomain_validation,
            "oauth_endpoints": self.test_oauth_endpoints,
            "tenant_auth_protection": self.test_tenant_endpoints_without_auth,
        }
        
        results = {}
        
        for test_name, test_func in tests.items():
            print(f"\n🔍 Running {test_name}...")
            try:
                results[test_name] = await test_func()
            except Exception as e:
                print(f"❌ Test {test_name} crashed: {e}")
                results[test_name] = False
        
        await self.client.aclose()
        return results
    
    def print_summary(self, results: Dict[str, bool]):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("🔍 TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for r in results.values() if r)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {test_name}")
        
        print(f"\n📊 Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Deployment is working correctly.")
            return 0
        else:
            print("⚠️  Some tests failed. Check the deployment configuration.")
            return 1

async def main():
    if len(sys.argv) != 2:
        print("Usage: python test_deployment.py <BASE_URL>")
        print("Example: python test_deployment.py https://your-app.railway.app")
        sys.exit(1)
    
    base_url = sys.argv[1]
    tester = DeploymentTester(base_url)
    
    results = await tester.run_all_tests()
    exit_code = tester.print_summary(results)
    
    sys.exit(exit_code)

if __name__ == "__main__":
    asyncio.run(main())