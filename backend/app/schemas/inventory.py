from pydantic import BaseModel, ConfigDict, Field

class InventoryCreate(BaseModel):
    product_id: int
    warehouse_id: int
    available_quantity: int = Field(default=0, ge=0)

class InventoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    warehouse_id: int
    available_quantity: int