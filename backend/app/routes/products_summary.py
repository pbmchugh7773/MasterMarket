from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.crud import get_product_summary
from app.database import get_db
from app.schemas import ProductSummaryResponse

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/{product_id}/summary", response_model=ProductSummaryResponse)
def product_summary(product_id: int, db: Session = Depends(get_db)):
    summary = get_product_summary(db, product_id)
    if not summary:
        raise HTTPException(status_code=404, detail="Product not found")
    return summary
