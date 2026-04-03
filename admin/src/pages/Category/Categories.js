import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Categories.css';

const API_URL = "https://demotents-dhia.onrender.com";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/categories?includeSubCategories=true`);
      const result = await response.json();
      if (result.success) {
        setCategories(result.categories);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Category created successfully');
        setShowAddModal(false);
        setFormData({ name: '', description: '' });
        fetchCategories();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/categories/${currentCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Category updated successfully');
        setShowEditModal(false);
        setCurrentCategory(null);
        setFormData({ name: '', description: '' });
        fetchCategories();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      const response = await fetch(`${API_URL}/api/categories/${categoryId}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        toast.success('Category deleted successfully');
        fetchCategories();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const openEditModal = (category) => {
    setCurrentCategory(category);
    setFormData({ name: category.name, description: category.description || '' });
    setShowEditModal(true);
  };

  // ========== LOADER ==========
  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-cat-container">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />
      
      {/* HEADER */}
      <div className="admin-cat-header">
        <div className="header-titles">
          <h1>Categories</h1>
          <p>Manage your product categories and sub-categories.</p>
        </div>
        <button className="admin-btn-primary" onClick={() => setShowAddModal(true)}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Category
        </button>
      </div>

      {/* GRID */}
      <div className="admin-cat-grid">
        {categories.length === 0 ? (
          <div className="admin-empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3>No categories yet</h3>
            <p>Get started by creating your first category.</p>
            <button className="admin-btn-outline" onClick={() => setShowAddModal(true)}>
              Create Category
            </button>
          </div>
        ) : (
          categories.map(category => (
            <div key={category.id} className="admin-cat-card">
              <div className="card-top">
                <div className="card-title-group">
                  <h3>{category.name}</h3>
                  <div className="card-actions">
                    <button className="action-btn edit" onClick={() => openEditModal(category)} title="Edit">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button className="action-btn delete" onClick={() => handleDeleteCategory(category.id)} title="Delete">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                {category.description ? (
                  <p className="card-desc">{category.description}</p>
                ) : (
                  <p className="card-desc empty-desc">No description provided.</p>
                )}
                <div className="card-metrics">
                  <span className="metric-badge">
                    <strong>{category.product_count || 0}</strong> Products
                  </span>
                  <span className="metric-badge">
                    <strong>{category.sub_categories?.length || 0}</strong> Sub-cats
                  </span>
                </div>
              </div>

              {/* Sub-categories List */}
              <div className="card-bottom">
                <h4 className="sub-title">Sub-categories</h4>
                {category.sub_categories && category.sub_categories.length > 0 ? (
                  <div className="sub-pill-container">
                    {category.sub_categories.map(subCat => (
                      <div key={subCat.id} className="sub-pill">
                        <span className="sub-name">{subCat.name}</span>
                        <span className="sub-count">{subCat.product_count || 0}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-subs">None added yet</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="admin-modal-backdrop" onClick={() => { setShowAddModal(false); setFormData({ name: '', description: '' }); }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Add Category</h2>
              <button className="close-btn" onClick={() => { setShowAddModal(false); setFormData({ name: '', description: '' }); }}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="modal-form">
              <div className="input-group">
                <label>Name <span>*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Luxury Tents" required autoFocus />
              </div>
              <div className="input-group">
                <label>Description <span>(Optional)</span></label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief description of the category..." rows="3" />
              </div>
              <div className="modal-foot">
                <button type="button" className="admin-btn-ghost" onClick={() => { setShowAddModal(false); setFormData({ name: '', description: '' }); }}>Cancel</button>
                <button type="submit" className="admin-btn-primary">Create Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="admin-modal-backdrop" onClick={() => { setShowEditModal(false); setCurrentCategory(null); setFormData({ name: '', description: '' }); }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Edit Category</h2>
              <button className="close-btn" onClick={() => { setShowEditModal(false); setCurrentCategory(null); setFormData({ name: '', description: '' }); }}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleEditCategory} className="modal-form">
              <div className="input-group">
                <label>Name <span>*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Luxury Tents" required autoFocus />
              </div>
              <div className="input-group">
                <label>Description <span>(Optional)</span></label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief description of the category..." rows="3" />
              </div>
              <div className="modal-foot">
                <button type="button" className="admin-btn-ghost" onClick={() => { setShowEditModal(false); setCurrentCategory(null); setFormData({ name: '', description: '' }); }}>Cancel</button>
                <button type="submit" className="admin-btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;