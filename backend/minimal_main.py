#!/usr/bin/env python3
"""
Minimal main app to test server startup
"""

from fastapi import FastAPI
from api.routers.financial import router as financial_router
import uvicorn

app = FastAPI(title="Minimal Test")

# Include the financial router
app.include_router(financial_router)

@app.get("/test")
def test():
    return {"message": "Minimal server working"}

if __name__ == "__main__":
    print("Starting minimal server with financial router...")
    uvicorn.run(app, host="127.0.0.1", port=8003) 