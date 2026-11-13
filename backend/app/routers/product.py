
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.stock_movement import StockMovement
from app.models.alert import Alert
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
)

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.post(
    "/",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED
)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db)
):
    if db.query(Product).filter(Product.sku == payload.sku).first():
        raise HTTPException(
            status_code=409,
            detail="SKU already exists"
        )

    product = Product(**payload.model_dump())
    db.add(product)

    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="SKU already exists"
        )

    return product


@router.get("/", response_model=list[ProductResponse])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.id.desc()).all()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    updates = payload.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No fields provided"
        )

    if any(
        value is None
        for key, value in updates.items()
        if key != "description"
    ):
        raise HTTPException(
            status_code=422,
            detail="Required fields cannot be null"
        )

    if "sku" in updates:
        duplicate = db.query(Product).filter(
            Product.sku == updates["sku"],
            Product.id != product_id
        ).first()

        if duplicate:
            raise HTTPException(
                status_code=409,
                detail="SKU already exists"
            )

    for key, value in updates.items():
        setattr(product, key, value)

    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Product update conflict"
        )

    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    has_inventory = db.query(Inventory).filter(
        Inventory.product_id == product_id
    ).first()

    has_movements = db.query(StockMovement).filter(
        StockMovement.product_id == product_id
    ).first()

    has_alerts = db.query(Alert).filter(
        Alert.product_id == product_id
    ).first()

    if has_inventory or has_movements or has_alerts:
        raise HTTPException(
            status_code=409,
            detail=(
                "Cannot delete product because inventory records, "
                "stock movement history, or alert history exist."
            )
        )

    db.delete(product)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Product cannot be deleted because related records exist."
        )

    return {"message": "Product deleted successfully"}
