from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime, date
import random
import json

# Import our modules
from database import engine, get_db, Base
from models import User, Transaction, ActivityLog, Upload, UploadTransaction
from auth import (
    UserRegister, UserLogin, Token, 
    authenticate_user, create_user, create_access_token,
    get_current_user
)
from logic import calculate_financials, simulate_hiring_scenario, generate_forecast, log_activity

# Create database tables
Base.metadata.create_all(bind=engine)

# Pydantic models
class TransactionCreate(BaseModel):
    date: Optional[str] = None
    description: str
    amount: float
    category: str
    vendor: Optional[str] = None
    notes: Optional[str] = None

class HiringScenario(BaseModel):
    new_hires: int
    avg_salary: float

class TransactionResponse(BaseModel):
    id: int
    transaction_id: str
    date: datetime
    description: str
    amount: float
    category: str
    vendor: Optional[str] = None
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class CashUpdate(BaseModel):
    cash_on_hand: float

# Initialize FastAPI
app = FastAPI(title="FinSight AI API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Authentication Endpoints ---
@app.post("/api/auth/register", response_model=Token)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    user = create_user(db, user_data)
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "company_name": user.company_name
        }
    }


@app.post("/api/auth/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    user = authenticate_user(db, user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    access_token = create_access_token(data={"sub": user.email})
    
    # Log activity
    log_activity(db, user.id, "LOGIN", f"User logged in from web")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "company_name": user.company_name
        }
    }


# --- User Endpoints ---
@app.get("/api/user/me")
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "company_name": current_user.company_name,
        "cash_on_hand": current_user.cash_on_hand
    }

# --- Financial Data Endpoints ---
@app.get("/api/financial-data")
def get_financial_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get financial overview data"""
    return calculate_financials(db, current_user.id)


@app.put("/api/cash-on-hand")
def update_cash_on_hand(
    cash_data: CashUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update cash on hand"""
    current_user.cash_on_hand = cash_data.cash_on_hand
    db.commit()
    
    log_activity(db, current_user.id, "UPDATE_CASH", f"Updated cash on hand to {cash_data.cash_on_hand}")
    
    return {"success": True, "cash_on_hand": current_user.cash_on_hand}

@app.get("/api/forecast")
def get_forecast(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get ML-powered expense forecast"""
    return generate_forecast(db, current_user.id)


# --- Transaction Endpoints ---
@app.post("/api/transactions")
def add_transaction(
    transaction: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new transaction"""
    try:
        if transaction.date:
            from dateutil import parser
            txn_date = parser.parse(transaction.date)
        else:
            txn_date = datetime.utcnow()
    except Exception:
        txn_date = datetime.utcnow()

    new_transaction = Transaction(
        user_id=current_user.id,
        transaction_id=f"txn_{random.randint(10000, 99999)}",
        date=txn_date,
        description=transaction.description,
        amount=transaction.amount,
        category=transaction.category,
        vendor=transaction.vendor,
        notes=transaction.notes
    )
    
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    
    log_activity(
        db,
        current_user.id,
        "ADD_TRANSACTION",
        f"Added transaction: {transaction.description} - {transaction.amount}"
    )
    
    return {"success": True, "transaction": new_transaction}

@app.get("/api/transactions")
def get_transactions(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get transaction history with pagination and filtering"""
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    if category:
        query = query.filter(Transaction.category == category)
    
    transactions = query.order_by(Transaction.date.desc()).offset(skip).limit(limit).all()
    
    # Convert to dict manually
    result = []
    for txn in transactions:
        result.append({
            "id": txn.id,
            "transaction_id": txn.transaction_id,
            "date": txn.date.isoformat(),
            "description": txn.description,
            "amount": txn.amount,
            "category": txn.category,
            "vendor": txn.vendor,
            "notes": txn.notes
        })
    
    return result

@app.delete("/api/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a transaction"""
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(transaction)
    db.commit()
    
    log_activity(db, current_user.id, "DELETE_TRANSACTION", f"Deleted transaction {transaction_id}")
    
    return {"success": True}

# --- Activity Log Endpoints ---
@app.get("/api/activity")
def get_activity_log(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent activity log"""
    activities = db.query(ActivityLog).filter(
        ActivityLog.user_id == current_user.id
    ).order_by(ActivityLog.timestamp.desc()).limit(limit).all()
    
    return [{
        "id": a.id,
        "action": a.action,
        "details": a.details,
        "timestamp": a.timestamp.isoformat()
    } for a in activities]

# --- Statistics Endpoints ---
@app.get("/api/stats/categories")
def get_category_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get spending by category"""
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).all()
    
    category_totals = {}
    for t in transactions:
        if t.category not in category_totals:
            category_totals[t.category] = 0
        category_totals[t.category] += abs(t.amount)
    
    categories = [
        {"category": cat, "total": total}
        for cat, total in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
    ]
    
    return {"categories": categories}

# --- Simulation Endpoints ---
@app.post("/api/simulate/hiring")
def simulate_hiring(
    scenario: HiringScenario,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Simulate the impact of a hiring scenario"""
    from logic import simulate_hiring_scenario
    return simulate_hiring_scenario(db, current_user.id, scenario.new_hires, scenario.avg_salary)

# --- CSV Upload Endpoints ---
@app.post("/api/upload/csv")
async def upload_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and analyze CSV file"""
    import pandas as pd
    from io import StringIO
    
    try:
        content = await file.read()
        content_str = content.decode('utf-8')
        df = pd.read_csv(StringIO(content_str))
        
        required_cols = ['Date', 'Description', 'Amount']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing required columns: {', '.join(missing_cols)}")
        
        transactions = []
        for idx, row in df.iterrows():
            txn = {
                'id': idx,
                'date': str(row['Date']),
                'description': str(row['Description']),
                'amount': float(row['Amount']),
                'category': str(row.get('Category', 'Operations')),
                'vendor': str(row.get('Vendor', '')) if pd.notna(row.get('Vendor')) else None,
                'notes': str(row.get('Notes', '')) if pd.notna(row.get('Notes')) else None
            }
            transactions.append(txn)
        
        upload = Upload(
            user_id=current_user.id,
            filename=file.filename,
            status="completed",
            total_transactions=len(transactions),
            analysis_results=json.dumps({
                'total_transactions': len(transactions),
                'summary': {
                    'total_amount': float(df['Amount'].sum()),
                    'total_expenses': float(df[df['Amount'] < 0]['Amount'].sum()),
                    'total_revenue': float(df[df['Amount'] > 0]['Amount'].sum())
                }
            })
        )
        db.add(upload)
        db.commit()
        db.refresh(upload)
        
        for txn in transactions:
            staged_txn = UploadTransaction(
                upload_id=upload.id,
                transaction_id=f"staged_{upload.id}_{txn['id']}",
                date=pd.to_datetime(txn['date']),
                description=txn['description'],
                amount=txn['amount'],
                category=txn['category'],
                vendor=txn['vendor'],
                notes=txn['notes']
            )
            db.add(staged_txn)
        
        db.commit()
        log_activity(db, current_user.id, "CSV_UPLOAD", f"Uploaded {file.filename}")
        
        return {
            "upload_id": upload.id,
            "filename": file.filename,
            "total_transactions": len(transactions),
            "analysis": json.loads(upload.analysis_results)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Upload failed: {str(e)}")

@app.post("/api/upload/{upload_id}/confirm")
def confirm_upload(
    upload_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Confirm and import staged transactions"""
    upload = db.query(Upload).filter(Upload.id == upload_id, Upload.user_id == current_user.id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    staged_txns = db.query(UploadTransaction).filter(UploadTransaction.upload_id == upload_id).all()
    imported_count = 0
    
    for staged in staged_txns:
        txn = Transaction(
            user_id=current_user.id,
            transaction_id=f"txn_{random.randint(10000, 99999)}",
            date=staged.date,
            description=staged.description,
            amount=staged.amount,
            category=staged.category or "Operations",
            vendor=staged.vendor,
            notes=staged.notes
        )
        db.add(txn)
        imported_count += 1
    
    upload.imported_count = imported_count
    upload.status = "imported"
    db.commit()
    
    log_activity(db, current_user.id, "IMPORT_TRANSACTIONS", f"Imported {imported_count} transactions")
    
    return {"success": True, "imported_count": imported_count}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
