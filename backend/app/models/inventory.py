
from sqlalchemy import (
    Column, Integer, ForeignKey, DateTime,
    UniqueConstraint, CheckConstraint
)
from sqlalchemy.sql import func

from app.database import Base


class Inventory(Base):
    __tablename__ = "inventory"

    __table_args__ = (
        UniqueConstraint(
            "product_id",
            "warehouse_id",
            name="unique_product_warehouse"
        ),
        CheckConstraint(
            "available_quantity >= 0",
            name="check_available_quantity_non_negative"
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

    available_quantity = Column(
        Integer,
        nullable=False,
        default=0
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
