#!/usr/bin/env python3
"""
Test frontend data flow simulation
"""
import requests
import json

def simulate_frontend_flow():
    """Simulate the frontend data flow to verify Dashboard component receives correct data"""
    base_url = "http://localhost:8000"
    
    # Step 1: Create a test job (simulates file upload)
    print("Step 1: Creating test job...")
    response = requests.post(f"{base_url}/financial/test-job")
    if response.status_code != 200:
        print(f"Failed to create test job: {response.status_code}")
        return
    
    job_data = response.json()
    job_id = job_data['job_id']
    print(f"✅ Created job: {job_id}")
    
    # Step 2: Get insights (simulates ProcessingPage.fetchAnalysisResults)
    print("\nStep 2: Fetching insights...")
    response = requests.get(f"{base_url}/financial/insights/{job_id}")
    if response.status_code != 200:
        print(f"Failed to fetch insights: {response.status_code}")
        return
    
    backend_data = response.json()
    print("✅ Backend data structure:")
    print(f"   - ai_analysis: {'present' if 'ai_analysis' in backend_data else 'missing'}")
    print(f"   - risk_assessment: {'present' if 'risk_assessment' in backend_data else 'missing'}")
    print(f"   - financial_kpis: {'present' if 'financial_kpis' in backend_data else 'missing'}")
    print(f"   - recommendations: {'present' if 'recommendations' in backend_data else 'missing'}")
    
    # Step 3: Simulate ProcessingPage data mapping
    print("\nStep 3: Simulating ProcessingPage data mapping...")
    formatted_results = {
        "domain": "financial",
        "timestamp": "2025-07-31T09:00:00.000Z",
        "status": "success",
        "financial_kpis": backend_data.get('insights', {}).get('financial_kpis', backend_data.get('financial_kpis', {})),
        "ml_prompts": backend_data.get('insights', {}).get('ml_prompts', backend_data.get('ml_prompts', [])),
        "market_context": backend_data.get('market_context', {}),
        "statistical_analysis": backend_data.get('statistical_analysis', {}),
        "ai_analysis": backend_data.get('ai_analysis', {}),
        "risk_assessment": backend_data.get('insights', {}).get('risk_assessment', backend_data.get('risk_assessment', {})),
        "recommendations": backend_data.get('insights', {}).get('recommendations', backend_data.get('recommendations', []))
    }
    
    print("✅ Formatted results structure:")
    print(f"   - ai_analysis: {'present' if formatted_results.get('ai_analysis') else 'missing'}")
    print(f"   - risk_assessment: {'present' if formatted_results.get('risk_assessment') else 'missing'}")
    print(f"   - financial_kpis: {'present' if formatted_results.get('financial_kpis') else 'missing'}")
    print(f"   - recommendations: {'present' if formatted_results.get('recommendations') else 'missing'}")
    
    # Step 4: Simulate Dashboard component data extraction
    print("\nStep 4: Simulating Dashboard component data extraction...")
    analysis_results = formatted_results
    
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
    
    # Step 5: Check tab visibility conditions
    print("\nStep 5: Checking tab visibility conditions...")
    
    # Narrative tab condition
    narrative_visible = bool(ai_analysis.get('analysis'))
    print(f"   - Narrative tab content visible: {narrative_visible}")
    if ai_analysis.get('analysis'):
        print(f"     Analysis text: {ai_analysis['analysis'][:100]}...")
    
    # Risk assessment tab condition
    risks_visible = bool(risk_assessment.get('key_risks', []))
    print(f"   - Risk assessment tab content visible: {risks_visible}")
    if risk_assessment.get('key_risks'):
        print(f"     Risk count: {len(risk_assessment['key_risks'])}")
    
    print("\n✅ Frontend flow simulation complete!")

if __name__ == "__main__":
    simulate_frontend_flow() 