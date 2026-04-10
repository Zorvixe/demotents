import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ProductDetails.css";

const ProductDetails = () => {
  const { productId } = useParams();
  const { productSlug } = useParams();

  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImg, setActiveImg] = useState("");
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [allLightboxImages, setAllLightboxImages] = useState([]);

  const [mainImageLoaded, setMainImageLoaded] = useState(false);
  const [mainImageError, setMainImageError] = useState(false);
  const [thumbLoaded, setThumbLoaded] = useState({});
  const [thumbError, setThumbError] = useState({});
  const [relatedImageLoaded, setRelatedImageLoaded] = useState({});
  const [relatedImageError, setRelatedImageError] = useState({});

  const BASE_URL = "https://api.demotents.com";
  const API_URL = `${BASE_URL}/api`;
  const PLACEHOLDER_IMAGE = "https://via.placeholder.com/300x300?text=No+Image";

  // Map color names to hex codes
  const getColorHex = (colorName) => {
    if (!colorName) return '#dddddd';

    const normalized = colorName.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

    const colorMap = {
      'Red': '#ff0000', 'Blue': '#0000ff', 'Green': '#008000', 'Black': '#000000',
      'White': '#ffffff', 'Yellow': '#ffff00', 'Purple': '#800080', 'Orange': '#ffa500',
      'Pink': '#ffc0cb', 'Brown': '#a52a2a', 'Gray': '#808080', 'Grey': '#808080',
      'Navy': '#000080', 'Maroon': '#800000', 'Teal': '#008080', 'Olive': '#808000',
      'Lime': '#00ff00', 'Cyan': '#00ffff', 'Magenta': '#ff00ff', 'Silver': '#c0c0c0',
      'Gold': '#ffd700', 'Beige': '#f5f5dc', 'Ivory': '#fffff0', 'Khaki': '#f0e68c',
      'Coral': '#ff7f50', 'Salmon': '#fa8072', 'Turquoise': '#40e0d0', 'Lavender': '#e6e6fa',
      'Violet': '#ee82ee', 'Indigo': '#4b0082', 'Rose': '#ff007f', 'Copper': '#b87333',
      'Bronze': '#cd7f32', 'Charcoal': '#36454F', 'Cream': '#FFFDD0', 'Mint': '#98FB98',
      'Peach': '#FFDAB9', 'Rose Gold': '#B76E79', 'Tan': '#D2B48C', 'Camel': '#C19A6B',
      'Champagne': '#F7E7CE', 'Nude': '#E3BC9A', 'Olive Green': '#556B2F', 'Burgundy': '#800020',
      'Navy Blue': '#000080', 'Forest Green': '#228B22', 'Sky Blue': '#87CEEB', 'Mustard': '#FFDB58'
    };

    if (colorMap[normalized]) return colorMap[normalized];
    for (const [key, hex] of Object.entries(colorMap)) {
      if (normalized.includes(key) || key.includes(normalized)) return hex;
    }

    let hash = 0;
    for (let i = 0; i < colorName.length; i++) {
      hash = ((hash << 5) - hash) + colorName.charCodeAt(i);
      hash |= 0;
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 55%)`;
  };

  const handleColorSelect = (colorName) => setSelectedColor(colorName);

  const capitalizeFirstLetter = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const productRes = await fetch(`${API_URL}/products/${productSlug}`);
        if (!productRes.ok) throw new Error(`Failed to fetch product: ${productRes.status}`);
        const productData = await productRes.json();

        if (productData.success && productData.product) {
          const product = productData.product;
          setProduct(product);
          if (product.main_image_url) {
            const mainUrl = getImageUrl(product.main_image_url);
            setActiveImg(mainUrl);
          }

          if (product.category_id) {
            const relatedRes = await fetch(
              `${API_URL}/products?category_id=${product.category_id}&limit=6&is_active=true`
            );
            if (relatedRes.ok) {
              const relatedData = await relatedRes.json();
              if (relatedData.success) {
                const filtered = relatedData.products
                  .filter(p => p.id !== product.id)
                  .slice(0, 6);
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

  const getRelatedProductImageUrl = (product) => {
    if (product.main_image_url) {
      const url = getImageUrl(product.main_image_url);
      if (url) return url;
    }
    return PLACEHOLDER_IMAGE;
  };

  const handleRelatedProductClick = (relatedProduct) => {
    window.scrollTo(0, 0);
    navigate(`/product/${relatedProduct.id}/${relatedProduct.slug || ""}`);
  };

  useEffect(() => {
    setMainImageLoaded(false);
    setMainImageError(false);
  }, [activeImg]);

  // Build array of all images for lightbox
  useEffect(() => {
    if (product) {
      const images = [
        ...(product.main_image_url ? [product.main_image_url] : []),
        ...(product.sub_images?.map(img => img.image_url) || [])
      ].filter(Boolean).map(img => getImageUrl(img));
      setAllLightboxImages(images);
    }
  }, [product]);

  const handleMainImageLoad = () => setMainImageLoaded(true);
  const handleMainImageError = () => {
    setMainImageError(true);
    setMainImageLoaded(true);
  };

  const handleThumbLoad = (index) => setThumbLoaded(prev => ({ ...prev, [index]: true }));
  const handleThumbError = (index) => {
    setThumbError(prev => ({ ...prev, [index]: true }));
    setThumbLoaded(prev => ({ ...prev, [index]: true }));
  };

  const handleRelatedImageLoad = (id) => setRelatedImageLoaded(prev => ({ ...prev, [id]: true }));
  const handleRelatedImageError = (id) => {
    setRelatedImageError(prev => ({ ...prev, [id]: true }));
    setRelatedImageLoaded(prev => ({ ...prev, [id]: true }));
  };

  // Open lightbox on main image click
  const openLightbox = () => {
    const currentIndex = allLightboxImages.findIndex(img => img === activeImg);
    setLightboxIndex(currentIndex >= 0 ? currentIndex : 0);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % allLightboxImages.length);
  };

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + allLightboxImages.length) % allLightboxImages.length);
  };

  if (loading) {
    return (
      <div className="global-loader">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="ecom-error-container py-5 text-center">
        <p className="ecom-error-message">{error || "Product not found"}</p>
        <button className="ecom-amz-btn-primary mt-3" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const allImages = [
    ...(product.main_image_url ? [product.main_image_url] : []),
    ...(product.sub_images?.map(img => img.image_url) || [])
  ].filter(Boolean);


  // ✅ WhatsApp Share Function
  const shareOnWhatsApp = () => {
    const baseUrl = window.location.origin;

    // Build SEO-friendly product URL
    const productUrl = `${baseUrl}/product/${product.id}/${product.slug || ""}`;

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

  return (
    <div className="ecom-product-page container py-4">
      {/* LIGHTBOX MODAL */}
      {lightboxOpen && allLightboxImages.length > 0 && (
        <div className="ecom-lightbox" onClick={closeLightbox}>
          <span className="ecom-lightbox-close" onClick={closeLightbox}>&times;</span>
          <button className="ecom-lightbox-prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>&#10094;</button>
          <div className="ecom-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={allLightboxImages[lightboxIndex]} alt="Zoom" />
          </div>
          <button className="ecom-lightbox-next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>&#10095;</button>
        </div>
      )}

      <div className="row g-4 ecom-main-row">
        {/* LEFT – IMAGE GALLERY */}
        <div className="col-lg-5 col-md-6 ecom-gallery-section">
          <div className="ecom-gallery-layout">
            {/* Thumbnails */}
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="ecom-thumbnail-col">
                {allImages.map((img, index) => {
                  const thumbUrl = getImageUrl(img);
                  const isLoaded = thumbLoaded[index];
                  const hasError = thumbError[index];
                  return (
                    <div
                      key={index}
                      className={`ecom-thumb-box ${activeImg === thumbUrl ? "active" : ""}`}
                      onClick={() => setActiveImg(thumbUrl)}   // ← only onClick, no onMouseEnter
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
                        <div className="ecom-thumb-fallback"><span>No img</span></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Main Image (clickable) */}
            <div className="ecom-main-image-wrapper" onClick={openLightbox}>
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
                <div className="ecom-image-fallback"><i className="bi bi-image text-muted fs-1"></i><span className="mt-2">No image available</span></div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT – PRODUCT DETAILS (unchanged except minor fixes) */}
        <div className="col-lg-7 col-md-6 ecom-info-section">
          <div className="ecom-product-info">
            <h1 className="ecom-product-title">{capitalizeFirstLetter(product.name)}</h1>
            <div className="ecom-rating-box">
              <span className="ecom-stars">
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-half"></i>
              </span>
              <a href="#reviews" className="ecom-rating-count">1,245 ratings</a>
              <span className="ecom-rating-divider">|</span>
              <a href="#qa" className="ecom-qa-link">Search this page</a>
            </div>

            <hr className="ecom-divider" />

            <div className="ecom-price-section">
              {product.core_price || product.elite_price || product.pro_price ? (
                <div className="ecom-tiered-pricing">
                  <div className="ecom-price-label-amz">Available Configurations</div>
                  <div className="ecom-tier-boxes">
                    {product.core_price && (
                      <div className="ecom-amz-box">
                        <span className="amz-box-title">Core</span>
                        <span className="amz-box-price">₹{product.core_price.toLocaleString()}</span>
                      </div>
                    )}
                    {product.elite_price && (
                      <div className="ecom-amz-box">
                        <span className="amz-box-title">Elite</span>
                        <span className="amz-box-price">₹{product.elite_price.toLocaleString()}</span>
                      </div>
                    )}
                    {product.pro_price && (
                      <div className="ecom-amz-box">
                        <span className="amz-box-title">Pro</span>
                        <span className="amz-box-price">₹{product.pro_price.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="ecom-main-price-block">
                  <div className="ecom-price-row">
                    <span className="ecom-price-symbol">₹</span>
                    <span className="ecom-price-whole">{product.price ? product.price.toLocaleString() : "Price on request"}</span>
                  </div>
                  <div className="ecom-tax-text">Inclusive of all taxes</div>
                </div>
              )}
            </div>

            <hr className="ecom-divider" />

            <div className="ecom-meta-table">
              {product.sku && <div className="ecom-meta-row"><span className="ecom-meta-label">SKU : </span><span className="ecom-meta-val">{product.sku}</span></div>}
              {product.product_type && <div className="ecom-meta-row"><span className="ecom-meta-label">Type : </span><span className="ecom-meta-val">{product.product_type}</span></div>}
              {product.size && <div className="ecom-meta-row"><span className="ecom-meta-label">Size</span><span className="ecom-meta-val">{product.size}</span></div>}
            </div>

            <div className="ecom-stock-box mt-3">
              <h4 className={`ecom-stock-text ${product.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {product.stock_quantity > 0 ? 'In Stock' : 'Currently unavailable.'}
              </h4>
              {product.stock_quantity > 0 && <p className="ecom-seller-text">Sold by <b>Official Store</b> and Fulfilled by Platform.</p>}
            </div>

            {/* Color Swatches */}
            {(() => {
              const colorsArray = Array.isArray(product.cloth_colors) ? product.cloth_colors : [];
              const validColors = colorsArray.filter(c => c && c.trim() !== "");
              if (validColors.length === 0) return null;
              return (
                <div className="ecom-color-variants mt-3">
                  <p className="ecom-variant-label-text">Color: <strong>{selectedColor || "Select a color"}</strong></p>
                  <div className="ecom-color-swatches">
                    {validColors.map((colorName, idx) => {
                      const hexColor = getColorHex(colorName);
                      const isSelected = selectedColor === colorName;
                      return (
                        <div
                          key={idx}
                          className={`ecom-swatch ${isSelected ? 'selected' : ''}`}
                          style={{ backgroundColor: hexColor }}
                          title={colorName}
                          onClick={() => handleColorSelect(colorName)}
                        >
                          {isSelected && (
                            <i className="bi bi-check-lg ecom-swatch-check"></i>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div className="ecom-description-section mt-4">
              <h3 className="ecom-section-heading">About this item</h3>
              <ul className="ecom-bullets">
                {product.description ? (
                  product.description.split('\n').filter(line => line.trim() !== '').map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))
                ) : (
                  <li>Premium quality materials used for long-lasting durability.</li>
                )}
              </ul>
            </div>

            <div className="ecom-action-panel mt-4">
              <div className="ecom-qty-selector mb-3">
                <label>Qty:</label>
                <select className="ecom-qty-dropdown">
                  <option>1</option><option>2</option><option>3</option><option>4</option><option>5</option>
                </select>
              </div>
              <div className="ecom-action-buttons">
                <button className="ecom-btn-amz-yellow" onClick={shareOnWhatsApp}>
                  <i className="bi bi-whatsapp"></i> Enquire on WhatsApp
                </button>

                <button className="ecom-btn-amz-orange" onClick={() => window.location.href = "tel:+919010864897"}>
                  <i className="bi bi-telephone"></i> Call to Buy Now
                </button>
              </div>
              <div className="ecom-secure-text mt-3">
                <i className="bi bi-lock-fill text-muted"></i> Secure transaction
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr className="ecom-heavy-divider" />

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <div className="ecom-related-section">
          <h2 className="ecom-related-heading">Also Like</h2>
          <div className="ecom-related-scroller">
            <div className="ecom-related-track">
              {relatedProducts.map((item) => {
                const relatedImgUrl = getRelatedProductImageUrl(item);
                const isLoaded = relatedImageLoaded[item.id];
                const hasError = relatedImageError[item.id];

                let displayPrice = "";
                if (item.core_price || item.elite_price || item.pro_price) {
                  const prices = [item.core_price, item.elite_price, item.pro_price].filter(p => p && !isNaN(p) && p > 0);
                  if (prices.length) displayPrice = `₹${Math.min(...prices).toLocaleString()}`;
                } else if (item.price) {
                  displayPrice = `₹${item.price.toLocaleString()}`;
                }

                return (
                  <div key={item.id} className="ecom-related-card" onClick={() => handleRelatedProductClick(item)}>
                    <div className="ecom-related-img-box">
                      {!isLoaded && relatedImgUrl && !hasError && (
                        <div className="ecom-related-loader"><div className="ecom-spinner-small"></div></div>
                      )}
                      {relatedImgUrl && !hasError && (
                        <img
                          src={relatedImgUrl}
                          alt={item.name}
                          className="ecom-related-img"
                          style={{ display: isLoaded ? 'block' : 'none' }}
                          onLoad={() => handleRelatedImageLoad(item.id)}
                          onError={() => handleRelatedImageError(item.id)}
                        />
                      )}
                      {(hasError || !relatedImgUrl) && (
                        <div className="ecom-related-fallback"><i className="bi bi-image"></i></div>
                      )}
                    </div>
                    <div className="ecom-related-details">
                      <p className="ecom-related-name" title={item.name}>{item.name}</p>
                      <div className="ecom-related-stars">
                        <i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-half"></i> <span className="text-muted">89</span>
                      </div>
                      <p className="ecom-related-price">{displayPrice || "Contact for price"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;