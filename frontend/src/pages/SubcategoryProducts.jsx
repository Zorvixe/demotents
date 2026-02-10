import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "./CategoryProducts.css"; // Reuse the same CSS

const SubcategoryProducts = () => {
  const { subcategoryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { subCategoryId, subCategoryName, parentCategoryId, parentCategoryName } = location.state || {};
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subcategoryData, setSubcategoryData] = useState(null);

  const API_URL = "https://demotents-backend.onrender.com/api";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const finalSubcategoryId = subcategoryId || subCategoryId;
        
        if (!finalSubcategoryId) {
          throw new Error("Subcategory not found");
        }

        // Fetch products for this subcategory
        const productRes = await fetch(
          `${API_URL}/products?sub_category_id=${finalSubcategoryId}&is_active=true`
        );
        
        if (!productRes.ok) {
          throw new Error(`Failed to fetch products: ${productRes.status}`);
        }
        
        const productData = await productRes.json();

        if (productData.success) {
          setProducts(productData.products);
          
          // Fetch subcategory details
          const subcatRes = await fetch(`${API_URL}/sub-categories/${finalSubcategoryId}`);
          if (subcatRes.ok) {
            const subcatData = await subcatRes.json();
            if (subcatData.success) {
              setSubcategoryData(subcatData.sub_category);
            }
          }
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
  }, [subcategoryId, subCategoryId]);

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

  // Get display names
  const displaySubcategoryName = subCategoryName || subcategoryData?.name || "Subcategory";
  const displayParentCategoryName = parentCategoryName || "Category";

  return (
    <div className="container py-5 category-products-container">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <button 
              className="btn btn-link p-0" 
              onClick={() => navigate("/categories")}
            >
              Categories
            </button>
          </li>
          {parentCategoryName && (
            <li className="breadcrumb-item">
              <button 
                className="btn btn-link p-0" 
                onClick={() => navigate(`/category/${generatePath(parentCategoryName)}`, {
                  state: { categoryId: parentCategoryId, categoryName: parentCategoryName }
                })}
              >
                {parentCategoryName}
              </button>
            </li>
          )}
          <li className="breadcrumb-item active" aria-current="page">
            {displaySubcategoryName}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="text-center mb-5">
        <h3 className="section-title-main">
          <span>{displaySubcategoryName}</span>
        </h3>
        <p className="section-subtext">
          {parentCategoryName && (
            <span className="text-muted">Under: {parentCategoryName}</span>
          )}
        </p>
        <div className="products-count">
          {products.length} {products.length === 1 ? 'Product' : 'Products'} Available
        </div>
      </div>

      {/* Products Grid */}
      <div className="row g-4">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="col-lg-3 col-md-4 col-sm-6">
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
                    <h6 className="product-title">{product.name}</h6>
                    <p className="product-price">₹ {product.price?.toLocaleString() || 'Price on request'}</p>
                    <p className="product-sku">SKU: {product.sku || 'N/A'}</p>
                    
                    {product.description && (
                      <p className="product-description">
                        {product.description.length > 60 
                          ? `${product.description.substring(0, 60)}...` 
                          : product.description}
                      </p>
                    )}
                  </div>

                  <div className="product-actions mt-3">
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
            <p className="no-products">No products available in this subcategory yet.</p>
            {parentCategoryName && (
              <button 
                className="btn btn-primary me-2"
                onClick={() => navigate(`/category/${generatePath(parentCategoryName)}`, {
                  state: { categoryId: parentCategoryId, categoryName: parentCategoryName }
                })}
              >
                View {parentCategoryName}
              </button>
            )}
            <button 
              className="btn btn-outline-primary"
              onClick={() => navigate('/categories')}
            >
              Browse All Categories
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function for URL generation
const generatePath = (name) => {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

export default SubcategoryProducts;