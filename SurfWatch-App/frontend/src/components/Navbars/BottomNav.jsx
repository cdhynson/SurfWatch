import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './BottomNav.css';

function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
      <Link to="/explore" className={location.pathname === '/explore' ? 'active' : ''}>Explore</Link>
      <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>Profile</Link>
    </nav>
  );
}

export default BottomNav;
