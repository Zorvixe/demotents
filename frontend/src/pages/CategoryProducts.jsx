import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./CategoryProducts.css";

const CategoryProducts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { categorySlug } = useParams();
  const { categoryId, categoryName } = location.state || {};
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryData, setCategoryData] = useState(null);

  const API_URL = "https://demotents-backend.onrender.com/api";

  // Default images for categories
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch category data
        let finalCategoryId = categoryId;
        let finalCategoryName = categoryName;

        if (!finalCategoryId) {
          // Try to get category by name from slug
          const categoryRes = await fetch(`${API_URL}/categories`);
          const categoryData = await categoryRes.json();
          
          if (categoryData.success) {
            const foundCategory = categoryData.categories.find(
              cat => cat.name.toLowerCase().replace(/\s+/g, '-') === categorySlug
            );
            
            if (foundCategory) {
              finalCategoryId = foundCategory.id;
              finalCategoryName = foundCategory.name;
              setCategoryData(foundCategory);
            }
          }
        }

        if (!finalCategoryId) {
          throw new Error("Category not found");
        }

        // Fetch products for this category
        const productRes = await fetch(
          `${API_URL}/products?category_id=${finalCategoryId}&is_active=true`
        );
        
        if (!productRes.ok) {
          throw new Error(`Failed to fetch products: ${productRes.status}`);
        }
        
        const productData = await productRes.json();

        if (productData.success) {
          setProducts(productData.products);
        } else {
          setError(productData.message || "Failed to load products");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categorySlug, categoryId, categoryName]);

  const getCategoryImage = (categoryName) => {
    return defaultCategoryImages[categoryName] || '/placeholder.jpg';
  };

  const openModal = (product) => {
    navigate(`/product/${product.id}`, {
      state: { product }
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="category-products-container py-5">
        <div className="text-center mb-5">
          <h3 className="section-title-main">
            <span>Loading Products...</span>
          </h3>
        </div>
        <div className="loading-state text-center py-5">
          <div className="spinner"></div>
          <p className="mt-3">Loading products...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="category-products-container py-5">
        <div className="text-center mb-5">
          <h3 className="section-title-main">
            <span>Products</span>
          </h3>
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
    );
  }

  // Get category name from state or use the slug
  const displayCategoryName = categoryName || 
    (categorySlug ? categorySlug.replace(/-/g, ' ') : 'Products');

  return (
    <div className="container py-5 category-products-container " style={{marginTop: "50px"}}>
    

      {/* Category Banner */}
      <div className="category-banner mb-5">
       
        <div className="banner-overlay">
          <h2>{displayCategoryName}</h2>
        </div>
      </div>

      {/* Products Grid */}
      <div className="row g-4">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="col-lg-3 col-md-4 col-6">
              <div className="card product-card border-0 shadow-sm">
                <div
                  className="image-container"
                  onClick={() => openModal(product)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={product.main_image_url 
                      ? product.main_image_url.startsWith('http') 
                        ? product.main_image_url 
                        : `https://demotents-backend.onrender.com${product.main_image_url}`
                      : '/placeholder.jpg'}
                    alt={product.name}
                    className="d-block w-100 product-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder.jpg';
                    }}
                  />
                  {product.sub_images_count > 0 && (
                    <span className="photo-badge">+{product.sub_images_count}</span>
                  )}
                </div>

                <div className="card-body text-center d-flex flex-column justify-content-between">
                  <div>
                    <h6 className="product-title-category">{product.name}</h6>
                    <p className="product-price-category">₹ {product.price?.toLocaleString() || 'Price on request'}</p>
                    <p className="product-sku-category">SKU: {product.sku || 'N/A'}</p>
                    
                    {product.description && (
                      <p className="product-description-category">
                        {product.description.length > 60 
                          ? `${product.description.substring(0, 60)}...` 
                          : product.description}
                      </p>
                    )}
                  </div>

                  <div className="product-actions-category mt-3">
                    <button 
                      className="btn btn-success btn-sm px-3 me-2"
                      onClick={() => openModal(product)}
                    >
                      View Details
                    </button>
                    <button className="btn btn-outline-primary btn-sm px-3">
                      Enquire Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12 text-center py-5">
            <p className="no-products">No products available in this category yet.</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/categories')}
            >
              Browse Other Categories
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryProducts;