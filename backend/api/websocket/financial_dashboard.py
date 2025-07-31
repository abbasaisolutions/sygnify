from fastapi import WebSocket, WebSocketDisconnect
import asyncio

# Example: Real-time dashboard WebSocket handler
async def financial_dashboard_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        for i in range(10):
            # Send mock real-time dashboard data
            await websocket.send_json({
                "type": "dashboard_update",
                "kpi": {
                    "revenue": 100000 + i * 1000,
                    "expenses": 50000 + i * 500,
                    "profit": 50000 + i * 500,
                    "risk_score": 0.2 + i * 0.01
                },
                "progress": i * 10
            })
            await asyncio.sleep(1)
        await websocket.send_json({"type": "complete"})
    except WebSocketDisconnect:
        pass 