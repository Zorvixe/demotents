import React, { useState, useEffect } from "react";
import "./Navbar.css";
import { RiCloseLine, RiArrowDropDownLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_URL = "https://api.demotents.com";

  useEffect(() => {
    const fetchNavbarMenu = async () => {
      try {
        const response = await fetch(`${API_URL}/api/navbar-menu`);
        if (!response.ok) throw new Error("API failed");
        const data = await response.json();
        if (data.success) {
          setMenuItems(data.menu || []);
        }
      } catch (error) {
        console.error("❌ Navbar fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNavbarMenu();
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to generate URL‑friendly slug
  const toSlug = (str) =>
    str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const handleNavigation = (path, state = {}) => {
    navigate(path, { state });
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
              <><span></span><span></span><span></span></>
            )}
          </div>
        </div>

        <div className={`w-100 mt-2 nav-links ${menuOpen ? "active" : ""}`}>
          <ul className="navbar-nav d-flex flex-row">
            <li className="nav-item" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              <span className="nav-link">HOME</span>
            </li>

            {filteredMenuItems.map((item) => {
              const categorySlug = toSlug(item.name);
              return (
                <React.Fragment key={item.id}>
                  {item.sub_categories && item.sub_categories.length > 0 ? (
                    // Category with subcategories – shows subcategories with print options
                    <li className="nav-item dropdown dropdown-hover">
                      <span className="nav-link d-flex align-items-center gap-1" style={{ cursor: "pointer" }}>
                        {item.name.toUpperCase()}
                        <RiArrowDropDownLine size={20} />
                      </span>
                      <ul className="dropdown-menu">
                        {item.sub_categories.map((sub, index) => (
                          <li key={index} className="dropdown-submenu">
                            <span className="dropdown-item d-flex justify-content-between align-items-center">
                              {sub.name}
                              <RiArrowDropDownLine size={18} />
                            </span>
                            <ul className="dropdown-menu nested-menu">
                              <li
                                onClick={() =>
                                  handleNavigation(`/subcategory/${sub.id}?type=without-print`, {
                                    subCategoryId: sub.id,
                                    subCategoryName: sub.name,
                                    parentCategoryId: item.id,
                                    parentCategoryName: item.name,
                                  })
                                }
                              >
                                <span className="dropdown-item">Without Print</span>
                              </li>
                              <li
                                onClick={() =>
                                  handleNavigation(`/subcategory/${sub.id}?type=custom`, {
                                    subCategoryId: sub.id,
                                    subCategoryName: sub.name,
                                    parentCategoryId: item.id,
                                    parentCategoryName: item.name,
                                  })
                                }
                              >
                                <span className="dropdown-item">With Customization</span>
                              </li>
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ) : (
                    // Simple category (no subcategories) – show dropdown with print options
                    <li className="nav-item dropdown dropdown-hover">
                      <span className="nav-link d-flex align-items-center gap-1" style={{ cursor: "pointer" }}>
                        {item.name.toUpperCase()}
                        <RiArrowDropDownLine size={20} />
                      </span>
                      <ul className="dropdown-menu">
                        <li
                          onClick={() =>
                            handleNavigation(`/category/${categorySlug}?type=without-print`, {
                              categoryId: item.id,
                              categoryName: item.name,
                            })
                          }
                        >
                          <span className="dropdown-item">Without Print</span>
                        </li>
                        <li
                          onClick={() =>
                            handleNavigation(`/category/${categorySlug}?type=custom`, {
                              categoryId: item.id,
                              categoryName: item.name,
                            })
                          }
                        >
                          <span className="dropdown-item">With Customization</span>
                        </li>
                      </ul>
                    </li>
                  )}
                </React.Fragment>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;