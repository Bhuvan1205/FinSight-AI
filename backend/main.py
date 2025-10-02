from fastapi import FastAPI
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from pydantic import BaseModel # Make sure to add this import
from logic import calculate_financials, simulate_hiring_scenario, generate_forecast
# This class defines the data structure for a new transaction
class Transaction(BaseModel):
    description: str
    amount: float
    category: str
    vendor: Optional[str] = None # Make vendor optional
    # The other fields are not needed for user input, so we leave them out

# --- Setup the Application ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)



# --- API Endpoints (The "Plumbing") ---
@app.get("/api/financials")
def get_financials():
    financial_data = calculate_financials()
    return financial_data
# This is your new POST endpoint
@app.post("/api/add_expense")
def add_expense(transaction: Transaction):
    from datetime import date
    import random

    # --- THIS IS THE FIX ---
    # We now build the full 8-column row, providing empty strings for the optional fields
    today = date.today().strftime("%Y-%m-%d")
    new_id = f"txn_{random.randint(100, 999)}"
    
    # Get the optional vendor, or use an empty string if it's not provided
    vendor = transaction.vendor if transaction.vendor else ""
    
    # Create the full 8-column row as a string. Notice the empty commas for the last two fields.
    new_row = f"\n{new_id},{today},{transaction.description},{transaction.amount},{transaction.category},{vendor},,"

    with open('transactions.csv', 'a', newline='') as f:
        f.write(new_row)

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