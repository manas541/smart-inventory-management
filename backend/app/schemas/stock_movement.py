from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import Literal


class StockMovementCreate(BaseModel):
    movement_type: Literal["INBOUND", "OUTBOUND"]
    quantity: int = Field(gt=0)


class StockMovementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    warehouse_id: int
    movement_type: str
    quantity: int
    created_at: datetime