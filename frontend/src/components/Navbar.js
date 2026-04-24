import React, { useState, useEffect, useRef } from "react";
import "./Navbar.css";
import { RiCloseLine, RiArrowDropDownLine, RiSearchLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const searchRef = useRef(null);
  const debounceRef = useRef(null);

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

  // Search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/products/search?q=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.products);
          setShowSearchDropdown(true);
        } else {
          setSearchResults([]);
          setShowSearchDropdown(false);
        }
      } catch (err) {
        console.error("Search error:", err);
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toSlug = (str) =>
    str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const handleNavigation = (path, state = {}) => {
    navigate(path, { state });
  };

  const handleProductClick = (product) => {
    setShowSearchDropdown(false);
    setSearchTerm("");
    navigate(`/product/${product.uuid}/${product.slug || ""}`);
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${API_URL}/${cleanPath}`;
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

          {/* Search Box with full-width dropdown */}
          <div className="search-box" ref={searchRef}>
            <div className="search-input-wrapper">
              <RiSearchLine className="search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchDropdown(true);
                }}
              />
            </div>

            {/* Dropdown - full width of viewport */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="search-dropdown-fullwidth">
                <div className="search-dropdown-container">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      className="search-result-item"
                      onClick={() => handleProductClick(product)}
                    >
                      <div className="search-result-img">
                        {product.main_image_url ? (
                          <img src={getImageUrl(product.main_image_url)} alt={product.name} />
                        ) : (
                          <div className="no-img">📷</div>
                        )}
                      </div>
                      <div className="search-result-info">
                        <div className="search-result-name">{product.name}</div>
                        {product.displayPrice && (
                          <div className="search-result-price">{product.displayPrice}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
          {/* ... rest of your existing nav links (unchanged) ... */}
          <ul className="navbar-nav d-flex flex-row">
            <li className="nav-item" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              <span className="nav-link">HOME</span>
            </li>

            {filteredMenuItems.map((item) => {
              const categorySlug = toSlug(item.name);
              const hasTypedOptions = item.category_without_print_count > 0 || item.category_custom_count > 0;
              const hasStandard = item.category_standard_count > 0;

              if (item.sub_categories && item.sub_categories.length > 0) {
                return (
                  <li key={item.id} className="nav-item dropdown dropdown-hover">
                    <span className="nav-link d-flex align-items-center gap-1" style={{ cursor: "pointer" }}>
                      {item.name.toUpperCase()}
                      <RiArrowDropDownLine size={20} />
                    </span>
                    <ul className="dropdown-menu">
                      {item.sub_categories.map((sub) => {
                        const showWithoutPrint = sub.without_print_count > 0;
                        const showCustom = sub.custom_count > 0;
                        const showStandard = sub.standard_count > 0;

                        if (showStandard && !showWithoutPrint && !showCustom) {
                          return (
                            <li
                              key={sub.id}
                              onClick={() =>
                                handleNavigation(`/subcategory/${sub.id}`, {
                                  subCategoryId: sub.id,
                                  subCategoryName: sub.name,
                                  parentCategoryId: item.id,
                                  parentCategoryName: item.name,
                                })
                              }
                              style={{ cursor: "pointer" }}
                            >
                              <span className="dropdown-item">{sub.name}</span>
                            </li>
                          );
                        }

                        return (
                          <li key={sub.id} className="dropdown-submenu">
                            <span className="dropdown-item d-flex justify-content-between align-items-center">
                              {sub.name}
                              <RiArrowDropDownLine size={18} />
                            </span>
                            <ul className="dropdown-menu nested-menu">
                              {showWithoutPrint && (
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
                              )}
                              {showCustom && (
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
                              )}
                            </ul>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              }

              if (hasTypedOptions) {
                return (
                  <li key={item.id} className="nav-item dropdown dropdown-hover">
                    <span className="nav-link d-flex align-items-center gap-1" style={{ cursor: "pointer" }}>
                      {item.name.toUpperCase()}
                      <RiArrowDropDownLine size={20} />
                    </span>
                    <ul className="dropdown-menu">
                      {item.category_without_print_count > 0 && (
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
                      )}
                      {item.category_custom_count > 0 && (
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
                      )}
                    </ul>
                  </li>
                );
              } else if (hasStandard) {
                return (
                  <li
                    key={item.id}
                    className="nav-item"
                    onClick={() =>
                      handleNavigation(`/category/${categorySlug}`, {
                        categoryId: item.id,
                        categoryName: item.name,
                      })
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <span className="nav-link">{item.name.toUpperCase()}</span>
                  </li>
                );
              } else {
                return null;
              }
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;