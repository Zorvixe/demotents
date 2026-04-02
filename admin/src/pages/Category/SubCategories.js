import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './SubCategories.css';


  const API_URL = process.env.REACT_APP_BACKEND_BASE_URL || "http://localhost:5004";


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

 if (loading) {
  return (
    <div className="loader-container">
      <div className="spinner"></div>
    </div>
  );
}

  return (
    <div className="sub-categories-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="sub-categories-header">
        <h1>Sub-Categories Management</h1>
        <button 
          className="add-sub-category-btn"
          onClick={() => setShowAddModal(true)}
        >
          + Add New Sub-Category
        </button>
      </div>

      <div className="sub-categories-list">
        {subCategories.length === 0 ? (
          <div className="empty-state">
            <p>No sub-categories found. Create your first sub-category!</p>
          </div>
        ) : (
          subCategories.map(subCat => (
            <div key={subCat.id} className="sub-category-card">
              <div className="sub-category-header">
                <div>
                  <h3>{subCat.name}</h3>
                  <p className="category-name">
                    Category: {subCat.category_name}
                  </p>
                </div>
                <div className="sub-category-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => openEditModal(subCat)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteSubCategory(subCat.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {subCat.description && (
                <p className="sub-category-description">{subCat.description}</p>
              )}
              
              <div className="sub-category-stats">
                <span>{subCat.product_count || 0} Products</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Sub-Category Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Sub-Category</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ name: '', description: '', category_id: '' });
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddSubCategory}>
              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Sub-Category Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter sub-category name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter sub-category description"
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: '', description: '', category_id: '' });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Sub-Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Sub-Category Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Sub-Category</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowEditModal(false);
                  setCurrentSubCategory(null);
                  setFormData({ name: '', description: '', category_id: '' });
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditSubCategory}>
              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Sub-Category Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter sub-category name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter sub-category description"
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowEditModal(false);
                    setCurrentSubCategory(null);
                    setFormData({ name: '', description: '', category_id: '' });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Update Sub-Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubCategories;