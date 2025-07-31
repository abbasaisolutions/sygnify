#!/usr/bin/env python3
"""
Test frontend data structure compatibility
"""
import requests
import json

def test_frontend_data_structure():
    """Test that the backend data structure matches frontend expectations"""
    base_url = "http://localhost:8000"
    
    # Create a test job
    print("Creating test job...")
    response = requests.post(f"{base_url}/financial/test-job")
    if response.status_code != 200:
        print(f"Failed to create test job: {response.status_code}")
        return
    
    job_data = response.json()
    job_id = job_data['job_id']
    print(f"Created job: {job_id}")
    
    # Get insights
    print("Fetching insights...")
    response = requests.get(f"{base_url}/financial/insights/{job_id}")
    if response.status_code != 200:
        print(f"Failed to fetch insights: {response.status_code}")
        return
    
    insights_data = response.json()
    print("✅ Insights fetched successfully")
    
    # Check for required fields that frontend expects
    print("\nChecking data structure...")
    
    # Check for ai_analysis
    if 'ai_analysis' in insights_data:
        print("✅ ai_analysis found")
        ai_analysis = insights_data['ai_analysis']
        if 'analysis' in ai_analysis:
            print(f"✅ ai_analysis.analysis: {ai_analysis['analysis'][:100]}...")
        if 'confidence_score' in ai_analysis:
            print(f"✅ ai_analysis.confidence_score: {ai_analysis['confidence_score']}")
        if 'key_insights' in ai_analysis:
            print(f"✅ ai_analysis.key_insights: {len(ai_analysis['key_insights'])} items")
    else:
        print("❌ ai_analysis not found")
    
    # Check for risk_assessment
    if 'risk_assessment' in insights_data:
        print("✅ risk_assessment found")
        risk_assessment = insights_data['risk_assessment']
        if 'key_risks' in risk_assessment:
            print(f"✅ risk_assessment.key_risks: {len(risk_assessment['key_risks'])} items")
        if 'risk_score' in risk_assessment:
            print(f"✅ risk_assessment.risk_score: {risk_assessment['risk_score']}")
    else:
        print("❌ risk_assessment not found")
    
    # Check for financial_kpis
    if 'financial_kpis' in insights_data:
        print("✅ financial_kpis found")
        financial_kpis = insights_data['financial_kpis']
        print(f"✅ financial_kpis keys: {list(financial_kpis.keys())}")
    else:
        print("❌ financial_kpis not found")
    
    # Check for recommendations
    if 'recommendations' in insights_data:
        print("✅ recommendations found")
        recommendations = insights_data['recommendations']
        print(f"✅ recommendations: {len(recommendations)} items")
    else:
        print("❌ recommendations not found")
    
    print("\nData structure check complete!")

if __name__ == "__main__":
    test_frontend_data_structure() 