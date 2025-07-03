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
from app.routes import products_with_prices
from app.routes import admin
from app.models import Base
from app.database import engine
from app.routes import products_summary
from app.routes import community_prices
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()
os.makedirs("static/images", exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")


#Base.metadata.drop_all(bind=engine)
#Base.metadata.create_all(bind=engine)
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

app.include_router(products_with_prices.router)
app.include_router(products.router)
app.include_router(basket.router)
app.include_router(prices.router)
app.include_router(price_history.router)
app.include_router(price_routes.router)
app.include_router(users.router)
app.include_router(routes_user.router)
app.include_router(admin.router)
app.include_router(products_summary.router)
app.include_router(community_prices.router, prefix="/api/community-prices", tags=["community-prices"])










