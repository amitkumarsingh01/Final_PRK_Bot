#!/usr/bin/env python3
"""
Database initialization script for PRK Tech India backend.
This script creates all database tables defined in the models.
"""

import sys
import os

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import Base, engine

def init_database():
    """Initialize the database by creating all tables."""
    try:
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
        print("📋 Created tables:")
        for table_name in Base.metadata.tables.keys():
            print(f"   - {table_name}")
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        sys.exit(1)

if __name__ == "__main__":
    init_database() 