print("🟢 main.py se está ejecutando desde el inicio")

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.schemas import PriceCreate, PriceUpdate, Price
from app import crud
from app.database import SessionLocal  # Database session dependency
from app.routes import products
from app.routes import basket
from app.routes import prices
from app.routes import price_history


app = FastAPI()

# Dependency to get DB session for each request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.include_router(products.router)
app.include_router(basket.router)
app.include_router(prices.router)
app.include_router(price_history.router)




from app.models import Base
from app.database import engine

Base.metadata.create_all(bind=engine)



