import pytest
import asyncio
import json
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime

# Import the class to test
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from narrative import NarrativeGenerator

class TestNarrativeGenerator:
    """Test suite for NarrativeGenerator class."""
    
    @pytest.fixture
    def sample_data(self):
        """Sample financial data for testing."""
        return {
            "data": [
                {"Revenue": 100000, "Net Income": 15000, "Total Assets": 500000},
                {"Revenue": 120000, "Net Income": 18000, "Total Assets": 520000},
                {"Revenue": 90000, "Net Income": 12000, "Total Assets": 480000}
            ],
            "labels": {
                "Revenue": "Revenue Metric",
                "Net Income": "Profitability Metric", 
                "Total Assets": "Leverage Metric"
            }
        }
    
    @pytest.fixture
    def narrative_gen(self):
        """Create NarrativeGenerator instance for testing."""
        return NarrativeGenerator()
    
    @pytest.fixture
    def mock_llm_client(self):
        """Mock LLM client for testing."""
        mock_client = Mock()
        mock_client.generate = AsyncMock(return_value=Mock(text='{"headline": "Test", "paragraphs": ["Test paragraph"]}'))
        return mock_client

    def test_init(self):
        """Test NarrativeGenerator initialization."""
        gen = NarrativeGenerator()
        assert gen.llm_client is None
        assert gen.fallback_template_path == "templates/narrative_fallback.txt"
        assert "concise" in gen.ab_test_variants
        assert "detailed" in gen.ab_test_variants
        assert "executive" in gen.ab_test_variants

@pytest.mark.asyncio
    async def test_get_user_preferences_default(self, narrative_gen):
        """Test getting default user preferences when user not found."""
        prefs = await narrative_gen.get_user_preferences(123)
        assert prefs["tone"] == "professional"
        assert prefs["verbosity"] == "detailed"
        assert prefs["role"] == "analyst"
        assert prefs["ab_test_group"] in ["concise", "detailed", "executive"]

    def test_load_fallback_template(self, narrative_gen):
        """Test loading fallback template."""
        template = narrative_gen.load_fallback_template()
        assert "headline" in template
        assert "paragraphs" in template
        assert isinstance(template["paragraphs"], list)

@pytest.mark.asyncio
    async def test_extract_facts_rule_based(self, narrative_gen, sample_data):
        """Test rule-based fact extraction."""
        facts = await narrative_gen.extract_facts(sample_data)
        assert "facts" in facts
        assert isinstance(facts["facts"], list)
        assert len(facts["facts"]) <= 5

    def test_build_fact_extraction_prompt(self, narrative_gen, sample_data):
        """Test building fact extraction prompt."""
        prompt = narrative_gen._build_fact_extraction_prompt(sample_data)
        assert "Analyze this financial data" in prompt
        assert "Revenue" in prompt
        assert "Net Income" in prompt
        assert "Total Assets" in prompt

    def test_extract_facts_rule_based_method(self, narrative_gen, sample_data):
        """Test the rule-based fact extraction method directly."""
        facts = narrative_gen._extract_facts_rule_based(sample_data)
        assert "facts" in facts
        assert len(facts["facts"]) <= 5
        
        # Should extract trends for numeric columns
        fact_text = " ".join(facts["facts"])
        assert any(col in fact_text for col in ["Revenue", "Net Income", "Total Assets"])

    @pytest.mark.asyncio
    async def test_generate_narrative_template_fallback(self, narrative_gen, sample_data):
        """Test narrative generation with template fallback."""
        facts = {"facts": ["Revenue shows increasing trend", "Net Income is stable"]}
        narrative = await narrative_gen.generate_narrative(facts, user_role="executive")
        
        assert "headline" in narrative
        assert "paragraphs" in narrative
        assert "metadata" in narrative
        assert narrative["metadata"]["method"] == "template"

    def test_build_narrative_prompt(self, narrative_gen):
        """Test building narrative prompt."""
        facts = {"facts": ["Test fact 1", "Test fact 2"]}
        preferences = {"tone": "professional", "role": "analyst"}
        variant_config = {"style": "paragraphs"}
        
        prompt = narrative_gen._build_narrative_prompt(facts, preferences, variant_config)
        assert "professional" in prompt
        assert "analyst" in prompt
        assert "Test fact 1" in prompt
        assert "Test fact 2" in prompt

    def test_generate_template_narrative_executive(self, narrative_gen):
        """Test executive template narrative generation."""
        facts = {"facts": ["Revenue up 20%", "Profit margin stable", "Assets growing"]}
        preferences = {"role": "executive"}
        variant_config = {"style": "high_level"}
        
        narrative = narrative_gen._generate_template_narrative(facts, preferences, variant_config)
        assert "Executive Summary" in narrative["headline"]
        assert len(narrative["paragraphs"]) >= 2

    def test_generate_template_narrative_analyst(self, narrative_gen):
        """Test analyst template narrative generation."""
        facts = {"facts": ["Revenue up 20%", "Profit margin stable", "Assets growing"]}
        preferences = {"role": "analyst"}
        variant_config = {"style": "paragraphs"}
        
        narrative = narrative_gen._generate_template_narrative(facts, preferences, variant_config)
        assert "Comprehensive" in narrative["headline"]
        assert "analysis" in narrative["headline"].lower()

    def test_generate_template_narrative_manager(self, narrative_gen):
        """Test manager template narrative generation."""
        facts = {"facts": ["Revenue up 20%", "Profit margin stable", "Assets growing"]}
        preferences = {"role": "manager"}
        variant_config = {"style": "paragraphs"}
        
        narrative = narrative_gen._generate_template_narrative(facts, preferences, variant_config)
        assert "Performance" in narrative["headline"]
        assert "Overview" in narrative["headline"]

    def test_parse_facts_response_json(self, narrative_gen):
        """Test parsing JSON facts response."""
        response = '{"facts": ["fact1", "fact2"]}'
        result = narrative_gen._parse_facts_response(response)
        assert result["facts"] == ["fact1", "fact2"]

    def test_parse_facts_response_text(self, narrative_gen):
        """Test parsing text facts response."""
        response = "fact1\nfact2\n# comment"
        result = narrative_gen._parse_facts_response(response)
        assert "fact1" in result["facts"]
        assert "fact2" in result["facts"]
        assert "# comment" not in result["facts"]

    def test_parse_narrative_response_json(self, narrative_gen):
        """Test parsing JSON narrative response."""
        response = '{"headline": "Test", "paragraphs": ["p1", "p2"]}'
        result = narrative_gen._parse_narrative_response(response)
        assert result["headline"] == "Test"
        assert result["paragraphs"] == ["p1", "p2"]

    def test_parse_narrative_response_text(self, narrative_gen):
        """Test parsing text narrative response."""
        response = "Test Headline\nparagraph1\nparagraph2"
        result = narrative_gen._parse_narrative_response(response)
        assert result["headline"] == "Test Headline"
        assert "paragraph1" in result["paragraphs"]

    @pytest.mark.asyncio
    async def test_call_llm_placeholder(self, narrative_gen):
        """Test LLM call with placeholder (no real client)."""
        with pytest.raises(Exception, match="LLM client not available"):
            await narrative_gen._call_llm("test prompt")

    @pytest.mark.asyncio
    async def test_call_llm_with_mock_client(self, mock_llm_client):
        """Test LLM call with mock client."""
        gen = NarrativeGenerator(llm_client=mock_llm_client)
        response = await gen._call_llm("test prompt")
        assert "headline" in response
        assert "paragraphs" in response

    @pytest.mark.asyncio
    async def test_generate_complete_analysis_success(self, narrative_gen, sample_data):
        """Test complete analysis pipeline success."""
        result = await narrative_gen.generate_complete_analysis(sample_data, user_role="analyst")
        
        assert result["success"] is True
        assert "narrative" in result
        assert "facts" in result
        assert "metadata" in result
        assert result["metadata"]["user_role"] == "analyst"

    @pytest.mark.asyncio
    async def test_generate_complete_analysis_with_user_id(self, narrative_gen, sample_data):
        """Test complete analysis with user ID."""
        result = await narrative_gen.generate_complete_analysis(sample_data, user_id=123, user_role="executive")
        
        assert result["success"] is True
        assert result["metadata"]["user_id"] == 123
        assert result["metadata"]["user_role"] == "executive"

    @pytest.mark.asyncio
    async def test_track_ab_test_result(self, narrative_gen):
        """Test A/B test result tracking."""
        # Should not raise exception
        await narrative_gen.track_ab_test_result(123, "detailed", 0.85)

    def test_ab_test_variants_config(self, narrative_gen):
        """Test A/B test variants configuration."""
        variants = narrative_gen.ab_test_variants
        
        assert "concise" in variants
        assert "detailed" in variants
        assert "executive" in variants
        
        assert "max_length" in variants["concise"]
        assert "style" in variants["concise"]
        assert variants["concise"]["style"] == "bullet_points"

    @pytest.mark.asyncio
    async def test_narrative_with_different_roles(self, narrative_gen):
        """Test narrative generation with different user roles."""
        facts = {"facts": ["Revenue up 20%", "Profit margin stable"]}
        
        # Test executive role
        exec_narrative = await narrative_gen.generate_narrative(facts, user_role="executive")
        assert "Executive" in exec_narrative["headline"]
        
        # Test analyst role
        analyst_narrative = await narrative_gen.generate_narrative(facts, user_role="analyst")
        assert "Comprehensive" in analyst_narrative["headline"]
        
        # Test manager role
        manager_narrative = await narrative_gen.generate_narrative(facts, user_role="manager")
        assert "Performance" in manager_narrative["headline"]

    @pytest.mark.asyncio
    async def test_narrative_metadata(self, narrative_gen):
        """Test narrative metadata generation."""
        facts = {"facts": ["Test fact"]}
        narrative = await narrative_gen.generate_narrative(facts, user_role="analyst")
        
        metadata = narrative["metadata"]
        assert "variant" in metadata
        assert "user_preferences" in metadata
        assert "generated_at" in metadata
        assert "method" in metadata
        assert metadata["method"] == "template"  # No LLM client

if __name__ == "__main__":
    pytest.main([__file__])
