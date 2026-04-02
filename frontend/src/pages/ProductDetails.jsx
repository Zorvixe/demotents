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
    navigate(`/product/${relatedProduct.id}`, {
      state: { product: relatedProduct }
    });
  };

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
          <p className="mt-3">Loading product d...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-details-page container py-5">
        <div className="text-center py-5">
          <p className="error-message">{error || "Product not found"}</p>
          <button 
            className="btn btn-primary mt-3"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Get all images including main image and sub-images
  const allImages = [
    ...(product.main_image_url ? [product.main_image_url] : []),
    ...(product.sub_images?.map(img => img.image_url) || [])
  ].filter(Boolean);

  return (
    <div className="product-details-page container py-5">
      {/* MAIN SECTION */}
      <div className="row g-5 align-items-start">
        {/* LEFT – IMAGES */}
        <div className="col-lg-6 col-md-12">
          <div className="product-image-box">
            <img
              src={activeImg || getImageUrl(product.main_image_url)}
              alt={product.name}
              className="main-product-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder.jpg';
              }}
            />
          </div>

          {allImages.length > 1 && (
            <div className="thumbnail-row">
              {allImages.map((img, index) => (
                <img
                  key={index}
                  src={getImageUrl(img)}
                  alt="thumbnail"
                  className={`thumb-img ${activeImg === getImageUrl(img) ? "active" : ""}`}
                  onClick={() => setActiveImg(getImageUrl(img))}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder.jpg';
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT – DETAILS */}
        <div className="col-lg-6 col-md-12">
          <h2 className="product-title">{product.name}</h2>
          
        

          <div className="product-price">

  {/* WITH CUSTOMIZATION */}
  {product.core_price || product.elite_price || product.pro_price ? (
    <>
      <p>Core: ₹ {product.core_price || "—"}</p>
      <p>Elite: ₹ {product.elite_price || "—"}</p>
      <p>Pro: ₹ {product.pro_price || "—"}</p>
    </>
  ) : (
    /* WITHOUT CUSTOMIZATION */
    <p>
      ₹ {product.price?.toLocaleString() || "Price on request"}
    </p>
  )}

  {/* COLORS (FOR BOTH) */}
  {product.cloth_colors && product.cloth_colors.length > 0 && (
  <p className="product-colors">
    Colors: {product.cloth_colors.join(", ")}
  </p>
)}

</div>

          <p className={`product-stock ${product.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
            {product.stock_quantity > 0
              ? `In stock: ${product.stock_quantity} available`
              : "Out of stock - Contact for availability"}
          </p>

          {product.sku && (
            <p className="product-sku-detail">SKU: {product.sku}</p>
          )}

          <p className="product-description">{product.description}</p>

          <div className="product-actions mt-4">
            <button className="btn contact-product-btn me-3">
              <i className="bi bi-whatsapp me-2"></i> WhatsApp Enquiry
            </button>
            <button className="btn btn-outline-primary">
              <i className="bi bi-telephone me-2"></i> Call Now
            </button>
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <div className="related-products mt-5">
          <h4 className="mb-4">You may also like</h4>

          <div className="row g-3">
            {relatedProducts.map((item) => (
              <div key={item.id} className="col-6 col-md-4 col-lg-3">
                <div 
                  className="related-card"
                  onClick={() => handleRelatedProductClick(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={getImageUrl(item.main_image_url)}
                    alt={item.name}
                    className="related-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder.jpg';
                    }}
                  />
                  <p className="related-title">{item.name}</p>
                  <p className="related-price">
                    ₹ {item.price?.toLocaleString() || 'Price on request'}
                  </p>
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