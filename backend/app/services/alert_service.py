from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.inventory import Inventory
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.models.alert import Alert


def evaluate_inventory_alerts(
    db: Session,
    inventory: Inventory
):
    product = db.query(Product).filter(
        Product.id == inventory.product_id
    ).first()

    if not product:
        return []

    generated_alerts = []

    # Rule 1: Low stock
    low_stock_alert = db.query(Alert).filter(
        Alert.product_id == inventory.product_id,
        Alert.warehouse_id == inventory.warehouse_id,
        Alert.alert_type == "LOW_STOCK",
        Alert.status == "ACTIVE"
    ).first()

    if inventory.available_quantity <= product.minimum_stock:
        if not low_stock_alert:
            alert = Alert(
                product_id=inventory.product_id,
                warehouse_id=inventory.warehouse_id,
                alert_type="LOW_STOCK",
                message=(
                    f"{product.name} is running low. "
                    f"Available stock: {inventory.available_quantity}"
                ),
                severity="HIGH",
                status="ACTIVE"
            )
            db.add(alert)
            generated_alerts.append(alert)

    elif low_stock_alert:
        low_stock_alert.status = "RESOLVED"
        low_stock_alert.resolved_at = datetime.now(timezone.utc)

    
    # Rule 2: Fast depletion
    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)

    recent_outbound = db.query(
        func.coalesce(func.sum(StockMovement.quantity), 0)
    ).filter(
        StockMovement.product_id == inventory.product_id,
        StockMovement.warehouse_id == inventory.warehouse_id,
        StockMovement.movement_type == "OUTBOUND",
        StockMovement.created_at >= one_hour_ago
    ).scalar()

    existing_fast_alert = db.query(Alert).filter(
        Alert.product_id == inventory.product_id,
        Alert.warehouse_id == inventory.warehouse_id,
        Alert.alert_type == "FAST_DEPLETION",
        Alert.status == "ACTIVE"
    ).first()


    if recent_outbound >= 30:
        if not existing_fast_alert:
            alert = Alert(
                product_id=inventory.product_id,
                warehouse_id=inventory.warehouse_id,
                alert_type="FAST_DEPLETION",
                message=(
                    f"{product.name} is depleting quickly. "
                    f"{recent_outbound} units moved out in the last hour."
                ),
                severity="MEDIUM",
                status="ACTIVE"
            )
            db.add(alert)
            generated_alerts.append(alert)

    elif existing_fast_alert:

        print("RESOLVING FAST DEPLETION ALERT")
        existing_fast_alert.status = "RESOLVED"
        existing_fast_alert.resolved_at = datetime.now(timezone.utc)


    db.flush()
    return generated_alerts