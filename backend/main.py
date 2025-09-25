from fastapi import FastAPI
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel # Make sure to add this import
from logic import calculate_financials, simulate_hiring_scenario, generate_forecast
# This class defines the data structure for a new transaction
class Transaction(BaseModel):
    description: str
    amount: float
    category: str

# --- Setup the Application ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)



# --- API Endpoints (The "Plumbing") ---
@app.get("/api/financials")
def get_financials():
    financial_data = calculate_financials()
    return financial_data
# This is your new POST endpoint
@app.post("/api/add_expense")
def add_expense(transaction: Transaction):
    # The 'transaction' parameter is automatically validated against your Pydantic model.
    
    # Get the current date for the new transaction
    from datetime import date
    today = date.today().strftime("%Y-%m-%d")

    # Create the new row as a string
    # We'll generate a simple new ID for now
    import random
    new_id = f"txn_{random.randint(100, 999)}"
    new_row = f"\n{today},{transaction.description},{transaction.amount},{transaction.category}"

    # Open the CSV file in 'append' mode ('a') and add the new row
    with open('transactions.csv', 'a') as f:
        f.write(new_row)

    # Return a success message
    return {"status": "success", "data_added": transaction}

# Add this class to main.py
class HiringScenario(BaseModel):
    new_hires: int
    avg_salary: float
    
@app.post("/api/simulate/hiring")
def run_hiring_simulation(scenario: HiringScenario):
    # This endpoint receives the scenario data from the user
    # It calls your logic function with the data
    simulation_result = simulate_hiring_scenario(
        new_hires=scenario.new_hires, 
        avg_salary=scenario.avg_salary
    )
    # It returns the result of the simulation
    return simulation_result
@app.get("/api/forecast")
def get_forecast():
    # This endpoint calls your new forecast logic
    forecast_data = generate_forecast()
    return forecast_data