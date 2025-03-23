from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud
from app.schemas import Basket, BasketCreate, BasketUpdate
from app.database import SessionLocal

router = APIRouter(prefix="/basket", tags=["basket"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=list[Basket])
def read_baskets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_baskets(db, skip=skip, limit=limit)

@router.get("/{basket_id}", response_model=Basket)
def read_basket(basket_id: int, db: Session = Depends(get_db)):
    db_basket = crud.get_basket(db, basket_id)
    if db_basket is None:
        raise HTTPException(status_code=404, detail="Basket not found")
    return db_basket

@router.post("/", response_model=Basket)
def create_basket(basket: BasketCreate, db: Session = Depends(get_db)):
    return crud.create_basket(db, basket)

@router.put("/{basket_id}", response_model=Basket)
def update_basket(basket_id: int, basket: BasketUpdate, db: Session = Depends(get_db)):
    db_basket = crud.update_basket(db, basket_id, basket)
    if db_basket is None:
        raise HTTPException(status_code=404, detail="Basket not found")
    return db_basket

@router.delete("/{basket_id}", response_model=Basket)
def delete_basket(basket_id: int, db: Session = Depends(get_db)):
    db_basket = crud.delete_basket(db, basket_id)
    if db_basket is None:
        raise HTTPException(status_code=404, detail="Basket not found")
    return db_basket
