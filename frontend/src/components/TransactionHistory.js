import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { FiTrash2, FiDownload, FiSearch, FiFilter } from 'react-icons/fi';
import './TransactionHistory.css';

function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/transactions?limit=100');
      setTransactions(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await axios.delete(`http://127.0.0.1:8000/api/transactions/${id}`);
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction');
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/export/transactions');
      const blob = new Blob([response.data.csv_data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
    } catch (error) {
      console.error('Error exporting transactions:', error);
      alert('Failed to export transactions');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get unique categories
  const categories = [...new Set(transactions.map(t => t.category))];

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="transaction-history-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transaction History</h1>
          <p className="page-subtitle">View and manage all your transactions</p>
        </div>
        <button className="btn btn-primary" onClick={handleExport}>
          <FiDownload /> Export CSV
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-box">
          <FiFilter className="filter-icon" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="transactions-container">
        {loading ? (
          <div className="loading-state">Loading transactions...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions found</p>
          </div>
        ) : (
          <div className="transactions-table">
            <div className="table-header">
              <div className="th th-date">Date</div>
              <div className="th th-description">Description</div>
              <div className="th th-category">Category</div>
              <div className="th th-amount">Amount</div>
              <div className="th th-actions">Actions</div>
            </div>
            {filteredTransactions.map(transaction => (
              <div key={transaction.id} className="table-row">
                <div className="td td-date">
                  {format(new Date(transaction.date), 'MMM dd, yyyy')}
                </div>
                <div className="td td-description">
                  <div className="transaction-description">{transaction.description}</div>
                  {transaction.vendor && (
                    <div className="transaction-vendor">{transaction.vendor}</div>
                  )}
                </div>
                <div className="td td-category">
                  <span className="category-badge">{transaction.category}</span>
                </div>
                <div className="td td-amount">
                  <span className={transaction.amount < 0 ? 'amount-negative' : 'amount-positive'}>
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
                <div className="td td-actions">
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => handleDelete(transaction.id)}
                    title="Delete transaction"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TransactionHistory;
