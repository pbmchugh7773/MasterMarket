from fastapi import FastAPI
from .database import engine, Base
from .routes import products
from . import models

# Automatically create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Include your API routes
app.include_router(products.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to MasterMarket!"}
