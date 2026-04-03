import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ProductDetails.css";

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImg, setActiveImg] = useState("");
  const [relatedProducts, setRelatedProducts] = useState([]);

  const [mainImageLoaded, setMainImageLoaded] = useState(false);
  const [mainImageError, setMainImageError] = useState(false);
  const [thumbLoaded, setThumbLoaded] = useState({});
  const [thumbError, setThumbError] = useState({});
  const [relatedImageLoaded, setRelatedImageLoaded] = useState({});
  const [relatedImageError, setRelatedImageError] = useState({});

  const BASE_URL = "https://demotents-dhia.onrender.com";
  const API_URL = `${BASE_URL}/api`;
  const PLACEHOLDER_IMAGE = "https://via.placeholder.com/300x300?text=No+Image";

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const productRes = await fetch(`${API_URL}/products/${productId}`);
        if (!productRes.ok) throw new Error(`Failed to fetch product: ${productRes.status}`);
        const productData = await productRes.json();

        if (productData.success && productData.product) {
          const product = productData.product;
          setProduct(product);
          if (product.main_image_url) {
            setActiveImg(getImageUrl(product.main_image_url));
          }

          if (product.category_id) {
            const relatedRes = await fetch(
              `${API_URL}/products?category_id=${product.category_id}&limit=4&is_active=true`
            );
            if (relatedRes.ok) {
              const relatedData = await relatedRes.json();
              if (relatedData.success) {
                const filtered = relatedData.products
                  .filter(p => p.id !== product.id)
                  .slice(0, 4);
                setRelatedProducts(filtered);
              }
            }
          }
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load product details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [productId]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
    return `${BASE_URL}/${cleanPath}`;
  };

  // For related products – use ONLY main_image_url
  const getRelatedProductImageUrl = (product) => {
    if (product.main_image_url) {
      const url = getImageUrl(product.main_image_url);
      if (url) return url;
    }
    return PLACEHOLDER_IMAGE;
  };

  const getDisplayPrice = (product) => {
    if (product.core_price || product.elite_price || product.pro_price) {
      const prices = [product.core_price, product.elite_price, product.pro_price]
        .filter(p => p && !isNaN(p) && p > 0);
      if (prices.length) {
        const minPrice = Math.min(...prices);
        return `From ₹ ${minPrice.toLocaleString()}`;
      }
    }
    if (product.price && !isNaN(product.price) && product.price > 0) {
      return `₹ ${product.price.toLocaleString()}`;
    }
    return "Price on request";
  };

  const handleRelatedProductClick = (relatedProduct) => {
    window.scrollTo(0, 0);
    navigate(`/product/${relatedProduct.id}`);
  };

  useEffect(() => {
    setMainImageLoaded(false);
    setMainImageError(false);
  }, [activeImg]);

  const handleMainImageLoad = () => setMainImageLoaded(true);
  const handleMainImageError = () => {
    setMainImageError(true);
    setMainImageLoaded(true);
  };

  const handleThumbLoad = (index) => {
    setThumbLoaded(prev => ({ ...prev, [index]: true }));
  };
  const handleThumbError = (index) => {
    setThumbError(prev => ({ ...prev, [index]: true }));
    setThumbLoaded(prev => ({ ...prev, [index]: true }));
  };

  const handleRelatedImageLoad = (id) => {
    setRelatedImageLoaded(prev => ({ ...prev, [id]: true }));
  };
  const handleRelatedImageError = (id) => {
    console.warn(`Related image failed to load for product ${id}`);
    setRelatedImageError(prev => ({ ...prev, [id]: true }));
    setRelatedImageLoaded(prev => ({ ...prev, [id]: true }));
  };

  if (loading) {
    return (
      <div className="ecom-loader-container">
        <div className="ecom-loader-spinner"></div>
        <p>Loading details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="ecom-error-container py-5 text-center">
        <p className="ecom-error-message">{error || "Product not found"}</p>
        <button className="ecom-btn-primary mt-3" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const allImages = [
    ...(product.main_image_url ? [product.main_image_url] : []),
    ...(product.sub_images?.map(img => img.image_url) || [])
  ].filter(Boolean);

  return (
    <div className="ecom-product-page container py-5">
      <div className="row g-4 align-items-start">
        {/* LEFT – IMAGE GALLERY (unchanged) */}
        <div className="col-lg-5 col-md-6">
          <div className="ecom-gallery-container">
            <div className="ecom-main-image-wrapper">
              {!mainImageLoaded && activeImg && !mainImageError && (
                <div className="ecom-image-loader"><div className="ecom-spinner"></div></div>
              )}
              {activeImg && !mainImageError && (
                <img
                  src={activeImg}
                  alt={product.name}
                  className="ecom-main-img"
                  style={{ display: mainImageLoaded ? 'block' : 'none' }}
                  onLoad={handleMainImageLoad}
                  onError={handleMainImageError}
                />
              )}
              {(mainImageError || !activeImg) && (
                <div className="ecom-image-fallback"><span>No image</span></div>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="ecom-thumbnail-row">
                {allImages.map((img, index) => {
                  const thumbUrl = getImageUrl(img);
                  const isLoaded = thumbLoaded[index];
                  const hasError = thumbError[index];
                  return (
                    <div
                      key={index}
                      className={`ecom-thumb-box ${activeImg === thumbUrl ? "active" : ""}`}
                      onClick={() => setActiveImg(thumbUrl)}
                    >
                      {!isLoaded && thumbUrl && !hasError && (
                        <div className="ecom-thumb-loader"><div className="ecom-spinner-small"></div></div>
                      )}
                      {thumbUrl && !hasError && (
                        <img
                          src={thumbUrl}
                          alt={`Thumbnail ${index + 1}`}
                          className="ecom-thumb-img"
                          style={{ display: isLoaded ? 'block' : 'none' }}
                          onLoad={() => handleThumbLoad(index)}
                          onError={() => handleThumbError(index)}
                        />
                      )}
                      {(hasError || !thumbUrl) && (
                        <div className="ecom-thumb-fallback"><span>No image</span></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT – PRODUCT DETAILS (unchanged) */}
        <div className="col-lg-7 col-md-6">
          <div className="ecom-product-info">
            <h1 className="ecom-product-title">{product.name}</h1>
            {product.sku && <p className="ecom-sku">SKU: <span>{product.sku}</span></p>}
            <hr className="ecom-divider" />

            <div className="ecom-price-section">
              {product.core_price || product.elite_price || product.pro_price ? (
                <div className="ecom-tiered-pricing">
                  <span className="ecom-price-label">Available Tiers:</span>
                  <div className="ecom-tier-grid">
                    {product.core_price && <div className="ecom-tier-card core"><span className="tier-name">Core</span><span className="tier-price">₹ {product.core_price.toLocaleString()}</span></div>}
                    {product.elite_price && <div className="ecom-tier-card elite"><span className="tier-name">Elite</span><span className="tier-price">₹ {product.elite_price.toLocaleString()}</span></div>}
                    {product.pro_price && <div className="ecom-tier-card pro"><span className="tier-name">Pro</span><span className="tier-price">₹ {product.pro_price.toLocaleString()}</span></div>}
                  </div>
                </div>
              ) : (
                <div className="ecom-single-price-box">
                  <span className="ecom-price-symbol">₹</span>
                  <span className="ecom-price-value">{product.price ? product.price.toLocaleString() : "Price on request"}</span>
                </div>
              )}
            </div>

            <div className="ecom-stock-status">
              <span className={`ecom-stock-indicator ${product.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {product.stock_quantity > 0 ? `In stock: ${product.stock_quantity} available` : "Out of stock - Contact for availability"}
              </span>
            </div>

            {product.cloth_colors && product.cloth_colors.length > 0 && (
              <div className="ecom-color-variants mt-3">
                <p className="ecom-variant-label">Available Colors:</p>
                <div className="ecom-color-tags">
                  {product.cloth_colors.map((color, idx) => <span key={idx} className="ecom-color-tag">{color}</span>)}
                </div>
              </div>
            )}

            <hr className="ecom-divider" />
            <div className="ecom-description-section">
              <h3 className="ecom-section-heading">About this item</h3>
              <p className="ecom-description-text">{product.description}</p>
            </div>

            <div className="ecom-action-buttons">
              <button className="ecom-btn ecom-btn-whatsapp"><i className="bi bi-whatsapp"></i> WhatsApp Enquiry</button>
              <button className="ecom-btn ecom-btn-call"><i className="bi bi-telephone"></i> Call Now</button>
            </div>
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS – now using only main_image_url */}
     {relatedProducts.length > 0 && (
  <div className="ecom-related-section mt-5 pt-4 border-top">
    <h2 className="ecom-related-title">You May Also Like</h2>
    <div className="row g-3 ecom-related-grid mt-3">
      {relatedProducts.map((item) => {
        const relatedImgUrl = getRelatedProductImageUrl(item);
        const isLoaded = relatedImageLoaded[item.id];
        const hasError = relatedImageError[item.id];
        const displayPrice = getDisplayPrice(item);
        return (
          <div key={item.id} className="col-6 col-md-4 col-lg-3">
            <div className="ecom-related-card" onClick={() => handleRelatedProductClick(item)}>
              <div className="ecom-related-img-box">
                {!isLoaded && relatedImgUrl !== PLACEHOLDER_IMAGE && (
                  <div className="ecom-related-loader"><div className="ecom-spinner-small"></div></div>
                )}
                <img
                  src={relatedImgUrl}
                  alt={item.name}
                  className="ecom-related-img"
                  ref={(img) => {
                    if (img && img.complete && !isLoaded && !hasError) {
                      handleRelatedImageLoad(item.id);
                    }
                  }}
                  onLoad={() => handleRelatedImageLoad(item.id)}
                  onError={() => handleRelatedImageError(item.id)}
                />
                {(hasError || !relatedImgUrl) && (
                  <div className="ecom-related-fallback"><span>No image</span></div>
                )}
              </div>
              <div className="ecom-related-details">
                <p className="ecom-related-name" title={item.name}>
                  {item.name.length > 40 ? item.name.slice(0, 37) + '...' : item.name}
                </p>
                <p className="ecom-related-price">{displayPrice}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
    </div>
  );
};

export default ProductDetails;