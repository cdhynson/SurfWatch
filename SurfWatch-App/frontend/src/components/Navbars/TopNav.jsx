import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './TopNav.css';

function TopNav() {
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);

  const handleSearchToggle = (e) => {
    e.preventDefault(); // prevent default link behavior
    setShowSearch((prev) => !prev);
  };

  return (
    <nav className="top-nav">
      <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>Settings</Link>
      <Link to="/" className={location.pathname === '/' ? 'active' : ''}>SurfWatch</Link>
      <a href="#" onClick={handleSearchToggle} className={showSearch ? 'active' : ''}>Search</a>

      {showSearch && (
        <div className="search-overlay">
          <input type="text" placeholder="Search beaches..." className="search-input" />
        </div>
      )}
    </nav>
  );
}

export default TopNav;
