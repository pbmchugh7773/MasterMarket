from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Product, Price

router = APIRouter()

@router.get("/products/with-prices")
def get_products_with_prices(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    result = []

    for product in products:
        prices = db.query(Price).filter(Price.product_id == product.id).all()

        # Extraer precios por supermercado
        price_map = {p.supermarket.lower(): p.price for p in prices}

        result.append({
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "category": product.category,
            "brand": product.brand,
            "quantity": product.quantity,
            "image_url": product.image_url,
            "barcode": product.barcode,
            "precio_lidl": price_map.get("lidl") or 0,
            "precio_tesco": price_map.get("tesco") or 0,
            "precio_aldi": price_map.get("aldi") or 0,
        })

    return result
