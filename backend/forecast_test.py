import pandas as pd
from prophet import Prophet
import matplotlib.pyplot as plt # Prophet uses this to plot charts

# --- 1. Load and Prepare the Data ---
try:
    # Read the transaction data
    df = pd.read_csv('transactions.csv')

    # Convert 'Date' column to datetime objects
    df['Date'] = pd.to_datetime(df['Date'])

    # Filter for expenses only and make them positive for forecasting
    expenses_df = df[df['Amount'] < 0].copy()
    expenses_df['Amount'] = expenses_df['Amount'].abs()

    # Prophet requires two specific column names: 'ds' (datestamp) and 'y' (value)
    prophet_df = expenses_df[['Date', 'Amount']].rename(
        columns={'Date': 'ds', 'Amount': 'y'}
    )

    print("Data prepared successfully. First 5 rows:")
    print(prophet_df.head())

    # --- 2. Create and Fit the Model ---
    # Initialize the Prophet model
    model = Prophet()

    # Fit the model to your historical expense data
    model.fit(prophet_df)

    # --- 3. Make a Future Prediction ---
    # Create a dataframe for future dates (e.g., the next 180 days)
    future = model.make_future_dataframe(periods=180)

    # Use the model to predict the values for those future dates
    forecast = model.predict(future)

    print("\nForecast generated successfully. Last 5 rows of prediction:")
    # Print the last 5 rows of the forecast, showing the date and the predicted value ('yhat')
    print(forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail())

    # Optional: Display the forecast chart
    print("\nPlotting forecast... Close the chart window to exit.")
    fig1 = model.plot(forecast)
    plt.show()

except FileNotFoundError:
    print("Error: 'transactions.csv' not found. Make sure the file is in the same folder.")
except Exception as e:
    print(f"An error occurred: {e}")