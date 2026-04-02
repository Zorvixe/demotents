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

  const API_URL = `${import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:5004"}/api`;
  


  // Default category images stored in React public folder
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

  // Fetch products for the category
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        let finalCategoryId = categoryId;
        let finalCategoryName = categoryName;

        // If categoryId not passed from navigate state, find from slug
        if (!finalCategoryId) {
          const categoryRes = await fetch(`${API_URL}/categories`);
          const categoryData = await categoryRes.json();
          if (categoryData.success) {
            const foundCategory = categoryData.categories.find(
              (cat) =>
                cat.name.toLowerCase().replace(/\s+/g, "-") === categorySlug
            );
            if (foundCategory) {
              finalCategoryId = foundCategory.id;
              finalCategoryName = foundCategory.name;
              setCategoryData(foundCategory);
            }
          }
        }

        if (!finalCategoryId) throw new Error("Category not found");

        const productRes = await fetch(
          `${API_URL}/products?category_id=${finalCategoryId}&is_active=true`
        );

        if (!productRes.ok)
          throw new Error(`Failed to fetch products: ${productRes.status}`);

        const productData = await productRes.json();
        if (productData.success) setProducts(productData.products);
        else setError(productData.message || "Failed to load products");
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categorySlug, categoryId, categoryName]);

  // Helper: Get category image
  const getCategoryImage = (categoryName) => {
    return defaultCategoryImages[categoryName] || "/placeholder.jpg";
  };

  // Open product modal
  const openModal = (product) => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  // Loading state
  if (loading) {
    return (
      <div className="category-products-container py-5 text-center">
        <h3>Loading Products...</h3>
        <div className="spinner"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="category-products-container py-5 text-center">
        <h3>Products</h3>
        <p className="text-danger">{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  const displayCategoryName =
    categoryName || (categorySlug ? categorySlug.replace(/-/g, " ") : "Products");

    const getImageUrl = (url) => {
  if (!url) return "/placeholder.jpg";

  // If already full URL (new images)
  if (url.startsWith("http")) {
    return url;
  }

  // Old images (relative path)
  return `${import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:5004"}${url}`;
};
  return (
    <div className="container py-5 category-products-container" style={{ marginTop: "50px" }}>
      {/* Category Banner */}
      <div className="category-banner mb-5" style={{ position: "relative" }}>
        <img
          src={getCategoryImage(displayCategoryName)}
          alt={displayCategoryName}
          className="w-100"
          style={{ height: "250px", objectFit: "cover", borderRadius: "8px" }}
        />
        <div
          className="banner-overlay"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "2rem",
            fontWeight: "600",
            borderRadius: "8px",
          }}
        >
          {displayCategoryName}
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
                      src={getImageUrl(product.main_image_url)}
  alt={product.name}
  className="d-block w-100 product-image"
  onError={(e) => {
    e.target.onerror = null;
    e.target.src = "/placeholder.jpg";
  }}

                  />
                  {product.sub_images_count > 0 && (
                    <span className="photo-badge">+{product.sub_images_count}</span>
                  )}
                </div>

                <div className="card-body text-center d-flex flex-column justify-content-between">
                  <div>
                    <h6 className="product-title-category">{product.name}</h6>

                      {product.core_price || product.elite_price || product.pro_price ? (
                        <div className="product-price-category">
                          <p>Core: ₹ {product.core_price || "—"}</p>
                          <p>Elite: ₹ {product.elite_price || "—"}</p>
                          <p>Pro: ₹ {product.pro_price || "—"}</p>
                        </div>
                      ) : (
                        <p className="product-price-category">
                          ₹ {product.price?.toLocaleString() || "Price on request"}
                        </p>
                      )}

                      {/* ✅ ADD THIS */}
                      {product.cloth_colors && product.cloth_colors.length > 0 && (
                        <p className="product-colors-category">
                          Colors: {product.cloth_colors.join(", ")}
                        </p>
                      )}

                      <p className="product-sku-category">SKU: {product.sku || "N/A"}</p>
                  </div>
                  <div className="product-actions-category mt-3">
                    <button
                      className="btn btn-success btn-sm px-3 me-2"
                      onClick={() => openModal(product)}
                    >
                      View Details
                    </button>
                    <button className="btn btn-outline-primary btn-sm px-3">Enquire Now</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12 text-center py-5">
            <p className="no-products">No products available in this category yet.</p>
            <button className="btn btn-primary" onClick={() => navigate("/categories")}>
              Browse Other Categories
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryProducts;