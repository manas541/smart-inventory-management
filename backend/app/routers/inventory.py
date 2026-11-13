
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.warehouse import Warehouse
from app.models.stock_movement import StockMovement
from app.schemas.inventory import InventoryCreate, InventoryResponse
from app.schemas.stock_movement import StockMovementCreate
from app.services.alert_service import evaluate_inventory_alerts
from app.realtime.websocket_manager import manager
from sqlalchemy import desc
from app.models.stock_movement import StockMovement
from app.schemas.stock_movement import StockMovementResponse

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])


@router.post("/", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
def create_inventory(payload: InventoryCreate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    warehouse = db.query(Warehouse).filter(Warehouse.id == payload.warehouse_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    inventory = Inventory(**payload.model_dump())
    db.add(inventory)

    try:
        db.commit()
        db.refresh(inventory)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Inventory already exists for this product and warehouse"
        )

    return inventory

@router.get("/movements", response_model=list[StockMovementResponse])
def get_stock_movements(db: Session = Depends(get_db)):
    return (
        db.query(StockMovement)
        .order_by(desc(StockMovement.created_at))
        .all()
    )


@router.get("/", response_model=list[InventoryResponse])
def list_inventory(db: Session = Depends(get_db)):
    return db.query(Inventory).order_by(Inventory.id.desc()).all()


@router.post("/{inventory_id}/movement")
async def create_stock_movement(
    inventory_id: int,
    payload: StockMovementCreate,
    db: Session = Depends(get_db)
):
    try:
        inventory = (
            db.query(Inventory)
            .filter(Inventory.id == inventory_id)
            .with_for_update()
            .first()
        )

        if not inventory:
            raise HTTPException(status_code=404, detail="Inventory not found")

        if (
            payload.movement_type == "OUTBOUND"
            and inventory.available_quantity < payload.quantity
        ):
            raise HTTPException(status_code=409, detail="Insufficient stock")

        if payload.movement_type == "INBOUND":
            inventory.available_quantity += payload.quantity
        else:
            inventory.available_quantity -= payload.quantity

        movement = StockMovement(
            product_id=inventory.product_id,
            warehouse_id=inventory.warehouse_id,
            movement_type=payload.movement_type,
            quantity=payload.quantity
        )

        db.add(movement)
        db.flush()

        generated_alerts = evaluate_inventory_alerts(db, inventory)

        db.commit()
        db.refresh(inventory)

        for alert in generated_alerts:
            await manager.broadcast({
    "event": "INVENTORY_UPDATED",
    "inventory_id": inventory.id,
    "product_id": inventory.product_id,
    "warehouse_id": inventory.warehouse_id,
    "available_quantity": inventory.available_quantity,
    "alerts": [
        {
            "id": alert.id,
            "type": alert.alert_type,
            "message": alert.message,
            "severity": alert.severity
        }
        for alert in generated_alerts
    ]
})

        return {
            "message": "Stock movement recorded successfully",
            "movement_type": payload.movement_type,
            "quantity": payload.quantity,
            "available_quantity": inventory.available_quantity,
            "alerts": [
                {
                    "id": alert.id,
                    "type": alert.alert_type,
                    "message": alert.message,
                    "severity": alert.severity
                }
                for alert in generated_alerts
            ]
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


