import React, { useState } from 'react';
import axios from 'axios';
import { FiSearch, FiUsers, FiDollarSign } from 'react-icons/fi';
import './Components.css';

function ScenarioSimulator() {
  const [newHires, setNewHires] = useState('');
  const [avgSalary, setAvgSalary] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async (event) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    const scenario = {
      new_hires: parseInt(newHires),
      avg_salary: parseFloat(avgSalary)
    };

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/simulate/hiring', scenario);
      setResult(response.data);
    } catch (error) {
      console.error("Error running simulation!", error);
      alert('Failed to run simulation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon-header scenario-icon">
          <FiSearch />
        </div>
        <div>
          <h2 className="card-title">What-If Scenario</h2>
          <p className="card-subtitle">Simulate the impact of key decisions</p>
        </div>
      </div>

      <form onSubmit={handleSimulate} className="scenario-form">
        <div className="form-group">
          <label className="form-label" htmlFor="newHires">
            <FiUsers className="label-icon-inline" /> New Hires
          </label>
          <input
            id="newHires"
            className="form-input"
            type="number"
            value={newHires}
            onChange={e => setNewHires(e.target.value)}
            placeholder="e.g., 3"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="avgSalary">
            <FiDollarSign className="label-icon-inline" /> Average Monthly Salary (₹)
          </label>
          <input
            id="avgSalary"
            className="form-input"
            type="number"
            value={avgSalary}
            onChange={e => setAvgSalary(e.target.value)}
            placeholder="e.g., 80000"
            required
            disabled={loading}
          />
        </div>

        <button type="submit" className="btn btn-secondary" disabled={loading}>
          {loading ? 'Simulating...' : 'Simulate Impact'}
        </button>
      </form>

      {result && (
        <div className="scenario-results">
          <div className="result-divider"></div>
          <h3 className="result-title">Simulation Result</h3>
          <div className="result-comparison">
            <div className="result-item">
              <p className="result-label">Current Runway</p>
              <p className="result-value result-before">{result.current_runway} mo</p>
            </div>
            <div className="result-arrow">→</div>
            <div className="result-item">
              <p className="result-label">Simulated Runway</p>
              <p className="result-value result-after">{result.simulated_runway} mo</p>
            </div>
          </div>
          <div className="result-details">
            <p>Current Burn: ₹{result.current_burn?.toLocaleString('en-IN')}/month</p>
            <p>Simulated Burn: ₹{result.simulated_burn?.toLocaleString('en-IN')}/month</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScenarioSimulator;
