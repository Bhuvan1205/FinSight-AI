import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiTrendingUp, FiBriefcase, FiDollarSign } from 'react-icons/fi';
import './Auth.css';

function Register() {
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cashOnHand, setCashOnHand] = useState('7500000');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const result = await register(
      companyName,
      email,
      password,
      parseFloat(cashOnHand)
    );

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo-container">
              <FiTrendingUp className="logo-icon-auth" />
              <h1 className="logo-text-auth">FinSight AI</h1>
            </div>
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-subtitle">Start managing your finances smarter</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="companyName" className="form-label">
                <FiBriefcase className="label-icon" />
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                className="form-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your Company Inc."
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <FiMail className="label-icon" />
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="cashOnHand" className="form-label">
                <FiDollarSign className="label-icon" />
                Cash on Hand (₹)
              </label>
              <input
                id="cashOnHand"
                type="number"
                className="form-input"
                value={cashOnHand}
                onChange={(e) => setCashOnHand(e.target.value)}
                placeholder="7500000"
                required
                disabled={loading}
              />
              <small className="form-hint">Your current available cash balance</small>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <FiLock className="label-icon" />
                Password
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                <FiLock className="label-icon" />
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-auth"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="auth-info">
          <h3>Why FinSight AI?</h3>
          <ul>
            <li>🚀 Get started in under 2 minutes</li>
            <li>🔒 Bank-level security for your data</li>
            <li>📊 Instant insights into your runway</li>
            <li>🎯 Make data-driven decisions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Register;
