#!/usr/bin/env python3
"""
Test the exact frontend upload flow to debug narrative and risk assessment display
"""
import requests
import json
import io
import time

def test_frontend_upload_flow():
    """Test the exact frontend upload flow"""
    base_url = "http://localhost:8000"
    
    # Create a sample CSV file (like what frontend would upload)
    csv_content = """date,revenue,expenses,profit
2023-01-01,1000,800,200
2023-01-02,1100,850,250
2023-01-03,1200,900,300
2023-01-04,1150,875,275
2023-01-05,1300,950,350"""
    
    # Step 1: Upload file (simulates frontend upload)
    print("Step 1: Uploading file (frontend simulation)...")
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
        print(f"Response: {response.text}")
        return
    
    upload_data = response.json()
    job_id = upload_data['job_id']
    print(f"✅ File uploaded successfully, job_id: {job_id}")
    
    # Step 2: Wait for processing (like frontend does)
    print("\nStep 2: Waiting for processing...")
    time.sleep(3)
    
    # Step 3: Get insights (simulates ProcessingPage.fetchAnalysisResults)
    print("\nStep 3: Fetching insights (ProcessingPage simulation)...")
    response = requests.get(f"{base_url}/financial/insights/{job_id}")
    
    if response.status_code != 200:
        print(f"❌ Failed to fetch insights: {response.status_code}")
        print(f"Response: {response.text}")
        return
    
    backend_data = response.json()
    print("✅ Insights fetched successfully")
    
    # Step 4: Simulate ProcessingPage data mapping
    print("\nStep 4: Simulating ProcessingPage data mapping...")
    formatted_results = {
        "financial_kpis": backend_data.get('insights', {}).get('financial_kpis', backend_data.get('financial_kpis', {})),
        "ml_prompts": backend_data.get('insights', {}).get('ml_prompts', backend_data.get('ml_prompts', [])),
        "market_context": backend_data.get('market_context', {}),
        "statistical_analysis": backend_data.get('statistical_analysis', {}),
        "ai_analysis": backend_data.get('ai_analysis', {}),
        "risk_assessment": backend_data.get('insights', {}).get('risk_assessment', backend_data.get('risk_assessment', {})),
        "recommendations": backend_data.get('insights', {}).get('recommendations', backend_data.get('recommendations', []))
    }
    
    print("✅ Formatted results created")
    
    # Step 5: Simulate Dashboard component data extraction
    print("\nStep 5: Simulating Dashboard component data extraction...")
    analysis_results = formatted_results
    
    # Extract data like Dashboard component does
    financial_kpis = analysis_results.get('financial_kpis', {})
    ml_prompts = analysis_results.get('ml_prompts', [])
    risk_assessment = analysis_results.get('risk_assessment', {})
    recommendations = analysis_results.get('recommendations', [])
    ai_analysis = analysis_results.get('ai_analysis', {})
    
    print("✅ Dashboard extracted data:")
    print(f"   - financial_kpis keys: {list(financial_kpis.keys())}")
    print(f"   - ml_prompts count: {len(ml_prompts)}")
    print(f"   - risk_assessment keys: {list(risk_assessment.keys())}")
    print(f"   - recommendations count: {len(recommendations)}")
    print(f"   - ai_analysis keys: {list(ai_analysis.keys())}")
    
    # Step 6: Check tab visibility conditions (like Dashboard does)
    print("\nStep 6: Checking tab visibility conditions...")
    
    # Narrative tab condition (from Dashboard.jsx)
    narrative_visible = bool(ai_analysis.get('analysis'))
    print(f"   - Narrative tab content visible: {narrative_visible}")
    if ai_analysis.get('analysis'):
        print(f"     Analysis text: {ai_analysis['analysis'][:100]}...")
    else:
        print(f"     ❌ Analysis text is empty or missing")
        print(f"     ai_analysis content: {ai_analysis}")
    
    # Risk assessment tab condition (from Dashboard.jsx)
    risks_visible = bool(risk_assessment.get('key_risks', []))
    print(f"   - Risk assessment tab content visible: {risks_visible}")
    if risk_assessment.get('key_risks'):
        print(f"     Risk count: {len(risk_assessment['key_risks'])}")
    else:
        print(f"     ❌ Risk assessment is empty or missing")
        print(f"     risk_assessment content: {risk_assessment}")
    
    # Step 7: Debug the actual data structure
    print("\nStep 7: Debugging actual data structure...")
    print(f"Backend data keys: {list(backend_data.keys())}")
    print(f"ai_analysis present: {'ai_analysis' in backend_data}")
    print(f"risk_assessment present: {'risk_assessment' in backend_data}")
    print(f"insights present: {'insights' in backend_data}")
    
    if 'ai_analysis' in backend_data:
        print(f"ai_analysis content: {json.dumps(backend_data['ai_analysis'], indent=2)}")
    
    if 'risk_assessment' in backend_data:
        print(f"risk_assessment content: {json.dumps(backend_data['risk_assessment'], indent=2)}")
    
    print("\n✅ Frontend flow simulation complete!")

if __name__ == "__main__":
    test_frontend_upload_flow() 