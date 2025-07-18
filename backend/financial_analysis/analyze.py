import os
import asyncio
import json
import logging
from smart_labeler import SmartLabeler
from external_context import ExternalContext
from visualization import VisualizationGenerator
from narrative import NarrativeGenerator
from data_quality import DataQualityAnalyzer
from recommendations import RecommendationsEngine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_financial_analysis(columns, sample_rows, user_id=None, user_role="executive"):
    """
    Complete financial analysis pipeline using all modules with enhanced SmartLabeler.
    Returns modular JSON output ready for frontend consumption.
    """
    try:
        logger.info("Starting enhanced financial analysis pipeline...")
        
        # Step 1: Smart Labeling (Enhanced with cross-column inference)
        logger.info("Step 1: Enhanced Smart Labeling with cross-column inference")
        labeler = SmartLabeler(glossary_path="finance_glossary.json")
        labels = await labeler.extract_labels(sample_rows, user_id=user_id)
        logger.info(f"Extracted {len(labels)} enhanced labels with cross-column inference")
        
        # Extract semantic labels for backward compatibility
        semantic_labels = {col: label_info['semantic'] for col, label_info in labels.items()}

        # Step 2: External Context Integration
        logger.info("Step 2: External Context Integration")
        external = ExternalContext(redis_url="redis://localhost:6379/0")
        news = external.fetch_news("interest rates")
        fred = external.fetch_fred("FEDFUNDS")
        av_data = external.fetch_alpha_vantage("AAPL")
        logger.info("External context fetched")

        # Step 3: Visualizations
        logger.info("Step 3: Visualizations")
        viz = VisualizationGenerator()
        chart_config = viz.generate_chart_config(sample_rows)
        chart_config = viz.add_interactivity_hints(chart_config)
        caption = viz.generate_caption(sample_rows)
        logger.info("Visualizations generated")

        # Step 4: Narrative Generation (Enhanced with user preferences)
        logger.info("Step 4: Enhanced Narrative Generation")
        narrative_gen = NarrativeGenerator()
        
        # Get user preferences (simulated for now)
        user_preferences = {
            "role": user_role,
            "tone": "formal",
            "verbosity": "concise"
        }
        
        # Prepare data for narrative generation with semantic labels
        narrative_data = {
            "data": sample_rows, 
            "labels": semantic_labels,
            "enhanced_labels": labels  # Include full label info
        }
        
        # Generate narratives with user preferences
        narratives = await narrative_gen.generate_narratives(
            data=sample_rows,
            labels=semantic_labels,
            metrics={'profit_margin': 0.2, 'current_ratio': 2.5, 'asset_turnover': 1.2},
            user_role=user_preferences["role"],
            tone=user_preferences["tone"],
            verbosity=user_preferences["verbosity"]
        )
        
        # Also generate complete analysis for backward compatibility
        narrative_result = await narrative_gen.generate_complete_analysis(
            narrative_data, 
            user_id=user_id, 
            user_role=user_role
        )
        logger.info(f"Narrative generation: {'success' if narrative_result['success'] else 'failed'}")

        # Step 5: Data Quality & Outlier Detection
        logger.info("Step 5: Data Quality Analysis")
        dq = DataQualityAnalyzer()
        
        # Analyze numeric columns for outliers
        outlier_analysis = {}
        for col, label_info in labels.items():
            if label_info['type'] == 'numeric':
                values = [row.get(col, 0) for row in sample_rows if row.get(col) is not None]
                if values:
                    outlier_indices = dq.detect_outliers(values)
                    if outlier_indices:
                        outlier_analysis[col] = {
                            'indices': outlier_indices,
                            'semantic_label': label_info['semantic'],
                            'count': len(outlier_indices)
                        }
        
        missing_data = dq.assess_missing_data(sample_rows)
        problematic_rows = dq.sample_problematic_rows(sample_rows)
        logger.info(f"Data quality analysis complete. Outliers found in {len(outlier_analysis)} columns")

        # Step 6: SMART Recommendations
        logger.info("Step 6: SMART Recommendations")
        recommender = RecommendationsEngine()
        recommendations = recommender.generate_smart_recommendations({
            "labels": semantic_labels, 
            "enhanced_labels": labels,
            "data_quality": missing_data,
            "outliers": outlier_analysis
        })
        recommendations = recommender.prioritize(recommendations)
        logger.info(f"Generated {len(recommendations)} recommendations")

        # Modular JSON Output
        output = {
            "version": "2.1.0",
            "success": True,
            "smart_labels": semantic_labels,  # Backward compatibility
            "enhanced_labels": labels,  # Full label information
            "external_context": {
                "news": news, 
                "fred": fred, 
                "alpha_vantage": av_data
            },
            "visualizations": {
                "chart_config": chart_config, 
                "caption": caption
            },
            "narratives": narratives,  # New format
            "narrative": narrative_result["narrative"],  # Backward compatibility
            "facts": narrative_result["facts"],
            "data_quality": {
                "outliers": outlier_analysis, 
                "missing": missing_data, 
                "problematic_rows": problematic_rows
            },
            "recommendations": recommendations,
            "metadata": {
                "user_id": user_id,
                "user_role": user_role,
                "user_preferences": user_preferences,
                "generated_at": narrative_result["metadata"]["generated_at"],
                "pipeline_version": "2.1.0",
                "columns_analyzed": len(columns),
                "records_analyzed": len(sample_rows),
                "cross_column_inference": True
            }
        }

        logger.info("Enhanced financial analysis pipeline completed successfully!")
        return output

    except Exception as e:
        logger.error(f"Enhanced financial analysis pipeline failed: {e}")
        return {
            "version": "2.1.0",
            "success": False,
            "error": str(e),
            "metadata": {
                "user_id": user_id,
                "user_role": user_role,
                "generated_at": "2024-01-01T00:00:00Z",
                "cross_column_inference": True
            }
        }

# Sample data for testing
columns = ["Revenue", "Net Income", "Total Assets"]
sample_rows = [
    {"Revenue": 100000, "Net Income": 15000, "Total Assets": 500000},
    {"Revenue": 120000, "Net Income": 18000, "Total Assets": 520000},
    {"Revenue": 90000, "Net Income": 12000, "Total Assets": 480000},
    {"Revenue": 110000, "Net Income": 16000, "Total Assets": 510000},
    {"Revenue": 130000, "Net Income": 20000, "Total Assets": 530000}
]

async def main():
    """Main function to run the enhanced financial analysis pipeline."""
    print("🚀 Starting Enhanced Sygnify Financial Analysis Pipeline (v2.1)...")
    print("=" * 60)
    
    # Test with different user roles
    roles = ["executive", "analyst", "manager"]
    
    for role in roles:
        print(f"\n📊 Testing with role: {role.upper()}")
        print("-" * 40)
        
        result = await run_financial_analysis(
            columns=columns,
            sample_rows=sample_rows,
            user_id=123,
            user_role=role
        )
        
        if result["success"]:
            print(f"✅ Enhanced analysis completed for {role}")
            print(f"📝 Narrative: {result['narrative']['headline']}")
            print(f"🔍 Facts extracted: {len(result['facts']['facts'])}")
            print(f"📈 Recommendations: {len(result['recommendations'])}")
            print(f"🏷️  Smart Labels: {list(result['smart_labels'].values())}")
            print(f"🔄 Cross-column inference: {result['metadata']['cross_column_inference']}")
        else:
            print(f"❌ Enhanced analysis failed for {role}: {result['error']}")
    
    print("\n" + "=" * 60)
    print("🎉 Enhanced Financial Analysis Pipeline Test Complete!")

if __name__ == "__main__":
    asyncio.run(main()) 