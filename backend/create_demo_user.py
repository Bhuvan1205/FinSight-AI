"""
Create demo user using the auth module
"""
from database import SessionLocal
from models import User
from auth import get_password_hash

db = SessionLocal()

try:
    # Delete existing users
    db.query(User).delete()
    db.commit()
    print("Deleted existing users")
    
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
    
    print(f"✓ Demo user created successfully!")
    print(f"  Email: {demo_user.email}")
    print(f"  Company: {demo_user.company_name}")
    print(f"  Cash: ₹{demo_user.cash_on_hand:,.0f}")
    
except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()
