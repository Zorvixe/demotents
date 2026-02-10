import React, { useEffect, useState } from "react";
import "./Navbar.css";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = "https://demotents-backend.onrender.com/api";

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
            path: `/subcategory/${subCat.id}`,
            state: {
              subCategoryId: subCat.id,
              subCategoryName: subCat.name,
              parentCategoryId: category.id,
              parentCategoryName: category.name
            }
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

  const handleNavigation = (item) => {
    if (item.path) {
      navigate(item.path, { state: item.state || {} });
    }
  };

  // Generate URL-friendly path
  const generatePath = (name) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
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
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark navbar-custom fixed-top">
      <div className="container">
        {/* Logo */}
        <a className="navbar-brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <img src="/logo11.png" alt="logo" className="logo" />
        </a>

        {/* Mobile Toggle Button */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation Items */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {/* Home */}
            <li className="nav-item" onClick={() => navigate("/")}>
              <span className="nav-link" style={{ cursor: "pointer" }}>HOME</span>
            </li>

            {/* About Us */}
            <li className="nav-item" onClick={() => navigate("/about")}>
              <span className="nav-link" style={{ cursor: "pointer" }}>ABOUT US</span>
            </li>

            {/* Dynamic Categories from Backend */}
            {menuItems.map((item, index) => (
              <React.Fragment key={index}>
                {item.type === "dropdown" ? (
                  // Dropdown menu for categories with sub-categories
                  <li className="nav-item dropdown dropdown-hover">
                    <span className="nav-link dropdown-toggle" style={{ cursor: "pointer" }}>
                      {item.label}
                    </span>
                    <ul className="dropdown-menu">
                      {item.items.map((subItem, subIndex) => (
                        <li key={subIndex} onClick={() => handleNavigation(subItem)}>
                          <span className="dropdown-item" style={{ cursor: "pointer" }}>
                            {subItem.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : (
                  // Direct link for categories without sub-categories
                  <li className="nav-item" onClick={() => handleNavigation(item)}>
                    <span className="nav-link" style={{ cursor: "pointer" }}>
                      {item.label}
                    </span>
                  </li>
                )}
              </React.Fragment>
            ))}

            {/* Contact - Always visible */}
            <li className="nav-item" onClick={() => navigate("/contact")}>
              <span className="nav-link" style={{ cursor: "pointer" }}>CONTACT</span>
            </li>

            {/* All Categories Link */}
            <li className="nav-item" onClick={() => navigate("/categories")}>
              <span className="nav-link" style={{ cursor: "pointer" }}>ALL CATEGORIES</span>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;