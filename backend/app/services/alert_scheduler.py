
from app.database import SessionLocal
from app.models.inventory import Inventory
from app.models.alert import Alert
from app.services.alert_service import evaluate_inventory_alerts
from app.realtime.websocket_manager import manager


async def run_alert_evaluation():
    """
    Periodically reevaluate inventory alert conditions.
    Resolves alerts whose conditions are no longer true.
    """

    db = SessionLocal()

    try:
        # Capture active alert IDs before evaluation.
        active_before = {
            alert.id
            for alert in db.query(Alert)
            .filter(Alert.status == "ACTIVE")
            .all()
        }

        # Reevaluate every inventory record.
        inventory_records = db.query(Inventory).all()

        for inventory in inventory_records:
            evaluate_inventory_alerts(db, inventory)

        db.commit()

        # Capture active alert IDs after evaluation.
        active_after = {
            alert.id
            for alert in db.query(Alert)
            .filter(Alert.status == "ACTIVE")
            .all()
        }

        # Notify connected dashboard clients if alert state changed.
        if active_before != active_after:
            await manager.broadcast({
                "event": "ALERTS_UPDATED",
                "message": "Inventory alerts have been reevaluated."
            })

            print("Scheduled alert evaluation: alert status changed.")

    except Exception as exc:
        db.rollback()
        print(f"Scheduled alert evaluation failed: {exc}")

    finally:
        db.close()
