
from sqlalchemy import (
    Column, Integer, String, ForeignKey,
    DateTime, CheckConstraint
)
from sqlalchemy.sql import func

from app.database import Base


class StockMovement(Base):
    __tablename__ = "stock_movements"

    __table_args__ = (
        CheckConstraint(
            "quantity > 0",
            name="check_movement_quantity_positive"
        ),
        CheckConstraint(
            "movement_type IN ('INBOUND', 'OUTBOUND')",
            name="check_movement_type"
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

    movement_type = Column(String(20), nullable=False)

    quantity = Column(Integer, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
