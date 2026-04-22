import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';
import { RiArrowDropDownLine } from 'react-icons/ri';

const API_URL = 'https://api.demotents.com';

const Navbar = () => {
  const [menuTree, setMenuTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/menu`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setMenuTree(data.menu);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getLink = (item) => {
    if (item.type === 'custom_link') return item.link_url;
    if (item.type === 'category' && item.target_id) {
      return `/category/${item.category_slug || item.target_id}`;
    }
    if (item.type === 'subcategory' && item.target_id) {
      return `/subcategory/${item.target_id}`;
    }
    return '#';
  };

  const renderMenuItem = (item) => {
    const hasChildren = item.children && item.children.length > 0;
    if (hasChildren) {
      return (
        <li key={item.id} className="nav-item dropdown dropdown-hover">
          <span className="nav-link d-flex align-items-center gap-1" style={{ cursor: 'pointer' }}>
            {item.title.toUpperCase()}
            <RiArrowDropDownLine size={20} />
          </span>
          <ul className="dropdown-menu">
            {item.children.map(child => (
              <li key={child.id} className={child.children?.length ? 'dropdown-submenu' : ''}>
                {child.children?.length ? (
                  <>
                    <span className="dropdown-item d-flex justify-content-between align-items-center">
                      {child.title}
                      <RiArrowDropDownLine size={18} />
                    </span>
                    <ul className="dropdown-menu nested-menu">
                      {child.children.map(grand => (
                        <li key={grand.id}>
                          <span className="dropdown-item" onClick={() => navigate(getLink(grand))}>
                            {grand.title}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <span className="dropdown-item" onClick={() => navigate(getLink(child))}>
                    {child.title}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </li>
      );
    }
    return (
      <li key={item.id} className="nav-item">
        <span className="nav-link" onClick={() => navigate(getLink(item))}>
          {item.title.toUpperCase()}
        </span>
      </li>
    );
  };

  if (loading) return <div className="navbar-loading">Loading menu...</div>;

  return (
    <nav className="navbar navbar-dark bg-dark navbar-custom fixed-top">
      <div className="container flex-column">
        <div className="d-flex w-100 align-items-center justify-content-between top-row">
          <div className="navbar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <h1 className="Logo-Text">Demotents.com</h1>
          </div>
          {/* optional search box */}
        </div>
        <div className="w-100 mt-2 nav-links">
          <ul className="navbar-nav d-flex flex-row">
            <li className="nav-item" onClick={() => navigate('/')}>
              <span className="nav-link">HOME</span>
            </li>
            {menuTree.map(item => renderMenuItem(item))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;