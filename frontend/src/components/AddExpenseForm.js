import React, { useState } from 'react';
import axios from 'axios';
import { FiPlus, FiDollarSign } from 'react-icons/fi';
import './Components.css';

function AddExpenseForm() {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const newTransaction = {
      description: description,
      amount: -Math.abs(parseFloat(amount)),
      category: category,
      vendor: vendor || null,
      date: date
    };

    try {
      await axios.post('http://127.0.0.1:8000/api/transactions', newTransaction);
      alert('Expense Added Successfully!');
      setDescription('');
      setAmount('');
      setCategory('');
      setVendor('');
      setDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error("There was an error adding the expense!", error);
      alert('Failed to add expense.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon-header">
          <FiPlus />
        </div>
        <div>
          <h2 className="card-title">Add Expense</h2>
          <p className="card-subtitle">Log a new transaction to update your runway</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="expense-form">
        <div className="form-group">
          <label className="form-label" htmlFor="date">Date</label>
          <input
            id="date"
            className="form-input"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            disabled={loading}
          />
        </div>

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
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="amount">Amount (₹)</label>
          <div className="input-with-icon">
            <FiDollarSign className="input-icon-left" />
            <input
              id="amount"
              className="form-input input-with-icon-padding"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="5000"
              required
              disabled={loading}
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
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="vendor">Vendor (Optional)</label>
          <input
            id="vendor"
            className="form-input"
            type="text"
            value={vendor}
            onChange={e => setVendor(e.target.value)}
            placeholder="e.g., Amazon Web Services"
            disabled={loading}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          <FiPlus />
          {loading ? 'Adding...' : 'Add Transaction'}
        </button>
      </form>
    </div>
  );
}

export default AddExpenseForm;
