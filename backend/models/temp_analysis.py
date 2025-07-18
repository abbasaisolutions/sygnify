
import sys
import json
import asyncio
from pathlib import Path

# Add the financial_analysis directory to Python path
sys.path.append(str(Path(__file__).parent / 'financial_analysis'))

from orchestrator import FinancialAnalyticsOrchestrator

async def main():
    # Parse input data from file
    input_file = sys.argv[1]
    with open(input_file, 'r', encoding='utf-8') as f:
        input_data = json.load(f)
    data = input_data['data']
    preferences = input_data.get('preferences', {})
    
    # Initialize orchestrator
    orchestrator = FinancialAnalyticsOrchestrator()
    
    # Run analysis with preferences
    result = await orchestrator.analyze_financial_data(data, preferences=preferences)
    
    # Output result to stdout
    print(json.dumps(result))

if __name__ == "__main__":
    asyncio.run(main())
