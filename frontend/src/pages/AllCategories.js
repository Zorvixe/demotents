import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./AllCategories.css";

export default function AllCategories() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = useMemo(() => new URLSearchParams(location.search), [location]);
  const selected = query.get("selected");

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoaded, setImageLoaded] = useState({});
  const [imageError, setImageError] = useState({});

  // ✅ Same BASE_URL as CategoriesScroller
  const BASE_URL = "https://api.demotents.com";
  const API_URL = `${BASE_URL}/api/categories`;

  const refs = useRef({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_URL}`);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const data = await res.json();

        if (data.success) {
          const transformedCategories = data.categories.map(category => ({
            id: category.id,
            name: category.name,
            description: category.description,
            idSlug: category.name.toLowerCase().replace(/\s+/g, '-'),
            preview_image: category.preview_image,
            product_count: category.product_count || 0,
            sub_categories: category.sub_categories || []
          }));
          setCategories(transformedCategories);
          transformedCategories.forEach((s) => {
            const id = s.idSlug;
            if (!refs.current[id]) refs.current[id] = React.createRef();
          });
        } else {
          setError(data.message || "Failed to load categories");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load categories. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // ✅ FIXED: Same logic as CategoriesScroller
  const getCategoryImage = (category) => {
    if (category.preview_image) {
      if (category.preview_image.startsWith("http")) return category.preview_image;
      if (category.preview_image.startsWith("/uploads/")) return `${BASE_URL}${category.preview_image}`;
      return `${BASE_URL}/uploads/${category.preview_image}`;
    }
    return null; // No default image – will show loader then "No image"
  };

  const handleCategoryClick = (category) => {
    navigate(`/category/${category.idSlug}`, {
      state: { categoryId: category.id, categoryName: category.name }
    });
  };

  useEffect(() => {
    if (!selected || categories.length === 0) return;
    const match = categories.find(c => c.name.toLowerCase() === selected.toLowerCase());
    if (match && refs.current[match.idSlug]?.current) {
      setTimeout(() => {
        refs.current[match.idSlug].current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [selected, categories]);

  const scrollTo = (id) => {
    if (refs.current[id]?.current) {
      refs.current[id].current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleImageLoad = (catId) => {
    setImageLoaded(prev => ({ ...prev, [catId]: true }));
  };

  const handleImageError = (catId) => {
    setImageError(prev => ({ ...prev, [catId]: true }));
    setImageLoaded(prev => ({ ...prev, [catId]: true }));
  };

  if (loading) {
    return (
      <div className="global-loader">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-cats-page container py-5">
        <div className="modern-error-container text-center py-5">
          <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 className="error-title">Oops! Something went wrong</h3>
          <p className="error-message">{error}</p>
          <button className="modern-btn modern-btn-primary mt-3" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="modern-cats-page container py-5">
        <div className="modern-empty-state text-center py-5">
          <svg className="empty-icon mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
          </svg>
          <h3 className="empty-title">No Categories Found</h3>
          <p className="empty-subtitle mb-4">We are currently updating our catalog.</p>
          <button className="modern-btn modern-btn-primary" onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-cats-page container" style={{ marginTop: "80px", marginBottom: "60px" }}>

      <div className="modern-cats-header mb-4">
        <h1 className="cats-main-title">All Categories</h1>
      </div>

      <div className="modern-cats-layout">

        <aside className="modern-cats-sidebar d-none d-lg-block">
          <div className="sidebar-sticky-wrapper">
            <h3 className="sidebar-heading">Jump to</h3>
            <ul className="sidebar-nav-list">
              {categories.map((c) => (
                <li key={c.id}>
                  <button onClick={() => scrollTo(c.idSlug)} aria-label={c.name} className="sidebar-nav-btn">
                    <span className="nav-name">{c.name}</span>
                    <span className="nav-count">{c.product_count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="modern-cats-content">
          {categories.map((c) => {
            const imgUrl = getCategoryImage(c);
            const isLoaded = imageLoaded[c.id];
            const hasError = imageError[c.id];

            return (
              <section
                className="modern-cat-section"
                id={c.idSlug}
                key={c.id}
                ref={refs.current[c.idSlug]}
              >
                <div className="modern-cat-card" onClick={() => handleCategoryClick(c)}>

                  <div className="modern-cat-image-box">
                    {!isLoaded && (
                      <div className="image-loader-overlay">
                        <div className="image-spinner"></div>
                      </div>
                    )}
                    {imgUrl && !hasError && (
                      <img
                        src={imgUrl}
                        alt={c.name}
                        className="modern-cat-img"
                        style={{ display: isLoaded ? 'block' : 'none' }}
                        onLoad={() => handleImageLoad(c.id)}
                        onError={() => handleImageError(c.id)}
                      />
                    )}
                    {hasError && (
                      <div className="image-fallback">
                        <span>No image</span>
                      </div>
                    )}
                    {!imgUrl && !hasError && (
                      <div className="image-fallback">
                        <span>No image</span>
                      </div>
                    )}
                  </div>

                  <div className="modern-cat-info">
                    <div className="cat-info-top">
                      <h2 className="cat-title">{c.name}</h2>
                      <span className="cat-product-count">
                        {c.product_count || 0} {c.product_count === 1 ? 'Product' : 'Products'}
                      </span>
                    </div>

                    {c.description && <p className="cat-description">{c.description}</p>}

                    {c.sub_categories && c.sub_categories.length > 0 ? (
                      <div className="cat-subcategories">
                        <h4 className="subcat-label">Subcategories:</h4>
                        <div className="subcat-pill-container">
                          {c.sub_categories.map((sub) => (
                            <div key={sub.id} className="subcat-pill">
                              {sub.name} <span className="subcat-pill-count">({sub.product_count || 0})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="cat-subcategories empty">
                        <p className="no-subcat-text">No subcategories available</p>
                      </div>
                    )}

                    <div className="cat-action-bottom mt-auto pt-3">
                      <button
                        className="modern-btn modern-btn-primary w-100 w-sm-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCategoryClick(c);
                        }}
                      >
                        View All Products
                        <svg className="btn-icon-right" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </main>
      </div>
    </div>
  );
}