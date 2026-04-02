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

  const API_URL = `${import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:5004"}/api/categories`;
  

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

  // Create refs for scrolling
  const refs = useRef({});

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`${API_URL}?includeSubCategories=true`);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        
        const data = await res.json();

        if (data.success) {
          // Transform backend data to match component structure
          const transformedCategories = data.categories.map(category => ({
            id: category.id,
            name: category.name,
            description: category.description,
            idSlug: category.name.toLowerCase().replace(/\s+/g, '-'),
            items: category.sub_categories?.map(sub => sub.name) || [],
            preview_image: category.preview_image,
            product_count: category.product_count || 0,
            sub_categories: category.sub_categories || []
          }));
          
          setCategories(transformedCategories);
          
          // Initialize refs after data is loaded
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
        return `https://demotents-dhia.onrender.com/api${category.preview_image}`;
      }
      // If it's just a filename, construct the full URL
      return `https://demotents-dhia.onrender.com/api/uploads/${category.preview_image}`;
    }
    
    // If no preview image, use default based on category name
    const defaultImg = defaultCategoryImages[category.name];
    return defaultImg || '/placeholder.jpg';
  };

  // Handle category click for navigation
  const handleCategoryClick = (category) => {
    navigate(`/category/${category.idSlug}`, {
      state: {
        categoryId: category.id,
        categoryName: category.name
      }
    });
  };

  // Scroll to selected category
  useEffect(() => {
    if (!selected || categories.length === 0) return;
    
    const match = categories.find(
      (c) => c.name.toLowerCase() === selected.toLowerCase()
    );
    
    if (match && refs.current[match.idSlug]?.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        refs.current[match.idSlug].current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [selected, categories]);

  const scrollTo = (id) => {
    if (refs.current[id]?.current) {
      refs.current[id].current.scrollIntoView({ 
        behavior: "smooth", 
        block: "start" 
      });
    }
  };

  if (loading) {
    return (
      <div className="allcats-page">
        <header className="allcats-header">
          <h1 className="allcats-title">All Categories</h1>
          <p className="allcats-sub">Loading categories...</p>
        </header>
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="allcats-page">
        <header className="allcats-header">
          <h1 className="allcats-title">All Categories</h1>
          <p className="allcats-sub">Browse every tent type in one place.</p>
        </header>
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button 
            className="retry-button" 
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="allcats-page">
        <header className="allcats-header">
          <h1 className="allcats-title">All Categories</h1>
          <p className="allcats-sub">Browse every tent type in one place.</p>
        </header>
        <div className="no-categories">
          <p>No categories found.</p>
          <button 
            className="retry-button" 
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="allcats-page">
      <header className="allcats-header">
        <h1 className="allcats-title">All Categories</h1>
        <p className="allcats-sub">Browse every tent type in one place.</p>
        
      </header>

      <div className="allcats-body">
        {/* LEFT SIDEBAR */}
        <aside className="allcats-sidebar">
          <h3 className="side-title">Categories</h3>
          <ul className="side-list">
            {categories.map((c) => (
              <li key={c.id}>
                <button 
                  onClick={() => scrollTo(c.idSlug)} 
                  aria-label={c.name}
                  className="category-button"
                >
                  <span className="category-name">{c.name}</span>
                  <span className="product-count-badge">{c.product_count}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* RIGHT CONTENT */}
        <main className="allcats-content">
          {categories.map((c) => (
            <section 
              className="cat-section" 
              id={c.idSlug} 
              key={c.id} 
              ref={refs.current[c.idSlug]}
            >
              <div className="cat-card" onClick={() => handleCategoryClick(c)} style={{ cursor: 'pointer' }}>
                <img 
                  src={getCategoryImage(c)} 
                  alt={c.name}
                  className="category-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    // Try to get default image based on category name
                    const defaultImg = defaultCategoryImages[c.name];
                    if (defaultImg) {
                      e.target.src = defaultImg;
                    } else {
                      e.target.src = '/placeholder.jpg';
                    }
                  }}
                />
                <div className="cat-info">
                  <div className="cat-header">
                    <h2>{c.name}</h2>
                    <div className="product-count">
                      {c.product_count || 0} {c.product_count === 1 ? 'Product' : 'Products'}
                    </div>
                  </div>
                  
                  {c.description && (
                    <p className="category-description">{c.description}</p>
                  )}
                  
                  {c.sub_categories && c.sub_categories.length > 0 ? (
                    <div className="subcategories-list">
                      <h4>Sub-Categories:</h4>
                      <div className="subcategories-grid">
                        {c.sub_categories.map((sub) => (
                          <div key={sub.id} className="subcategory-item">
                            <span className="subcategory-name">{sub.name}</span>
                            <span className="subcategory-count">{sub.product_count || 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="no-subcategories">No sub-categories available</p>
                  )}
                  
                  <button 
                    className="view-category-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCategoryClick(c);
                    }}
                  >
                    View Products →
                  </button>
                </div>
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}