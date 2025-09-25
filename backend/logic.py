# --- Core Logic Function (The "Brain") ---
import pandas as pd
def calculate_financials():
    cash_on_hand = 75000
    try:
        df = pd.read_csv('transactions.csv')
    except FileNotFoundError:
        # If the CSV doesn't exist, return an error
        return {"error": "transactions.csv file not found."}

    total_expenses = df[df['Amount'] < 0]['Amount'].sum()
    avg_monthly_burn = abs(total_expenses / 2)

    if avg_monthly_burn > 0:
        runway_months = round(cash_on_hand / avg_monthly_burn, 1)
    else:
        runway_months = float('inf')
            
    return {
        "runway_months": runway_months, 
        "avg_monthly_burn": avg_monthly_burn, 
        "cash_on_hand": cash_on_hand
    }
    
    
    
    
    # This is the new function for the what-if scenario
def simulate_hiring_scenario(new_hires: int, avg_salary: float):
    # First, get the current financial state by calling the function we already built
    current_financials = calculate_financials()
    
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
        
    # Return a dictionary with both the current and simulated results
    return {
        "current_runway": current_runway,
        "simulated_runway": simulated_runway,
        "simulated_burn": simulated_burn
    }
    
from prophet import Prophet # Add this import at the top of logic.py

# This is the new function for the ML forecast
def generate_forecast():
    try:
        df = pd.read_csv('transactions.csv')
        df['Date'] = pd.to_datetime(df['Date'])
        
        # Prepare data for Prophet
        expenses_df = df[df['Amount'] < 0].copy()
        expenses_df['Amount'] = expenses_df['Amount'].abs()
        
        prophet_df = expenses_df[['Date', 'Amount']].rename(
            columns={'Date': 'ds', 'Amount': 'y'}
        )
        
        # Create, fit, and predict
        model = Prophet()
        model.fit(prophet_df)
        future = model.make_future_dataframe(periods=180)
        forecast = model.predict(future)
        
        # Return only the relevant columns as a dictionary
        return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict('records')

    except Exception as e:
        return {"error": str(e)}