"""
Database Migration Script
Creates initial database and migrates data from transactions.csv if it exists
"""
from database import engine, Base, SessionLocal
from models import User, Transaction
from auth import get_password_hash
import pandas as pd
import os
from datetime import datetime

def init_database():
    """Initialize database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully!")

def create_demo_user():
    """Create a demo user account"""
    db = SessionLocal()
    try:
        # Check if demo user already exists
        existing_user = db.query(User).filter(User.email == "demo@finsight.ai").first()
        if existing_user:
            print("✓ Demo user already exists")
            return existing_user
        
        # Create demo user
        demo_user = User(
            company_name="Demo Company",
            email="demo@finsight.ai",
            password_hash=get_password_hash("demo123"),
            cash_on_hand=7500000.0
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        print("✓ Demo user created (email: demo@finsight.ai, password: demo123)")
        return demo_user
    except Exception as e:
        print(f"✗ Error creating demo user: {e}")
        db.rollback()
        return None
    finally:
        db.close()

def migrate_csv_data(user_id: int):
    """Migrate data from transactions.csv to database"""
    csv_file = "transactions.csv"
    
    if not os.path.exists(csv_file):
        print(f"ℹ No {csv_file} found, skipping migration")
        return
    
    db = SessionLocal()
    try:
        print(f"Reading {csv_file}...")
        df = pd.read_csv(csv_file)
        
        print(f"Migrating {len(df)} transactions...")
        for _, row in df.iterrows():
            transaction = Transaction(
                user_id=user_id,
                transaction_id=row.get('Transaction ID', f"txn_{_}"),
                date=pd.to_datetime(row['Date']),
                description=row['Description'],
                amount=float(row['Amount']),
                category=row['Category'],
                vendor=row.get('Vendor', None) if pd.notna(row.get('Vendor')) else None
            )
            db.add(transaction)
        
        db.commit()
        print(f"✓ Successfully migrated {len(df)} transactions!")
        
        # Rename CSV file to indicate it's been migrated
        os.rename(csv_file, f"{csv_file}.migrated")
        print(f"✓ Renamed {csv_file} to {csv_file}.migrated")
        
    except Exception as e:
        print(f"✗ Error migrating CSV data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("FinSight AI - Database Initialization")
    print("=" * 60)
    
    # Initialize database
    init_database()
    
    # Create demo user
    demo_user = create_demo_user()
    
    # Migrate CSV data if exists
    if demo_user:
        migrate_csv_data(demo_user.id)
    
    print("=" * 60)
    print("Database setup complete!")
    print("=" * 60)
