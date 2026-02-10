import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiTrendingUp, FiDollarSign, FiActivity, FiCalendar } from 'react-icons/fi';
import ForecastChart from './ForecastChart';
import './Dashboard.css';

function Dashboard() {
  const [financials, setFinancials] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get('http://127.0.0.1:8000/api/financial-data'),
      axios.get('http://127.0.0.1:8000/api/stats/categories')
    ])
      .then(([financialsRes, statsRes]) => {
        setFinancials(financialsRes.data);
        setStats(statsRes.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching data!", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(2)}K`;
    return `₹${num}`;
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Welcome back, {user?.company_name}!</h1>
          <p className="dashboard-subtitle">Here's your financial overview</p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card runway-card">
          <div className="metric-icon-container runway-icon">
            <FiTrendingUp />
          </div>
          <div className="metric-content">
            <p className="metric-label">Financial Runway</p>
            {loading ? (
              <div className="skeleton-text"></div>
            ) : (
              <>
                <h2 className="metric-value runway-value">
                  {financials?.runway_months === Infinity ? '∞' : financials?.runway_months}
                </h2>
                <span className="metric-unit">Months</span>
              </>
            )}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-container burn-icon">
            <FiActivity />
          </div>
          <div className="metric-content">
            <p className="metric-label">Monthly Burn Rate</p>
            {loading ? (
              <div className="skeleton-text"></div>
            ) : (
              <>
                <h2 className="metric-value">{formatNumber(financials?.avg_monthly_burn || 0)}</h2>
                <span className="metric-unit">per month</span>
              </>
            )}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-container cash-icon">
            <FiDollarSign />
          </div>
          <div className="metric-content">
            <p className="metric-label">Cash on Hand</p>
            {loading ? (
              <div className="skeleton-text"></div>
            ) : (
              <>
                <h2 className="metric-value">{formatNumber(financials?.cash_on_hand || 0)}</h2>
                <span className="metric-unit">available</span>
              </>
            )}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-container expense-icon">
            <FiCalendar />
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Expenses</p>
            {loading ? (
              <div className="skeleton-text"></div>
            ) : (
              <>
                <h2 className="metric-value">{formatNumber(financials?.total_expenses || 0)}</h2>
                <span className="metric-unit">to date</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="dashboard-section">
        <ForecastChart />
      </div>

      {/* Category Breakdown */}
      {stats && stats.categories && stats.categories.length > 0 && (
        <div className="dashboard-section">
          <div className="section-card">
            <h3 className="section-title">Spending by Category</h3>
            <div className="category-list">
              {stats.categories.slice(0, 5).map((cat, index) => (
                <div key={index} className="category-item">
                  <div className="category-info">
                    <span className="category-name">{cat.category}</span>
                    <span className="category-amount">{formatCurrency(cat.total)}</span>
                  </div>
                  <div className="category-bar">
                    <div
                      className="category-bar-fill"
                      style={{
                        width: `${(cat.total / stats.categories[0].total) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
