import React, { useState } from "react";
import "./Navbar.css";
import { RiCloseLine, RiArrowDropDownLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { useCategories } from "../App";

const Navbar = () => {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Transform categories
  const transformCategoriesToNav = (categoriesData) => {
    return categoriesData
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(category => {
        const hasSubCategories = category.sub_categories && category.sub_categories.length > 0;

        if (hasSubCategories) {
          return {
            type: "dropdown",
            label: category.name.toUpperCase(),
            categoryId: category.id,
            categoryName: category.name,
            path: `/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`,
            subItems: category.sub_categories.map(subCat => ({
              label: subCat.name,
              subCatId: subCat.id,
            }))
          };
        } else {
          return {
            type: "link",
            label: category.name.toUpperCase(),
            path: `/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`,
            state: { categoryId: category.id, categoryName: category.name }
          };
        }
      });
  };

  const menuItems = transformCategoriesToNav(categories);

  // Filter only main categories
  const filteredMenuItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNavigation = (path, state = {}) => {
    navigate(path, { state });
  };

  return (
    <nav className="navbar navbar-dark bg-dark navbar-custom fixed-top">
      <div className="container flex-column">
        {/* Top Row */}
        <div className="d-flex w-100 align-items-center justify-content-between top-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div 
            className="navbar-brand m-0 text-center" 
            onClick={() => navigate("/")} 
            style={{ cursor: "pointer" }}
          >
            <h1 className="Logo-Text">Demotents.com</h1>
          </div>

          

          <div className="menu" onClick={toggleMenu}>
            {menuOpen ? <RiCloseLine size={28} color="white" /> : <><span></span><span></span><span></span></>}
          </div>
        </div>

        {/* Navigation Links */}
        <div className={`w-100 mt-2 nav-links ${menuOpen ? "active" : ""}`}>
          
          <ul className="navbar-nav d-flex flex-row justify-content-center flex-wrap">
            <div className="nav-item" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <span className="nav-link">HOME</span>
          </div>
         
            {filteredMenuItems.map((item, index) => (
              <React.Fragment key={index}>
                {item.type === "dropdown" && searchTerm === "" ? (
                  // === Normal Dropdown Mode (only when search is empty) ===
                  <li className="nav-item dropdown dropdown-hover">
                    <span 
                      className="nav-link d-flex align-items-center gap-1"
                      onClick={() => handleNavigation(item.path, { 
                        categoryId: item.categoryId, 
                        categoryName: item.categoryName 
                      })}
                      style={{ cursor: "pointer" }}
                    >
                      {item.label} 
                      <RiArrowDropDownLine size={20} />
                    </span>

                    {/* Subcategories Dropdown */}
                    <ul className="dropdown-menu">
                      {item.subItems.map((subItem, subIndex) => (
                        <li key={subIndex} className="dropdown-submenu">
                          <span className="dropdown-item d-flex justify-content-between align-items-center">
                            {subItem.label}
                            <RiArrowDropDownLine size={18} />
                          </span>

                          {/* Second Level */}
                          <ul className="dropdown-menu nested-menu">
                            <li 
                              onClick={() => handleNavigation(
                                `/subcategory/${subItem.subCatId}?type=without-print`
                              )}
                            >
                              <span className="dropdown-item">Without Print</span>
                            </li>
                            <li 
                              onClick={() => handleNavigation(
                                `/subcategory/${subItem.subCatId}?type=custom`
                              )}
                            >
                              <span className="dropdown-item">With Customization</span>
                            </li>
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : (
                  // === Simple Link Mode (when searching OR no subcategories) ===
                  <li 
                    className="nav-item"
                    onClick={() => handleNavigation(item.path, { 
                      categoryId: item.categoryId, 
                      categoryName: item.categoryName 
                    })}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="nav-link">{item.label}</span>
                  </li>
                )}
              </React.Fragment>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;