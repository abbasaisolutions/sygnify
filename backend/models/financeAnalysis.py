import pandas as pd

def finance_analysis(data):
    df = pd.DataFrame(data)
    if 'revenue' in df and 'expenses' in df:
        df['cash_flow'] = df['revenue'] - df['expenses']
        cash_flow = df['cash_flow'].sum()
        risk_score = df['cash_flow'].std()
    else:
        cash_flow = 0
        risk_score = 0
    return {'cash_flow': float(cash_flow), 'risk_score': float(risk_score)}

import sys
import json

if __name__ == "__main__":
    data_path = sys.argv[1]
    with open(data_path, 'r') as f:
        data = json.load(f)
    result = finance_analysis(data)
    print(json.dumps(result)) 