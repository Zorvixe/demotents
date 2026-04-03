import React, { useState } from "react";
import "./Navbar.css";
import { RiCloseLine } from "react-icons/ri";
import { RiArrowDropDownLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { useCategories } from "../App"; // import from App.js

const Navbar = () => {
  const navigate = useNavigate();
  const { categories, BASE_URL } = useCategories(); // get global categories
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Transform categories into navigation structure (same as before)
  const transformCategoriesToNav = (categoriesData) => {
    const navItems = [];
    const sortedCategories = [...categoriesData].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    sortedCategories.forEach(category => {
      const hasSubCategories = category.sub_categories && category.sub_categories.length > 0;
      if (hasSubCategories) {
        navItems.push({
          type: "dropdown",
          label: category.name.toUpperCase(),
          items: category.sub_categories.map(subCat => ({
            label: subCat.name,
            children: [
              { label: "Without Print", path: `/subcategory/${subCat.id}?type=without-print` },
              { label: "With Customization", path: `/subcategory/${subCat.id}?type=custom` }
            ]
          }))
        });
      } else {
        navItems.push({
          type: "link",
          label: category.name.toUpperCase(),
          path: `/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`,
          state: { categoryId: category.id, categoryName: category.name }
        });
      }
    });
    return navItems;
  };

  const menuItems = transformCategoriesToNav(categories);

  const filteredMenuItems = menuItems
    .map(item => {
      if (item.type === "dropdown") {
        const filteredSubItems = item.items.filter(sub =>
          sub.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filteredSubItems.length > 0 || item.label.toLowerCase().includes(searchTerm.toLowerCase())) {
          return { ...item, items: filteredSubItems };
        }
        return null;
      } else {
        return item.label.toLowerCase().includes(searchTerm.toLowerCase()) ? item : null;
      }
    })
    .filter(Boolean);

  const handleNavigation = (item) => {
    if (item.path) navigate(item.path, { state: item.state || {} });
  };

  return (
    <nav className="navbar navbar-dark bg-dark navbar-custom fixed-top">
      <div className="container flex-column">
        {/* Row 1 */}
        <div className="d-flex w-100 align-items-center justify-content-between top-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="navbar-brand m-0 text-center" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <h1 className="Logo-Text">Demotents.com</h1>
          </div>
          <div className="nav-item" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <span className="nav-link">HOME</span>
          </div>
          <div className="menu" onClick={toggleMenu}>
            {menuOpen ? <RiCloseLine size={28} color="white" /> : <><span></span><span></span><span></span></>}
          </div>
        </div>

        {/* Row 2 */}
        <div className={`w-100 mt-2 nav-links ${menuOpen ? "active" : ""}`}>
          <ul className="navbar-nav d-flex flex-row justify-content-center flex-wrap">
            {filteredMenuItems.map((item, index) => (
              <React.Fragment key={index}>
                {item.type === "dropdown" ? (
                  <li className="nav-item dropdown dropdown-hover">
                    <span className="nav-link d-flex align-items-center gap-1">
                      {item.label} <RiArrowDropDownLine size={20} />
                    </span>
                    <ul className={`dropdown-menu ${searchTerm ? "show-dropdown" : ""}`}>
                      {item.items.map((subItem, subIndex) => (
                        <li key={subIndex} className="dropdown-submenu">
                          <span className="dropdown-item">{subItem.label}</span>
                          <ul className="dropdown-menu nested-menu">
                            {subItem.children.map((child, i) => (
                              <li key={i} onClick={() => handleNavigation(child)}>
                                <span className="dropdown-item">{child.label}</span>
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : (
                  <li className="nav-item" onClick={() => handleNavigation(item)}>
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