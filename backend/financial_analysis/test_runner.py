#!/usr/bin/env python3
"""
Test runner for Sygnify Financial Analysis Module.
Runs unit tests and integration tests.
"""

import asyncio
import sys
import os
import subprocess
from pathlib import Path

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def run_unit_tests():
    """Run unit tests using pytest."""
    print("🧪 Running Unit Tests...")
    print("=" * 40)
    
    try:
        # Run pytest on the tests directory
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "tests/", 
            "-v", 
            "--tb=short"
        ], capture_output=True, text=True, cwd=os.path.dirname(__file__))
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        if result.returncode == 0:
            print("✅ Unit tests passed!")
            return True
        else:
            print("❌ Unit tests failed!")
            return False
            
    except Exception as e:
        print(f"❌ Error running unit tests: {e}")
        return False

async def run_integration_test():
    """Run integration test using the analyze.py script."""
    print("\n🔗 Running Integration Test...")
    print("=" * 40)
    
    try:
        # Import and run the main analysis function
        from analyze import run_financial_analysis
        
        # Test data
        columns = ["Revenue", "Net Income", "Total Assets"]
        sample_rows = [
            {"Revenue": 100000, "Net Income": 15000, "Total Assets": 500000},
            {"Revenue": 120000, "Net Income": 18000, "Total Assets": 520000},
            {"Revenue": 90000, "Net Income": 12000, "Total Assets": 480000}
        ]
        
        print("📊 Testing financial analysis pipeline...")
        result = await run_financial_analysis(
            columns=columns,
            sample_rows=sample_rows,
            user_id=123,
            user_role="analyst"
        )
        
        if result["success"]:
            print("✅ Integration test passed!")
            print(f"📝 Generated narrative: {result['narrative']['headline']}")
            print(f"🔍 Facts extracted: {len(result['facts']['facts'])}")
            print(f"📈 Recommendations: {len(result['recommendations'])}")
            return True
        else:
            print(f"❌ Integration test failed: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Error running integration test: {e}")
        return False

async def test_narrative_generation():
    """Test narrative generation specifically."""
    print("\n📝 Testing Narrative Generation...")
    print("=" * 40)
    
    try:
        from narrative import NarrativeGenerator
        
        # Test data
        sample_data = {
            "data": [
                {"Revenue": 100000, "Net Income": 15000},
                {"Revenue": 120000, "Net Income": 18000},
                {"Revenue": 90000, "Net Income": 12000}
            ],
            "labels": {
                "Revenue": "Revenue Metric",
                "Net Income": "Profitability Metric"
            }
        }
        
        # Test different roles
        roles = ["executive", "analyst", "manager"]
        narrative_gen = NarrativeGenerator()
        
        for role in roles:
            print(f"\n👤 Testing {role} role...")
            result = await narrative_gen.generate_complete_analysis(
                sample_data, 
                user_id=123, 
                user_role=role
            )
            
            if result["success"]:
                print(f"✅ {role}: {result['narrative']['headline']}")
                print(f"   Facts: {len(result['facts']['facts'])}")
            else:
                print(f"❌ {role}: {result['error']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing narrative generation: {e}")
        return False

async def main():
    """Main test runner function."""
    print("🚀 Sygnify Financial Analysis Module Test Runner")
    print("=" * 60)
    
    # Check if required files exist
    required_files = [
        "narrative.py",
        "smart_labeler.py", 
        "external_context.py",
        "visualization.py",
        "data_quality.py",
        "recommendations.py",
        "analyze.py",
        "finance_glossary.json"
    ]
    
    print("📁 Checking required files...")
    missing_files = []
    for file in required_files:
        if os.path.exists(file):
            print(f"✅ {file}")
        else:
            print(f"❌ {file} (missing)")
            missing_files.append(file)
    
    if missing_files:
        print(f"\n❌ Missing required files: {missing_files}")
        return False
    
    print(f"\n✅ All required files present!")
    
    # Run tests
    unit_success = await run_unit_tests()
    integration_success = await run_integration_test()
    narrative_success = await test_narrative_generation()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary:")
    print(f"   Unit Tests: {'✅ PASS' if unit_success else '❌ FAIL'}")
    print(f"   Integration Test: {'✅ PASS' if integration_success else '❌ FAIL'}")
    print(f"   Narrative Generation: {'✅ PASS' if narrative_success else '❌ FAIL'}")
    
    overall_success = unit_success and integration_success and narrative_success
    
    if overall_success:
        print("\n🎉 All tests passed! Financial Analysis Module is ready.")
    else:
        print("\n⚠️  Some tests failed. Please check the output above.")
    
    return overall_success

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1) 