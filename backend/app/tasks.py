# app/tasks.py
from celery import shared_task
from datetime import datetime
from database import SessionLocal
import crud
from models import Product

@shared_task(name="app.tasks.update_prices")
def update_prices():
    db = SessionLocal()
    try:
        products = db.query(Product).all()
        for product in products:
            # Replace this with your actual logic for fetching the new price
            new_price = 9.99  # example placeholder
            crud.update_price(db, product.id, new_price)
            # You may also create a new history record here
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()
