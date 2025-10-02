import React, { useState } from 'react';
import axios from 'axios';

// We pass a 'refreshData' function as a prop to this component
function AddExpenseForm({ refreshData }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = (event) => {
    // Prevent the browser from reloading the page
    event.preventDefault();

    // Create the new transaction object
    const newTransaction = {
      description: description,
      amount: -Math.abs(parseFloat(amount)), // Ensure amount is a negative number
      category: category,
    };

    // Send the data to the backend POST endpoint
    axios.post('http://127.0.0.1:8000/api/add_expense', newTransaction)
      .then(response => {
        alert('Expense Added Successfully!');
        // Clear the form fields
        setDescription('');
        setAmount('');
        setCategory('');
        // Call the refreshData function passed from App.js to update the dashboard
        refreshData();
      })
      .catch(error => {
        console.error("There was an error adding the expense!", error);
        alert('Failed to add expense.');
      });
  };

  return (
    <div className="form-card">
      <h3>Add New Expense</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description (e.g., AWS Bill)"
          required
        />
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Amount (e.g., 500)"
          required
        />
        <input
          type="text"
          value={category}
          onChange={e => setCategory(e.target.value)}
          placeholder="Category (e.g., Cloud)"
          required
        />
        <button type="submit">Add Expense</button>
      </form>
    </div>
  );
}

export default AddExpenseForm;