#!/usr/bin/env python3
"""
Migration script to add new fields to users table:
- country
- currency  
- google_id
- avatar_url
- provider
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Database connection parameters
DB_HOST = "localhost"
DB_NAME = "mastermarket_db"
DB_USER = "mastermarket" 
DB_PASSWORD = "securepassword"
DB_PORT = "5432"

def run_migration():
    try:
        # Connect to database
        connection = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )
        connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = connection.cursor()
        
        print("🔗 Connected to database")
        
        # Check if columns already exist
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name IN ('country', 'currency', 'google_id', 'avatar_url', 'provider');
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]
        print(f"📋 Existing columns: {existing_columns}")
        
        # Add new columns if they don't exist
        migrations = [
            ("country", "ALTER TABLE users ADD COLUMN country VARCHAR(10) DEFAULT 'UK';"),
            ("currency", "ALTER TABLE users ADD COLUMN currency VARCHAR(10) DEFAULT 'GBP';"),
            ("google_id", "ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;"),
            ("avatar_url", "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);"),
            ("provider", "ALTER TABLE users ADD COLUMN provider VARCHAR(50) DEFAULT 'email';")
        ]
        
        for column_name, sql in migrations:
            if column_name not in existing_columns:
                print(f"➕ Adding column: {column_name}")
                cursor.execute(sql)
                print(f"✅ Added column: {column_name}")
            else:
                print(f"⏭️  Column {column_name} already exists, skipping")
        
        print("🎉 Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        if connection:
            cursor.close()
            connection.close()
            print("🔌 Database connection closed")

if __name__ == "__main__":
    run_migration()