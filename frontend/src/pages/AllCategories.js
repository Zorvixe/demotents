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

  const BASE_URL = "https://api.demotents.com";
  const API_URL = `${BASE_URL}/api/categories`;

  const refs = useRef({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const data = await res.json();
        if (data.success) {
          setCategories(data.categories);
          // Pre-create refs for each category
          const createRefs = (cats) => {
            cats.forEach(cat => {
              const slug = cat.slug;
              if (!refs.current[slug]) refs.current[slug] = React.createRef();
              if (cat.children) createRefs(cat.children);
            });
          };
          createRefs(data.categories);
        } else {
          setError(data.message || "Failed to load categories");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load categories. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const getCategoryImage = (category) => {
    if (category.preview_image) {
      if (category.preview_image.startsWith("http")) return category.preview_image;
      if (category.preview_image.startsWith("/uploads/")) return `${BASE_URL}${category.preview_image}`;
      return `${BASE_URL}/uploads/${category.preview_image}`;
    }
    return null;
  };

  const handleCategoryClick = (category) => {
    navigate(`/category/${category.slug}`, {
      state: { categoryId: category.id, categoryName: category.name }
    });
  };

  const handleImageLoad = (catId) => setImageLoaded(prev => ({ ...prev, [catId]: true }));
  const handleImageError = (catId) => {
    setImageError(prev => ({ ...prev, [catId]: true }));
    setImageLoaded(prev => ({ ...prev, [catId]: true }));
  };

  const scrollTo = (slug) => {
    if (refs.current[slug]?.current) {
      refs.current[slug].current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    if (!selected || categories.length === 0) return;
    const match = findCategoryBySlug(categories, selected);
    if (match && refs.current[match.slug]?.current) {
      setTimeout(() => {
        refs.current[match.slug].current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [selected, categories]);

  const findCategoryBySlug = (cats, slug) => {
    for (let cat of cats) {
      if (cat.slug === slug) return cat;
      if (cat.children) {
        const found = findCategoryBySlug(cat.children, slug);
        if (found) return found;
      }
    }
    return null;
  };

  // Flatten categories for sidebar navigation (preserve hierarchy with indentation)
  const flattenForSidebar = (cats, level = 0, arr = []) => {
    cats.forEach(cat => {
      arr.push({ ...cat, level });
      if (cat.children) flattenForSidebar(cat.children, level + 1, arr);
    });
    return arr;
  };
  const flatSidebar = flattenForSidebar(categories);

  if (loading) return <div className="global-loader"><div className="spinner"></div></div>;
  if (error) return <div className="modern-cats-page container py-5"><div className="text-center">{error}</div></div>;
  if (categories.length === 0) return <div className="modern-cats-page container py-5"><div className="text-center">No categories found.</div></div>;

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
              {flatSidebar.map((cat) => (
                <li key={cat.id}>
                  <button onClick={() => scrollTo(cat.slug)} className="sidebar-nav-btn">
                    <span className="nav-name" style={{ marginLeft: `${cat.level * 12}px` }}>
                      {cat.name}
                    </span>
                    <span className="nav-count">{cat.product_count || 0}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="modern-cats-content">
          {categories.map((cat) => (
            <RenderCategory
              key={cat.id}
              category={cat}
              ref={refs.current[cat.slug]}
              onCategoryClick={handleCategoryClick}
              getImageUrl={getCategoryImage}
              imageLoaded={imageLoaded}
              imageError={imageError}
              onImageLoad={handleImageLoad}
              onImageError={handleImageError}
            />
          ))}
        </main>
      </div>
    </div>
  );
}

// Recursive component to render a category and its immediate children (not nested deeper)
const RenderCategory = React.forwardRef(({ category, onCategoryClick, getImageUrl, imageLoaded, imageError, onImageLoad, onImageError }, ref) => {
  const imgUrl = getImageUrl(category);
  const isLoaded = imageLoaded[category.id];
  const hasError = imageError[category.id];

  return (
    <section className="modern-cat-section" id={category.slug} ref={ref}>
      <div className="modern-cat-card" onClick={() => onCategoryClick(category)}>
        <div className="modern-cat-image-box">
          {!isLoaded && <div className="image-loader-overlay"><div className="image-spinner"></div></div>}
          {imgUrl && !hasError && (
            <img
              src={imgUrl}
              alt={category.name}
              className="modern-cat-img"
              style={{ display: isLoaded ? 'block' : 'none' }}
              onLoad={() => onImageLoad(category.id)}
              onError={() => onImageError(category.id)}
            />
          )}
          {(hasError || !imgUrl) && <div className="image-fallback"><span>No image</span></div>}
        </div>

        <div className="modern-cat-info">
          <div className="cat-info-top">
            <h2 className="cat-title">{category.name}</h2>
            <span className="cat-product-count">
              {category.product_count || 0} {category.product_count === 1 ? 'Product' : 'Products'}
            </span>
          </div>

          {category.description && <p className="cat-description">{category.description}</p>}

          {category.children && category.children.length > 0 ? (
            <div className="cat-subcategories">
              <h4 className="subcat-label">Subcategories:</h4>
              <div className="subcat-pill-container">
                {category.children.map((sub) => (
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
                onCategoryClick(category);
              }}
            >
              View All Products
              <svg className="btn-icon-right" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});