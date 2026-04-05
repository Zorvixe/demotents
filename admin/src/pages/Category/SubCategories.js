import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './SubCategories.css';

const API_URL = "https://demotents-dhia.onrender.com" || "http://localhost:5004";

const SubCategories = () => {
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentSubCategory, setCurrentSubCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: ''
  });

  // Custom Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    confirmType: 'danger'
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    fetchCategories();
    fetchSubCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories`);
      const result = await response.json();
      
      if (result.success) {
        setCategories(result.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSubCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/sub-categories`);
      const result = await response.json();
      
      if (result.success) {
        setSubCategories(result.sub_categories);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error fetching sub-categories:', error);
      toast.error('Failed to fetch sub-categories');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSubCategory = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.category_id) {
      toast.error('Sub-category name and category are required');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/sub-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Sub-category created successfully');
        setShowAddModal(false);
        setFormData({ name: '', description: '', category_id: '' });
        fetchSubCategories();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error creating sub-category:', error);
      toast.error('Failed to create sub-category');
    }
  };

  const handleEditSubCategory = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.category_id) {
      toast.error('Sub-category name and category are required');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/sub-categories/${currentSubCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Sub-category updated successfully');
        setShowEditModal(false);
        setCurrentSubCategory(null);
        setFormData({ name: '', description: '', category_id: '' });
        fetchSubCategories();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error updating sub-category:', error);
      toast.error('Failed to update sub-category');
    }
  };

  // Custom confirmation before delete
  const confirmDeleteSubCategory = (subCategoryId, subCategoryName) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Sub-Category',
      message: `Are you sure you want to delete "${subCategoryName}"? This action cannot be undone.`,
      confirmText: 'Delete Sub-Category',
      confirmType: 'danger',
      onConfirm: () => executeDeleteSubCategory(subCategoryId)
    });
  };

  const executeDeleteSubCategory = async (subCategoryId) => {
    closeConfirmDialog();
    try {
      const response = await fetch(`${API_URL}/api/sub-categories/${subCategoryId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Sub-category deleted successfully');
        fetchSubCategories();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error deleting sub-category:', error);
      toast.error('Failed to delete sub-category');
    }
  };

  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const openEditModal = (subCategory) => {
    setCurrentSubCategory(subCategory);
    setFormData({
      name: subCategory.name,
      description: subCategory.description || '',
      category_id: subCategory.category_id
    });
    setShowEditModal(true);
  };

  // Pagination Logic
  const totalPages = Math.ceil(subCategories.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSubCategories = subCategories.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-subcat-container">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />
      
      {/* Custom Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="admin-modal-backdrop confirm-dialog-overlay" onClick={closeConfirmDialog}>
          <div className="confirm-modal-content" onClick={e => e.stopPropagation()}>
            <div className="confirm-modal-header">
              <div className="confirm-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <h3>{confirmDialog.title}</h3>
            </div>
            <div className="confirm-modal-body">
              <p>{confirmDialog.message}</p>
            </div>
            <div className="confirm-modal-footer">
              <button onClick={closeConfirmDialog} className="btn-modern btn-ghost">Cancel</button>
              <button onClick={confirmDialog.onConfirm} className={`btn-modern btn-${confirmDialog.confirmType}`}>
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="admin-subcat-header">
        <div className="header-titles">
          <h1>Sub-Categories</h1>
          <p>Organize products further by managing your sub-categories.</p>
        </div>
        <button 
          className="admin-btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Sub-Category
        </button>
      </div>

      {/* TABLE VIEW */}
      {paginatedSubCategories.length === 0 ? (
        <div className="admin-empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3>No sub-categories yet</h3>
          <p>Get started by creating your first sub-category.</p>
          <button className="admin-btn-outline" onClick={() => setShowAddModal(true)}>
            Create Sub-Category
          </button>
        </div>
      ) : (
        <>
          <div className="inventory-table-container">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th width="25%">Sub-Category</th>
                  <th width="20%">Parent Category</th>
                  <th width="30%">Description</th>
                  <th width="15%">Products</th>
                  <th width="10%">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSubCategories.map((subCat) => (
                  <tr key={subCat.id} className="inventory-row">
                    <td className="cell-subcategory">
                      <div className="category-title-cell">
                        <span className="category-title">{subCat.name}</span>
                      </div>
                    </td>
                    <td className="cell-parent">
                      <span className="parent-badge">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        {subCat.category_name}
                      </span>
                    </td>
                    <td className="cell-desc">
                      <span className={subCat.description ? "desc-text" : "text-muted italic"}>
                        {subCat.description || 'No description provided'}
                      </span>
                    </td>
                    <td className="cell-stock">
                      <span className="stock-badge">
                        {subCat.product_count || 0} products
                      </span>
                    </td>
                    <td className="cell-actions">
                      <button onClick={() => openEditModal(subCat)} className="action-btn edit-btn" title="Edit Sub-Category">
                        Edit
                      </button>
                      <button onClick={() => confirmDeleteSubCategory(subCat.id, subCat.name)} className="action-btn delete-btn" title="Delete Sub-Category">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <button 
                className="pagination-btn" 
                onClick={() => goToPage(currentPage - 1)} 
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <div className="pagination-pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button 
                className="pagination-btn" 
                onClick={() => goToPage(currentPage + 1)} 
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="modal-head">
              <h2>Add Sub-Category</h2>
              <button className="close-btn" onClick={() => { setShowAddModal(false); setFormData({ name: '', description: '', category_id: '' }); }}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddSubCategory} className="modal-form">
              <div className="input-group">
                <label>Parent Category <span className="required-star">*</span></label>
                <div className="select-wrapper">
                  <select name="category_id" value={formData.category_id} onChange={handleInputChange} required>
                    <option value="" disabled>Select a parent category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <svg className="select-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <div className="input-group">
                <label>Sub-Category Name <span className="required-star">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. 10x10 Tents" required />
              </div>
              <div className="input-group">
                <label>Description <span>(Optional)</span></label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief description of the sub-category..." rows="3" />
              </div>
              <div className="modal-foot">
                <button type="button" className="admin-btn-ghost" onClick={() => { setShowAddModal(false); setFormData({ name: '', description: '', category_id: '' }); }}>Cancel</button>
                <button type="submit" className="admin-btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="modal-head">
              <h2>Edit Sub-Category</h2>
              <button className="close-btn" onClick={() => { setShowEditModal(false); setCurrentSubCategory(null); setFormData({ name: '', description: '', category_id: '' }); }}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleEditSubCategory} className="modal-form">
              <div className="input-group">
                <label>Parent Category <span className="required-star">*</span></label>
                <div className="select-wrapper">
                  <select name="category_id" value={formData.category_id} onChange={handleInputChange} required>
                    <option value="" disabled>Select a parent category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <svg className="select-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <div className="input-group">
                <label>Sub-Category Name <span className="required-star">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. 10x10 Tents" required />
              </div>
              <div className="input-group">
                <label>Description <span>(Optional)</span></label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief description of the sub-category..." rows="3" />
              </div>
              <div className="modal-foot">
                <button type="button" className="admin-btn-ghost" onClick={() => { setShowEditModal(false); setCurrentSubCategory(null); setFormData({ name: '', description: '', category_id: '' }); }}>Cancel</button>
                <button type="submit" className="admin-btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubCategories;