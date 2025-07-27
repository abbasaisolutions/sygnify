import pytest
from backend.models.smartNarrativeGenerator import SmartNarrativeGenerator

def test_insights_detail():
    gen = SmartNarrativeGenerator()
    data_profile = {
        "structure": {
            "numerical_columns": ["revenue", "churn", "engagement"],
            "shape": (2, 3),
            "missing_values": {},
            "patterns": {}
        }
    }
    analysis_results = {"revenue": [1000, 1200], "churn": [0.1, 0.2], "engagement": [0.8, 0.9]}
    insights = gen._generate_trend_analysis(data_profile, analysis_results, "finance")
    assert any("revenue" in t["metric"] for t in insights)
    assert any("churn" in t["metric"] for t in insights)
    assert any("engagement" in t["metric"] for t in insights) 