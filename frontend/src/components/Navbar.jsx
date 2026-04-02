import React, { useEffect, useState } from "react";
import "./Navbar.css";
import { RiCloseLine } from "react-icons/ri";
import { RiArrowDropDownLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const API_URL = `${"https://demotents-dhia.onrender.com" || "http://localhost:5004"}/api`;
  

  const toggleMenu = () => {
  setMenuOpen(!menuOpen);
};
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        
        // Fetch categories with sub-categories
        const res = await fetch(`${API_URL}/categories?includeSubCategories=true`);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        
        const data = await res.json();

        if (data.success && data.categories.length > 0) {
          // Transform backend categories into navigation structure
          const navItems = transformCategoriesToNav(data.categories);
          setMenuItems(navItems);
        } else {
          // No categories found
          setMenuItems([]);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        // If API fails, show empty navigation
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Function to transform backend categories to navigation structure
  const transformCategoriesToNav = (categoriesData) => {
    const navItems = [];
    
    // Sort categories alphabetically
    const sortedCategories = [...categoriesData].sort((a, b) => 
      a.name.localeCompare(b.name)
    );

    // Create navigation items for each category
    sortedCategories.forEach(category => {
      const hasSubCategories = category.sub_categories && category.sub_categories.length > 0;
      
      if (hasSubCategories) {
        // Category with sub-categories becomes a dropdown
        navItems.push({
          type: "dropdown",
          label: category.name.toUpperCase(),
          items: category.sub_categories.map(subCat => ({
  label: subCat.name,
  children: [
    {
      label: "Without Print",
      path: `/subcategory/${subCat.id}?type=without-print`,
    },
    {
      label: "With Customization",
      path: `/subcategory/${subCat.id}?type=custom`,
    }
  ]
}))
        });
      } else {
        // Category without sub-categories becomes a direct link
        navItems.push({
          type: "link",
          label: category.name.toUpperCase(),
          path: `/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`,
          state: {
            categoryId: category.id,
            categoryName: category.name
          }
        });
      }
    });

    return navItems;
  };

  const filteredMenuItems = menuItems
  .map(item => {
    if (item.type === "dropdown") {
      const filteredSubItems = item.items.filter(sub =>
        sub.label.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Show category if subcategories match OR category matches
      if (
        filteredSubItems.length > 0 ||
        item.label.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return {
          ...item,
          items: filteredSubItems,
        };
      }
      return null;
    } else {
      return item.label.toLowerCase().includes(searchTerm.toLowerCase())
        ? item
        : null;
    }
  })
  .filter(Boolean);

  const handleNavigation = (item) => {
    if (item.path) {
      navigate(item.path, { state: item.state || {} });
    }
  };

  

  if (loading) {
    return (
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark navbar-custom fixed-top">
        <div className="container">
          <a className="navbar-brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <img src="/logo11.png" alt="logo" className="logo" />
          </a>
          <div className="navbar-nav ms-auto">
            <span className="nav-link">Loading...</span>
          </div>
        </div>
      </nav>
    );
  }

  return (
  <nav className="navbar navbar-dark bg-dark navbar-custom fixed-top">
    <div className="container flex-column">

      {/* ===== Row 1 ===== */}
      <div className="d-flex w-100 align-items-center justify-content-between top-row">

        {/* Empty space (left) */}
     <div className="search-box">
  <input
    type="text"
    placeholder="Search category..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</div>

        {/* Logo - Center */}
        <div
          className="navbar-brand m-0 text-center"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <h1 className = "Logo-Text">Demotents.com</h1>
        </div>

        {/* Home - Right */}
        <div
          className="nav-item"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <span className="nav-link">HOME</span>
        </div>
        {/* Hamburger Menu (Mobile) */}
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

      {/* ===== Row 2 ===== */}
      <div className={`w-100 mt-2 nav-links ${menuOpen ? "active" : ""}`}>
      
        <ul className="navbar-nav d-flex flex-row justify-content-center flex-wrap">

          

          {/* Dynamic Categories */}
         {filteredMenuItems.map((item, index) => (
            <React.Fragment key={index}>
              {item.type === "dropdown" ? (
                <li className="nav-item dropdown dropdown-hover">
  <span className="nav-link d-flex align-items-center gap-1">
    {item.label}
    <RiArrowDropDownLine size={20} />
  </span>

  <ul className="dropdown-menu">
    {item.items.map((subItem, subIndex) => (
      <li key={subIndex} className="dropdown-submenu">

        <span className="dropdown-item">
          {subItem.label}
        </span>

        {/* 🔥 LEVEL 3 */}
        <ul className="dropdown-menu nested-menu">
          {subItem.children.map((child, i) => (
            <li key={i} onClick={() => handleNavigation(child)}>
              <span className="dropdown-item">
                {child.label}
              </span>
            </li>
          ))}
        </ul>

      </li>
    ))}
  </ul>
</li>
              ) : (
                <li
                  className="nav-item"
                  onClick={() => handleNavigation(item)}
                >
                  <span className="nav-link">{item.label}</span>
                </li>
              )}
            </React.Fragment>
          ))}

          

          {/* All Categories */}
          {/* <li className="nav-item" onClick={() => navigate("/categories")}>
            <span className="nav-link">ALL CATEGORIES</span>
          </li> */}

        </ul>
      </div>

    </div>
  </nav>
);
};

export default Navbar; 