print("🟢 main.py se está ejecutando desde el inicio")

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from app.schemas import PriceCreate, PriceUpdate, Price
from app import crud
from app.database import SessionLocal  # Database session dependency
from app.routes import products
from app.routes import basket
from app.routes import prices
from app.routes import price_history
from app.routes import users
from app.routes import routes_user
from app.routes import prices as price_routes


app = FastAPI()

# Dependency to get DB session for each request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # O usar ["http://localhost:8081"] para solo el frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(basket.router)
app.include_router(prices.router)
app.include_router(price_history.router)
app.include_router(users.router)
app.include_router(price_routes.router)
app.include_router(routes_user.router)




from app.models import Base
from app.database import engine

Base.metadata.create_all(bind=engine)



