import React from 'react';
import AddExpenseForm from './AddExpenseForm';
import ScenarioSimulator from './ScenarioSimulator';
import './Tools.css';

function Tools() {
  return (
    <div className="tools-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Tools</h1>
          <p className="page-subtitle">Manage expenses and run simulations</p>
        </div>
      </div>

      <div className="tools-grid">
        <AddExpenseForm />
        <ScenarioSimulator />
      </div>
    </div>
  );
}

export default Tools;
