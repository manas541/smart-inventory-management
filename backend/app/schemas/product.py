from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

class ProductCreate(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    minimum_stock: int = Field(default=10, ge=0)

class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sku: str
    description: Optional[str]
    minimum_stock: int