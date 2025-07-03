#!/usr/bin/env python3
"""
Script to clean up the database after removing thumbs_up/down from products
This will:
1. Drop the product_ratings table
2. Remove thumbs_up and thumbs_down columns from products table
"""

import psycopg2
from psycopg2 import sql
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection parameters
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "mastermarket_db")
DB_USER = os.getenv("DB_USER", "mastermarket")
DB_PASSWORD = os.getenv("DB_PASSWORD", "securepassword")

def cleanup_database():
    """Clean up old rating system from database"""
    conn = None
    cursor = None
    
    try:
        # Connect to database
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        cursor = conn.cursor()
        
        print("🔄 Starting database cleanup...")
        
        # Drop product_ratings table if exists
        print("📦 Dropping product_ratings table...")
        cursor.execute("DROP TABLE IF EXISTS product_ratings CASCADE;")
        print("✅ product_ratings table dropped")
        
        # Remove thumbs_up and thumbs_down columns from products table
        print("🔧 Removing thumbs columns from products table...")
        try:
            cursor.execute("ALTER TABLE products DROP COLUMN IF EXISTS thumbs_up;")
            cursor.execute("ALTER TABLE products DROP COLUMN IF EXISTS thumbs_down;")
            print("✅ Thumbs columns removed from products table")
        except Exception as e:
            print(f"⚠️  Warning: {e}")
        
        # Commit changes
        conn.commit()
        print("\n✨ Database cleanup completed successfully!")
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        if conn:
            conn.rollback()
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    print("🧹 Product Rating System Cleanup Script")
    print("=" * 50)
    print("This script will remove the old product rating system")
    print("(thumbs_up/down) from the database.\n")
    
    response = input("Do you want to continue? (yes/no): ")
    if response.lower() == 'yes':
        cleanup_database()
    else:
        print("❌ Cleanup cancelled")