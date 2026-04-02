import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Categories.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('https://demotents-dhia.onrender.com/api/categories?includeSubCategories=true');
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const response = await fetch('https://demotents-dhia.onrender.com/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`https://demotents-dhia.onrender.com/api/categories/${currentCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
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
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      const response = await fetch(`https://demotents-dhia.onrender.com/api/categories/${categoryId}`, {
        method: 'DELETE',
      });

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
    setFormData({
      name: category.name,
      description: category.description || ''
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
    <div className="categories-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="categories-header">
        <h1>Categories Management</h1>
        <button 
          className="add-category-btn"
          onClick={() => setShowAddModal(true)}
        >
          + Add New Category
        </button>
      </div>

      <div className="categories-list">
        {categories.length === 0 ? (
          <div className="empty-state">
            <p>No categories found. Create your first category!</p>
          </div>
        ) : (
          categories.map(category => (
            <div key={category.id} className="category-card">
              <div className="category-header">
                <h3>{category.name}</h3>
                <div className="category-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => openEditModal(category)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {category.description && (
                <p className="category-description">{category.description}</p>
              )}
              
              <div className="category-stats">
                <span>{category.product_count || 0} Products</span>
                <span>{category.sub_categories?.length || 0} Sub-categories</span>
              </div>

              {/* Sub-categories list */}
              {category.sub_categories && category.sub_categories.length > 0 && (
                <div className="sub-categories-section">
                  <h4>Sub-categories:</h4>
                  <div className="sub-categories-list">
                    {category.sub_categories.map(subCat => (
                      <div key={subCat.id} className="sub-category-item">
                        <span>{subCat.name}</span>
                        <span className="product-count">
                          {subCat.product_count || 0} products
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Category</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ name: '', description: '' });
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddCategory}>
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter category description"
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: '', description: '' });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Category</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowEditModal(false);
                  setCurrentCategory(null);
                  setFormData({ name: '', description: '' });
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditCategory}>
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter category description"
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowEditModal(false);
                    setCurrentCategory(null);
                    setFormData({ name: '', description: '' });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Update Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;