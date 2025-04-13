from sqlalchemy.orm import Session
from app.models import Price, PriceHistory, Product, Basket
from app.schemas import PriceCreate, PriceUpdate, ProductCreate, ProductUpdate, BasketCreate, BasketUpdate
from datetime import datetime
from app.models import User
from app.schemas import UserCreate
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.models import Price
from . import models, schemas
from typing import Optional


# ---------- PRICE ----------

def create_price(db: Session, price: PriceCreate):
    db_price = Price(**price.dict())
    db.add(db_price)
    db.commit()
    db.refresh(db_price)
    return db_price

def update_price(db: Session, price_id: int, new_price: float):
    db_price = db.query(Price).filter(Price.id == price_id).first()
    if not db_price:
        return None
    db_price.price = new_price
    db_price.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_price)
    return db_price

def get_prices_by_product_id(db: Session, product_id: int):
    return db.query(Price).filter(Price.product_id == product_id).all()


# ---------- PRICE HISTORY ----------

def create_price_history(db: Session, price: PriceCreate, timestamp: datetime):
    db_price_history = PriceHistory(
        product_id=price.product_id,
        supermarket=price.supermarket,
        price=price.price,
        recorded_at=timestamp
    )
    db.add(db_price_history)
    db.commit()
    db.refresh(db_price_history)
    return db_price_history

# ---------- PRODUCT ----------

def get_product(db: Session, product_id: int):
    return db.query(Product).filter(Product.id == product_id).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Product).offset(skip).limit(limit).all()

def create_product(db: Session, product: ProductCreate):
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product: ProductUpdate):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        return None
    for key, value in product.dict().items():
        setattr(db_product, key, value)
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        return None
    db.delete(db_product)
    db.commit()
    return db_product

# ---------- BASKET ----------

def get_basket(db: Session, basket_id: int):
    return db.query(Basket).filter(Basket.id == basket_id).first()

def get_baskets(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Basket).offset(skip).limit(limit).all()

def create_basket(db: Session, basket: BasketCreate):
    db_basket = Basket(**basket.dict())
    db.add(db_basket)
    db.commit()
    db.refresh(db_basket)
    return db_basket

def update_basket(db: Session, basket_id: int, basket: BasketUpdate):
    db_basket = db.query(Basket).filter(Basket.id == basket_id).first()
    if not db_basket:
        return None
    for key, value in basket.dict().items():
        setattr(db_basket, key, value)
    db.commit()
    db.refresh(db_basket)
    return db_basket

def delete_basket(db: Session, basket_id: int):
    db_basket = db.query(Basket).filter(Basket.id == basket_id).first()
    if not db_basket:
        return None
    db.delete(db_basket)
    db.commit()
    return db_basket
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ---------- USER ----------

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ----------- Hasheo de contraseña -----------

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# ----------- Crear usuario -----------

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    db_user = models.User(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        full_name=user.full_name,
        is_premium=user.is_premium
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# ----------- Autenticar usuario -----------

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

# ----------- Consultar usuario -----------

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> models.User:
    return db.query(models.User).filter(models.User.id == user_id).first()

# ----------- Actualizar usuario -----------

def update_user(db: Session, user_id: int, update_data: dict) -> models.User:
    user = get_user_by_id(db, user_id)
    if not user:
        return None

    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user

