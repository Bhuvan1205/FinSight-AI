import pandas as pd
from sqlalchemy.orm import Session
from models import User, Transaction, ActivityLog
from datetime import datetime
import json

# --- Core Logic Function (The "Brain") ---
def calculate_financials(db: Session, user_id: int):
    """Calculate financial runway for a specific user"""
    print(f"--- CHECKPOINT 1: Starting runway calculation for user {user_id}... ---")
    
    try:
        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User not found"}
        
        cash_on_hand = user.cash_on_hand
        
        # Get all transactions for this user
        transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()
        print(f"--- CHECKPOINT 2: Found {len(transactions)} transactions. ---")
        
        if not transactions:
            return {
                "runway_months": float('inf'), 
                "avg_monthly_burn": 0, 
                "cash_on_hand": cash_on_hand,
                "total_expenses": 0,
                "total_revenue": 0
            }
        
        # Convert to DataFrame for analysis
        df = pd.DataFrame([{
            'date': t.date,
            'amount': t.amount,
            'category': t.category
        } for t in transactions])
        
        df['date'] = pd.to_datetime(df['date'])
        print("--- CHECKPOINT 3: Date column converted. ---")
        
        num_months = df['date'].dt.to_period('M').nunique()
        print(f"--- CHECKPOINT 4: Found {num_months} unique months. ---")
        
        if num_months == 0:
            num_months = 1  # Avoid division by zero
        
        total_expenses = df[df['amount'] < 0]['amount'].sum()
        total_revenue = df[df['amount'] > 0]['amount'].sum()
        print(f"--- CHECKPOINT 5: Total expenses: {total_expenses}, Total revenue: {total_revenue}. ---")
        
        avg_monthly_burn = abs(total_expenses / num_months)
        print(f"--- CHECKPOINT 6: Average monthly burn calculated: {avg_monthly_burn}. ---")
        
        if avg_monthly_burn > 0:
            runway_months = round(cash_on_hand / avg_monthly_burn, 1)
        else:
            runway_months = float('inf')
        
        print("--- CHECKPOINT 7: Runway calculation complete. ---")
        
        return {
            "runway_months": runway_months, 
            "avg_monthly_burn": avg_monthly_burn, 
            "cash_on_hand": cash_on_hand,
            "total_expenses": abs(total_expenses),
            "total_revenue": total_revenue
        }
    except Exception as e:
        print(f"--- AN ERROR OCCURRED: {e} ---")
        return {"error": str(e)}


# This is the function for the what-if scenario
def simulate_hiring_scenario(db: Session, user_id: int, new_hires: int, avg_salary: float):
    """Simulate hiring scenario for a specific user"""
    # First, get the current financial state
    current_financials = calculate_financials(db, user_id)
    
    if "error" in current_financials:
        return current_financials
    
    # Get the current numbers from that result
    current_burn = current_financials["avg_monthly_burn"]
    cash_on_hand = current_financials["cash_on_hand"]
    current_runway = current_financials["runway_months"]
    
    # Calculate the additional monthly cost from the new hires
    new_monthly_cost = new_hires * avg_salary
    
    # Calculate the new, simulated burn rate
    simulated_burn = current_burn + new_monthly_cost
    
    # Calculate the new, simulated runway
    if simulated_burn > 0:
        simulated_runway = round(cash_on_hand / simulated_burn, 1)
    else:
        simulated_runway = float('inf')
    
    # Log activity
    log_activity(
        db, 
        user_id, 
        "RUN_SIMULATION", 
        json.dumps({
            "type": "hiring",
            "new_hires": new_hires,
            "avg_salary": avg_salary,
            "result": {
                "current_runway": current_runway,
                "simulated_runway": simulated_runway
            }
        })
    )
    
    # Return a dictionary with both the current and simulated results
    return {
        "current_runway": current_runway,
        "simulated_runway": simulated_runway,
        "simulated_burn": simulated_burn,
        "current_burn": current_burn
    }


from prophet import Prophet

# This is the function for the ML forecast
def generate_forecast(db: Session, user_id: int):
    """Generate ML forecast for a specific user"""
    try:
        # Get all transactions for this user
        transactions = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.amount < 0  # Only expenses
        ).all()
        
        if len(transactions) < 2:
            return {"error": "Not enough transaction data for forecasting. Need at least 2 expense records."}
        
        # Convert to DataFrame
        df = pd.DataFrame([{
            'ds': t.date,
            'y': abs(t.amount)
        } for t in transactions])
        
        df['ds'] = pd.to_datetime(df['ds'])
        
        # Create, fit, and predict
        model = Prophet()
        model.fit(df)
        future = model.make_future_dataframe(periods=180)
        forecast = model.predict(future)
        
        # Return only the relevant columns as a dictionary
        return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict('records')
    
    except Exception as e:
        return {"error": str(e)}


# Activity logging utility
def log_activity(db: Session, user_id: int, action: str, details: str = None):
    """Log user activity"""
    try:
        activity = ActivityLog(
            user_id=user_id,
            action=action,
            details=details
        )
        db.add(activity)
        db.commit()
    except Exception as e:
        print(f"Error logging activity: {e}")
        db.rollback()