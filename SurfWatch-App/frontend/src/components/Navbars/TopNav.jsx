import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './TopNav.css';

function TopNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>Profile</Link>
      <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
      <Link to="/search" className={location.pathname === '/search' ? 'active' : ''}>Explore</Link>
    </nav>
  );
}

export default TopNav;