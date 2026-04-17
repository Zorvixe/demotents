import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "./CategoryProducts.css";

const SubcategoryProducts = () => {
  const { subcategoryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const printType = queryParams.get("type"); // "without-print" or "custom"
  
  const { subCategoryId, subCategoryName, parentCategoryId, parentCategoryName } = location.state || {};
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subcategoryData, setSubcategoryData] = useState(null);
  
  const [imageLoaded, setImageLoaded] = useState({});
  const [imageError, setImageError] = useState({});

  const BASE_URL = "https://api.demotents.com";
  const API_URL = `${BASE_URL}/api`;

  const generatePath = (name) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const finalSubcategoryId = subcategoryId || subCategoryId;
        
        if (!finalSubcategoryId) {
          throw new Error("Subcategory not found");
        }

        // ✅ Build URL with optional type filter
        let url = `${API_URL}/products?sub_category_id=${finalSubcategoryId}&is_active=true`;
        if (printType) {
          url += `&type=${printType}`;
        }

        const productRes = await fetch(url);
        
        if (!productRes.ok) {
          throw new Error(`Failed to fetch products: ${productRes.status}`);
        }
        
        const productData = await productRes.json();

        if (productData.success) {
          setProducts(productData.products);
          
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
  }, [subcategoryId, subCategoryId, printType]);

  const getProductImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${BASE_URL}${url}`;
  };

  const handleImageLoad = (productId) => {
    setImageLoaded(prev => ({ ...prev, [productId]: true }));
  };

  const handleImageError = (productId) => {
    setImageError(prev => ({ ...prev, [productId]: true }));
    setImageLoaded(prev => ({ ...prev, [productId]: true }));
  };

 const openModal = (product) => {
  const slug = product.slug || product.id;
  const uuid = product.uuid;
  // Navigate with UUID and slug
  navigate(`/product/${uuid}/${slug}`, { state: { product } });
};

  const shareOnWhatsApp = (product) => {
    const baseUrl = window.location.origin;
    const productUrl = `${baseUrl}/product/${product.uuid}/${product.slug || ""}`;

    const message = `Hello 👋,

I'm interested in this product:

🛍️ ${product.name}
🔗 ${productUrl}

Please share more details.`;

    const encodedMessage = encodeURIComponent(message);

    window.open(
      `https://wa.me/919010864897?text=${encodedMessage}`,
      "_blank"
    );
  };

  const getDisplayPrice = (product) => {
    if (printType === "without-print") {
      return product.without_print_price
        ? `₹ ${product.without_print_price.toLocaleString()}`
        : "Price on request";
    } else if (printType === "custom") {
      if (product.core_price || product.elite_price || product.pro_price) {
        return null; // render tiered
      }
      return product.price ? `₹ ${product.price.toLocaleString()}` : "Price on request";
    } else {
      return product.price ? `₹ ${product.price.toLocaleString()}` : "Price on request";
    }
  };

  if (loading) {
    return (
      <div className="global-loader">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="category-error-container py-5 text-center">
        <div className="error-content">
          <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 className="error-title">Oops! Something went wrong</h3>
          <p className="error-message">{error}</p>
          <button className="category-btn category-btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const displaySubcategoryName = subCategoryName || subcategoryData?.name || "Subcategory";
  const pageTitle = printType === "without-print" 
    ? `${displaySubcategoryName} - Without Print`
    : printType === "custom"
    ? `${displaySubcategoryName} - With Customization`
    : displaySubcategoryName;

  return (
    <div className="category-wrapper container py-5" style={{ marginTop: "50px" }}>
      <div className="category-subcategory-banner mb-5">
        <div className="banner-content-wrapper">
          <h1 className="banner-title">{pageTitle}</h1>
          {parentCategoryName ? (
            <p className="banner-subtitle">
              <span className="opacity-75">Explore collection in</span> {parentCategoryName}
            </p>
          ) : (
            <p className="banner-subtitle">Explore our premium collection</p>
          )}
        </div>
      </div>

      <div className="row g-4">
        {products.length > 0 ? (
          products.map((product) => {
            const imgUrl = getProductImageUrl(product.main_image_url);
            const isLoaded = imageLoaded[product.id];
            const hasError = imageError[product.id];

            return (
              <div key={product.id} className="col-lg-3 col-md-4 col-sm-6 col-12">
                <div className="category-product-card">
                  <div
                    className="category-image-wrapper"
                    onClick={() => openModal(product)}
                  >
                    {!isLoaded && (
                      <div className="image-loader-overlay">
                        <div className="image-spinner"></div>
                      </div>
                    )}
                    {imgUrl && !hasError && (
                      <img
                        src={imgUrl}
                        alt={product.name}
                        className="category-product-image"
                        style={{ display: isLoaded ? 'block' : 'none' }}
                        onLoad={() => handleImageLoad(product.id)}
                        onError={() => handleImageError(product.id)}
                      />
                    )}
                    {(hasError || !imgUrl) && (
                      <div className="image-fallback">
                        <span>No image</span>
                      </div>
                    )}
                    {product.sub_images_count > 0 && (
                      <div className="category-photo-badge">
                        <svg className="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        +{product.sub_images_count}
                      </div>
                    )}
                  </div>

                  <div className="category-card-body">
                    <div className="category-card-info">
                      <h2 className="category-product-title">{product.name}</h2>

                      <div className="category-product-meta">
                        {product.sku && <span className="meta-sku">SKU: {product.sku}</span>}
                        {product.cloth_colors && product.cloth_colors.length > 0 && (
                          <span className="meta-colors" title={product.cloth_colors.join(", ")}>
                            {product.cloth_colors.length} Colors
                          </span>
                        )}
                      </div>

                      {product.description && (
                        <p className="category-product-description">
                          {product.description.length > 60 
                            ? `${product.description.substring(0, 60)}...` 
                            : product.description}
                        </p>
                      )}

                      <div className="category-pricing-section mt-3">
                        {printType === "custom" && (product.core_price || product.elite_price || product.pro_price) ? (
                          <div className="tiered-pricing">
                            {product.core_price && (
                              <div className="price-tier core">
                                <span className="tier-label">Core</span>
                                <span className="tier-value">₹{product.core_price}</span>
                              </div>
                            )}
                            {product.elite_price && (
                              <div className="price-tier elite">
                                <span className="tier-label">Elite</span>
                                <span className="tier-value">₹{product.elite_price}</span>
                              </div>
                            )}
                            {product.pro_price && (
                              <div className="price-tier pro">
                                <span className="tier-label">Pro</span>
                                <span className="tier-value">₹{product.pro_price}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="single-price">{getDisplayPrice(product)}</p>
                        )}
                      </div>
                    </div>

                    <div className="category-card-actions">
                      <button
                        className="category-btn category-btn-primary"
                        onClick={() => openModal(product)}
                      >
                        View Details
                      </button>
                      <button 
                        className="category-btn category-btn-secondary"
                        onClick={() => shareOnWhatsApp(product)}
                      >
                        Enquire
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-12">
            <div className="category-empty-state text-center py-5">
              <svg className="empty-icon mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
              </svg>
              <h3 className="empty-title">No Products Found</h3>
              <p className="empty-subtitle mb-4">No products available for this selection.</p>
              
              <div className="d-flex justify-content-center gap-3 flex-wrap">
                {parentCategoryName && (
                  <button 
                    className="category-btn category-btn-secondary px-4"
                    onClick={() => navigate(`/category/${generatePath(parentCategoryName)}`, {
                      state: { categoryId: parentCategoryId, categoryName: parentCategoryName }
                    })}
                  >
                    View {parentCategoryName}
                  </button>
                )}
                <button 
                  className="category-btn category-btn-primary px-4"
                  onClick={() => navigate('/categories')}
                >
                  Browse All Categories
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubcategoryProducts;