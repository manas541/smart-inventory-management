from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.alert import Alert

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("/")
def list_alerts(db: Session = Depends(get_db)):
    return db.query(Alert).order_by(Alert.created_at.desc()).all()


@router.get("/active")
def active_alerts(db: Session = Depends(get_db)):
    return db.query(Alert).filter(
        Alert.status == "ACTIVE"
    ).order_by(Alert.created_at.desc()).all()