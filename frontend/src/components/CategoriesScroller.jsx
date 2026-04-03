import React, { useState } from "react";
import "./CategoriesScroller.css";
import { useNavigate } from "react-router-dom";
import { useCategories } from "../App";

const CategoriesScroller = () => {
  const navigate = useNavigate();
  const { categories, BASE_URL } = useCategories();

  // Track image loading state for each category
  const [imageLoaded, setImageLoaded] = useState({});
  const [imageError, setImageError] = useState({});

  const getCategoryImage = (category) => {
    if (category.preview_image) {
      if (category.preview_image.startsWith("http")) return category.preview_image;
      if (category.preview_image.startsWith("/uploads/")) return `${BASE_URL}${category.preview_image}`;
      return `${BASE_URL}/uploads/${category.preview_image}`;
    }
    // No default image – return null (will show loader)
    return null;
  };

  const generatePath = (name) =>
    name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const handleCategoryClick = (category) => {
    navigate(`/category/${generatePath(category.name)}`, {
      state: { categoryId: category.id, categoryName: category.name },
    });
  };

  const handleImageLoad = (catId) => {
    setImageLoaded(prev => ({ ...prev, [catId]: true }));
  };

  const handleImageError = (catId) => {
    setImageError(prev => ({ ...prev, [catId]: true }));
    setImageLoaded(prev => ({ ...prev, [catId]: true })); // Mark as "loaded" to hide spinner
  };

  if (!categories || categories.length === 0) {
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
    <section className="popular-products-section py-5">
      <div className="container-fluid px-4">
        <div className="text-center mb-4">
          <h2 className="section-title">POPULAR CATEGORIES</h2>
          <p className="section-subtitle">Explore our tent collections</p>
        </div>

        <div className="categories-grid full-width">
          {categories.map((cat) => {
            const imgUrl = getCategoryImage(cat);
            const isLoaded = imageLoaded[cat.id];
            const hasError = imageError[cat.id];

            return (
              <div key={cat.id} className="category-card" onClick={() => handleCategoryClick(cat)}>
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
                <div className="card-content">
                  <h4 className="category-name">{cat.name}</h4>
                  <div className="category-count">
                    {cat.product_count || 0} {cat.product_count === 1 ? "Product" : "Products"}
                  </div>
                  {cat.description && (
                    <p className="category-description">
                      {cat.description.length > 80 ? `${cat.description.substring(0, 80)}...` : cat.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-4">
          <button className="view-all-btn" onClick={() => navigate("/categories")}>
            View All Categories
          </button>
        </div>
      </div>
    </section>
  );
};

export default CategoriesScroller;