import React, { useState, useEffect, useRef, useCallback } from "react";
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
  const [isSearching, setIsSearching] = useState(false);

  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const searchInputRef = useRef(null);

  const API_URL = "https://api.demotents.com";

  // Fetch navbar menu on mount
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

  // Perform search with debounce
  const performSearch = useCallback(async (query) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setSearchSuggestions([]);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);

    try {
      const res = await fetch(
        `${API_URL}/api/products/search?q=${encodeURIComponent(query.trim())}`
      );
      
      if (!res.ok) {
        throw new Error(`Search failed with status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        setSearchResults(data.products || []);
        setSearchSuggestions(data.suggestions || []);
        
        // Show dropdown if we have any results or suggestions
        if (data.products.length > 0 || data.suggestions.length > 0) {
          setShowSearchDropdown(true);
        } else {
          setShowSearchDropdown(false);
        }
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
    } finally {
      setIsSearching(false);
    }
  }, [API_URL]);

  // Debounced search effect
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchTerm.trim().length > 0) {
      debounceRef.current = setTimeout(() => {
        performSearch(searchTerm);
      }, 300);
    } else {
      setSearchResults([]);
      setSearchSuggestions([]);
      setShowSearchDropdown(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, performSearch]);

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
    setMenuOpen(false); // Close mobile menu
    navigate(path, { state });
  };

  const handleProductClick = (product) => {
    setShowSearchDropdown(false);
    setSearchTerm("");
    if (product.uuid) {
      navigate(`/product/${product.uuid}/${product.slug || ""}`);
    } else if (product.id) {
      navigate(`/product/${product.id}/${product.slug || ""}`);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_URL}${cleanPath}`;
  };

  // Helper to highlight matching text
  const highlightMatch = (text, searchQuery) => {
    if (!text || !searchQuery) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <span key={index} className="search-highlight">{part}</span> : 
        part
    );
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setShowSearchDropdown(true);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
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
          {/* Logo */}
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
                ref={searchInputRef}
                type="text"
                placeholder="Search products, colors, categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0 || searchSuggestions.length > 0) {
                    setShowSearchDropdown(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowSearchDropdown(false);
                  }
                }}
              />
              {isSearching && (
                <span className="search-loading-spinner"></span>
              )}
              {searchTerm && !isSearching && (
                <RiCloseLine 
                  className="clear-icon" 
                  onClick={() => {
                    setSearchTerm('');
                    setShowSearchDropdown(false);
                    setSearchResults([]);
                    setSearchSuggestions([]);
                    if (searchInputRef.current) {
                      searchInputRef.current.focus();
                    }
                  }} 
                />
              )}
            </div>

            {/* Search Dropdown */}
            {showSearchDropdown && (searchResults.length > 0 || searchSuggestions.length > 0) && (
              <div className="search-dropdown-fullwidth">
                <div className="search-dropdown-container">
                  
                  {/* Left Column: Suggestions */}
                  {searchSuggestions.length > 0 && (
                    <div className="search-suggestions-col">
                      <h6 className="dropdown-heading">SUGGESTIONS</h6>
                      <ul className="suggestion-list">
                        {searchSuggestions.map((sug, idx) => (
                          <li 
                            key={idx} 
                            onClick={() => handleSuggestionClick(sug)}
                            className="suggestion-item"
                          >
                            <RiSearchLine className="suggestion-icon" />
                            {highlightMatch(sug, searchTerm)}
                          </li>
                        ))}
                        <li 
                          className="search-for-text" 
                          onClick={() => {
                            setShowSearchDropdown(false);
                            navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
                          }}
                        >
                          <RiSearchLine className="suggestion-icon" />
                          Search for "{searchTerm}"
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* Right Column: Products */}
                  <div className="search-products-col">
                    {searchResults.length > 0 ? (
                      <>
                        <h6 className="dropdown-heading">PRODUCTS</h6>
                        <div className="search-products-grid">
                          {searchResults.map((product) => (
                            <div
                              key={product.id}
                              className="search-product-card"
                              onClick={() => handleProductClick(product)}
                            >
                              <div className="search-product-img">
                                {product.main_image_url ? (
                                  <img 
                                    src={getImageUrl(product.main_image_url)} 
                                    alt={product.name}
                                    loading="lazy"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className="no-img-placeholder"
                                  style={{ display: product.main_image_url ? 'none' : 'flex' }}
                                >
                                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <circle cx="8.5" cy="8.5" r="2.5" />
                                    <path d="M21 15l-5-4-3 3-4-4-6 6" />
                                  </svg>
                                </div>
                              </div>
                              <div className="search-product-details">
                                <span className="search-product-category">
                                  {product.category_name || "Demotents"}
                                </span>
                                <span className="search-product-title">
                                  {highlightMatch(product.name, searchTerm)}
                                </span>
                                <div className="search-price-container">
                                  <span className="search-price">
                                    {product.displayPrice || "Price on request"}
                                  </span>
                                  {product.originalPrice && (
                                    <span className="search-original-price">
                                      {product.originalPrice}
                                    </span>
                                  )}
                                  {product.discount && (
                                    <span className="search-discount">
                                      ({product.discount}% OFF)
                                    </span>
                                  )}
                                </div>
                                {product.priceLabel && (
                                  <span className="search-product-type">
                                    {product.priceLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* View All Results */}
                        <div className="view-all-results">
                          <button
                            className="view-all-btn"
                            onClick={() => {
                              setShowSearchDropdown(false);
                              navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
                            }}
                          >
                            View all results for "{searchTerm}" →
                          </button>
                        </div>
                      </>
                    ) : searchSuggestions.length === 0 ? (
                      <div className="no-results-shop-now">
                        <p className="no-results-text">
                          No products found for "{searchTerm}"
                        </p>
                        <button 
                          className="shop-now-btn"
                          onClick={() => {
                            setShowSearchDropdown(false);
                            navigate(`/categories`);
                          }}
                        >
                          Browse all categories →
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
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

        {/* Navigation Links */}
        <div className={`w-100 mt-2 nav-links ${menuOpen ? "active" : ""}`}>
          <ul className="navbar-nav d-flex flex-row">
            <li className="nav-item" onClick={() => handleNavigation("/")}>
              <span className="nav-link">HOME</span>
            </li>
            
            {menuItems.map((item) => {
              const categorySlug = toSlug(item.name);
              const hasTypedOptions = 
                item.category_without_print_count > 0 || 
                item.category_custom_count > 0;
              const hasStandard = item.category_standard_count > 0;

              // If category has sub-categories
              if (item.sub_categories && item.sub_categories.length > 0) {
                return (
                  <li key={item.id} className="nav-item dropdown dropdown-hover">
                    <span className="nav-link d-flex align-items-center gap-1">
                      {item.name.toUpperCase()}
                      <RiArrowDropDownLine size={20} />
                    </span>
                    <ul className="dropdown-menu">
                      {item.sub_categories.map((sub) => {
                        const showWithoutPrint = sub.without_print_count > 0;
                        const showCustom = sub.custom_count > 0;
                        const showStandard = sub.standard_count > 0;

                        // If only standard products, show direct link
                        if (showStandard && !showWithoutPrint && !showCustom) {
                          return (
                            <li
                              key={sub.id}
                              onClick={() => handleNavigation(
                                `/subcategory/${sub.id}`,
                                {
                                  subCategoryId: sub.id,
                                  subCategoryName: sub.name,
                                  parentCategoryId: item.id,
                                  parentCategoryName: item.name
                                }
                              )}
                            >
                              <span className="dropdown-item">{sub.name}</span>
                            </li>
                          );
                        }

                        // If has typed products, show nested menu
                        return (
                          <li key={sub.id} className="dropdown-submenu">
                            <span className="dropdown-item d-flex justify-content-between align-items-center">
                              {sub.name}
                              <RiArrowDropDownLine size={18} />
                            </span>
                            <ul className="dropdown-menu nested-menu">
                              {showWithoutPrint && (
                                <li onClick={() => handleNavigation(
                                  `/subcategory/${sub.id}?type=without-print`,
                                  {
                                    subCategoryId: sub.id,
                                    subCategoryName: sub.name,
                                    parentCategoryId: item.id,
                                    parentCategoryName: item.name
                                  }
                                )}>
                                  <span className="dropdown-item">Without Print</span>
                                </li>
                              )}
                              {showCustom && (
                                <li onClick={() => handleNavigation(
                                  `/subcategory/${sub.id}?type=custom`,
                                  {
                                    subCategoryId: sub.id,
                                    subCategoryName: sub.name,
                                    parentCategoryId: item.id,
                                    parentCategoryName: item.name
                                  }
                                )}>
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

              // If category has typed options (without sub-categories)
              if (hasTypedOptions) {
                return (
                  <li key={item.id} className="nav-item dropdown dropdown-hover">
                    <span className="nav-link d-flex align-items-center gap-1">
                      {item.name.toUpperCase()}
                      <RiArrowDropDownLine size={20} />
                    </span>
                    <ul className="dropdown-menu">
                      {item.category_without_print_count > 0 && (
                        <li onClick={() => handleNavigation(
                          `/category/${categorySlug}?type=without-print`,
                          { categoryId: item.id, categoryName: item.name }
                        )}>
                          <span className="dropdown-item">Without Print</span>
                        </li>
                      )}
                      {item.category_custom_count > 0 && (
                        <li onClick={() => handleNavigation(
                          `/category/${categorySlug}?type=custom`,
                          { categoryId: item.id, categoryName: item.name }
                        )}>
                          <span className="dropdown-item">With Customization</span>
                        </li>
                      )}
                    </ul>
                  </li>
                );
              } 
              // Standard category (no sub-categories, no typed options)
              else if (hasStandard) {
                return (
                  <li 
                    key={item.id} 
                    className="nav-item" 
                    onClick={() => handleNavigation(
                      `/category/${categorySlug}`,
                      { categoryId: item.id, categoryName: item.name }
                    )}
                  >
                    <span className="nav-link">{item.name.toUpperCase()}</span>
                  </li>
                );
              } 
              // No active products in category
              else {
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