# app/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    quantity = Column(Integer)
    image_url = Column(String)
    # Define relationships if needed

class Price(Base):
    __tablename__ = "prices"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
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
