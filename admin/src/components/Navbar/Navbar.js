import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext/AuthContext.js';
import './Navbar.css';
import profileImg from '../../assets/profile.jpg';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleProfileClick = () => {
    if (isAuthenticated) {
      setDropdownOpen((prev) => !prev);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="navbar">
      <div
        className="navbar-brand m-0 text-center"
        onClick={() => navigate('/')}
        style={{ cursor: 'pointer' }}
      >
        <h1 className="Logo-Text">Demotents.com</h1>
      </div>

      <div className="profile-wrapper" ref={dropdownRef}>
        <img
          className="profile"
          src={profileImg}
          alt="Profile"
          onClick={handleProfileClick}
        />
        {isAuthenticated && dropdownOpen && (
          <div className="dropdown-menu">
            <button onClick={handleLogout} className="dropdown-item">
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;