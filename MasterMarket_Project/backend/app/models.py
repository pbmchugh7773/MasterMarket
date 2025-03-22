from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from .database import Base

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    quantity = Column(Integer)
    image_url = Column(String)

class Price(Base):
    __tablename__ = "prices"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    supermarket = Column(String)
    price = Column(Float)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class PriceHistory(Base):  # Historical prices
    __tablename__ = "price_history"
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    supermarket = Column(String)
    price = Column(Float)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    subscription_type = Column(String, default="free")

class Basket(Base):
    __tablename__ = "basket"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
