from pydantic import BaseModel, ConfigDict
from typing import Optional

class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    warehouse_id: int
    alert_type: str
    message: str
    severity: str
    status: str