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

  const handleDeleteSubCategory = async (subCategoryId) => {
    if (!window.confirm('Are you sure you want to delete this sub-category?')) {
      return;
    }

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

  const openEditModal = (subCategory) => {
    setCurrentSubCategory(subCategory);
    setFormData({
      name: subCategory.name,
      description: subCategory.description || '',
      category_id: subCategory.category_id
    });
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
    <div className="admin-subcat-container">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />
      
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

      {/* GRID */}
      <div className="admin-subcat-grid">
        {subCategories.length === 0 ? (
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
          subCategories.map(subCat => (
            <div key={subCat.id} className="admin-subcat-card">
              <div className="card-top">
                <div className="card-title-group">
                  <div className="title-wrapper">
                    <h3>{subCat.name}</h3>
                    <span className="parent-badge">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      {subCat.category_name}
                    </span>
                  </div>
                  <div className="card-actions">
                    <button className="action-btn edit" onClick={() => openEditModal(subCat)} title="Edit">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button className="action-btn delete" onClick={() => handleDeleteSubCategory(subCat.id)} title="Delete">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                {subCat.description ? (
                  <p className="card-desc">{subCat.description}</p>
                ) : (
                  <p className="card-desc empty-desc">No description provided.</p>
                )}
                <div className="card-metrics">
                  <span className="metric-badge">
                    <strong>{subCat.product_count || 0}</strong> Products Attached
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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
                <label>Parent Category <span>*</span></label>
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
                <label>Sub-Category Name <span>*</span></label>
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
                <label>Parent Category <span>*</span></label>
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
                <label>Sub-Category Name <span>*</span></label>
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