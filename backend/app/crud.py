from sqlalchemy.orm import Session
from app.models import Price, PriceHistory, Product, Basket, GenericProduct, CommunityPrice, PriceVote
from app.schemas import PriceCreate, PriceUpdate, ProductCreate, ProductUpdate, BasketCreate, BasketUpdate, ProductSummaryResponse, ProductSummaryItem, CommunityPriceCreate, CommunityPriceUpdate, PriceVoteCreate
from datetime import datetime, timezone
from app.models import User
from app.schemas import UserCreate, UserUpdate, ProductOrGenericOut
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.models import Price
from . import models, schemas

# ---------- PRICE ----------

def create_price(db: Session, price: PriceCreate):
    existing = db.query(Price).filter_by(
        product_id=price.product_id,
        supermarket=price.supermarket
    ).first()

    if existing:
        # Guardar el precio anterior en PriceHistory
        history = PriceHistory(
            product_id=existing.product_id,
            supermarket=existing.supermarket,
            price=existing.price,
            recorded_at=existing.updated_at  # o datetime.utcnow() si preferís
        )
        db.add(history)

        # Actualizar el precio actual
        existing.price = price.price
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Crear nuevo precio si no existía
        new_price = Price(
            product_id=price.product_id,
            supermarket=price.supermarket,
            price=price.price,
            updated_at=datetime.now(timezone.utc)
        )
        db.add(new_price)
        db.commit()
        db.refresh(new_price)
        return new_price

def update_price(db: Session, price_id: int, new_price: float):
    db_price = db.query(Price).filter(Price.id == price_id).first()
    if not db_price:
        return None
    db_price.price = new_price
    db_price.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_price)
    return db_price

def get_prices_by_product_id(db: Session, product_id: int):
    return db.query(Price).filter(Price.product_id == product_id).all()

def get_prices(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Price).offset(skip).limit(limit).all()
    

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
    # Handle password for regular and OAuth users
    hashed_password = None
    if user.password:
        hashed_password = get_password_hash(user.password)
    
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        is_premium=user.is_premium,
        location=user.location,
        country=user.country,
        currency=user.currency,
        provider="email"  # Default provider for regular registration
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
    
    # Check if user is OAuth user (no password)
    if user.provider == "google" and not user.hashed_password:
        return None  # OAuth users can't login with password
    
    if not user.hashed_password or not verify_password(password, user.hashed_password):
        return None
    return user

# ----------- Consultar usuario -----------

def get_user_by_email(db: Session, email: str) -> models.User:
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
# Busca producto y precio tanto si es producto o generico
def get_product_summary(db: Session, product_id: int) -> ProductSummaryResponse:
    product = db.query(Product).filter(Product.id == product_id).first()

    if product:
        # Si el producto tiene un genérico asociado y es distinto de 0/null
        if product.generic_product_id not in (None, 0):
            generic_id = product.generic_product_id
            generic = db.query(GenericProduct).filter(GenericProduct.id == generic_id).first()
            if not generic:
                return None
            products = db.query(Product).filter(Product.generic_product_id == generic_id).all()
            product_summaries = []
            for p in products:
                price_obj = (
                    db.query(Price)
                    .filter(Price.product_id == p.id)
                    .order_by(Price.updated_at.desc())
                    .first()
                )
                product_summaries.append(ProductSummaryItem(
                    id=p.id,
                    name=p.name,
                    brand=p.brand,
                    barcode=p.barcode,
                    image_url=p.image_url,
                    supermarket=price_obj.supermarket,  # Cambia aquí si tienes otro campo para supermarket
                    last_price=price_obj.price if price_obj else None
                ))
            return ProductSummaryResponse(
                id=generic.id,
                name=generic.name,
                category=generic.category,
                image_url=generic.image_url,
                products=product_summaries
            )
        else:
            # Producto simple (sin genérico asociado)
            prices = db.query(Price).filter(Price.product_id == product.id).all()
            product_summaries = []
            for price_obj in prices:
                product_summaries.append(ProductSummaryItem(
                    id=product.id,
                    name=product.name,
                    brand=product.brand,
                    barcode=product.barcode,
                    image_url=product.image_url,
                    supermarket=price_obj.supermarket,
                    last_price=price_obj.price
                ))
            return ProductSummaryResponse(
                id=product.id,
                name=product.name,
                category=product.category,
                image_url=product.image_url,
                products=product_summaries
            )

    # Si no existe el producto, busca el genérico por ese ID
    generic = db.query(GenericProduct).filter(GenericProduct.id == product_id).first()
    if generic:
        products = db.query(Product).filter(Product.generic_product_id == generic.id).all()
        product_summaries = []
        for p in products:
            price_obj = (
                db.query(Price)
                .filter(Price.product_id == p.id)
                .order_by(Price.updated_at.desc())
                .first()
            )
            product_summaries.append(ProductSummaryItem(
                id=p.id,
                name=p.name,
                brand=p.brand,
                barcode=p.barcode,
                image_url=p.image_url,
                supermarket=price_obj.supermarket,  # Cambia aquí si tienes otro campo para supermarket
                last_price=price_obj.price if price_obj else None
            ))
        return ProductSummaryResponse(
            id=generic.id,
            name=generic.name,
            category=generic.category,
            image_url=generic.image_url,
            products=product_summaries
        )
    # Si no existe ni producto ni genérico, devuelve None (404 en el endpoint)
    return None



def get_all_simple_products(db: Session) -> list[ProductOrGenericOut]:
    # Productos sin genérico
    simple_products = db.query(Product).filter(Product.generic_product_id == None).all()
    # Genéricos
    generic_products = db.query(GenericProduct).all()
    all_products = []

    for p in simple_products:
        all_products.append(ProductOrGenericOut(
            id=p.id,
            name=p.name,
            description=p.description,
            category=p.category,
            brand=p.brand,
            quantity=p.quantity,
            image_url=p.image_url,
            barcode=p.barcode
        ))

    for g in generic_products:
        all_products.append(ProductOrGenericOut(
            id=g.id,
            name=g.name,
            description=g.description,         # GenericProduct no tiene descripción
            category=g.category,
            brand="",
            quantity=None,
            image_url=g.image_url,
            barcode=""
        ))

    return all_products

# ---------- COMMUNITY PRICE ----------

def create_community_price(db: Session, price: CommunityPriceCreate, user_id: int):
    db_community_price = CommunityPrice(
        product_id=price.product_id,
        user_id=user_id,
        store_name=price.store_name,
        store_location=price.store_location,
        price=price.price,
        price_photo_url=price.price_photo_url,
        currency=price.currency
    )
    db.add(db_community_price)
    db.commit()
    db.refresh(db_community_price)
    return db_community_price

def get_community_price(db: Session, price_id: int):
    return db.query(CommunityPrice).filter(CommunityPrice.id == price_id).first()

def get_community_prices_by_product(db: Session, product_id: int, skip: int = 0, limit: int = 100):
    return db.query(CommunityPrice).filter(
        CommunityPrice.product_id == product_id
    ).offset(skip).limit(limit).all()

def update_community_price(db: Session, price_id: int, price_update: CommunityPriceUpdate):
    db_price = db.query(CommunityPrice).filter(CommunityPrice.id == price_id).first()
    if not db_price:
        return None
    
    update_data = price_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_price, key, value)
    
    db.commit()
    db.refresh(db_price)
    return db_price

def delete_community_price(db: Session, price_id: int):
    db_price = db.query(CommunityPrice).filter(CommunityPrice.id == price_id).first()
    if not db_price:
        return None
    db.delete(db_price)
    db.commit()
    return db_price

# ---------- PRICE VOTE ----------

def create_price_vote(db: Session, vote: PriceVoteCreate, user_id: int):
    db_vote = PriceVote(
        price_id=vote.price_id,
        user_id=user_id,
        vote_type=vote.vote_type
    )
    db.add(db_vote)
    db.commit()
    db.refresh(db_vote)
    return db_vote

def get_price_vote(db: Session, price_id: int, user_id: int):
    return db.query(PriceVote).filter(
        PriceVote.price_id == price_id,
        PriceVote.user_id == user_id
    ).first()

def update_price_vote(db: Session, price_id: int, user_id: int, vote_type: str):
    db_vote = db.query(PriceVote).filter(
        PriceVote.price_id == price_id,
        PriceVote.user_id == user_id
    ).first()
    if not db_vote:
        return None
    db_vote.vote_type = vote_type
    db.commit()
    db.refresh(db_vote)
    return db_vote

def delete_price_vote(db: Session, price_id: int, user_id: int):
    db_vote = db.query(PriceVote).filter(
        PriceVote.price_id == price_id,
        PriceVote.user_id == user_id
    ).first()
    if not db_vote:
        return None
    db.delete(db_vote)
    db.commit()
    return db_vote

