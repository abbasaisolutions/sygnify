import pandas as pd

def operations_analysis(data):
    df = pd.DataFrame(data)
    efficiency = df['production'] / df['downtime'] if 'production' in df and 'downtime' in df else pd.Series([0])
    quality = df['quality_score'].mean() if 'quality_score' in df else 0
    return {'efficiency': float(efficiency.mean()), 'quality': float(quality)}

import sys
import json

if __name__ == "__main__":
    data_path = sys.argv[1]
    with open(data_path, 'r') as f:
        data = json.load(f)
    result = operations_analysis(data)
    print(json.dumps(result)) 