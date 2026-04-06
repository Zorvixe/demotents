import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./Menu.css";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const API_URL = "https://demotents-dhia.onrender.com";

const Menu = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  // Confirm Dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    confirmType: 'danger'
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/categories`);
      const result = await response.json();

      if (result.success) {
        setCategories(result.categories || []);
      } else {
        toast.error(result.message || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  // Drag & Drop
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCategories(items);

    try {
      await fetch(`${API_URL}/api/categories/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: items.map((cat, index) => ({ id: cat.id, order: index })) }),
      });
      toast.success("Categories reordered successfully");
    } catch (err) {
      toast.error("Failed to reorder categories");
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
      toast.error('Failed to update category');
    }
  };

  const confirmDeleteCategory = (categoryId, categoryName) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Category',
      message: `Are you sure you want to delete "${categoryName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmType: 'danger',
      onConfirm: () => executeDeleteCategory(categoryId)
    });
  };

  const executeDeleteCategory = async (categoryId) => {
    closeConfirmDialog();
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
      toast.error('Failed to delete category');
    }
  };

  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const openEditModal = (category) => {
    setCurrentCategory(category);
    setFormData({ name: category.name, description: category.description || '' });
    setShowEditModal(true);
  };

  // Toggle Navbar
  const toggleNavbar = async (category) => {
    try {
      let res;
      if (category.is_visible) {
        res = await fetch(`${API_URL}/api/navbar-menu/${category.menu_id}`, { method: "DELETE" });
      } else {
        res = await fetch(`${API_URL}/api/navbar-menu`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category_id: category.id, display_order: 0 }),
        });
      }
      const result = await res.json();
      if (res.ok && result.success) {
        toast.success(category.is_visible ? "Removed from Navbar" : "Added to Navbar");
        fetchCategories();
      } else {
        toast.error(result.message || "Failed to update navbar");
      }
    } catch (error) {
      console.error("Toggle navbar error:", error);
      toast.error("Failed to update navbar");
    }
  };

  // Pagination
  const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCategories = categories.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const goToPage = (page) => setCurrentPage(Math.min(Math.max(1, page), totalPages));

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;

  return (
    <div className="admin-cat-container">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />

      {/* Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div className="admin-modal-backdrop confirm-dialog-overlay" onClick={closeConfirmDialog}>
          <div className="confirm-modal-content" onClick={e => e.stopPropagation()}>
            <div className="confirm-modal-header"><h3>{confirmDialog.title}</h3></div>
            <div className="confirm-modal-body"><p>{confirmDialog.message}</p></div>
            <div className="confirm-modal-footer">
              <button onClick={closeConfirmDialog} className="btn-modern btn-ghost">Cancel</button>
              <button onClick={confirmDialog.onConfirm} className={`btn-modern btn-${confirmDialog.confirmType}`}>{confirmDialog.confirmText}</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="admin-cat-header">
        <div className="header-titles">
          <h1>Navbar Management</h1>
          <p>Control which categories appear in the main navigation bar.</p>
        </div>
        <button className="admin-btn-primary" onClick={() => setShowAddModal(true)}>Add Category</button>
      </div>

      {paginatedCategories.length === 0 ? (
        <div className="admin-empty-state">
          <h3>No categories found</h3>
          <button className="admin-btn-outline" onClick={() => setShowAddModal(true)}>Create First Category</button>
        </div>
      ) : (
        <>
          <div className="inventory-table-container">
            <DragDropContext onDragEnd={handleDragEnd}>
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Products</th>
                    <th>Sub-categories</th>
                    <th>Navbar Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <Droppable droppableId="categories-droppable">
                  {(provided) => (
                    <tbody {...provided.droppableProps} ref={provided.innerRef}>
                      {paginatedCategories.map((category, index) => (
                        <Draggable key={category.id} draggableId={category.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <tr
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={snapshot.isDragging ? "dragging-row" : ""}
                            >
                              <td><strong>{category.name}</strong></td>
                              <td>{category.description || '—'}</td>
                              <td>{category.product_count || 0}</td>
                              <td>{category.sub_categories?.length > 0 ? category.sub_categories.length : 'None'}</td>
                              <td>
                                <span className={`status-badge ${category.is_visible ? 'active' : 'inactive'}`}>
                                  {category.is_visible ? '✓ In Navbar' : 'Not in Navbar'}
                                </span>
                              </td>
                              <td className="cell-actions">
                                <div className="action-buttons">
                                  <button onClick={() => toggleNavbar(category)} className={`action-btn ${category.is_visible ? "remove-btn" : "add-btn"}`}>
                                    {category.is_visible ? "Remove from Navbar" : "Add to Navbar"}
                                  </button>
                                  <button onClick={() => openEditModal(category)} className="action-btn edit-btn">Edit</button>
                                  <button onClick={() => confirmDeleteCategory(category.id, category.name)} className="action-btn delete-btn">Delete</button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </tbody>
                  )}
                </Droppable>
              </table>
            </DragDropContext>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} className={currentPage === page ? 'active' : ''} onClick={() => goToPage(page)}>{page}</button>
              ))}
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
            </div>
          )}
        </>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="admin-modal-backdrop" onClick={() => { setShowAddModal(false); setFormData({ name: '', description: '' }); }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Add Category</h2>
              <button className="close-btn" onClick={() => { setShowAddModal(false); setFormData({ name: '', description: '' }); }}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="modal-form">
              <div className="input-group">
                <label>Name <span className="required-star">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Luxury Tents" required autoFocus />
              </div>
              <div className="input-group">
                <label>Description <span>(Optional)</span></label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief description..." rows="3" />
              </div>
              <div className="modal-foot">
                <button type="button" className="admin-btn-ghost" onClick={() => { setShowAddModal(false); setFormData({ name: '', description: '' }); }}>Cancel</button>
                <button type="submit" className="admin-btn-primary">Save</button>
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
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleEditCategory} className="modal-form">
              <div className="input-group">
                <label>Name <span className="required-star">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Luxury Tents" required autoFocus />
              </div>
              <div className="input-group">
                <label>Description <span>(Optional)</span></label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief description..." rows="3" />
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

export default Menu;