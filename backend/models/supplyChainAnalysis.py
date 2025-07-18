from prophet import Prophet
import pandas as pd

def supply_chain_analysis(data):
    df = pd.DataFrame(data)
    df_prophet = df[['date', 'sales']].rename(columns={'date': 'ds', 'sales': 'y'})
    model = Prophet()
    model.fit(df_prophet)
    future = model.make_future_dataframe(periods=90)
    forecast = model.predict(future)
    supplier_stats = df.groupby('supplier')['lead_time'].mean().to_dict()
    return {'forecast': forecast.to_dict(), 'supplier_stats': supplier_stats}

import sys
import json

if __name__ == "__main__":
    data_path = sys.argv[1]
    with open(data_path, 'r') as f:
        data = json.load(f)
    result = supply_chain_analysis(data)
    print(json.dumps(result))