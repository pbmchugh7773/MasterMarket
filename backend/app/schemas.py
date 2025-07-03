# app/schemas.py

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# ---------- User ----------
class UserCreate(BaseModel):
    email: EmailStr
    password: Optional[str] = None  # Optional for Google OAuth
    full_name: Optional[str] = None
    is_premium: Optional[bool] = False
    location: Optional[str] = None
    country: Optional[str] = "UK"
    currency: Optional[str] = "GBP"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleOAuthCreate(BaseModel):
    email: EmailStr
    full_name: str
    google_id: str
    avatar_url: Optional[str] = None
    country: Optional[str] = "UK"
    currency: Optional[str] = "GBP"

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool
    is_premium: bool
    location: Optional[str] = None
    country: Optional[str] = None
    currency: Optional[str] = None
    avatar_url: Optional[str] = None
    provider: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    is_premium: Optional[bool] = None
    is_active: Optional[bool] = None
    location: Optional[str] = None
    country: Optional[str] = None
    currency: Optional[str] = None

# ---------- Product ----------
class ProductBase(BaseModel):
    name: str
    description: str
    category: str
    brand: Optional[str] = None
    quantity: Optional[int] = None
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

# ---------- Community Price ----------
class CommunityPriceCreate(BaseModel):
    product_id: int
    store_name: str
    store_location: str
    price: float
    price_photo_url: Optional[str] = None
    currency: Optional[str] = "GBP"

class CommunityPriceUpdate(BaseModel):
    store_name: Optional[str] = None
    store_location: Optional[str] = None
    price: Optional[float] = None
    verification_status: Optional[str] = None

class CommunityPrice(BaseModel):
    id: int
    product_id: int
    user_id: int
    store_name: str
    store_location: str
    price: float
    price_photo_url: Optional[str] = None
    currency: str
    upvotes: int
    downvotes: int
    verification_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Nested data
    submitted_by: Optional[UserOut] = None
    product: Optional[Product] = None

    class Config:
        from_attributes = True

class CommunityPriceResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    store_name: str
    store_location: str
    price: float
    price_photo_url: Optional[str] = None
    currency: str
    upvotes: int
    downvotes: int
    verification_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CommunityPriceWithVotes(CommunityPrice):
    user_vote: Optional[str] = None  # 'upvote', 'downvote', or None

class CommunityPriceWithChange(BaseModel):
    id: int
    product_id: int
    user_id: int
    store_name: str
    store_location: str
    price: float
    price_photo_url: Optional[str] = None
    currency: str
    upvotes: int
    downvotes: int
    verification_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    user_vote: Optional[str] = None
    price_change_percentage: Optional[float] = None  # Percentage change from previous price
    previous_price: Optional[float] = None

    class Config:
        from_attributes = True

class TrendingPriceWithProduct(BaseModel):
    id: int
    product_id: int
    user_id: int
    store_name: str
    store_location: str
    price: float
    price_photo_url: Optional[str] = None
    currency: str
    upvotes: int
    downvotes: int
    verification_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    product_name: str
    product_image_url: Optional[str] = None

    class Config:
        from_attributes = True

# ---------- Price Vote ----------
class PriceVoteCreate(BaseModel):
    price_id: int
    vote_type: str  # 'upvote' or 'downvote'

class PriceVote(BaseModel):
    id: int
    price_id: int
    user_id: int
    vote_type: str
    created_at: datetime

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

# ---------- Barcode Search ----------
class BarcodeSearchResponse(BaseModel):
    found: bool
    product: Optional[Product] = None
    message: Optional[str] = None

# ---------- Price Photo Upload ----------
class PricePhotoUploadResponse(BaseModel):
    success: bool
    photo_url: Optional[str] = None
    extracted_price: Optional[float] = None
    message: Optional[str] = None

# ---------- Store ----------
class StoreBase(BaseModel):
    name: str
    chain: str
    address: str
    city: str
    postcode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    opening_hours: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None

class StoreCreate(StoreBase):
    pass

class Store(StoreBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class StoreWithDistance(Store):
    distance_km: Optional[float] = None

