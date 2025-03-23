from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app import crud
from app.schemas import Price, PriceCreate, PriceUpdate
from app.database import SessionLocal

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
    return db.query(crud.Price).offset(skip).limit(limit).all()

# GET /prices/{price_id} → obtener precio por ID
@router.get("/{price_id}", response_model=Price)
def read_price(price_id: int, db: Session = Depends(get_db)):
    db_price = db.query(crud.Price).filter(crud.Price.id == price_id).first()
    if db_price is None:
        raise HTTPException(status_code=404, detail="Price not found")
    return db_price

# POST /prices/ → agregar nuevo precio y guardar historial
@router.post("/", response_model=Price)
def add_price(price_in: PriceCreate, db: Session = Depends(get_db)):
    try:
        current_price = crud.create_price(db, price_in)
        crud.create_price_history(db, price_in, datetime.utcnow())
    except Exception:
        raise HTTPException(status_code=500, detail="Error processing the price update")
    return current_price

# PUT /prices/{price_id} → actualizar precio y guardar historial
@router.put("/{price_id}", response_model=Price)
def update_price(price_id: int, price_update: PriceUpdate, db: Session = Depends(get_db)):
    updated_price = crud.update_price(db, price_id, price_update.price)
    if updated_price is None:
        raise HTTPException(status_code=404, detail="Price record not found")

    price_data = PriceCreate(
        product_id=updated_price.product_id,
        supermarket=updated_price.supermarket,
        price=price_update.price
    )
    crud.create_price_history(db, price_data, datetime.utcnow())
    return updated_price
