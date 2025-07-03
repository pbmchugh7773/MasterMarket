#!/usr/bin/env python3
"""Initialize stores table with UK store data"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the app directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.models import Base, Store
from app.database import DATABASE_URL as SQLALCHEMY_DATABASE_URL

# Sample UK stores data
SAMPLE_STORES = [
    # London stores
    {
        "name": "Tesco Express - Oxford Street",
        "chain": "Tesco",
        "address": "15-17 Oxford Street",
        "city": "London",
        "postcode": "W1D 2AQ",
        "latitude": 51.5142,
        "longitude": -0.1311,
        "opening_hours": "Mon-Sun: 7:00-23:00"
    },
    {
        "name": "Sainsbury's Local - Covent Garden",
        "chain": "Sainsbury's",
        "address": "129 Long Acre",
        "city": "London",
        "postcode": "WC2E 9AA",
        "latitude": 51.5145,
        "longitude": -0.1269,
        "opening_hours": "Mon-Sat: 7:00-23:00, Sun: 8:00-22:00"
    },
    {
        "name": "ASDA - Park Royal",
        "chain": "ASDA",
        "address": "Western Road",
        "city": "London",
        "postcode": "NW10 7LW",
        "latitude": 51.5366,
        "longitude": -0.2756,
        "opening_hours": "24 hours"
    },
    {
        "name": "Waitrose - King's Cross",
        "chain": "Waitrose",
        "address": "Granary Square",
        "city": "London",
        "postcode": "N1C 4AA",
        "latitude": 51.5355,
        "longitude": -0.1248,
        "opening_hours": "Mon-Sat: 7:30-22:00, Sun: 11:00-17:00"
    },
    # Manchester stores
    {
        "name": "Tesco Metro - Market Street",
        "chain": "Tesco",
        "address": "58 Market Street",
        "city": "Manchester",
        "postcode": "M1 1PW",
        "latitude": 53.4819,
        "longitude": -2.2389,
        "opening_hours": "Mon-Sat: 6:00-00:00, Sun: 11:00-17:00"
    },
    {
        "name": "ASDA - Eastlands",
        "chain": "ASDA",
        "address": "Sport City Way",
        "city": "Manchester",
        "postcode": "M11 3BS",
        "latitude": 53.4831,
        "longitude": -2.2004,
        "opening_hours": "Mon-Sat: 7:00-23:00, Sun: 10:00-16:00"
    },
    # Birmingham stores
    {
        "name": "Sainsbury's - Birmingham City Centre",
        "chain": "Sainsbury's",
        "address": "Martineau Place",
        "city": "Birmingham",
        "postcode": "B2 4UW",
        "latitude": 52.4779,
        "longitude": -1.8988,
        "opening_hours": "Mon-Sat: 7:00-22:00, Sun: 11:00-17:00"
    },
    {
        "name": "Morrisons - Five Ways",
        "chain": "Morrisons",
        "address": "Hagley Road",
        "city": "Birmingham",
        "postcode": "B16 8PE",
        "latitude": 52.4716,
        "longitude": -1.9304,
        "opening_hours": "Mon-Sat: 7:00-22:00, Sun: 10:00-16:00"
    },
    # Glasgow stores
    {
        "name": "Tesco Extra - Glasgow Silverburn",
        "chain": "Tesco",
        "address": "Silverburn Shopping Centre",
        "city": "Glasgow",
        "postcode": "G53 6QR",
        "latitude": 55.8268,
        "longitude": -4.3407,
        "opening_hours": "24 hours"
    },
    {
        "name": "ASDA - Glasgow Govan",
        "chain": "ASDA",
        "address": "Helen Street",
        "city": "Glasgow",
        "postcode": "G51 3HR",
        "latitude": 55.8614,
        "longitude": -4.3142,
        "opening_hours": "Mon-Sat: 7:00-23:00, Sun: 7:00-22:00"
    },
    # Liverpool stores
    {
        "name": "Sainsbury's - Liverpool One",
        "chain": "Sainsbury's",
        "address": "Hanover Street",
        "city": "Liverpool",
        "postcode": "L1 3DZ",
        "latitude": 53.4037,
        "longitude": -2.9876,
        "opening_hours": "Mon-Sat: 7:00-22:00, Sun: 11:00-17:00"
    },
    {
        "name": "Tesco Express - Bold Street",
        "chain": "Tesco",
        "address": "89 Bold Street",
        "city": "Liverpool",
        "postcode": "L1 4HY",
        "latitude": 53.4029,
        "longitude": -2.9775,
        "opening_hours": "Mon-Sun: 6:00-23:00"
    }
]

def init_stores():
    """Initialize the stores table with sample data"""
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if stores already exist
        existing_stores = db.query(Store).count()
        if existing_stores > 0:
            print(f"Stores table already has {existing_stores} entries. Skipping initialization.")
            return
        
        # Add sample stores
        for store_data in SAMPLE_STORES:
            store = Store(**store_data)
            db.add(store)
        
        db.commit()
        print(f"Successfully added {len(SAMPLE_STORES)} stores to the database.")
        
    except Exception as e:
        print(f"Error initializing stores: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_stores()