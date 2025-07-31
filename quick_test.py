#!/usr/bin/env python3
import requests

# Test upload
files = {'file': ('test.csv', 'Date,Open,High\n2024-01-01,100,102\n2024-01-02,101,103', 'text/csv')}
data = {'domain': 'financial'}

response = requests.post('http://127.0.0.1:8000/financial/upload', files=files, data=data)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}") 