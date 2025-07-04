# app/schemas.py

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# ---------- Price ----------
class PriceCreate(BaseModel):
    product_id: int
    supermarket: str
    price: float

class PriceUpdate(BaseModel):
    price: float

class Price(BaseModel):
    id: int
    product_id: int
    supermarket: str
    price: float
    updated_at: datetime

    class Config:
        from_attributes = True

class ProductPrices(BaseModel):
    tesco: float
    aldi: float
    lidl: float

# ---------- PriceHistory ----------
class PriceHistory(BaseModel):
    id: int
    product_id: int
    supermarket: str
    price: float
    recorded_at: datetime

    class Config:
        from_attributes = True

# ---------- Product ----------
class ProductBase(BaseModel):
    name: str
    description: str
    category: str
    brand: Optional[str] = None
    quantity: int
    image_url: str
    barcode: str 

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    pass

class Product(ProductBase):
    id: int

    class Config:
        from_attributes = True

class ProductOrGenericOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = ""
    category: str
    brand: Optional[str] = ""
    quantity: Optional[int] = None
    image_url: Optional[str] = None
    barcode: Optional[str] = ""

class ProductSummaryItem(BaseModel):
    id: int
    name: str
    brand: Optional[str] = None
    barcode: str
    image_url: Optional[str] = None
    supermarket: Optional[str] = None
    last_price: Optional[float] = None

class ProductSummaryResponse(BaseModel):
    id: int
    name: str
    category: str
    image_url: Optional[str] = None
    products: List[ProductSummaryItem]

# ---------- Basket ----------
class BasketBase(BaseModel):
    user_id: int
    product_id: int
    quantity: int

class BasketCreate(BasketBase):
    pass

class BasketUpdate(BasketBase):
    pass

class Basket(BasketBase):
    id: int
    added_at: datetime

    class Config:
        from_attributes = True


class PriceCreate(BaseModel):
    product_id: int
    supermarket: str
    price: float

class PriceUpdate(BaseModel):
    price: float

class Price(BaseModel):
    id: int
    product_id: int
    supermarket: str
    price: float
    updated_at: datetime

    class Config:
       from_attributes = True

class PriceHistory(BaseModel):
    id: int
    product_id: int
    supermarket: str
    price: float
    recorded_at: datetime

    class Config:
        from_attributes = True
# Nuevo codigo



class BasketBase(BaseModel):
    user_id: int
    product_id: int
    quantity: int

class BasketCreate(BasketBase):
    pass

class BasketUpdate(BasketBase):
    pass

class Basket(BasketBase):
    id: int
    added_at: datetime

    class Config:
        from_attributes = True

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# ----------- Entrada: Registro -----------

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    is_premium: Optional[bool] = False

# ----------- Entrada: Login -----------

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# ----------- Salida: Perfil del usuario -----------

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool
    is_premium: bool
    created_at: datetime

    class Config:
        orm_mode = True

# ----------- Entrada: Actualizar perfil -----------

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    is_premium: Optional[bool] = None
    is_active: Optional[bool] = None
