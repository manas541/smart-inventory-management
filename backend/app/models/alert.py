
from sqlalchemy import (
    Column, Integer, String, ForeignKey,
    DateTime, Text, CheckConstraint
)
from sqlalchemy.sql import func

from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    __table_args__ = (
        CheckConstraint(
            "alert_type IN ('LOW_STOCK', 'FAST_DEPLETION')",
            name="check_alert_type"
        ),
        CheckConstraint(
            "severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')",
            name="check_alert_severity"
        ),
        CheckConstraint(
            "status IN ('ACTIVE', 'RESOLVED')",
            name="check_alert_status"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    warehouse_id = Column(
        Integer,
        ForeignKey("warehouses.id"),
        nullable=False
    )

    alert_type = Column(String(30), nullable=False)

    message = Column(Text, nullable=False)

    severity = Column(String(20), nullable=False)

    status = Column(
        String(20),
        nullable=False,
        default="ACTIVE"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    resolved_at = Column(DateTime(timezone=True), nullable=True)
