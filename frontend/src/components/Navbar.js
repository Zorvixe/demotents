import React, { useState, useEffect, useRef } from "react";
import "./Navbar.css";
import { RiCloseLine, RiArrowDropDownLine, RiSearchLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
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
      setSearchSuggestions([]);
      setShowSearchDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/products/search?q=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        if (data.success && (data.products.length > 0 || data.suggestions.length > 0)) {
          setSearchResults(data.products);
          setSearchSuggestions(data.suggestions);
          setShowSearchDropdown(true);
        } else {
          setSearchResults([]);
          setSearchSuggestions([]);
          setShowSearchDropdown(false);
        }
      } catch (err) {
        console.error("Search error:", err);
        setSearchResults([]);
        setSearchSuggestions([]);
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

  // Helper to highlight matching text
  const highlightMatch = (text, match) => {
    if (!match || !text) return text;
    const parts = text.split(new RegExp(`(${match})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === match.toLowerCase() ? 
        <span key={index} className="search-highlight">{part}</span> : part
    );
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

          {/* Search Box */}
          <div className="search-box" ref={searchRef}>
            <div className="search-input-wrapper">
              <RiSearchLine className="search-icon" />
              <input
                type="text"
                placeholder="Search products, colors, categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0 || searchSuggestions.length > 0) setShowSearchDropdown(true);
                }}
              />
              {searchTerm && (
                <RiCloseLine 
                  className="clear-icon" 
                  onClick={() => {
                    setSearchTerm('');
                    setShowSearchDropdown(false);
                  }} 
                />
              )}
            </div>

            {/* Mega Search Dropdown like Reference Image */}
            {showSearchDropdown && (
              <div className="search-dropdown-fullwidth">
                <div className="search-dropdown-container">
                  
                  {/* Left Column: Suggestions */}
                  <div className="search-suggestions-col">
                    <h6 className="dropdown-heading">SUGGESTIONS</h6>
                    <ul className="suggestion-list">
                      {searchSuggestions.map((sug, idx) => (
                        <li key={idx} onClick={() => setSearchTerm(sug)}>
                          {highlightMatch(sug, searchTerm)}
                        </li>
                      ))}
                      <li className="search-for-text" onClick={() => setShowSearchDropdown(false)}>
                        Search for "{searchTerm}" &rarr;
                      </li>
                    </ul>
                  </div>

                  {/* Right Column: Products */}
                  <div className="search-products-col">
                    <h6 className="dropdown-heading">PRODUCTS</h6>
                    <div className="search-products-grid">
                      {searchResults.length > 0 ? (
                        searchResults.map((product) => (
                          <div
                            key={product.id}
                            className="search-product-card"
                            onClick={() => handleProductClick(product)}
                          >
                            <div className="search-product-img">
                              {product.main_image_url ? (
                                <img src={getImageUrl(product.main_image_url)} alt={product.name} />
                              ) : (
                                <div className="no-img">📷</div>
                              )}
                            </div>
                            <div className="search-product-details">
                              <span className="search-product-category">
                                {product.category_name || "Demotents"}
                              </span>
                              <span className="search-product-title">
                                {highlightMatch(product.name, searchTerm)}
                              </span>
                              <div className="search-price-container">
                                {product.originalPrice && product.discount && (
                                  <span className="search-original-price">{product.originalPrice}</span>
                                )}
                                {product.displayPrice && (
                                  <span className="search-price">{product.displayPrice}</span>
                                )}
                                {product.discount && (
                                  <span className="search-discount">({product.discount}% OFF)</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-results-text">No exact products found.</p>
                      )}
                    </div>
                  </div>

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

        {/* Existing Navbar Links Block */}
        <div className={`w-100 mt-2 nav-links ${menuOpen ? "active" : ""}`}>
          <ul className="navbar-nav d-flex flex-row">
            <li className="nav-item" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              <span className="nav-link">HOME</span>
            </li>
            {menuItems.map((item) => {
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
                              onClick={() => handleNavigation(`/subcategory/${sub.id}`, { subCategoryId: sub.id, subCategoryName: sub.name, parentCategoryId: item.id, parentCategoryName: item.name })}
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
                                <li onClick={() => handleNavigation(`/subcategory/${sub.id}?type=without-print`, { subCategoryId: sub.id, subCategoryName: sub.name, parentCategoryId: item.id, parentCategoryName: item.name })}>
                                  <span className="dropdown-item">Without Print</span>
                                </li>
                              )}
                              {showCustom && (
                                <li onClick={() => handleNavigation(`/subcategory/${sub.id}?type=custom`, { subCategoryId: sub.id, subCategoryName: sub.name, parentCategoryId: item.id, parentCategoryName: item.name })}>
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
                        <li onClick={() => handleNavigation(`/category/${categorySlug}?type=without-print`, { categoryId: item.id, categoryName: item.name })}>
                          <span className="dropdown-item">Without Print</span>
                        </li>
                      )}
                      {item.category_custom_count > 0 && (
                        <li onClick={() => handleNavigation(`/category/${categorySlug}?type=custom`, { categoryId: item.id, categoryName: item.name })}>
                          <span className="dropdown-item">With Customization</span>
                        </li>
                      )}
                    </ul>
                  </li>
                );
              } else if (hasStandard) {
                return (
                  <li key={item.id} className="nav-item" onClick={() => handleNavigation(`/category/${categorySlug}`, { categoryId: item.id, categoryName: item.name })} style={{ cursor: "pointer" }}>
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