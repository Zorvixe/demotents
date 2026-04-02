import React, { useEffect, useState } from "react";
import "./CategoriesScroller.css";
import { useNavigate } from "react-router-dom";

const CategoriesScroller = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = `${process.env.VITE_BACKEND_BASE_URL || "http://localhost:5004"}/api/categories`;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(API_URL);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        
        const data = await res.json();

        if (data.success) {
          setCategories(data.categories);
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

  // Default images for categories without preview images
  const defaultCategoryImages = {
    'Canvas Tent': '/canvas.jpg',
    'Family Tent': '/family.jpg',
    'PVC Tent': '/pvc.jpg',
    'Promotional Tent': '/promotional.jpg',
    'Advertising Umbrellas': '/advertise.jpg',
    'Roll-Up Banner': '/rollup.png',
    'Folding Tent': '/folding.jpg',
    'Display Tent': '/display.avif',
    'Camping Tent': '/camping.jpg',
    'Luxury Tent': '/luxury.jpg',
    'Beach Umbrellas': '/beach.jpg',
    'Wedding Tent': '/wedding.jpg',
  };

  // Function to get the correct image URL
  const getCategoryImage = (category) => {
    // If there's a preview image from backend, use it
    if (category.preview_image) {
      // Check if the URL already has the full path
      if (category.preview_image.startsWith('http')) {
        return category.preview_image;
      }
      // If it starts with /uploads, add the base URL
      if (category.preview_image.startsWith('/uploads/')) {
        return `const API_URL = "https://demotents-dhia.onrender.com/api";${category.preview_image}`;
      }
      // If it's just a filename, construct the full URL
      return `const API_URL = "https://demotents-dhia.onrender.com/api";/uploads/${category.preview_image}`;
    }
    
    // If no preview image, use default based on category name
    const defaultImg = defaultCategoryImages[category.name];
    return defaultImg || '/placeholder.jpg';
  };

  // Function to generate URL-friendly path
  const generatePath = (categoryName) => {
    return categoryName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  // Handle category click
  const handleCategoryClick = (category) => {
    const path = generatePath(category.name);
    navigate(`/category/${path}`, {
      state: {
        categoryId: category.id,
        categoryName: category.name
      }
    });
  };

  // Loading state
  if (loading) {
    return (
      <section className="popular-products-section py-5">
        <div className="container-fluid px-4">
          <div className="text-center mb-5">
            <h2 className="section-title">POPULAR CATEGORIES</h2>
            <p className="section-subtitle">Explore our tent collections</p>
          </div>
          <div className="loading-state text-center py-5">
            <div className="spinner"></div>
            <p className="mt-3">Loading categories...</p>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="popular-products-section py-5">
        <div className="container-fluid px-4">
          <div className="text-center mb-5">
            <h2 className="section-title">POPULAR CATEGORIES</h2>
            <p className="section-subtitle">Explore our tent collections</p>
          </div>
          <div className="error-state text-center py-5">
            <p className="error-message">{error}</p>
            <button 
              className="retry-btn"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Empty state
  if (categories.length === 0) {
    return (
      <section className="popular-products-section py-5">
        <div className="container-fluid px-4">
          <div className="text-center mb-5">
            <h2 className="section-title">POPULAR CATEGORIES</h2>
            <p className="section-subtitle">Explore our tent collections</p>
          </div>
          <div className="empty-state text-center py-5">
            <p>No categories available yet.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="popular-products-section py-5">
      <div className="container-fluid px-4">
        <div className="text-center mb-5">
          <h2 className="section-title">POPULAR CATEGORIES</h2>
          <p className="section-subtitle">Explore our tent collections</p>
          
        </div>

        <div className="row g-4 justify-content-center">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="col-6 col-md-4 col-lg-3 d-flex"
              onClick={() => handleCategoryClick(cat)}
              style={{ cursor: "pointer" }}
            >
              <div className="product-card p-3 w-100">
                <h4 className="product-name">{cat.name}</h4>

                <div className="product-img-wrapper">
                  <img
                    src={getCategoryImage(cat)}
                    alt={cat.name}
                    className="product-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      // Try to get default image based on category name
                      const defaultImg = defaultCategoryImages[cat.name];
                      if (defaultImg) {
                        e.target.src = defaultImg;
                      } else {
                        e.target.src = '/placeholder.jpg';
                      }
                    }}
                  />
                </div>

                <div className="category-info">
                  <div className="product-count">
                    {cat.product_count || 0} {cat.product_count === 1 ? 'Product' : 'Products'}
                  </div>
                  
                  {cat.description && (
                    <p className="category-description">
                      {cat.description.length > 50 
                        ? `${cat.description.substring(0, 50)}...` 
                        : cat.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-5">
          <button 
            className="view-all-btn"
            onClick={() => navigate('/categories')}
          >
            View All Categories
          </button>
        </div>
      </div>
    </section>
  );
};

export default CategoriesScroller;