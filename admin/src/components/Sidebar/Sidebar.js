import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiPlusCircle, FiClipboard, FiBox, FiFolder, FiGrid, FiChevronLeft, FiChevronRight, FiBarChart2, FiMenu, FiVideo } from 'react-icons/fi';
import './Siderbar.css';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-options">
        <NavLink to="/" className="sidebar-option">
          <FiBarChart2 size={22} />
          <p>Dashboard</p>
        </NavLink>
        <NavLink to="/add" className="sidebar-option">
          <FiPlusCircle size={22} />
          <p>Add Items</p>
        </NavLink>
        <NavLink to="/list" className="sidebar-option">
          <FiClipboard size={22} />
          <p>List Items</p>
        </NavLink>
        <NavLink to="/menu" className="sidebar-option">
          <FiMenu size={22} />
          <p>Menu</p>
        </NavLink>
        <NavLink to="/videos" className="sidebar-option">
          <FiVideo size={22} />
          <p>Videos</p>
        </NavLink>
        <NavLink to="/new-category" className="sidebar-option">
          <FiFolder size={22} />
          <p>New Category</p>
        </NavLink>
        <NavLink to="/sub-category" className="sidebar-option">
          <FiGrid size={22} />
          <p>Sub Category</p>
        </NavLink>
      </div>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {isCollapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
      </button>
    </div>
  );
};

export default Sidebar;