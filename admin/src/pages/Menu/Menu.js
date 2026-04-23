// src/pages/Menu/Menu.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import "./Menu.css";

const Menu = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', confirmType: 'danger' });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/categories');
      const result = response.data;
      if (result.success) setCategories(result.categories || []);
      else toast.error(result.message || 'Failed to fetch categories');
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
      const response = await axios.post('/api/categories', formData);
      const result = response.data;
      if (result.success) {
        toast.success('Category created successfully');
        setShowAddModal(false);
        setFormData({ name: '', description: '' });
        fetchCategories();
      } else toast.error(result.message);
    } catch (error) { toast.error('Failed to create category'); }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Category name is required'); return; }
    try {
      const response = await axios.put(`/api/categories/${currentCategory.id}`, formData);
      const result = response.data;
      if (result.success) {
        toast.success('Category updated successfully');
        setShowEditModal(false);
        setCurrentCategory(null);
        setFormData({ name: '', description: '' });
        fetchCategories();
      } else toast.error(result.message);
    } catch (error) { toast.error('Failed to update category'); }
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
      const response = await axios.delete(`/api/categories/${categoryId}`);
      const result = response.data;
      if (result.success) {
        toast.success('Category deleted successfully');
        fetchCategories();
      } else toast.error(result.message);
    } catch (error) { toast.error('Failed to delete category'); }
  };

  const closeConfirmDialog = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const visibleCategories = categories.filter(cat => cat.is_visible);
    if (visibleCategories.length === 0) { toast.info("No items in navbar to reorder"); return; }
    const items = Array.from(categories);
    const [movedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, movedItem);
    setCategories(items);
    const navbarItems = items.filter(item => item.is_visible).map((item, index) => ({ id: item.menu_id, display_order: index }));
    if (navbarItems.length === 0) return;
    try {
      const response = await axios.put('/api/navbar-menu/reorder', { items: navbarItems });
      const result = response.data;
      if (result.success) toast.success("Navbar order saved successfully!");
      else toast.error(result.message || "Failed to save order");
    } catch (error) { console.error(error); toast.error("Failed to save navbar order"); }
  };

  const openEditModal = (category) => {
    setCurrentCategory(category);
    setFormData({ name: category.name, description: category.description || '' });
    setShowEditModal(true);
  };

  const toggleNavbar = async (category) => {
    try {
      let response;
      if (category.is_visible) {
        response = await axios.delete(`/api/navbar-menu/${category.menu_id}`);
      } else {
        response = await axios.post('/api/navbar-menu', { category_id: category.id, display_order: 999 });
      }
      const result = response.data;
      if (response.status === 200 || response.status === 201) {
        toast.success(category.is_visible ? "Removed from Navbar" : "Added to Navbar");
        fetchCategories();
      } else toast.error(result.message || "Failed to update navbar");
    } catch (error) { console.error(error); toast.error("Failed to update navbar"); }
  };

  const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCategories = categories.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const goToPage = (page) => setCurrentPage(Math.min(Math.max(1, page), totalPages));

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;

  return (
    <div className="menu-container">
      <ToastContainer />
      {confirmDialog.isOpen && (
        <div className="menu-modal-backdrop" onClick={closeConfirmDialog}>
          <div className="menu-confirm-box" onClick={e => e.stopPropagation()}>
            <div className="menu-confirm-header"><h3>{confirmDialog.title}</h3></div>
            <div className="menu-confirm-body"><p>{confirmDialog.message}</p></div>
            <div className="menu-confirm-footer"><button onClick={closeConfirmDialog} className="menu-btn menu-btn-light">Cancel</button><button onClick={confirmDialog.onConfirm} className="menu-btn menu-btn-danger">{confirmDialog.confirmText}</button></div>
          </div>
        </div>
      )}
      <div className="menu-header"><div><h1>Navbar</h1><p>Control which categories appear in the main navigation bar.</p></div></div>
      {paginatedCategories.length === 0 ? (
        <div className="menu-empty"><h3>No categories found</h3><button className="menu-btn menu-btn-outline" onClick={() => setShowAddModal(true)}>Create First Category</button></div>
      ) : (
        <>
          <div className="menu-table-wrapper">
            <table className="menu-table"><thead><tr><th>Category Name</th><th>Description</th><th>Products</th><th>Sub-categories</th><th>Status</th><th>Actions</th></tr></thead>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="categories">
                  {(provided) => (
                    <tbody ref={provided.innerRef} {...provided.droppableProps}>
                      {paginatedCategories.map((category, index) => (
                        <Draggable key={category.id} draggableId={category.id.toString()} index={index}>
                          {(provided) => (
                            <tr ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                              <td><strong>{category.name}</strong></td>
                              <td>{category.description || '—'}</td>
                              <td>{category.product_count || 0}</td>
                              <td>{category.sub_categories?.length || 'None'}</td>
                              <td><span className={`menu-status ${category.is_visible ? 'menu-active' : 'menu-inactive'}`}>{category.is_visible ? '✓ In Navbar' : 'Not in Navbar'}</span></td>
                              <td className="menu-actions"><button onClick={() => toggleNavbar(category)} className={`menu-action-btn ${category.is_visible ? "menu-remove-btn" : "menu-add-btn"}`}>{category.is_visible ? "Remove" : "Add to Navbar"}</button></td>
                            </tr>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </tbody>
                  )}
                </Droppable>
              </DragDropContext>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="menu-pagination">
              <button onClick={() => goToPage(currentPage - 1)}>Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (<button key={page} className={currentPage === page ? 'active' : ''} onClick={() => goToPage(page)}>{page}</button>))}
              <button onClick={() => goToPage(currentPage + 1)}>Next</button>
            </div>
          )}
        </>
      )}
      {showAddModal && (<div className="menu-modal-backdrop" onClick={() => setShowAddModal(false)}><div className="menu-modal" onClick={e => e.stopPropagation()}><h3>Add Category</h3><form onSubmit={handleAddCategory}><input type="text" name="name" placeholder="Category Name" value={formData.name} onChange={handleInputChange} required /><textarea name="description" placeholder="Description" value={formData.description} onChange={handleInputChange}></textarea><div className="menu-modal-actions"><button type="button" onClick={() => setShowAddModal(false)}>Cancel</button><button type="submit">Save</button></div></form></div></div>)}
      {showEditModal && (<div className="menu-modal-backdrop" onClick={() => setShowEditModal(false)}><div className="menu-modal" onClick={e => e.stopPropagation()}><h3>Edit Category</h3><form onSubmit={handleEditCategory}><input type="text" name="name" placeholder="Category Name" value={formData.name} onChange={handleInputChange} required /><textarea name="description" placeholder="Description" value={formData.description} onChange={handleInputChange}></textarea><div className="menu-modal-actions"><button type="button" onClick={() => setShowEditModal(false)}>Cancel</button><button type="submit">Update</button></div></form></div></div>)}
    </div>
  );
};

export default Menu;