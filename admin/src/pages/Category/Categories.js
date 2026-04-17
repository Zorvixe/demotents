import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Categories.css';

const API_URL = "https://api.demotents.com";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', confirmType: 'danger' });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const getAuthToken = () => localStorage.getItem('adminToken');

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/categories?includeSubCategories=true`);
      const result = await response.json();
      if (result.success) setCategories(result.categories);
      else toast.error(result.message);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    } finally { setLoading(false); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Category name is required'); return; }
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Category created successfully');
        setShowAddModal(false);
        setFormData({ name: '', description: '' });
        fetchCategories();
      } else toast.error(result.message);
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Category name is required'); return; }
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/categories/${currentCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Category updated successfully');
        setShowEditModal(false);
        setCurrentCategory(null);
        setFormData({ name: '', description: '' });
        fetchCategories();
      } else toast.error(result.message);
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const confirmDeleteCategory = (categoryId, categoryName) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Category',
      message: `Are you sure you want to delete "${categoryName}"? This action cannot be undone.`,
      confirmText: 'Delete Category',
      confirmType: 'danger',
      onConfirm: () => executeDeleteCategory(categoryId)
    });
  };

  const executeDeleteCategory = async (categoryId) => {
    closeConfirmDialog();
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Category deleted successfully');
        fetchCategories();
      } else toast.error(result.message);
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const closeConfirmDialog = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));

  const openEditModal = (category) => {
    setCurrentCategory(category);
    setFormData({ name: category.name, description: category.description || '' });
    setShowEditModal(true);
  };

  const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCategories = categories.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const goToPage = (page) => setCurrentPage(Math.min(Math.max(1, page), totalPages));

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;

  return (
    <div className="admin-cat-container">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />
      {confirmDialog.isOpen && (
        <div className="admin-modal-backdrop confirm-dialog-overlay" onClick={closeConfirmDialog}>
          <div className="confirm-modal-content" onClick={e => e.stopPropagation()}>
            <div className="confirm-modal-header"><div className="confirm-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div><h3>{confirmDialog.title}</h3></div>
            <div className="confirm-modal-body"><p>{confirmDialog.message}</p></div>
            <div className="confirm-modal-footer"><button onClick={closeConfirmDialog} className="btn-modern btn-ghost">Cancel</button><button onClick={confirmDialog.onConfirm} className={`btn-modern btn-${confirmDialog.confirmType}`}>{confirmDialog.confirmText}</button></div>
          </div>
        </div>
      )}
      <div className="admin-cat-header"><div className="header-titles"><h1>Categories</h1><p>Manage your product categories and sub-categories.</p></div><button className="admin-btn-primary" onClick={() => setShowAddModal(true)}><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Add Category</button></div>
      {paginatedCategories.length === 0 ? (
        <div className="admin-empty-state"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg><h3>No categories yet</h3><p>Get started by creating your first category.</p><button className="admin-btn-outline" onClick={() => setShowAddModal(true)}>Create Category</button></div>
      ) : (
        <>
          <div className="inventory-table-container"><table className="inventory-table"><thead><tr><th width="25%">Category Name</th><th width="30%">Description</th><th width="15%">Products</th><th width="20%">Sub-categories</th><th width="10%">Actions</th></tr></thead><tbody>
            {paginatedCategories.map((category) => (
              <tr key={category.id} className="inventory-row">
                <td className="cell-category"><div className="category-title-cell"><span className="category-title">{category.name}</span></div></td>
                <td className="cell-desc"><span className={category.description ? "desc-text" : "text-muted italic"}>{category.description || 'No description provided'}</span></td>
                <td className="cell-stock"><span className="stock-badge">{category.product_count || 0} products</span></td>
                <td className="cell-subcats">{category.sub_categories && category.sub_categories.length > 0 ? (<div className="subcat-pill-container">{category.sub_categories.map((subCat) => (<span key={subCat.id} className="subcat-pill" title={`${subCat.product_count || 0} products`}>{subCat.name}</span>))}</div>) : (<span className="text-muted">None</span>)}</td>
                <td className="cell-actions"><button onClick={() => openEditModal(category)} className="action-btn edit-btn" title="Edit Category"><FaEdit /></button><button onClick={() => confirmDeleteCategory(category.id, category.name)} className="action-btn delete-btn" title="Delete Category"><FaTrash /></button></td>
              </tr>
            ))}
          </tbody></table></div>
          {totalPages > 1 && (<div className="pagination-container"><button className="pagination-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>Previous</button><div className="pagination-pages">{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (<button key={page} className={`pagination-page ${currentPage === page ? 'active' : ''}`} onClick={() => goToPage(page)}>{page}</button>))}</div><button className="pagination-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button></div>)}
        </>
      )}
      {showAddModal && (<div className="admin-modal-backdrop" onClick={() => { setShowAddModal(false); setFormData({ name: '', description: '' }); }}><div className="admin-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><h2>Add Category</h2><button className="close-btn" onClick={() => { setShowAddModal(false); setFormData({ name: '', description: '' }); }}><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div><form onSubmit={handleAddCategory} className="modal-form"><div className="input-group"><label>Name <span className="required-star">*</span></label><input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Luxury Tents" required autoFocus /></div><div className="input-group"><label>Description <span>(Optional)</span></label><textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief description of the category..." rows="3" /></div><div className="modal-foot"><button type="button" className="admin-btn-ghost" onClick={() => { setShowAddModal(false); setFormData({ name: '', description: '' }); }}>Cancel</button><button type="submit" className="admin-btn-primary">Save</button></div></form></div></div>)}
      {showEditModal && (<div className="admin-modal-backdrop" onClick={() => { setShowEditModal(false); setCurrentCategory(null); setFormData({ name: '', description: '' }); }}><div className="admin-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><h2>Edit Category</h2><button className="close-btn" onClick={() => { setShowEditModal(false); setCurrentCategory(null); setFormData({ name: '', description: '' }); }}><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div><form onSubmit={handleEditCategory} className="modal-form"><div className="input-group"><label>Name <span className="required-star">*</span></label><input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Luxury Tents" required autoFocus /></div><div className="input-group"><label>Description <span>(Optional)</span></label><textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief description of the category..." rows="3" /></div><div className="modal-foot"><button type="button" className="admin-btn-ghost" onClick={() => { setShowEditModal(false); setCurrentCategory(null); setFormData({ name: '', description: '' }); }}>Cancel</button><button type="submit" className="admin-btn-primary">Save Changes</button></div></form></div></div>)}
    </div>
  );
};

export default Categories;