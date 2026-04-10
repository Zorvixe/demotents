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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '', message: '', onConfirm: null, confirmText: 'Confirm', confirmType: 'danger'
  });

  const [editForm, setEditForm] = useState({
    name: '', description: '', price: '', category_id: '', sub_category_id: '',
    stock_quantity: '', is_featured: false, sku: '', size: '', product_type: '',
    without_print_price: '', core_price: '', elite_price: '', pro_price: '', cloth_colors: '',
  });
  const [mainImageFile, setMainImageFile] = useState(null);
  const [subImageFiles, setSubImageFiles] = useState([]);
  const [existingSubImages, setExistingSubImages] = useState([]);
  const [existingMainImage, setExistingMainImage] = useState(null);
  const [imageLoaded, setImageLoaded] = useState({});
  const [imageError, setImageError] = useState({});

  const BASE_URL = "https://api.demotents.com";
  const API_URL = `${BASE_URL}/api`;

  const getAuthToken = () => localStorage.getItem('adminToken');

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
  const closeConfirmDialog = () => setConfirmDialog({ ...confirmDialog, isOpen: false });

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

  const confirmDeleteProduct = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      confirmText: 'Delete Product',
      confirmType: 'danger',
      onConfirm: () => executeDeleteProduct(id)
    });
  };

  const executeDeleteProduct = async (id) => {
    closeConfirmDialog();
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
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

    if (product.category_id) await fetchSubCategories(product.category_id);
    const fullProduct = await fetchProductDetails(product.id);
    if (fullProduct && fullProduct.sub_images) setExistingSubImages(fullProduct.sub_images);
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
      setEditForm(prev => ({ ...prev, product_type: value, without_print_price: '', core_price: '', elite_price: '', pro_price: '' }));
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

  const confirmDeleteExistingSubImage = (imageId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Image',
      message: 'Are you sure you want to delete this image? It will be removed permanently.',
      confirmText: 'Remove Image',
      confirmType: 'danger',
      onConfirm: () => executeDeleteExistingSubImage(imageId)
    });
  };

  const executeDeleteExistingSubImage = async (imageId) => {
    closeConfirmDialog();
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/products/${editingId}/images/${imageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        showNotification('Image deleted successfully', 'success');
        setExistingSubImages(prev => prev.filter(img => img.id !== imageId));
        fetchProducts();
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

      const token = getAuthToken();
      const response = await fetch(`${API_URL}/products/${editingId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === '' || product.category_id === parseInt(filterCategory);
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'stock': return b.stock_quantity - a.stock_quantity;
      case 'featured': return b.is_featured - a.is_featured;
      default: return a.name.localeCompare(b.name);
    }
  });

  const totalFiltered = filteredProducts.length;
  const totalPages = Math.ceil(totalFiltered / ITEMS_PER_PAGE);
  useEffect(() => setCurrentPage(1), [searchTerm, filterCategory, sortBy]);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const goToPage = (page) => setCurrentPage(Math.min(Math.max(1, page), totalPages));

  if (loading) return <div className="loader-container"><div className="spinner"></div><p>Loading products...</p></div>;

  return (
    <div className="product-list-container">
      {notification.message && <div className={`notification notification-${notification.type}`}>{notification.message}</div>}
      {confirmDialog.isOpen && (
        <div className="modal-overlay confirm-dialog-overlay">
          <div className="confirm-modal-content">
            <div className="confirm-modal-header"><div className="confirm-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div><h3>{confirmDialog.title}</h3></div>
            <div className="confirm-modal-body"><p>{confirmDialog.message}</p></div>
            <div className="confirm-modal-footer"><button onClick={closeConfirmDialog} className="btn-modern btn-ghost">Cancel</button><button onClick={confirmDialog.onConfirm} className={`btn-modern btn-${confirmDialog.confirmType}`}>{confirmDialog.confirmText}</button></div>
          </div>
        </div>
      )}
      {editingId && (
        <div className="modal-overlay edit-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header"><div><h2>Edit Product</h2></div><button className="close-modal" onClick={handleCancelEdit}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>
            <div className="modal-body">
              <div className="modal-grid-2col">
                <div className="form-section">
                  <h4 className="section-title">Basic Details</h4>
                  <div className="form-group"><label>Product Name <span className="required">*</span></label><input type="text" name="name" value={editForm.name} onChange={handleFormChange} className="edit-input" placeholder="Enter product name" /></div>
                  <div className="form-group"><label>Description</label><textarea name="description" value={editForm.description} onChange={handleFormChange} className="edit-textarea" rows="4" placeholder="Enter product description..."></textarea></div>
                  <div className="grid-2-col-inner mt-4"><div className="form-group"><label>SKU</label><input type="text" name="sku" value={editForm.sku} onChange={handleFormChange} className="edit-input" placeholder="e.g. PROD-01" /></div><div className="form-group"><label>Stock Quantity <span className="required">*</span></label><input type="number" name="stock_quantity" value={editForm.stock_quantity} onChange={handleFormChange} className="edit-input" min="0" /></div></div>
                  <div className="grid-2-col-inner"><div className="form-group"><label>Category <span className="required">*</span></label><select name="category_id" value={editForm.category_id} onChange={handleFormChange} className="edit-input" required><option value="">Select Category</option>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></div><div className="form-group"><label>Sub-Category</label><select name="sub_category_id" value={editForm.sub_category_id} onChange={handleFormChange} className="edit-input" disabled={!editForm.category_id}><option value="">Select Sub-Category</option>{subCategories.map(subCat => <option key={subCat.id} value={subCat.id}>{subCat.name}</option>)}</select></div></div>
                  <div className="form-group"><label>Cloth Colors (comma separated)</label><input type="text" name="cloth_colors" value={editForm.cloth_colors} onChange={handleFormChange} placeholder="e.g. Red, Blue, Green" className="edit-input" /></div>
                </div>
                <div className="form-section">
                  <div className="section-header-flex"><h4 className="section-title">Pricing & Options</h4><div className="featured-toggle"><span className="toggle-label-text">Featured Product</span><div className="toggle-switch"><input type="checkbox" id="featured-edit" name="is_featured" checked={editForm.is_featured} onChange={handleFormChange} /><label htmlFor="featured-edit" className="toggle-label"></label></div></div></div>
                  <div className="grid-2-col-inner"><div className="form-group"><label>Base Price <span className="required">*</span></label><div className="input-with-prefix"><span className="prefix">$</span><input type="number" name="price" value={editForm.price} onChange={handleFormChange} className="edit-input pl-8" step="0.01" /></div></div>
                    {/* REPLACE the <select> block with this */}
                    <div className="form-group">
                      <label>Size <span className="required">*</span></label>
                      <input
                        type="text"
                        name="size"
                        value={editForm.size}
                        onChange={handleFormChange}
                        className="edit-input"
                        placeholder="Enter size (e.g. 10x10, 12x12, Custom)"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group"><label>Product Type <span className="required">*</span></label><select name="product_type" value={editForm.product_type} onChange={handleFormChange} className="edit-input" required><option value="">Select Type</option><option value="without_print">Without Print</option><option value="customization">With Customization</option></select></div>
                  {editForm.product_type === 'without_print' && <div className="form-group bg-light p-3 rounded mt-2"><label>Without Print Price</label><div className="input-with-prefix"><span className="prefix">$</span><input type="number" name="without_print_price" value={editForm.without_print_price} onChange={handleFormChange} className="edit-input pl-8" step="0.01" /></div></div>}
                  {editForm.product_type === 'customization' && <div className="grid-3-col bg-light p-3 rounded mt-2"><div className="form-group m-0"><label>Core Price</label><input type="number" name="core_price" value={editForm.core_price} onChange={handleFormChange} className="edit-input" step="0.01" /></div><div className="form-group m-0"><label>Elite Price</label><input type="number" name="elite_price" value={editForm.elite_price} onChange={handleFormChange} className="edit-input" step="0.01" /></div><div className="form-group m-0"><label>Pro Price</label><input type="number" name="pro_price" value={editForm.pro_price} onChange={handleFormChange} className="edit-input" step="0.01" /></div></div>}
                  <hr className="divider" />
                  <h4 className="section-title">Media</h4>
                  <div className="form-group"><label>Main Image</label><div className="image-edit-wrapper"><div className="current-image">{mainImageFile ? <img src={URL.createObjectURL(mainImageFile)} alt="Preview" /> : <img src={getImageUrl(existingMainImage)} alt="Current Main" />}</div><div className="upload-btn-wrapper"><label className="btn-modern btn-outline"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>Change Main Image<input type="file" onChange={handleMainImageChange} accept="image/*" className="hidden-input" /></label></div></div></div>
                  <div className="form-group mt-4"><div className="flex-between"><label>Sub Images</label><span className="text-xs text-muted">Max 10 total</span></div>
                    {existingSubImages.length === 0 && subImageFiles.length === 0 ? <div className="empty-images-box">No additional images added yet.</div> : <div className="sub-images-preview">
                      {existingSubImages.map((img) => (<div key={img.id} className="sub-image-item"><img src={getImageUrl(img.image_url)} alt="Sub" /><button type="button" onClick={() => confirmDeleteExistingSubImage(img.id)} className="remove-image-btn" title="Delete Image"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>))}
                      {subImageFiles.map((file, index) => (<div key={`new-${index}`} className="sub-image-item new-item"><img src={URL.createObjectURL(file)} alt={`Preview ${index + 1}`} /><div className="new-badge">NEW</div><button type="button" onClick={() => removeNewSubImage(index)} className="remove-image-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>))}
                    </div>}
                    <div className="upload-btn-wrapper mt-3"><label className="upload-dropzone"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg><span>Click to browse and add sub-images</span><input type="file" onChange={handleSubImagesChange} multiple accept="image/*" className="hidden-input" /></label></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer"><button onClick={handleCancelEdit} className="btn-modern btn-ghost">Cancel</button><button onClick={handleUpdate} className="btn-modern btn-primary"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>Save Changes</button></div>
          </div>
        </div>
      )}
      <div className="header-section"><div className="header-content"><div className="header-text"><h3 className="header-title">Product Inventory</h3><p className="header-subtitle">Manage and organize your products efficiently</p></div><div className="header-stats"><div className="stat-card"><span className="stat-number">{totalFiltered}</span><span className="stat-label">Products</span></div><div className="stat-card featured"><span className="stat-number">{products.filter(p => p.is_featured).length}</span><span className="stat-label">Featured</span></div></div></div></div>
      <div className="filters-section"><div className="filter-group"><input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="filter-input search-input" /></div><div className="filter-group"><select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="filter-input"><option value="">All Categories</option>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></div><div className="filter-group"><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-input"><option value="name">Sort by Name</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="stock">Stock Quantity</option><option value="featured">Featured First</option></select></div></div>
      {paginatedProducts.length === 0 ? <div className="empty-state"><div className="empty-icon">📦</div><h3>No Products Found</h3><p>Try adjusting your filters or add a new product</p></div> : <>
        <div className="inventory-table-container"><table className="inventory-table"><thead><tr><th width="5%"></th><th width="30%">Product</th><th width="15%">SKU</th><th width="15%">Category</th><th width="10%">Price</th><th width="12%">Inventory</th><th width="13%">Actions</th></tr></thead><tbody>
          {paginatedProducts.map((product) => {
            const imgUrl = getImageUrl(product.main_image_url);
            const isLoaded = imageLoaded[product.id];
            const hasError = imageError[product.id];
            return (<tr key={product.id} className="inventory-row"><td className="cell-image"><div className="table-thumbnail-wrapper">{!isLoaded && imgUrl && !hasError && <div className="img-placeholder" />}{imgUrl && !hasError ? <img src={imgUrl} alt={product.name} className="table-thumbnail" style={{ display: isLoaded ? 'block' : 'none' }} onLoad={() => handleImageLoad(product.id)} onError={() => handleImageError(product.id)} /> : <div className="table-thumbnail placeholder-empty"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>}</div></td><td className="cell-product"><div className="product-name-cell"><span className="product-title">{product.name}</span>{product.is_featured && <span className="badge-featured">Featured</span>}</div></td><td className="cell-sku">{product.sku ? <span className="sku-badge">{product.sku}</span> : <span className="text-muted">N/A</span>}</td><td className="cell-category"><div className="category-text">{getCategoryName(product)}</div>{getSubCategoryName(product) && <div className="sub-category-text">{getSubCategoryName(product)}</div>}</td><td className="cell-price">${parseFloat(product.price).toFixed(2)}</td><td className="cell-stock">{product.stock_quantity > 0 ? <span className="stock-in">{product.stock_quantity} in stock</span> : <span className="stock-out">Out of stock</span>}</td><td className="cell-actions"><button onClick={() => handleEdit(product)} className="action-btn edit-btn" title="Edit Product">Edit</button><button onClick={() => confirmDeleteProduct(product.id)} className="action-btn delete-btn" title="Delete Product">Delete</button></td></tr>);
          })}
        </tbody></table></div>
        {totalPages > 1 && (<div className="pagination-container"><button className="pagination-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>Previous</button><div className="pagination-pages">{Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (<button key={page} className={`pagination-page ${currentPage === page ? 'active' : ''}`} onClick={() => goToPage(page)}>{page}</button>))}</div><button className="pagination-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button></div>)}
      </>}
    </div>
  );
};

export default List;