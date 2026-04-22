import React, { useState, useEffect } from "react";
import "./CategoriesScroller.css";
import { useNavigate } from "react-router-dom";
import { useCategories } from "../App";

const CategoriesScroller = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const { BASE_URL } = useCategories();

  const [imageLoaded, setImageLoaded] = useState({});
  const [imageError, setImageError] = useState({});

  useEffect(() => {
    fetch(`${BASE_URL}/api/categories`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Show only root categories (no parent)
          const rootCategories = data.categories.filter(cat => cat.parent_id === null);
          setCategories(rootCategories);
        }
      })
      .catch(err => console.error("Failed to fetch categories", err));
  }, [BASE_URL]);

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

  const generatePath = (name) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const handleCategoryClick = (category) => {
    navigate(`/category/${generatePath(category.name)}`, {
      state: { categoryId: category.id, categoryName: category.name },
    });
  };

  if (!categories.length) return null;

  return (
    <section className="popular-products-section py-4">
      <div className="container-fluid categories-container">
        <div className="text-center mb-4">
          <h2 className="section-title">POPULAR CATEGORIES</h2>
          <p className="section-subtitle">Explore our tent collections</p>
        </div>
        <div className="categories-grid three-rows-only">
          {categories.map((cat) => {
            const imgUrl = getCategoryImage(cat);
            const isLoaded = imageLoaded[cat.id];
            const hasError = imageError[cat.id];
            return (
              <div key={cat.id} className="category-card" onClick={() => handleCategoryClick(cat)}>
                <div className="image-wrapper">
                  {!isLoaded && <div className="image-loader"><div className="spinner"></div></div>}
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
                  {(hasError || !imgUrl) && <div className="image-fallback"><span>No image</span></div>}
                </div>
                <div className="card-content text-center">
                  <h4 className="category-name">{cat.name}</h4>
                </div>
              </div>
            );
          })}
        </div>
        {categories.length > 12 && (
          <div className="text-center mt-4">
            <button className="view-all-btn" onClick={() => navigate("/categories")}>
              View All Categories
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesScroller;