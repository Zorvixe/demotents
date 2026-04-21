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
  const [fallbackUsed, setFallbackUsed] = useState(false);

  const [imageLoaded, setImageLoaded] = useState({});
  const [imageError, setImageError] = useState({});
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  const BASE_URL = "https://api.demotents.com";
  const API_URL = `${BASE_URL}/api`;

  const toSlug = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  useEffect(() => {
    const fetchProducts = async (ignoreType = false) => {
      try {
        setLoading(true);
        setError(null);
        setFallbackUsed(false);

        let finalCategoryId = categoryId;
        let finalCategoryName = categoryName;

        // Resolve category from slug if not provided in state
        if (!finalCategoryId && categorySlug) {
          const categoryRes = await fetch(`${API_URL}/categories`);
          const categoryDataJson = await categoryRes.json();
          if (categoryDataJson.success) {
            const foundCategory = categoryDataJson.categories.find((cat) => {
              const normalisedName = toSlug(cat.name);
              return normalisedName === categorySlug;
            });
            if (foundCategory) {
              finalCategoryId = foundCategory.id;
              finalCategoryName = foundCategory.name;
              setCategoryData(foundCategory);
            } else {
              throw new Error(`Category "${categorySlug}" not found`);
            }
          } else {
            throw new Error("Failed to load categories list");
          }
        }

        if (!finalCategoryId) {
          throw new Error("Category ID could not be determined");
        }

        let url = `${API_URL}/products?category_id=${finalCategoryId}&is_active=true`;
        if (!ignoreType && (printType === "without-print" || printType === "custom")) {
          url += `&type=${printType}`;
        }

        const productRes = await fetch(url);
        if (!productRes.ok) throw new Error(`Failed to fetch products: ${productRes.status}`);

        const productData = await productRes.json();
        if (productData.success) {
          if (productData.products.length === 0 && !ignoreType && printType) {
            // No products for this type → fallback to all products
            setFallbackUsed(true);
            await fetchProducts(true);
            return;
          }
          setProducts(productData.products);
        } else {
          setError(productData.message || "Failed to load products");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Failed to load products. Please try again.");
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

  const handleProductImageLoad = (productId) =>
    setImageLoaded(prev => ({ ...prev, [productId]: true }));
  const handleProductImageError = (productId) => {
    setImageError(prev => ({ ...prev, [productId]: true }));
    setImageLoaded(prev => ({ ...prev, [productId]: true }));
  };
  const handleBannerLoad = () => setBannerLoaded(true);
  const handleBannerError = () => setBannerError(true);

  const openModal = (product) => {
    navigate(`/product/${product.uuid}/${product.slug}`, { state: { product } });
  };

  const shareOnWhatsApp = (product) => {
    const baseUrl = window.location.origin;
    const productUrl = `${baseUrl}/product/${product.uuid}/${product.slug || ""}`;
    const message = `Hello 👋,\n\nI'm interested in this product:\n\n🛍️ ${product.name}\n🔗 ${productUrl}\n\nPlease share more details.`;
    window.open(`https://wa.me/919010864897?text=${encodeURIComponent(message)}`, "_blank");
  };

  const getDisplayPrice = (product) => {
    if (printType === "without-print" && !fallbackUsed) {
      return product.without_print_price ? `₹ ${product.without_print_price.toLocaleString()}` : "Price on request";
    }
    if (printType === "custom" && !fallbackUsed) {
      if (product.core_price || product.elite_price || product.pro_price) return null;
      return product.price ? `₹ ${product.price.toLocaleString()}` : "Price on request";
    }
    return product.price ? `₹ ${product.price.toLocaleString()}` : "Price on request";
  };

  if (loading) return <div className="global-loader"><div className="spinner"></div></div>;

  const displayCategoryName = categoryName || (categorySlug ? categorySlug.replace(/-/g, " ") : "Products");
  const pageTitle = fallbackUsed
    ? `${displayCategoryName} (Showing all products)`
    : printType === "without-print"
    ? `${displayCategoryName} - Without Print`
    : printType === "custom"
    ? `${displayCategoryName} - With Customization`
    : displayCategoryName;

  const bannerImageUrl = getCategoryBannerImage();

  return (
    <div className="category-wrapper container py-5" style={{ marginTop: "50px" }}>
      {fallbackUsed && (
        <div className="alert alert-info mb-4">
          No products found for the selected print type. Showing all products instead.
        </div>
      )}
      <div className="category-banner mb-5">
        {bannerImageUrl && !bannerError && (
          <>
            {!bannerLoaded && <div className="banner-loader-overlay"><div className="banner-spinner"></div></div>}
            <img src={bannerImageUrl} alt={pageTitle} className="banner-image" style={{ display: bannerLoaded ? 'block' : 'none' }} onLoad={handleBannerLoad} onError={handleBannerError} />
          </>
        )}
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
            const displayPrice = getDisplayPrice(product);

            return (
              <div key={product.id} className="col-lg-3 col-md-4 col-sm-6 col-12">
                <div className="category-product-card">
                  <div className="category-image-wrapper" onClick={() => openModal(product)}>
                    {!isLoaded && <div className="image-loader-overlay"><div className="image-spinner"></div></div>}
                    {imgUrl && !hasError && (
                      <img src={imgUrl} alt={product.name} className="category-product-image" style={{ display: isLoaded ? 'block' : 'none' }} onLoad={() => handleProductImageLoad(product.id)} onError={() => handleProductImageError(product.id)} />
                    )}
                    {(hasError || !imgUrl) && <div className="image-fallback"><span>No image</span></div>}
                    {product.sub_images_count > 0 && (
                      <div className="category-photo-badge">
                        <svg className="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
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
                          <span className="meta-colors" title={product.cloth_colors.join(", ")}>{product.cloth_colors.length} Colors</span>
                        )}
                      </div>
                      <div className="category-pricing-section">
                        {!fallbackUsed && printType === "custom" && (product.core_price || product.elite_price || product.pro_price) ? (
                          <div className="tiered-pricing">
                            {product.core_price && <div className="price-tier core"><span className="tier-label">Core</span><span className="tier-value">₹{product.core_price}</span></div>}
                            {product.elite_price && <div className="price-tier elite"><span className="tier-label">Elite</span><span className="tier-value">₹{product.elite_price}</span></div>}
                            {product.pro_price && <div className="price-tier pro"><span className="tier-label">Pro</span><span className="tier-value">₹{product.pro_price}</span></div>}
                          </div>
                        ) : (
                          <p className="single-price">{displayPrice}</p>
                        )}
                      </div>
                    </div>
                    <div className="category-card-actions">
                      <button className="category-btn category-btn-primary" onClick={() => openModal(product)}>View Details</button>
                      <button className="category-btn category-btn-secondary" onClick={() => shareOnWhatsApp(product)}>Enquire</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-12">
            <div className="category-empty-state text-center py-5">
              <h3 className="empty-title">No Products Found</h3>
              <p className="empty-subtitle mb-4">No products available for this selection.</p>
              <button className="category-btn category-btn-primary px-4" onClick={() => navigate("/categories")}>Browse All Categories</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryProducts;