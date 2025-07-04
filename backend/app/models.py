# app/models.py
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for Google OAuth users
    full_name = Column(String, nullable=True)
    location = Column(String, nullable=True)  # User's location/area
    country = Column(String, nullable=True, default="UK")  # User's country
    currency = Column(String, nullable=True, default="GBP")  # User's preferred currency
    
    # Google OAuth fields
    google_id = Column(String, unique=True, nullable=True)  # Google user ID
    avatar_url = Column(String, nullable=True)  # Profile picture URL
    provider = Column(String, default="email")  # "email" or "google"

    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    role = Column(String, default="user")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    submitted_prices = relationship("CommunityPrice", back_populates="submitted_by")
    price_votes = relationship("PriceVote", back_populates="user")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    category = Column(String)
    brand = Column(String, nullable=True)
    quantity = Column(Integer)
    image_url = Column(String)
    barcode = Column(String, index=True)
    
    # Define relationshwith GenericProduct
    generic_product_id = Column(Integer, ForeignKey("generic_products.id"), nullable=True)
    generic_product = relationship("GenericProduct", back_populates="products")

#new table for generic products
class GenericProduct(Base):
    __tablename__ = "generic_products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    category = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    # Si quieres agregar más campos genéricos, aquí van

    # Relación reversa
    products = relationship("Product", back_populates="generic_product")

class Price(Base):
    __tablename__ = "prices"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"))
    supermarket = Column(String)
    price = Column(Float)
    updated_at = Column(DateTime, default=datetime.utcnow)
    product = relationship("Product", backref="prices")

class PriceHistory(Base):
    __tablename__ = "price_history"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    supermarket = Column(String)
    price = Column(Float)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    product = relationship("Product", backref="price_history")

class Basket(Base):
    __tablename__ = "basket"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    added_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product")

class CommunityPrice(Base):
    __tablename__ = "community_prices"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    store_name = Column(String, nullable=False)
    store_location = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    price_photo_url = Column(String, nullable=True)  # S3 URL for price tag photo
    currency = Column(String, default="GBP")
    country = Column(String, default="UK")  # Country where price was submitted
    
    # Voting statistics
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    verification_status = Column(String, default="pending")  # pending, verified, disputed
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    product = relationship("Product", backref="community_prices")
    submitted_by = relationship("User", back_populates="submitted_prices")
    votes = relationship("PriceVote", back_populates="price", cascade="all, delete-orphan")

class PriceVote(Base):
    __tablename__ = "price_votes"
    
    id = Column(Integer, primary_key=True, index=True)
    price_id = Column(Integer, ForeignKey("community_prices.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    vote_type = Column(String, nullable=False)  # 'upvote' or 'downvote'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Unique constraint to prevent multiple votes from same user on same price
    __table_args__ = (
        UniqueConstraint('price_id', 'user_id', name='unique_user_price_vote'),
    )
    
    # Relationships
    price = relationship("CommunityPrice", back_populates="votes")
    user = relationship("User", back_populates="price_votes")

class Store(Base):
    __tablename__ = "stores"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    chain = Column(String, nullable=False)  # e.g., "Tesco", "ASDA", "Sainsbury's"
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    postcode = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Store features
    opening_hours = Column(String, nullable=True)  # JSON string for now
    phone = Column(String, nullable=True)
    website = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

