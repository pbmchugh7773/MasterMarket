#from fastapi import APIRouter, Depends
#from sqlalchemy.orm import Session
from .. import models, database

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud
from app.schemas import Product, ProductCreate, ProductUpdate
from app.database import SessionLocal
print("✅ Se cargó el router de productos")

router = APIRouter(prefix="/products", tags=["products"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

#@router.get("/")
#def get_products(db: Session = Depends(get_db)):
#    return db.query(models.Product).all()
@router.get("/", response_model=list[Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_products(db, skip=skip, limit=limit)

@router.get("/{product_id}", response_model=Product)
def read_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud.get_product(db, product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.post("/", response_model=Product)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db, product)

@router.put("/{product_id}", response_model=Product)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    db_product = crud.update_product(db, product_id, product)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.delete("/{product_id}", response_model=Product)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud.delete_product(db, product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product
