"""
Add sample transactions for demo user
"""
from database import SessionLocal
from models import User, Transaction
from datetime import datetime, timedelta
import random

db = SessionLocal()

try:
    # Get demo user
    demo_user = db.query(User).filter(User.email == "demo@finsight.ai").first()
    
    if not demo_user:
        print("Demo user not found!")
        exit(1)
    
    print(f"Adding sample transactions for {demo_user.company_name}...")
    
    # Sample transaction data
    sample_transactions = [
        # Cloud & Infrastructure
        {"description": "AWS Monthly Bill", "amount": -45000, "category": "Cloud Services", "vendor": "Amazon Web Services", "days_ago": 5},
        {"description": "Google Cloud Platform", "amount": -28000, "category": "Cloud Services", "vendor": "Google Cloud", "days_ago": 10},
        {"description": "DigitalOcean Hosting", "amount": -12000, "category": "Cloud Services", "vendor": "DigitalOcean", "days_ago": 15},
        
        # Salaries
        {"description": "Engineering Team Salaries", "amount": -450000, "category": "Salaries", "vendor": None, "days_ago": 3},
        {"description": "Marketing Team Salaries", "amount": -180000, "category": "Salaries", "vendor": None, "days_ago": 3},
        {"description": "Operations Team Salaries", "amount": -120000, "category": "Salaries", "vendor": None, "days_ago": 3},
        
        # Software & Tools
        {"description": "GitHub Enterprise", "amount": -15000, "category": "Software", "vendor": "GitHub", "days_ago": 7},
        {"description": "Slack Business Plan", "amount": -8000, "category": "Software", "vendor": "Slack", "days_ago": 8},
        {"description": "Figma Professional", "amount": -6000, "category": "Software", "vendor": "Figma", "days_ago": 12},
        {"description": "Notion Team Plan", "amount": -4000, "category": "Software", "vendor": "Notion", "days_ago": 14},
        
        # Marketing
        {"description": "Google Ads Campaign", "amount": -75000, "category": "Marketing", "vendor": "Google Ads", "days_ago": 6},
        {"description": "LinkedIn Ads", "amount": -35000, "category": "Marketing", "vendor": "LinkedIn", "days_ago": 9},
        {"description": "Content Marketing", "amount": -25000, "category": "Marketing", "vendor": None, "days_ago": 11},
        
        # Office & Operations
        {"description": "Office Rent", "amount": -85000, "category": "Office", "vendor": None, "days_ago": 1},
        {"description": "Office Supplies", "amount": -12000, "category": "Office", "vendor": "Amazon Business", "days_ago": 4},
        {"description": "Internet & Utilities", "amount": -8000, "category": "Office", "vendor": None, "days_ago": 2},
        
        # Revenue (positive amounts)
        {"description": "Client Payment - Acme Corp", "amount": 500000, "category": "Revenue", "vendor": "Acme Corp", "days_ago": 5},
        {"description": "Subscription Revenue", "amount": 250000, "category": "Revenue", "vendor": None, "days_ago": 10},
        {"description": "Consulting Services", "amount": 150000, "category": "Revenue", "vendor": "Tech Solutions Inc", "days_ago": 15},
        
        # Miscellaneous
        {"description": "Legal Fees", "amount": -35000, "category": "Professional Services", "vendor": "Law Firm LLP", "days_ago": 13},
        {"description": "Accounting Services", "amount": -18000, "category": "Professional Services", "vendor": "CA Associates", "days_ago": 16},
        {"description": "Team Building Event", "amount": -22000, "category": "HR", "vendor": None, "days_ago": 20},
    ]
    
    # Add transactions
    for idx, txn_data in enumerate(sample_transactions):
        transaction = Transaction(
            user_id=demo_user.id,
            transaction_id=f"txn_{10000 + idx}",
            date=datetime.now() - timedelta(days=txn_data["days_ago"]),
            description=txn_data["description"],
            amount=txn_data["amount"],
            category=txn_data["category"],
            vendor=txn_data["vendor"]
        )
        db.add(transaction)
    
    db.commit()
    
    print(f"✓ Successfully added {len(sample_transactions)} sample transactions!")
    print(f"\nTransaction Summary:")
    print(f"  Total Expenses: ₹{sum(t['amount'] for t in sample_transactions if t['amount'] < 0):,.0f}")
    print(f"  Total Revenue: ₹{sum(t['amount'] for t in sample_transactions if t['amount'] > 0):,.0f}")
    print(f"  Net: ₹{sum(t['amount'] for t in sample_transactions):,.0f}")
    
except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()
