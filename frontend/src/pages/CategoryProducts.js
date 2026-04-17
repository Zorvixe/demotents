import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./CategoryProducts.css";

const CategoryProducts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { categorySlug } = useParams();
  const queryParams = new URLSearchParams(location.search);
  const printType = queryParams.get("type");

  const { categoryId, categoryName } = location.state || {};

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  
  const [imageLoaded, setImageLoaded] = useState({});
  const [imageError, setImageError] = useState({});
  
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  const BASE_URL = "https://api.demotents.com";
  const API_URL = `${BASE_URL}/api`;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        let finalCategoryId = categoryId;
        let finalCategoryName = categoryName;

        // If no categoryId provided, resolve from slug
        if (!finalCategoryId) {
          const categoryRes = await fetch(`${API_URL}/categories`);
          const categoryDataJson = await categoryRes.json();
          if (categoryDataJson.success) {
            const foundCategory = categoryDataJson.categories.find(
              (cat) => cat.name.toLowerCase().replace(/\s+/g, "-") === categorySlug
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

        // Build URL with proper filters
        let url = `${API_URL}/products?category_id=${finalCategoryId}&is_active=true`;
        if (printType === "without-print" || printType === "custom") {
          url += `&type=${printType}`;
        }

        console.log("🔍 Fetching products from:", url);
        const productRes = await fetch(url);

        if (!productRes.ok) {
          throw new Error(`Failed to fetch products: ${productRes.status}`);
        }

        const productData = await productRes.json();
        if (productData.success) {
          console.log(`✅ Loaded ${productData.products.length} products for category ${finalCategoryName}`);
          setProducts(productData.products);
          
          // If no products found, try to fetch subcategories and their products (optional)
          if (productData.products.length === 0) {
            console.warn("⚠️ No products found directly. Checking subcategories...");
            const subcatRes = await fetch(`${API_URL}/categories/${finalCategoryId}/sub-categories`);
            const subcatData = await subcatRes.json();
            if (subcatData.success && subcatData.sub_categories.length > 0) {
              // Fetch products from each subcategory
              const subcatProductPromises = subcatData.sub_categories.map(sc =>
                fetch(`${API_URL}/products?sub_category_id=${sc.id}&is_active=true`).then(r => r.json())
              );
              const subcatResults = await Promise.all(subcatProductPromises);
              const allSubcatProducts = subcatResults.flatMap(res => res.success ? res.products : []);
              if (allSubcatProducts.length > 0) {
                console.log(`✅ Found ${allSubcatProducts.length} products in subcategories`);
                setProducts(allSubcatProducts);
              }
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

    fetchProducts();
  }, [categorySlug, categoryId, categoryName, printType]);

  const getCategoryBannerImage = () => {
    if (categoryData && categoryData.preview_image) {
      const img = categoryData.preview_image;
      if (img.startsWith("http")) return img;
      if (img.startsWith("/uploads/")) return `${BASE_URL}${img}`;
      return `${BASE_URL}/uploads/${img}`;
    }
    return null;
  };

  const getProductImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${BASE_URL}${url}`;
  };

  const handleProductImageLoad = (productId) => {
    setImageLoaded(prev => ({ ...prev, [productId]: true }));
  };

  const handleProductImageError = (productId) => {
    setImageError(prev => ({ ...prev, [productId]: true }));
    setImageLoaded(prev => ({ ...prev, [productId]: true }));
  };

  const handleBannerLoad = () => setBannerLoaded(true);
  const handleBannerError = () => setBannerError(true);

const openModal = (product) => {
  const slug = product.slug || product.id;
  const uuid = product.uuid;
  // Navigate with UUID and slug
  navigate(`/product/${uuid}/${slug}`, { state: { product } });
};

  // Helper to display correct price based on print type
  const getDisplayPrice = (product) => {
    if (printType === "without-print") {
      return product.without_print_price
        ? `₹ ${product.without_print_price.toLocaleString()}`
        : "Price on request";
    } else if (printType === "custom") {
      // Show tiered prices
      if (product.core_price || product.elite_price || product.pro_price) {
        return null; // will render tiered pricing
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

  const displayCategoryName =
    categoryName || (categorySlug ? categorySlug.replace(/-/g, " ") : "Products");
  const bannerImageUrl = getCategoryBannerImage();

  // Add type suffix to page title
  const pageTitle = printType === "without-print" 
    ? `${displayCategoryName} - Without Print`
    : printType === "custom"
    ? `${displayCategoryName} - With Customization`
    : displayCategoryName;

  return (
    <div className="category-wrapper container py-5" style={{ marginTop: "50px" }}>
      
      <div className="category-banner mb-5">
        {bannerImageUrl && !bannerError ? (
          <>
            {!bannerLoaded && (
              <div className="banner-loader-overlay">
                <div className="banner-spinner"></div>
              </div>
            )}
            <img
              src={bannerImageUrl}
              alt={pageTitle}
              className="banner-image"
              style={{ display: bannerLoaded ? 'block' : 'none' }}
              onLoad={handleBannerLoad}
              onError={handleBannerError}
            />
          </>
        ) : null}
        <div className="banner-gradient-overlay">
          <h1 className="banner-title">{pageTitle}</h1>
          <p className="banner-subtitle">Explore our premium collection</p>
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
                        onLoad={() => handleProductImageLoad(product.id)}
                        onError={() => handleProductImageError(product.id)}
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

                      <div className="category-pricing-section">
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
                      <button className="category-btn category-btn-secondary">
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
              <button className="category-btn category-btn-primary px-4" onClick={() => navigate("/categories")}>
                Browse All Categories
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryProducts;