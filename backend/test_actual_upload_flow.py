#!/usr/bin/env python3
"""
Test actual file upload flow to see data structure
"""
import requests
import json
import io

def test_actual_upload_flow():
    """Test the actual file upload flow to see what data structure is returned"""
    base_url = "http://localhost:8000"
    
    # Create a sample CSV file
    csv_content = """date,revenue,expenses,profit
2023-01-01,1000,800,200
2023-01-02,1100,850,250
2023-01-03,1200,900,300
2023-01-04,1150,875,275
2023-01-05,1300,950,350"""
    
    # Create file-like object
    files = {
        'file': ('test_data.csv', io.StringIO(csv_content), 'text/csv')
    }
    
    # Step 1: Upload file
    print("Step 1: Uploading file...")
    response = requests.post(
        f"{base_url}/financial/upload",
        files=files,
        data={'domain': 'financial'}
    )
    
    if response.status_code != 200:
        print(f"Failed to upload file: {response.status_code}")
        print(f"Response: {response.text}")
        return
    
    upload_data = response.json()
    job_id = upload_data['job_id']
    print(f"✅ File uploaded successfully, job_id: {job_id}")
    
    # Step 2: Wait a moment for processing
    import time
    time.sleep(2)
    
    # Step 3: Get insights
    print("\nStep 2: Fetching insights...")
    response = requests.get(f"{base_url}/financial/insights/{job_id}")
    
    if response.status_code != 200:
        print(f"Failed to fetch insights: {response.status_code}")
        print(f"Response: {response.text}")
        return
    
    insights_data = response.json()
    print("✅ Insights fetched successfully")
    
    # Step 4: Analyze data structure
    print("\nStep 3: Analyzing data structure...")
    print(f"Root level keys: {list(insights_data.keys())}")
    
    # Check for ai_analysis
    if 'ai_analysis' in insights_data:
        print("✅ ai_analysis found at root level")
        ai_analysis = insights_data['ai_analysis']
        print(f"   ai_analysis keys: {list(ai_analysis.keys())}")
        if 'analysis' in ai_analysis:
            print(f"   analysis present: {bool(ai_analysis['analysis'])}")
    else:
        print("❌ ai_analysis not found at root level")
    
    # Check for insights.ai_analysis
    if 'insights' in insights_data and 'ai_analysis' in insights_data['insights']:
        print("✅ ai_analysis found in insights")
        ai_analysis = insights_data['insights']['ai_analysis']
        print(f"   ai_analysis keys: {list(ai_analysis.keys())}")
    else:
        print("❌ ai_analysis not found in insights")
    
    # Check for risk_assessment
    if 'risk_assessment' in insights_data:
        print("✅ risk_assessment found at root level")
        risk_assessment = insights_data['risk_assessment']
        print(f"   risk_assessment keys: {list(risk_assessment.keys())}")
    else:
        print("❌ risk_assessment not found at root level")
    
    # Check for insights.risk_assessment
    if 'insights' in insights_data and 'risk_assessment' in insights_data['insights']:
        print("✅ risk_assessment found in insights")
        risk_assessment = insights_data['insights']['risk_assessment']
        print(f"   risk_assessment keys: {list(risk_assessment.keys())}")
    else:
        print("❌ risk_assessment not found in insights")
    
    print("\n✅ Actual upload flow test complete!")

if __name__ == "__main__":
    test_actual_upload_flow() 