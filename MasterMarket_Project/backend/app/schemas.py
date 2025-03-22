from pydantic import BaseModel
from datetime import datetime

# Schema for creating a new price entry
class PriceCreate(BaseModel):
    product_id: int
    supermarket: str
    price: float

# Schema for updating an existing price entry
class PriceUpdate(BaseModel):
    price: float

# Schema for a full Price response (if needed)
class Price(BaseModel):
    id: int
    product_id: int
    supermarket: str
    price: float
    updated_at: datetime

    class Config:
        orm_mode = True

# Schema for historical price records
class PriceHistory(BaseModel):
    id: int
    product_id: int
    supermarket: str
    price: float
    recorded_at: datetime

    class Config:
        orm_mode = True
