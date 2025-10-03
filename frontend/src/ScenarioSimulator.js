import React, { useState } from 'react';
import axios from 'axios';

function ScenarioSimulator({ Icon }) {
  const [newHires, setNewHires] = useState('');
  const [avgSalary, setAvgSalary] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = (event) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    const scenario = {
      new_hires: parseInt(newHires),
      avg_salary: parseFloat(avgSalary)
    };

    axios.post('http://127.0.0.1:8000/api/simulate/hiring', scenario)
      .then(response => {
        setResult(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error running simulation!", error);
        setLoading(false);
        alert('Failed to run simulation.');
      });
  };

  return (
    <div className="form-card">
      <div className="card-header">
        <div className="card-icon scenario-icon">
            <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </div>
        <div>
          <h2 className="card-title">What-If Scenario</h2>
          <p className="card-subtitle">Simulate the impact of key decisions.</p>
        </div>
      </div>
      <form onSubmit={handleSimulate} className="scenario-form">
        <div className="form-group">
          <label className="form-label" htmlFor="newHires">New Hires</label>
          <input
            id="newHires"
            className="form-input"
            type="number"
            value={newHires}
            onChange={e => setNewHires(e.target.value)}
            placeholder="e.g., 3"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="avgSalary">Average Monthly Salary</label>
          <div className="input-with-icon">
             <span className="input-icon">₹</span>
             <input
                id="avgSalary"
                className="form-input input-with-prefix"
                type="number"
                value={avgSalary}
                onChange={e => setAvgSalary(e.target.value)}
                placeholder="e.g., 80000"
                required
              />
           </div>
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
        </div>
      )}
    </div>
  );
}

export default ScenarioSimulator;