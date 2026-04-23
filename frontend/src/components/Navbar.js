// src/components/Navbar.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RiCloseLine, RiArrowDropDownLine } from "react-icons/ri";
import "./Navbar.css";

const API_URL = process.env.REACT_APP_API_URL || "https://api.demotents.com";

const Navbar = () => {
  const navigate = useNavigate();
  const [menuTree, setMenuTree] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(`${API_URL}/api/menu`);
        if (!response.ok) throw new Error("Failed to fetch menu");
        const data = await response.json();
        if (data.success) {
          setMenuTree(data.menu);
        } else {
          console.error("API returned error:", data.message);
        }
      } catch (error) {
        console.error("Navbar fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Filter menu items (only root level for search visibility)
  const filteredMenu = menuTree.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate URL for a menu item based on its type
  const getItemUrl = (item) => {
    if (item.url) return item.url; // custom external or internal URL
    switch (item.link_to) {
      case "category":
        return `/category/${item.slug}`;
      case "sub_category":
        return `/subcategory/${item.link_id}`;
      case "page":
        return `/page/${item.slug}`;
      default:
        return `/${item.slug}`;
    }
  };

  // Recursive render function for nested menus
  const renderMenuItems = (items, isDropdown = false) => {
    return items.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const itemUrl = getItemUrl(item);

      if (hasChildren) {
        // Dropdown parent
        return (
          <li key={item.id} className="nav-item dropdown dropdown-hover">
            <span
              className="nav-link d-flex align-items-center gap-1"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(itemUrl)}
            >
              {item.name.toUpperCase()}
              <RiArrowDropDownLine size={20} />
            </span>
            <ul className="dropdown-menu">
              {renderMenuItems(item.children, true)}
            </ul>
          </li>
        );
      } else {
        // Simple link
        return (
          <li key={item.id} className="nav-item">
            <Link to={itemUrl} className="nav-link">
              {item.name.toUpperCase()}
            </Link>
          </li>
        );
      }
    });
  };

  if (loading) {
    return (
      <nav className="navbar navbar-dark bg-dark navbar-custom fixed-top">
        <div className="container flex-column">
          <div className="d-flex w-100 align-items-center justify-content-between top-row">
            <div className="navbar-brand m-0 text-center">
              <h1 className="Logo-Text">Demotents.com</h1>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar navbar-dark bg-dark navbar-custom fixed-top">
      <div className="container flex-column">
        <div className="d-flex w-100 align-items-center justify-content-between top-row">
          <div
            className="navbar-brand m-0 text-center"
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            <h1 className="Logo-Text">Demotents.com</h1>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="menu" onClick={toggleMenu}>
            {menuOpen ? (
              <RiCloseLine size={28} color="white" />
            ) : (
              <>
                <span></span>
                <span></span>
                <span></span>
              </>
            )}
          </div>
        </div>

        <div className={`w-100 mt-2 nav-links ${menuOpen ? "active" : ""}`}>
          <ul className="navbar-nav d-flex flex-row">
            <li className="nav-item" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              <span className="nav-link">HOME</span>
            </li>
            {filteredMenu.length > 0 && renderMenuItems(filteredMenu)}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;