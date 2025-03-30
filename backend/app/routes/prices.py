from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.schemas import Price, PriceCreate, PriceUpdate
import app.crud as price_crud


router = APIRouter(prefix="/prices", tags=["prices"])

# Dependencia para obtener la sesión de base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# GET /prices/ → listar precios
@router.get("/", response_model=list[Price])
def read_prices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return price_crud.get_prices(db, skip=skip, limit=limit)

# GET /prices/{price_id} → obtener precio por ID
@router.get("/{price_id}", response_model=Price)
def read_price(price_id: int, db: Session = Depends(get_db)):
    db_price = price_crud.get_price(db, price_id=price_id)
    if db_price is None:
        raise HTTPException(status_code=404, detail="Price not found")
    return db_price

# GET /prices/product/{product_id} → obtener precios por ID de producto
@router.get("/product/{product_id}", response_model=list[Price])
def read_prices_by_product(product_id: int, db: Session = Depends(get_db)):
    prices = price_crud.get_prices_by_product_id(db, product_id=product_id)
    if not prices:
        raise HTTPException(status_code=404, detail="No prices found for this product")
    return prices
