import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { FiTrendingUp, FiHome, FiDollarSign, FiActivity, FiBarChart2, FiUpload, FiLogOut, FiUser } from 'react-icons/fi';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="logo">
          <div className="logo-icon">
            <FiTrendingUp />
          </div>
          <span className="logo-text">FinSight AI</span>
        </Link>

        <ul className="nav-links">
          <li className="nav-link">
            <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
              <FiHome /> Dashboard
            </Link>
          </li>
          <li className="nav-link">
            <Link to="/transactions" className={isActive('/transactions') ? 'active' : ''}>
              <FiDollarSign /> Transactions
            </Link>
          </li>
          <li className="nav-link">
            <Link to="/upload" className={isActive('/upload') ? 'active' : ''}>
              <FiUpload /> Upload Data
            </Link>
          </li>
          <li className="nav-link">
            <Link to="/tools" className={isActive('/tools') ? 'active' : ''}>
              <FiBarChart2 /> Tools
            </Link>
          </li>
          <li className="nav-link">
            <Link to="/activity" className={isActive('/activity') ? 'active' : ''}>
              <FiActivity /> Activity
            </Link>
          </li>
        </ul>

        <div className="nav-user">
          <div className="user-info">
            <FiUser className="user-icon" />
            <span className="user-name">{user?.company_name}</span>
          </div>
          <button onClick={handleLogout} className="btn-logout" title="Logout">
            <FiLogOut />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
