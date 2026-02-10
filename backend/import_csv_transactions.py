"""
Import transactions from CSV file for demo user
"""
from database import SessionLocal
from models import User, Transaction
import pandas as pd
from datetime import datetime

db = SessionLocal()

try:
    # Get demo user
    demo_user = db.query(User).filter(User.email == "demo@finsight.ai").first()
    
    if not demo_user:
        print("Demo user not found!")
        exit(1)
    
    print(f"Importing transactions from CSV for {demo_user.company_name}...")
    
    # Read CSV
    df = pd.read_csv('sample_transactions.csv')
    
    print(f"Found {len(df)} transactions in CSV")
    
    # Add transactions
    added = 0
    for _, row in df.iterrows():
        transaction = Transaction(
            user_id=demo_user.id,
            transaction_id=row['Transaction ID'],
            date=pd.to_datetime(row['Date']),
            description=row['Description'],
            amount=float(row['Amount']),
            category=row['Category'],
            vendor=row['Vendor'] if pd.notna(row['Vendor']) else None,
            notes=row['Notes'] if pd.notna(row['Notes']) else None
        )
        db.add(transaction)
        added += 1
    
    db.commit()
    
    print(f"✓ Successfully imported {added} transactions!")
    
    # Calculate summary
    total_expenses = df[df['Amount'] < 0]['Amount'].sum()
    total_revenue = df[df['Amount'] > 0]['Amount'].sum()
    
    print(f"\nImport Summary:")
    print(f"  Total Expenses: ₹{total_expenses:,.0f}")
    print(f"  Total Revenue: ₹{total_revenue:,.0f}")
    print(f"  Net: ₹{(total_revenue + total_expenses):,.0f}")
    
    # Category breakdown
    print(f"\nCategory Breakdown:")
    category_totals = df.groupby('Category')['Amount'].sum().sort_values()
    for category, amount in category_totals.items():
        if amount < 0:
            print(f"  {category}: ₹{amount:,.0f}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
