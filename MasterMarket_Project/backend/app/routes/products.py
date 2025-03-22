from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, database

router = APIRouter(prefix="/products", tags=["products"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()
