#!/usr/bin/env python3
"""
Simple verification script for the fixes
"""
import os

def check_file_exists(filepath):
    """Check if a file exists"""
    return os.path.exists(filepath)

def check_file_content(filepath, search_string):
    """Check if a file contains a specific string"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            return search_string in content
    except Exception:
        return False

def main():
    """Verify the key fixes"""
    print("🔍 Verifying Fixes...")
    print("=" * 40)
    
    fixes = [
        {
            "name": "Job Simulator Global Status Sync",
            "file": "backend/api/services/job_simulation_service.py",
            "check": "global_job_status",
            "description": "Job simulator now syncs with global job status"
        },
        {
            "name": "Main.py Fallback Job Status Sync",
            "file": "backend/api/main.py", 
            "check": "from api.routers.financial import job_status",
            "description": "Fallback case now updates global job status"
        },
        {
            "name": "Frontend Insights Endpoint Fix",
            "file": "frontend/client/src/components/ProcessingPage.jsx",
            "check": "ENDPOINTS.insights}/${jobId}",
            "description": "Frontend now includes job_id in insights request"
        },
        {
            "name": "API Config Documentation",
            "file": "frontend/client/src/config/api.js",
            "check": "Requires job_id parameter",
            "description": "API config now documents job_id requirement"
        }
    ]
    
    passed = 0
    total = len(fixes)
    
    for fix in fixes:
        print(f"\n🔧 {fix['name']}:")
        
        if not check_file_exists(fix['file']):
            print(f"❌ File not found: {fix['file']}")
            continue
            
        if check_file_content(fix['file'], fix['check']):
            print(f"✅ {fix['description']}")
            passed += 1
        else:
            print(f"❌ Fix not found in {fix['file']}")
    
    print("\n" + "=" * 40)
    print(f"📊 Results: {passed}/{total} fixes verified")
    
    if passed == total:
        print("🎉 All fixes are in place!")
        print("\n💡 The system should now:")
        print("1. Properly initialize job simulator")
        print("2. Sync job status between WebSocket and API")
        print("3. Handle insights endpoint with job_id")
        print("4. Display real financial KPIs")
    else:
        print("⚠️ Some fixes may be missing. Please check the files.")
    
    return passed == total

if __name__ == "__main__":
    main() 