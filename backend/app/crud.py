from sqlalchemy.orm import Session
from app.models import Price, PriceHistory, Product, Basket
from app.schemas import PriceCreate, PriceUpdate, ProductCreate, ProductUpdate, BasketCreate, BasketUpdate
from datetime import datetime
from app.models import User
from app.schemas import UserCreate
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.models import Price

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

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user