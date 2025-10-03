import React, { useState } from 'react';
import axios from 'axios';

function AddExpenseForm({ refreshData, Icon }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const newTransaction = {
      description: description,
      amount: -Math.abs(parseFloat(amount)),
      category: category,
    };

    axios.post('http://127.0.0.1:8000/api/add_expense', newTransaction)
      .then(response => {
        alert('Expense Added Successfully!');
        setDescription('');
        setAmount('');
        setCategory('');
        refreshData();
      })
      .catch(error => {
        console.error("There was an error adding the expense!", error);
        alert('Failed to add expense.');
      });
  };

  return (
    <div className="form-card">
      <div className="card-header">
        <div className="card-icon add-icon">
          <Icon path="M12 4v16m8-8H4" />
        </div>
        <div>
          <h2 className="card-title">Add Expense</h2>
          <p className="card-subtitle">Log a new transaction to update your runway.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="expense-form">
        <div className="form-group">
          <label className="form-label" htmlFor="description">Description</label>
          <input
            id="description"
            className="form-input"
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g., AWS Monthly Bill"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="amount">Amount</label>
           <div className="input-with-icon">
             <span className="input-icon">₹</span>
             <input
                id="amount"
                className="form-input input-with-prefix"
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="500"
                required
              />
           </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="category">Category</label>
          <input
            id="category"
            className="form-input"
            type="text"
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="e.g., Cloud Services"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          <Icon path="M12 4.5v15m7.5-7.5h-15" />
          <span>Add Transaction</span>
        </button>
      </form>
    </div>
  );
}

export default AddExpenseForm;