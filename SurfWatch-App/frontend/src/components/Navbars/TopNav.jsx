import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './TopNav.css';

function TopNav() {
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);

  const handleSearchToggle = (e) => {
    e.preventDefault(); 
    setShowSearch((prev) => !prev);
  };

  return (
    <nav className="top-nav">
      <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}><img src="/assets/settings.svg" alt="Settings"/></Link>
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit'}} className={location.pathname === '/' ? 'active' : ''}><h1>SurfWatch</h1></Link>
      <a href="#" onClick={handleSearchToggle} className={showSearch ? 'active' : ''}><img src="/assets/search.svg" alt="Search"/></a>

      {showSearch && (
        <div className="search-overlay">
          <input type="text" placeholder="Search beaches... (Currently not functional)" className="search-input" />
        </div>
      )}
    </nav>
  );
}

export default TopNav;
