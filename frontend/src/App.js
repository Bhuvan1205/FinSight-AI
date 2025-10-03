import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import AddExpenseForm from './AddExpenseForm';
import ScenarioSimulator from './ScenarioSimulator';
import ForecastChart from './ForecastChart';

// A simple SVG icon component
const Icon = ({ path }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

function App() {
  const [financials, setFinancials] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchData();
  }, []);

  const runwayStatus = financials && financials.runway_months > 6 ? "Healthy" : "At Risk";

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="logo-section">
          <div className="logo-icon">
            <Icon path="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z" />
          </div>
          <div>
            <h1 className="logo-text">FinSight AI</h1>
            <p className="header-subtitle">Smart CFO Assistant for Financial Planning</p>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        {/* Main Column for Visuals */}
        <div className="main-column">
          {loading ? (
            <div className="metric-card"><p>Loading Financials...</p></div>
          ) : financials ? (
            <div className="metric-card runway-card">
              <div className="card-header">
                <div className="card-icon runway-icon">
                  <Icon path="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </div>
                <div>
                  <h2 className="card-title">Financial Runway</h2>
                  <p className="card-subtitle">Estimated time until cash runs out.</p>
                </div>
              </div>
              <div className="runway-value-container">
                <span className="runway-value">{financials.runway_months}</span>
                <span className="runway-unit">Months</span>
              </div>
              <div className="runway-status">
                <div className={`status-indicator ${runwayStatus === 'Healthy' ? 'status-healthy' : ''}`}></div>
                <span>Status: {runwayStatus}</span>
              </div>
            </div>
          ) : <div className="metric-card"><p>Could not load financial data.</p></div>}
          
          <ForecastChart />
        </div>

        {/* Sidebar Column for Actions */}
        <div className="sidebar-column">
          <AddExpenseForm refreshData={fetchData} Icon={Icon} />
          <ScenarioSimulator Icon={Icon} />
        </div>
      </main>
    </div>
  );
}

export default App;