import React, { useState } from "react";
import "./CategoriesScroller.css";
import { useNavigate } from "react-router-dom";
import { useCategories } from "../App";

const CategoriesScroller = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  const { BASE_URL } = useCategories();

  // Sort categories by ID (ascending) – oldest first
  const sortedCategories = [...(categories || [])].sort((a, b) => a.id - b.id);

  // Calculate how many items fit in 2 rows based on screen size
  const getMaxCategoriesToShow = () => {
    // Get grid column count based on current screen width
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      let columnsPerRow = 5; // Default desktop columns

      if (width <= 480) columnsPerRow = 2;
      else if (width <= 768) columnsPerRow = 3;
      else if (width <= 991) columnsPerRow = 4;
      else columnsPerRow = 5;

      return columnsPerRow * 2; // 2 rows maximum
    }
    return 10; // Default: 5 columns × 2 rows
  };

  // State for responsive calculation
  const [maxCategories, setMaxCategories] = useState(getMaxCategoriesToShow());

  // Update on window resize
  React.useEffect(() => {
    const handleResize = () => {
      setMaxCategories(getMaxCategoriesToShow());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Limit categories to only 2 rows worth
  const displayedCategories = sortedCategories.slice(0, maxCategories);

  // Track image loading state per category
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

  const generatePath = (name) =>
    name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const handleCategoryClick = (category) => {
    navigate(`/category/${generatePath(category.name)}`, {
      state: { categoryId: category.id, categoryName: category.name },
    });
  };

  useEffect(() => {
  fetch(`${BASE_URL}/api/categories-with-images`)
    .then(res => res.json())
    .then(data => {
      if (data.success) setCategories(data.categories);
    });
}, []);

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

        {/* Fixed height grid container - will NOT exceed 2 rows */}
        <div className="categories-grid two-rows-only">
          {displayedCategories.map((cat) => {
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
                  {(hasError || !imgUrl) && (
                    <div className="image-fallback">
                      <span>No image</span>
                    </div>
                  )}
                </div>
                <div className="card-content">
                  <h4 className="category-name">{cat.name}</h4>

                </div>
              </div>
            );
          })}
        </div>

        {/* Show "View All" button ONLY if there are more categories beyond 2 rows */}
        {sortedCategories.length > maxCategories && (
          <div className="text-center mt-3">
            <button className="view-all-btn" onClick={() => navigate("/categories")}>
              View All Categories ({sortedCategories.length - maxCategories} more)
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesScroller;