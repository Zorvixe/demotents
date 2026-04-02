'use client';

import React, { useState, useEffect } from 'react';
import './List.css';

const List = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');
  
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    sub_category_id: '',
    stock_quantity: '',
    is_featured: false,
  });
  
  const [mainImageFile, setMainImageFile] = useState(null);
  const [subImageFiles, setSubImageFiles] = useState([]);
  const [existingSubImages, setExistingSubImages] = useState([]);

  const API_URL = 'https://demotents-dhia.onrender.com/api';

  // Fetch all data on mount
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProducts(),
        fetchCategories(),
      ]);
      setLoading(false);
    };
    fetchAllData();
  }, []);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      showNotification('Failed to fetch products', 'error');
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch subcategories
  const fetchSubCategories = async (categoryId) => {
    try {
      const response = await fetch(`${API_URL}/categories/${categoryId}/sub-categories`);
      const data = await response.json();
      if (data.success) {
        setSubCategories(data.sub_categories);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubCategories([]);
    }
  };

  // Fetch product details
  const fetchProductDetails = async (productId) => {
    try {
      const response = await fetch(`${API_URL}/products/${productId}`);
      const data = await response.json();
      if (data.success) {
        return data.product;
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
    return null;
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        showNotification('Product deleted successfully', 'success');
        fetchProducts();
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showNotification('Failed to delete product', 'error');
    }
  };

  // Handle edit
  const handleEdit = async (product) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category_id: product.category_id || '',
      sub_category_id: product.sub_category_id || '',
      stock_quantity: product.stock_quantity || 0,
      is_featured: product.is_featured || false,
    });

    if (product.category_id) {
      fetchSubCategories(product.category_id);
    }

    setMainImageFile(null);
    setSubImageFiles([]);
    setExistingSubImages([]);

    const fullProduct = await fetchProductDetails(product.id);
    if (fullProduct && fullProduct.sub_images) {
      setExistingSubImages(fullProduct.sub_images.map(img => img.id));
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({
      name: '',
      description: '',
      price: '',
      category_id: '',
      sub_category_id: '',
      stock_quantity: '',
      is_featured: false,
    });
    setMainImageFile(null);
    setSubImageFiles([]);
    setExistingSubImages([]);
    setSubCategories([]);
  };

  // Handle form change
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'category_id') {
      setEditForm(prev => ({
        ...prev,
        [name]: value,
        sub_category_id: '',
      }));
      if (value) {
        fetchSubCategories(value);
      } else {
        setSubCategories([]);
      }
    } else {
      setEditForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  // Handle main image change
  const handleMainImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setMainImageFile(e.target.files[0]);
    }
  };

  // Handle sub images change
  const handleSubImagesChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);

      if (subImageFiles.length + filesArray.length > 10) {
        showNotification('Maximum 10 sub-images allowed', 'error');
        return;
      }

      const oversizedFiles = filesArray.filter(file => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        showNotification('Some files exceed 5MB limit', 'error');
        return;
      }

      setSubImageFiles(prev => [...prev, ...filesArray]);
    }
  };

  // Remove sub image
  const removeSubImage = (index) => {
    setSubImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle update
  const handleUpdate = async (id) => {
    try {
      const formData = new FormData();

      Object.keys(editForm).forEach(key => {
        if (editForm[key] !== null && editForm[key] !== undefined) {
          formData.append(key, editForm[key]);
        }
      });

      if (mainImageFile) {
        formData.append('mainImage', mainImageFile);
      }

      subImageFiles.forEach((file) => {
        formData.append('subImages', file);
      });

      if (existingSubImages.length > 0) {
        formData.append('existingSubImages', JSON.stringify(existingSubImages));
      }

      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        showNotification('Product updated successfully', 'success');
        handleCancelEdit();
        fetchProducts();
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      showNotification('Failed to update product', 'error');
    }
  };

  // Get category name
  const getCategoryName = (product) => {
    if (product.category_name) {
      return product.category_name;
    }
    const category = categories.find(cat => cat.id === product.category_id);
    return category ? category.name : 'No Category';
  };

  // Get subcategory name
  const getSubCategoryName = (product) => {
    if (product.sub_category_name) {
      return product.sub_category_name;
    }
    if (product.sub_category_id) {
      const subCategory = subCategories.find(sub => sub.id === product.sub_category_id);
      return subCategory ? subCategory.name : '';
    }
    return '';
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === '' || product.category_id === parseInt(filterCategory);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'stock':
          return b.stock_quantity - a.stock_quantity;
        case 'featured':
          return b.is_featured - a.is_featured;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="product-list-container">
      {notification.message && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="header-section">
        <div className="header-content">
          <div className="header-text">
            <h3 className="header-title">Product Inventory</h3>
            <p className="header-subtitle">Manage and organize your products efficiently</p>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <span className="stat-number">{filteredProducts.length}</span>
              <span className="stat-label">Products</span>
            </div>
            <div className="stat-card featured">
              <span className="stat-number">{products.filter(p => p.is_featured).length}</span>
              <span className="stat-label">Featured</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input search-input"
          />
        </div>
        <div className="filter-group">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-input"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-input"
          >
            <option value="name">Sort by Name</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="stock">Stock Quantity</option>
            <option value="featured">Featured First</option>
          </select>
        </div>
      </div>

      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No Products Found</h3>
          <p>Try adjusting your filters or add a new product</p>
        </div>
      ) : (
        <div className="products-container">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`product-card ${editingId === product.id ? 'editing' : ''}`}
            >
              {/* Product Image */}
              <div className="product-image-section">
                {editingId === product.id ? (
                  <div className="image-edit-wrapper">
                    <div className="current-image">
                      <img
                        src={mainImageFile ? URL.createObjectURL(mainImageFile) : `${API_URL.replace('/api', '')}${product.main_image_url}`}
                        alt={product.name}
                      />
                    </div>
                    <label className="change-image-btn">
                      <input
                        type="file"
                        onChange={handleMainImageChange}
                        accept="image/*"
                      />
                      <span>Change Image</span>
                    </label>
                    {mainImageFile && (
                      <p className="filename">{mainImageFile.name}</p>
                    )}
                  </div>
                ) : (
                  <div className="product-image">
                    <img
                      src={`${API_URL.replace('/api', '')}${product.main_image_url || '/uploads/default.jpg'}`}
                      alt={product.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
                      }}
                    />
                    {product.sub_images_count > 0 && (
                      <div className="image-badge">+{product.sub_images_count}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="product-info-section">
                {editingId === product.id ? (
                  <>
                    <input
                      type="text"
                      name="name"
                      value={editForm.name}
                      onChange={handleFormChange}
                      className="edit-input"
                      placeholder="Product Name"
                    />
                  </>
                ) : (
                  <>
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-sku">SKU: {product.sku || 'N/A'}</p>
                  </>
                )}
              </div>

              {/* Product Details Grid */}
              <div className="product-details-grid">
                {/* Category */}
                <div className="detail-item">
                  <label>Category</label>
                  {editingId === product.id ? (
                    <select
                      name="category_id"
                      value={editForm.category_id}
                      onChange={handleFormChange}
                      className="edit-input"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="detail-value">{getCategoryName(product)}</span>
                  )}
                </div>

                {/* Sub-Category */}
                <div className="detail-item">
                  <label>Sub-Category</label>
                  {editingId === product.id ? (
                    <select
                      name="sub_category_id"
                      value={editForm.sub_category_id}
                      onChange={handleFormChange}
                      className="edit-input"
                      disabled={!editForm.category_id}
                    >
                      <option value="">Select Sub-Category</option>
                      {subCategories.map(subCat => (
                        <option key={subCat.id} value={subCat.id}>{subCat.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="detail-value">{getSubCategoryName(product) || '-'}</span>
                  )}
                </div>

                {/* Price */}
                <div className="detail-item">
                  <label>Price</label>
                  {editingId === product.id ? (
                    <div className="price-input-group">
                      <span>$</span>
                      <input
                        type="number"
                        name="price"
                        value={editForm.price}
                        onChange={handleFormChange}
                        className="edit-input"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  ) : (
                    <span className="detail-value price">${parseFloat(product.price).toFixed(2)}</span>
                  )}
                </div>

                {/* Stock */}
                <div className="detail-item">
                  <label>Stock</label>
                  {editingId === product.id ? (
                    <input
                      type="number"
                      name="stock_quantity"
                      value={editForm.stock_quantity}
                      onChange={handleFormChange}
                      className="edit-input"
                      min="0"
                    />
                  ) : (
                    <span className={`detail-value stock ${product.stock_quantity === 0 ? 'out-of-stock' : 'in-stock'}`}>
                      {product.stock_quantity} units
                      {product.stock_quantity === 0 && <span className="stock-status"> - Out of Stock</span>}
                    </span>
                  )}
                </div>

                {/* Featured */}
                <div className="detail-item featured-item">
                  <label>Featured</label>
                  {editingId === product.id ? (
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        id={`featured-${product.id}`}
                        name="is_featured"
                        checked={editForm.is_featured}
                        onChange={handleFormChange}
                      />
                      <label htmlFor={`featured-${product.id}`} className="toggle-label"></label>
                    </div>
                  ) : (
                    <span className={`detail-value ${product.is_featured ? 'featured-badge' : 'not-featured'}`}>
                      {product.is_featured ? '⭐ Featured' : '-'}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {editingId === product.id && (
                <div className="description-section">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleFormChange}
                    className="edit-textarea"
                    placeholder="Product description"
                  ></textarea>
                </div>
              )}

              {/* Sub Images */}
              {editingId === product.id && (
                <div className="sub-images-section">
                  <label>Product Images</label>
                  <input
                    type="file"
                    onChange={handleSubImagesChange}
                    multiple
                    accept="image/*"
                    className="edit-input"
                  />
                  {subImageFiles.length > 0 && (
                    <div className="sub-images-preview">
                      {subImageFiles.map((file, index) => (
                        <div key={index} className="sub-image-item">
                          <img src={URL.createObjectURL(file) || "/placeholder.svg"} alt={`Preview ${index + 1}`} />
                          <button
                            type="button"
                            onClick={() => removeSubImage(index)}
                            className="remove-image-btn"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {subImageFiles.length > 0 && (
                    <p className="image-count">{subImageFiles.length} new images</p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="action-buttons">
                {editingId === product.id ? (
                  <>
                    <button
                      onClick={() => handleUpdate(product.id)}
                      className="btn btn-save"
                    >
                      ✓ Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="btn btn-cancel"
                    >
                      ✕ Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(product)}
                      className="btn btn-edit"
                    >
                      ✎ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="btn btn-delete"
                    >
                      🗑 Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default List;
