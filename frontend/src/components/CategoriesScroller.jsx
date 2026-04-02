import React, { useEffect, useState } from "react";
import "./CategoriesScroller.css";
import { useNavigate } from "react-router-dom";

const CategoriesScroller = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Base URL (single source of truth)
  const BASE_URL =
    "https://demotents-dhia.onrender.com" || "http://localhost:5004";

  const API_URL = `${BASE_URL}/api/categories`;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Fetching from:", API_URL); // Debug

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
  }, [API_URL]);

  // ✅ Default fallback images
  const defaultCategoryImages = {
    "Canvas Tent": "/canvas.jpg",
    "Family Tent": "/family.jpg",
    "PVC Tent": "/pvc.jpg",
    "Promotional Tent": "/promotional.jpg",
    "Advertising Umbrellas": "/advertise.jpg",
    "Roll-Up Banner": "/rollup.png",
    "Folding Tent": "/folding.jpg",
    "Display Tent": "/display.avif",
    "Camping Tent": "/camping.jpg",
    "Luxury Tent": "/luxury.jpg",
    "Beach Umbrellas": "/beach.jpg",
    "Wedding Tent": "/wedding.jpg",
  };

  // ✅ FIXED IMAGE FUNCTION
  const getCategoryImage = (category) => {
    if (category.preview_image) {
      // Already full URL
      if (category.preview_image.startsWith("http")) {
        return category.preview_image;
      }

      // Starts with /uploads
      if (category.preview_image.startsWith("/uploads/")) {
        return `${BASE_URL}${category.preview_image}`;
      }

      // Just filename
      return `${BASE_URL}/uploads/${category.preview_image}`;
    }

    // Fallback image
    return defaultCategoryImages[category.name] || "/placeholder.jpg";
  };

  // ✅ Clean URL generator
  const generatePath = (name) =>
    name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  const handleCategoryClick = (category) => {
    navigate(`/category/${generatePath(category.name)}`, {
      state: {
        categoryId: category.id,
        categoryName: category.name,
      },
    });
  };

  // ================= UI STATES =================

  if (loading) {
    return (
      <section className="popular-products-section py-5">
        <div className="container-fluid px-4 text-center">
          <h2 className="section-title">POPULAR CATEGORIES</h2>
          <p className="section-subtitle">Explore our tent collections</p>

          <div className="loading-state py-5">
            <div className="spinner"></div>
            <p className="mt-3">Loading categories...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="popular-products-section py-5">
        <div className="container-fluid px-4 text-center">
          <h2 className="section-title">POPULAR CATEGORIES</h2>
          <p className="section-subtitle">Explore our tent collections</p>

          <div className="error-state py-5">
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

  if (categories.length === 0) {
    return (
      <section className="popular-products-section py-5">
        <div className="container-fluid px-4 text-center">
          <h2 className="section-title">POPULAR CATEGORIES</h2>
          <p className="section-subtitle">Explore our tent collections</p>

          <div className="empty-state py-5">
            <p>No categories available yet.</p>
          </div>
        </div>
      </section>
    );
  }

  // ================= MAIN UI =================

  return (
    <section className="popular-products-section py-5">
      <div className="container-fluid px-4">
        <div className="text-center mb-5">
          <h2 className="section-title">POPULAR CATEGORIES</h2>
          <p className="section-subtitle">
            Explore our tent collections
          </p>
        </div>

     <div className="categories-grid full-width">
  {categories.map((cat) => (
    <div
      key={cat.id}
      className="category-card"
      onClick={() => handleCategoryClick(cat)}
    >
      <div className="image-wrapper">
        <img
          src={getCategoryImage(cat)}
          alt={cat.name}
          className="category-image"
          onError={(e) => {
            e.target.onerror = null;
            const defaultImg = defaultCategoryImages[cat.name];
            e.target.src = defaultImg || '/placeholder.jpg';
          }}
        />
      </div>

      <div className="card-content">
        <h4 className="category-name">{cat.name}</h4>

        <div className="category-count">
          {cat.product_count || 0} {cat.product_count === 1 ? 'Product' : 'Products'}
        </div>

        {cat.description && (
          <p className="category-description">
            {cat.description.length > 60 
              ? `${cat.description.substring(0, 60)}...` 
              : cat.description}
          </p>
        )}
      </div>
    </div>
  ))}
</div>

        <div className="text-center mt-5">
          <button
            className="view-all-btn"
            onClick={() => navigate("/categories")}
          >
            View All Categories
          </button>
        </div>
      </div>
    </section>
  );
};

export default CategoriesScroller;