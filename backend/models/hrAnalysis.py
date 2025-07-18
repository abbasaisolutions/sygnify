import pandas as pd

def hr_analysis(data):
    df = pd.DataFrame(data)
    turnover_rate = df['turnover'].mean() if 'turnover' in df else 0
    satisfaction = df['satisfaction'].mean() if 'satisfaction' in df else 0
    return {'turnover_rate': float(turnover_rate), 'satisfaction': float(satisfaction)}

import sys
import json

if __name__ == "__main__":
    data_path = sys.argv[1]
    with open(data_path, 'r') as f:
        data = json.load(f)
    result = hr_analysis(data)
    print(json.dumps(result)) 