import React from 'react';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="container">
        <a href="#dashboard" className="logo">
          {/* The letter 'F' has been removed from inside this div */}
          <div className="logo-icon"></div>
          <span className="logo-text">FinSight AI</span>
        </a>
        <ul className="nav-links">
          <li className="nav-link"><a href="#dashboard">Dashboard</a></li>
          <li className="nav-link"><a href="#tools">Tools</a></li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;

