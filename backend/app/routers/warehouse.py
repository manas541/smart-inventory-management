
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.warehouse import Warehouse
from app.models.inventory import Inventory
from app.models.stock_movement import StockMovement
from app.models.alert import Alert
from app.schemas.warehouse import (
    WarehouseCreate,
    WarehouseUpdate,
    WarehouseResponse,
)

router = APIRouter(prefix="/api/warehouses", tags=["Warehouses"])


@router.post(
    "/",
    response_model=WarehouseResponse,
    status_code=status.HTTP_201_CREATED
)
def create_warehouse(
    payload: WarehouseCreate,
    db: Session = Depends(get_db)
):
    warehouse = Warehouse(**payload.model_dump())

    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)

    return warehouse


@router.get("/", response_model=list[WarehouseResponse])
def list_warehouses(db: Session = Depends(get_db)):
    return db.query(Warehouse).order_by(
        Warehouse.id.desc()
    ).all()


@router.patch("/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(
    warehouse_id: int,
    payload: WarehouseUpdate,
    db: Session = Depends(get_db)
):
    warehouse = db.query(Warehouse).filter(
        Warehouse.id == warehouse_id
    ).first()

    if not warehouse:
        raise HTTPException(
            status_code=404,
            detail="Warehouse not found"
        )

    updates = payload.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No fields provided"
        )

    if any(value is None for value in updates.values()):
        raise HTTPException(
            status_code=422,
            detail="Fields cannot be null"
        )

    for key, value in updates.items():
        setattr(warehouse, key, value)

    try:
        db.commit()
        db.refresh(warehouse)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Warehouse update conflict"
        )

    return warehouse


@router.delete("/{warehouse_id}")
def delete_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db)
):
    warehouse = db.query(Warehouse).filter(
        Warehouse.id == warehouse_id
    ).first()

    if not warehouse:
        raise HTTPException(
            status_code=404,
            detail="Warehouse not found"
        )

    has_inventory = db.query(Inventory).filter(
        Inventory.warehouse_id == warehouse_id
    ).first()

    has_movements = db.query(StockMovement).filter(
        StockMovement.warehouse_id == warehouse_id
    ).first()

    has_alerts = db.query(Alert).filter(
        Alert.warehouse_id == warehouse_id
    ).first()

    if has_inventory or has_movements or has_alerts:
        raise HTTPException(
            status_code=409,
            detail=(
                "Cannot delete warehouse because inventory records, "
                "stock movement history, or alert history exist."
            )
        )

    db.delete(warehouse)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Warehouse cannot be deleted because related records exist."
        )

    return {"message": "Warehouse deleted successfully"}
