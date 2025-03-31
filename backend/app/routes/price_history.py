from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models import PriceHistory
from app.schemas import PriceHistory as PriceHistorySchema
from app.database import SessionLocal
from app.database import get_db

router = APIRouter(prefix="/price-history", tags=["price-history"])



@router.get("/", response_model=list[PriceHistorySchema])
def read_price_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(PriceHistory).offset(skip).limit(limit).all()

@router.get("/product/{product_id}", response_model=list[PriceHistorySchema])
def read_price_history_for_product(product_id: int, db: Session = Depends(get_db)):
    return db.query(PriceHistory).filter(PriceHistory.product_id == product_id).order_by(PriceHistory.recorded_at.desc()).all()
