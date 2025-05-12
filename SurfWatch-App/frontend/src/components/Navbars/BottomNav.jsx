import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './BottomNav.css';

function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <Link to="/" className={location.pathname === '/' ? 'active' : ''}><img src="/assets/home.svg" alt="Home"/></Link>
      <Link to="/explore" className={location.pathname === '/explore' ? 'active' : ''}><img src="/assets/logo.svg" alt="Explore"/></Link>
      <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}><img src="/assets/profile.svg" alt="Profile"/></Link>
    </nav>
  );
}

export default BottomNav;
