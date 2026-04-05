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
    sku: '',
    size: '',
    product_type: '',
    without_print_price: '',
    core_price: '',
    elite_price: '',
    pro_price: '',
    cloth_colors: '',
  });

  const [mainImageFile, setMainImageFile] = useState(null);
  const [subImageFiles, setSubImageFiles] = useState([]);
  const [existingSubImages, setExistingSubImages] = useState([]);
  const [existingMainImage, setExistingMainImage] = useState(null);

  const [imageLoaded, setImageLoaded] = useState({});
  const [imageError, setImageError] = useState({});

  const BASE_URL = "https://demotents-dhia.onrender.com";
  const API_URL = `${BASE_URL}/api`;

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchCategories()]);
      setLoading(false);
    };
    fetchAllData();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();
      if (data.success) setProducts(data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
      showNotification('Failed to fetch products', 'error');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);
      const data = await response.json();
      if (data.success) setCategories(data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSubCategories = async (categoryId) => {
    try {
      const response = await fetch(`${API_URL}/categories/${categoryId}/sub-categories`);
      const data = await response.json();
      if (data.success) setSubCategories(data.sub_categories);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubCategories([]);
    }
  };

  const fetchProductDetails = async (productId) => {
    try {
      const response = await fetch(`${API_URL}/products/${productId}`);
      const data = await response.json();
      if (data.success) return data.product;
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
    return null;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/uploads/")) return `${BASE_URL}${imagePath}`;
    return `${BASE_URL}/uploads/${imagePath}`;
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
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
      sku: product.sku || '',
      size: product.size || '',
      product_type: product.product_type || '',
      without_print_price: product.without_print_price || '',
      core_price: product.core_price || '',
      elite_price: product.elite_price || '',
      pro_price: product.pro_price || '',
      cloth_colors: product.cloth_colors ? product.cloth_colors.join(', ') : '',
    });
    setExistingMainImage(product.main_image_url);
    setMainImageFile(null);
    setSubImageFiles([]);
    setExistingSubImages([]);

    if (product.category_id) {
      await fetchSubCategories(product.category_id);
    }

    const fullProduct = await fetchProductDetails(product.id);
    if (fullProduct && fullProduct.sub_images) {
      setExistingSubImages(fullProduct.sub_images);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({
      name: '', description: '', price: '', category_id: '', sub_category_id: '',
      stock_quantity: '', is_featured: false, sku: '', size: '', product_type: '',
      without_print_price: '', core_price: '', elite_price: '', pro_price: '', cloth_colors: '',
    });
    setMainImageFile(null);
    setSubImageFiles([]);
    setExistingSubImages([]);
    setSubCategories([]);
    setExistingMainImage(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'category_id') {
      setEditForm(prev => ({ ...prev, [name]: value, sub_category_id: '' }));
      if (value) fetchSubCategories(value);
      else setSubCategories([]);
    } else if (name === 'product_type') {
      setEditForm(prev => ({
        ...prev,
        product_type: value,
        without_print_price: '',
        core_price: '',
        elite_price: '',
        pro_price: '',
      }));
    } else {
      setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleMainImageChange = (e) => {
    if (e.target.files && e.target.files[0]) setMainImageFile(e.target.files[0]);
  };

  const handleSubImagesChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const totalImages = existingSubImages.length + subImageFiles.length + filesArray.length;
      if (totalImages > 10) {
        showNotification(`Maximum 10 sub-images allowed. You can only add ${10 - (existingSubImages.length + subImageFiles.length)} more.`, 'error');
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

  const removeNewSubImage = (index) => {
    setSubImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingSubImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      const response = await fetch(`${API_URL}/products/${editingId}/images/${imageId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        showNotification('Image deleted successfully', 'success');
        setExistingSubImages(prev => prev.filter(img => img.id !== imageId));
        fetchProducts(); // refresh list background
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      showNotification('Failed to delete image', 'error');
    }
  };

  const handleUpdate = async () => {
    try {
      const formData = new FormData();
      Object.keys(editForm).forEach(key => {
        if (editForm[key] !== null && editForm[key] !== undefined) {
          if (key === 'cloth_colors') {
            const colorsArray = editForm[key].split(',').map(c => c.trim());
            formData.append(key, JSON.stringify(colorsArray));
          } else {
            formData.append(key, editForm[key]);
          }
        }
      });
      if (mainImageFile) formData.append('mainImage', mainImageFile);
      subImageFiles.forEach(file => formData.append('subImages', file));

      const response = await fetch(`${API_URL}/products/${editingId}`, {
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

  const getCategoryName = (product) => {
    if (product.category_name) return product.category_name;
    const category = categories.find(cat => cat.id === product.category_id);
    return category ? category.name : 'No Category';
  };

  const getSubCategoryName = (product) => {
    if (product.sub_category_name) return product.sub_category_name;
    if (product.sub_category_id) {
      const subCategory = subCategories.find(sub => sub.id === product.sub_category_id);
      return subCategory ? subCategory.name : '';
    }
    return '';
  };

  const handleImageLoad = (productId) => setImageLoaded(prev => ({ ...prev, [productId]: true }));
  const handleImageError = (productId) => {
    setImageError(prev => ({ ...prev, [productId]: true }));
    setImageLoaded(prev => ({ ...prev, [productId]: true }));
  };

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === '' || product.category_id === parseInt(filterCategory);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'stock': return b.stock_quantity - a.stock_quantity;
        case 'featured': return b.is_featured - a.is_featured;
        default: return a.name.localeCompare(b.name);
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

      {/* Edit Modal */}
      {editingId && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h2>Edit Product</h2>
              <button className="close-modal" onClick={handleCancelEdit}>&times;</button>
            </div>

            <div className="modal-body">
              <div className="modal-grid-2col">
                {/* Left column */}
                <div>
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input type="text" name="name" value={editForm.name} onChange={handleFormChange} className="edit-input" />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea name="description" value={editForm.description} onChange={handleFormChange} className="edit-textarea" rows="4"></textarea>
                  </div>
                  <div className="form-group">
                    <label>SKU</label>
                    <input type="text" name="sku" value={editForm.sku} onChange={handleFormChange} className="edit-input" />
                  </div>
                  <div className="form-group">
                    <label>Base Price *</label>
                    <input type="number" name="price" value={editForm.price} onChange={handleFormChange} className="edit-input" step="0.01" />
                  </div>
                  <div className="form-group">
                    <label>Stock Quantity *</label>
                    <input type="number" name="stock_quantity" value={editForm.stock_quantity} onChange={handleFormChange} className="edit-input" min="0" />
                  </div>
                  <div className="form-group">
                    <label>Size *</label>
                    <select name="size" value={editForm.size} onChange={handleFormChange} className="edit-input" required>
                      <option value="">Select Size</option>
                      <option value="4x4">4x4</option>
                      <option value="6x6">6x6</option>
                      <option value="10x10">10x10</option>
                      <option value="10x20">10x20</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Product Type *</label>
                    <select name="product_type" value={editForm.product_type} onChange={handleFormChange} className="edit-input" required>
                      <option value="">Select Type</option>
                      <option value="without_print">Without Print</option>
                      <option value="customization">With Customization</option>
                    </select>
                  </div>

                  {editForm.product_type === 'without_print' && (
                    <div className="form-group">
                      <label>Without Print Price</label>
                      <input type="number" name="without_print_price" value={editForm.without_print_price} onChange={handleFormChange} className="edit-input" step="0.01" />
                    </div>
                  )}
                  {editForm.product_type === 'customization' && (
                    <div className="grid-3-col">
                      <div className="form-group"><label>Core Price</label><input type="number" name="core_price" value={editForm.core_price} onChange={handleFormChange} className="edit-input" step="0.01" /></div>
                      <div className="form-group"><label>Elite Price</label><input type="number" name="elite_price" value={editForm.elite_price} onChange={handleFormChange} className="edit-input" step="0.01" /></div>
                      <div className="form-group"><label>Pro Price</label><input type="number" name="pro_price" value={editForm.pro_price} onChange={handleFormChange} className="edit-input" step="0.01" /></div>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Cloth Colors (comma separated)</label>
                    <input type="text" name="cloth_colors" value={editForm.cloth_colors} onChange={handleFormChange} placeholder="Red, Blue, Green" className="edit-input" />
                  </div>
                </div>

                {/* Right column */}
                <div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select name="category_id" value={editForm.category_id} onChange={handleFormChange} className="edit-input" required>
                      <option value="">Select Category</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Sub-Category</label>
                    <select name="sub_category_id" value={editForm.sub_category_id} onChange={handleFormChange} className="edit-input" disabled={!editForm.category_id}>
                      <option value="">Select Sub-Category</option>
                      {subCategories.map(subCat => <option key={subCat.id} value={subCat.id}>{subCat.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group featured-toggle">
                    <label>Featured Product</label>
                    <div className="toggle-switch">
                      <input type="checkbox" id="featured-edit" name="is_featured" checked={editForm.is_featured} onChange={handleFormChange} />
                      <label htmlFor="featured-edit" className="toggle-label"></label>
                    </div>
                  </div>

                  <hr />
                  <div className="form-group">
                    <label>Main Image</label>
                    <div className="image-edit-wrapper">
                      <div className="current-image">
                        {mainImageFile ? (
                          <img src={URL.createObjectURL(mainImageFile)} alt="Preview" />
                        ) : (
                          <img src={getImageUrl(existingMainImage)} alt="Current Main" />
                        )}
                      </div>
                      <label className="change-image-btn">
                        <input type="file" onChange={handleMainImageChange} accept="image/*" />
                        <span>Change Main Image</span>
                      </label>
                    </div>
                  </div>

                  <hr />
                  <div className="form-group">
                    <label>Existing Sub Images</label>
                    {existingSubImages.length === 0 ? (
                      <p className="no-images-text">No existing sub-images.</p>
                    ) : (
                      <div className="sub-images-preview">
                        {existingSubImages.map((img) => (
                          <div key={img.id} className="sub-image-item">
                            <img src={getImageUrl(img.image_url)} alt="Sub" />
                            <button type="button" onClick={() => handleDeleteExistingSubImage(img.id)} className="remove-image-btn" title="Delete Image">×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Add New Sub Images (Max total: 10)</label>
                    <input type="file" onChange={handleSubImagesChange} multiple accept="image/*" className="edit-input" />
                    {subImageFiles.length > 0 && (
                      <div className="sub-images-preview mt-2">
                        {subImageFiles.map((file, index) => (
                          <div key={index} className="sub-image-item">
                            <img src={URL.createObjectURL(file)} alt={`Preview ${index + 1}`} />
                            <button type="button" onClick={() => removeNewSubImage(index)} className="remove-image-btn">×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={handleCancelEdit} className="btn btn-cancel">Cancel</button>
              <button onClick={handleUpdate} className="btn btn-save">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Header, Filters and Products Grid (unchanged) */}
      <div className="header-section">
        <div className="header-content">
          <div className="header-text">
            <h3 className="header-title">Product Inventory</h3>
            <p className="header-subtitle">Manage and organize your products efficiently</p>
          </div>
          <div className="header-stats">
            <div className="stat-card"><span className="stat-number">{filteredProducts.length}</span><span className="stat-label">Products</span></div>
            <div className="stat-card featured"><span className="stat-number">{products.filter(p => p.is_featured).length}</span><span className="stat-label">Featured</span></div>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-group"><input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="filter-input search-input" /></div>
        <div className="filter-group"><select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="filter-input"><option value="">All Categories</option>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></div>
        <div className="filter-group"><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-input"><option value="name">Sort by Name</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="stock">Stock Quantity</option><option value="featured">Featured First</option></select></div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📦</div><h3>No Products Found</h3><p>Try adjusting your filters or add a new product</p></div>
      ) : (
        <div className="products-container">
          {filteredProducts.map((product) => {
            const imgUrl = getImageUrl(product.main_image_url);
            const isLoaded = imageLoaded[product.id];
            const hasError = imageError[product.id];
            return (
              <div key={product.id} className="product-card">
                <div className="product-image-section">
                  <div className="product-image">
                    {!isLoaded && imgUrl && !hasError && <div className="image-loader-overlay"><div className="spinner-small"></div></div>}
                    {imgUrl && !hasError && <img src={imgUrl} alt={product.name} style={{ display: isLoaded ? 'block' : 'none' }} onLoad={() => handleImageLoad(product.id)} onError={() => handleImageError(product.id)} />}
                    {(hasError || !imgUrl) && <div className="no-image-placeholder">No image</div>}
                    {product.sub_images_count > 0 && <div className="image-badge">+{product.sub_images_count} images</div>}
                  </div>
                </div>
                <div className="product-info-section"><h3 className="product-name">{product.name}</h3><p className="product-sku">SKU: {product.sku || 'N/A'}</p></div>
                <div className="product-details-grid">
                  <div className="detail-item"><label>Category</label><span className="detail-value">{getCategoryName(product)}</span></div>
                  <div className="detail-item"><label>Sub-Category</label><span className="detail-value">{getSubCategoryName(product) || '-'}</span></div>
                  <div className="detail-item"><label>Price</label><span className="detail-value price">${parseFloat(product.price).toFixed(2)}</span></div>
                  <div className="detail-item"><label>Stock</label><span className={`detail-value stock ${product.stock_quantity === 0 ? 'out-of-stock' : 'in-stock'}`}>{product.stock_quantity} units{product.stock_quantity === 0 && <span className="stock-status"> - Out of Stock</span>}</span></div>
                  <div className="detail-item featured-item"><label>Featured</label><span className={`detail-value ${product.is_featured ? 'featured-badge' : 'not-featured'}`}>{product.is_featured ? '⭐ Featured' : '-'}</span></div>
                </div>
                <div className="action-buttons"><button onClick={() => handleEdit(product)} className="btn btn-edit">✎ Edit</button><button onClick={() => handleDelete(product.id)} className="btn btn-delete">🗑 Delete</button></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default List;