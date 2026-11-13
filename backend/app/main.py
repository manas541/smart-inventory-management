import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from app.routers.product import router as product_router
from app.routers.warehouse import router as warehouse_router
from app.routers.inventory import router as inventory_router
from app.routers.alert import router as alert_router
from app.realtime.websocket_manager import manager
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.alert_scheduler import run_alert_evaluation

app = FastAPI(
    title="Smart Inventory Management API",
    description="Inventory tracking and low-stock alert system",
    version="1.0.0"
)

scheduler = AsyncIOScheduler()


@app.on_event("startup")
async def start_alert_scheduler():
    scheduler.add_job(
        run_alert_evaluation,
        trigger="interval",
        seconds=60,  # Temporary interval for testing
        id="inventory_alert_evaluation",
        replace_existing=True,
    )

    scheduler.start()
    print("Inventory alert scheduler started.")


@app.on_event("shutdown")
async def stop_alert_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("Inventory alert scheduler stopped.")

allowed_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Smart Inventory Management API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.websocket("/ws/inventory")
async def inventory_websocket(websocket: WebSocket):
    await manager.connect(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


app.include_router(product_router)
app.include_router(warehouse_router)
app.include_router(inventory_router)
app.include_router(alert_router)
