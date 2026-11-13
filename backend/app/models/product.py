
from sqlalchemy import Column, Integer, String, Text, DateTime, CheckConstraint
from sqlalchemy.sql import func

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    __table_args__ = (
        CheckConstraint(
            "minimum_stock >= 0",
            name="check_minimum_stock_non_negative"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(150), nullable=False)

    sku = Column(String(50), unique=True, nullable=False, index=True)

    description = Column(Text, nullable=True)

    minimum_stock = Column(Integer, nullable=False, default=10)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
