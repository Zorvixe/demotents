import React, { useState, useRef, useEffect } from "react";
import "./CategoriesScroller.css";
import { useNavigate } from "react-router-dom";
import { useCategories } from "../App";

// --- SUB-COMPONENT: Individual Scrollable Row ---
const CategoryRow = ({ rowCategories, BASE_URL, onCategoryClick }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  // Track image loading state just for this row
  const [imageLoaded, setImageLoaded] = useState({});
  const [imageError, setImageError] = useState({});

  const getCategoryImage = (category) => {
    if (category.preview_image) {
      if (category.preview_image.startsWith("http")) return category.preview_image;
      if (category.preview_image.startsWith("/uploads/")) return `${BASE_URL}${category.preview_image}`;
      return `${BASE_URL}/uploads/${category.preview_image}`;
    }
    return null;
  };

  const handleImageLoad = (catId) => setImageLoaded(prev => ({ ...prev, [catId]: true }));
  const handleImageError = (catId) => {
    setImageError(prev => ({ ...prev, [catId]: true }));
    setImageLoaded(prev => ({ ...prev, [catId]: true }));
  };

  // Check scroll position to show/hide buttons
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [rowCategories]);

  // Scroll Function
  const scroll = (direction) => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!rowCategories || rowCategories.length === 0) return null;

  return (
    <div className="categories-carousel-wrapper">
      {/* Left Button */}
      {canScrollLeft && (
        <button className="amz-scroll-btn left" onClick={() => scroll("left")}>
          <svg width="18" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      )}

      {/* Scrollable Track - Single Row */}
      <div className="categories-scroll-track" ref={scrollRef} onScroll={checkScroll}>
        {rowCategories.map((cat) => {
          const imgUrl = getCategoryImage(cat);
          const isLoaded = imageLoaded[cat.id];
          const hasError = imageError[cat.id];

          return (
            <div key={cat.id} className="category-card" onClick={() => onCategoryClick(cat)}>
              <div className="image-wrapper">
                {!isLoaded && (
                  <div className="image-loader">
                    <div className="spinner"></div>
                  </div>
                )}
                {imgUrl && !hasError && (
                  <img
                    src={imgUrl}
                    alt={cat.name}
                    className="category-image"
                    style={{ display: isLoaded ? 'block' : 'none' }}
                    onLoad={() => handleImageLoad(cat.id)}
                    onError={() => handleImageError(cat.id)}
                  />
                )}
                {(hasError || !imgUrl) && (
                  <div className="image-fallback">
                    <span>No image</span>
                  </div>
                )}
              </div>
              <div className="card-content">
                <h4 className="category-name">{cat.name}</h4>
                <div className="category-count">
                  {cat.product_count || 0} {cat.product_count === 1 ? "Product" : "Products"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right Button */}
      {canScrollRight && (
        <button className="amz-scroll-btn right" onClick={() => scroll("right")}>
          <svg width="18" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---
const CategoriesScroller = () => {
  const navigate = useNavigate();
  const { categories, BASE_URL } = useCategories();

  // Sort categories by ID (ascending) – oldest first
  const sortedCategories = [...(categories || [])].sort((a, b) => a.id - b.id);

  // Split categories into two rows (Alternating to keep visual order similar to old grid)
  const topRowCategories = sortedCategories.filter((_, index) => index % 2 === 0);
  const bottomRowCategories = sortedCategories.filter((_, index) => index % 2 !== 0);

  const generatePath = (name) =>
    name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const handleCategoryClick = (category) => {
    navigate(`/category/${generatePath(category.name)}`, {
      state: { categoryId: category.id, categoryName: category.name },
    });
  };

  if (!sortedCategories || sortedCategories.length === 0) {
    return (
      <section className="popular-products-section py-5">
        <div className="container-fluid px-4 text-center">
          <h2 className="section-title">POPULAR CATEGORIES</h2>
          <p className="section-subtitle">Explore our tent collections</p>
          <div className="empty-state py-5"><p>No categories available yet.</p></div>
        </div>
      </section>
    );
  }

  return (
    <section className="popular-products-section py-4">
      <div className="container-fluid categories-container">
        <div className="text-center mb-3">
          <h2 className="section-title">POPULAR CATEGORIES</h2>
          <p className="section-subtitle">Explore our tent collections</p>
        </div>

        {/* TOP ROW */}
        <CategoryRow 
          rowCategories={topRowCategories} 
          BASE_URL={BASE_URL} 
          onCategoryClick={handleCategoryClick} 
        />

        {/* BOTTOM ROW (Only renders if there are enough categories) */}
        {bottomRowCategories.length > 0 && (
          <CategoryRow 
            rowCategories={bottomRowCategories} 
            BASE_URL={BASE_URL} 
            onCategoryClick={handleCategoryClick} 
          />
        )}

        <div className="text-center mt-3">
          <button className="view-all-btn" onClick={() => navigate("/categories")}>
            View All Categories
          </button>
        </div>
      </div>
    </section>
  );
};

export default CategoriesScroller;