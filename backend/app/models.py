# app/models.py
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)

    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    role = Column(String, default="user")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

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
