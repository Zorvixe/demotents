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

  const API_URL = `${"https://demotents-dhia.onrender.com" || "http://localhost:5004"}/api`;

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch product details
        const productRes = await fetch(`${API_URL}/products/${productId}`);
        
        if (!productRes.ok) {
          throw new Error(`Failed to fetch product: ${productRes.status}`);
        }
        
        const productData = await productRes.json();

        if (productData.success && productData.product) {
          const product = productData.product;
          setProduct(product);
          
          // Set active image
          if (product.main_image_url) {
            const mainImage = product.main_image_url.startsWith('http') 
              ? product.main_image_url 
              : `https://demotents-dhia.onrender.com${product.main_image_url}`;
            setActiveImg(mainImage);
          }

          // Fetch related products from same category
          if (product.category_id) {
            const relatedRes = await fetch(
              `${API_URL}/products?category_id=${product.category_id}&limit=4&is_active=true`
            );
            
            if (relatedRes.ok) {
              const relatedData = await relatedRes.json();
              if (relatedData.success) {
                // Filter out current product
                const filteredRelated = relatedData.products
                  .filter(p => p.id !== product.id)
                  .slice(0, 4); // Limit to 4 products
                setRelatedProducts(filteredRelated);
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
    if (!imagePath) return '/placeholder.jpg';
    return imagePath.startsWith('http') 
      ? imagePath 
      : `https://demotents-dhia.onrender.com${imagePath}`;
  };

  const handleRelatedProductClick = (relatedProduct) => {
    // Scroll to top when navigating to related product
    window.scrollTo(0, 0);
    navigate(`/product/${relatedProduct.id}`, {
      state: { product: relatedProduct }
    });
  };

  // ========== LOADER UI ==========
  if (loading) {
    return (
      <div className="ecom-loader-container">
        <div className="ecom-loader-spinner"></div>
        <p>Loading details...</p>
      </div>
    );
  }

  // ========== ERROR UI ==========
  if (error || !product) {
    return (
      <div className="ecom-error-container py-5 text-center">
        <p className="ecom-error-message">{error || "Product not found"}</p>
        <button 
          className="ecom-btn-primary mt-3"
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>
    );
  }

  // Get all images including main image and sub-images
  const allImages = [
    ...(product.main_image_url ? [product.main_image_url] : []),
    ...(product.sub_images?.map(img => img.image_url) || [])
  ].filter(Boolean);

  return (
    <div className="ecom-product-page container py-5">

      {/* MAIN LAYOUT */}
      <div className="row g-4 align-items-start">
        
        {/* LEFT – IMAGE GALLERY (Amazon/Flipkart Style) */}
        <div className="col-lg-5 col-md-6">
          <div className="ecom-gallery-container">
            {/* Main Image Box */}
            <div className="ecom-main-image-wrapper">
              <img
                src={activeImg || getImageUrl(product.main_image_url)}
                alt={product.name}
                className="ecom-main-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder.jpg';
                }}
              />
            </div>

            {/* Thumbnail Row */}
            {allImages.length > 1 && (
              <div className="ecom-thumbnail-row">
                {allImages.map((img, index) => (
                  <div 
                    key={index}
                    className={`ecom-thumb-box ${activeImg === getImageUrl(img) ? "active" : ""}`}
                    onClick={() => setActiveImg(getImageUrl(img))}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`Thumbnail ${index + 1}`}
                      className="ecom-thumb-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder.jpg';
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT – DETAILS (Clear hierarchy, pricing rules intact) */}
        <div className="col-lg-7 col-md-6">
          <div className="ecom-product-info">
            <h1 className="ecom-product-title">{product.name}</h1>
            
            {/* SKU */}
            {product.sku && (
              <p className="ecom-sku">SKU: <span>{product.sku}</span></p>
            )}

            <hr className="ecom-divider" />

            {/* PRICING SECTION */}
            <div className="ecom-price-section">
              {/* WITH CUSTOMIZATION / TIERS */}
              {product.core_price || product.elite_price || product.pro_price ? (
                <div className="ecom-tiered-pricing">
                  <span className="ecom-price-label">Available Tiers:</span>
                  <div className="ecom-tier-grid">
                    {product.core_price && (
                      <div className="ecom-tier-card core">
                        <span className="tier-name">Core</span>
                        <span className="tier-price">₹ {product.core_price?.toLocaleString()}</span>
                      </div>
                    )}
                    {product.elite_price && (
                      <div className="ecom-tier-card elite">
                        <span className="tier-name">Elite</span>
                        <span className="tier-price">₹ {product.elite_price?.toLocaleString()}</span>
                      </div>
                    )}
                    {product.pro_price && (
                      <div className="ecom-tier-card pro">
                        <span className="tier-name">Pro</span>
                        <span className="tier-price">₹ {product.pro_price?.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="ecom-single-price-box">
                  <span className="ecom-price-symbol">₹</span>
                  <span className="ecom-price-value">
                    {product.price ? product.price.toLocaleString() : "Price on request"}
                  </span>
                </div>
              )}
            </div>

            {/* STOCK STATUS */}
            <div className="ecom-stock-status">
              <span className={`ecom-stock-indicator ${product.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {product.stock_quantity > 0
                  ? `In stock: ${product.stock_quantity} available`
                  : "Out of stock - Contact for availability"}
              </span>
            </div>

            {/* COLORS SECTION */}
            {product.cloth_colors && product.cloth_colors.length > 0 && (
              <div className="ecom-color-variants mt-3">
                <p className="ecom-variant-label">Available Colors:</p>
                <div className="ecom-color-tags">
                  {product.cloth_colors.map((color, idx) => (
                    <span key={idx} className="ecom-color-tag">{color}</span>
                  ))}
                </div>
              </div>
            )}

            <hr className="ecom-divider" />

            {/* DESCRIPTION */}
            <div className="ecom-description-section">
              <h3 className="ecom-section-heading">About this item</h3>
              <p className="ecom-description-text">{product.description}</p>
            </div>

            {/* ACTION BUTTONS (Amazon/Flipkart style sticky logic via CSS) */}
            <div className="ecom-action-buttons">
              <button className="ecom-btn ecom-btn-whatsapp">
                <i className="bi bi-whatsapp"></i> WhatsApp Enquiry
              </button>
              <button className="ecom-btn ecom-btn-call">
                <i className="bi bi-telephone"></i> Call Now
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <div className="ecom-related-section mt-5 pt-4 border-top">
          <h2 className="ecom-related-title">Also Like</h2>
          <div className="row g-3 ecom-related-grid mt-3">
            {relatedProducts.map((item) => (
              <div key={item.id} className="col-6 col-md-4 col-lg-3">
                <div 
                  className="ecom-related-card"
                  onClick={() => handleRelatedProductClick(item)}
                >
                  <div className="ecom-related-img-box">
                    <img
                      src={getImageUrl(item.main_image_url)}
                      alt={item.name}
                      className="ecom-related-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder.jpg';
                      }}
                    />
                  </div>
                  <div className="ecom-related-details">
                    <p className="ecom-related-name" title={item.name}>{item.name}</p>
                    <p className="ecom-related-price">
                      ₹ {item.price?.toLocaleString() || 'Price on request'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;