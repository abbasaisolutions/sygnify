import pandas as pd
from sklearn.cluster import KMeans

def advertising_analysis(data):
    df = pd.DataFrame(data)
    avg_rating = df['ratings'].mean() if 'ratings' in df else 0
    if 'reviews' in df:
        X = df[['ratings']].values
        kmeans = KMeans(n_clusters=3)
        df['segment'] = kmeans.fit_predict(X)
        segments = df.groupby('segment')['ratings'].mean().to_dict()
    else:
        segments = {}
    return {'avg_rating': avg_rating, 'segments': segments}

import sys
import json

if __name__ == "__main__":
    data_path = sys.argv[1]
    with open(data_path, 'r') as f:
        data = json.load(f)
    result = advertising_analysis(data)
    print(json.dumps(result))