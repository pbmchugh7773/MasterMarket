# app/schemas.py
from pydantic import BaseModel
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
    quantity: int
    image_url: str

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    pass

class Product(ProductBase):
    id: int

    class Config:
        from_attributes = True

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

# SCHEMAS DE USUARIO



class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        from_attributes = True
