import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import AddExpenseForm from './AddExpenseForm'; // Import the new component

function App() {
  const [financials, setFinancials] = useState(null);
  const [loading, setLoading] = useState(true);

  // We've moved the data fetching into its own function
  const fetchData = () => {
    setLoading(true);
    axios.get('http://127.0.0.1:8000/api/financials')
      .then(response => {
        setFinancials(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching data from backend!", error);
        setLoading(false);
      });
  };

  // This still runs once when the component first loads
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>FinSight AI Dashboard</h1>

        {loading ? (
          <p>Loading Financials...</p>
        ) : financials ? ( // Check if financials is not null before displaying
          <div className="metric-card">
            <h2>Financial Runway</h2>
            <p className="runway-number">{financials.runway_months}</p>
            <p>Months</p>
          </div>
        ) : <p>Could not load financial data.</p>}

        {/* Add the new form component here, passing the fetchData function as a prop */}
        <AddExpenseForm refreshData={fetchData} />

      </header>
    </div>
  );
}

export default App;