#!/usr/bin/env python3
"""
Debug what the frontend actually receives for narrative tab
"""
import requests
import json
import io
import time

def test_frontend_data_debug():
    """Test what the frontend actually receives"""
    base_url = "http://localhost:8000"
    
    # Create a sample CSV file
    csv_content = """date,revenue,expenses,profit
2023-01-01,1000,800,200
2023-01-02,1100,850,250
2023-01-03,1200,900,300
2023-01-04,1150,875,275
2023-01-05,1300,950,350"""
    
    # Upload file
    print("Step 1: Uploading file...")
    files = {
        'file': ('test_data.csv', io.StringIO(csv_content), 'text/csv')
    }
    
    response = requests.post(
        f"{base_url}/financial/upload",
        files=files,
        data={'domain': 'financial'}
    )
    
    if response.status_code != 200:
        print(f"❌ Upload failed: {response.status_code}")
        return
    
    job_id = response.json()['job_id']
    print(f"✅ File uploaded successfully, job_id: {job_id}")
    
    # Wait for processing
    print("\nStep 2: Waiting for processing...")
    time.sleep(3)
    
    # Get insights
    print("\nStep 3: Fetching insights...")
    response = requests.get(f"{base_url}/financial/insights/{job_id}")
    
    if response.status_code != 200:
        print(f"❌ Failed to fetch insights: {response.status_code}")
        return
    
    backend_data = response.json()
    print("✅ Insights fetched successfully")
    
    # Simulate ProcessingPage mapping (exactly as frontend does)
    print("\nStep 4: Simulating ProcessingPage data mapping...")
    formatted_results = {
        "domain": "financial",
        "timestamp": "2025-07-31T10:00:00.000Z",
        "status": "success",
        "financial_kpis": backend_data.get('insights', {}).get('financial_kpis', backend_data.get('financial_kpis', {})),
        "ml_prompts": backend_data.get('insights', {}).get('ml_prompts', backend_data.get('ml_prompts', [])),
        "market_context": backend_data.get('market_context', {}),
        "statistical_analysis": backend_data.get('statistical_analysis', {}),
        "ai_analysis": backend_data.get('ai_analysis', {}),
        "risk_assessment": backend_data.get('insights', {}).get('risk_assessment', backend_data.get('risk_assessment', {})),
        "recommendations": backend_data.get('insights', {}).get('recommendations', backend_data.get('recommendations', []))
    }
    
    print("✅ Formatted results created")
    
    # Debug the exact data that Dashboard receives
    print("\nStep 5: Debugging Dashboard data...")
    analysis_results = formatted_results
    
    print("🔍 analysisResults structure:")
    print(f"  - Type: {type(analysis_results)}")
    print(f"  - Keys: {list(analysis_results.keys())}")
    
    print("\n🔍 ai_analysis structure:")
    ai_analysis = analysis_results.get('ai_analysis', {})
    print(f"  - Type: {type(ai_analysis)}")
    print(f"  - Keys: {list(ai_analysis.keys())}")
    print(f"  - Content: {json.dumps(ai_analysis, indent=2)}")
    
    print("\n🔍 Narrative tab condition check:")
    analysis_text = analysis_results.get('ai_analysis', {}).get('analysis')
    condition = bool(analysis_text)
    print(f"  - analysisResults?.ai_analysis?.analysis: {repr(analysis_text)}")
    print(f"  - bool(analysis_text): {condition}")
    print(f"  - analysis_text type: {type(analysis_text)}")
    print(f"  - analysis_text length: {len(analysis_text) if analysis_text else 0}")
    
    print("\n🔍 Dashboard component extraction:")
    financial_kpis = analysis_results.get('financial_kpis', {})
    ml_prompts = analysis_results.get('ml_prompts', [])
    risk_assessment = analysis_results.get('risk_assessment', {})
    recommendations = analysis_results.get('recommendations', [])
    ai_analysis_extracted = analysis_results.get('ai_analysis', {})
    
    print(f"  - financial_kpis keys: {list(financial_kpis.keys())}")
    print(f"  - ml_prompts count: {len(ml_prompts)}")
    print(f"  - risk_assessment keys: {list(risk_assessment.keys())}")
    print(f"  - recommendations count: {len(recommendations)}")
    print(f"  - ai_analysis keys: {list(ai_analysis_extracted.keys())}")
    
    print("\n🔍 Final narrative visibility check:")
    narrative_visible = bool(ai_analysis_extracted.get('analysis'))
    print(f"  - Narrative tab should be visible: {narrative_visible}")
    
    if narrative_visible:
        print(f"  - Analysis text preview: {ai_analysis_extracted.get('analysis', '')[:100]}...")
    else:
        print("  - ❌ Analysis text is missing or empty")
    
    print("\n✅ Frontend data debug complete!")

if __name__ == "__main__":
    test_frontend_data_debug() 