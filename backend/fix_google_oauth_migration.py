#!/usr/bin/env python3
"""
Migration script to make hashed_password nullable for Google OAuth users
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Database connection parameters
DB_HOST = "db"  # Docker service name
DB_NAME = "mastermarket_db"
DB_USER = "mastermarket" 
DB_PASSWORD = "securepassword"
DB_PORT = "5432"

def run_migration():
    connection = None
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
        
        # Check current constraint
        cursor.execute("""
            SELECT is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'hashed_password';
        """)
        current_nullable = cursor.fetchone()
        print(f"📋 Current hashed_password nullable status: {current_nullable[0] if current_nullable else 'Column not found'}")
        
        if current_nullable and current_nullable[0] == 'NO':
            print("🔄 Making hashed_password column nullable...")
            cursor.execute("ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL;")
            print("✅ hashed_password column is now nullable")
        else:
            print("⏭️  hashed_password column is already nullable or doesn't exist")
        
        # Verify the change
        cursor.execute("""
            SELECT is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'hashed_password';
        """)
        new_nullable = cursor.fetchone()
        print(f"🎉 Updated hashed_password nullable status: {new_nullable[0] if new_nullable else 'Column not found'}")
        
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