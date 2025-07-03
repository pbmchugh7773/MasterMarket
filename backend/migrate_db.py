#!/usr/bin/env python3
"""
Database migration script to add new columns and tables for community pricing
"""

import os
import sys
from sqlalchemy import text

# Add the app directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from app.models import Base

def migrate_database():
    """Run database migrations"""
    print("🔄 Starting database migration...")
    
    try:
        with engine.connect() as conn:
            # Add new columns to users table if they don't exist
            print("📝 Adding new columns to users table...")
            
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN location VARCHAR"))
                print("✅ Added 'location' column to users table")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print("ℹ️  'location' column already exists")
                else:
                    print(f"❌ Error adding 'location' column: {e}")
            
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN country VARCHAR DEFAULT 'UK'"))
                print("✅ Added 'country' column to users table")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print("ℹ️  'country' column already exists")
                else:
                    print(f"❌ Error adding 'country' column: {e}")
            
            conn.commit()
        
        # Create all tables (this will create new tables but won't modify existing ones)
        print("🏗️  Creating new tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created/updated successfully")
        
        print("🎉 Database migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    migrate_database()