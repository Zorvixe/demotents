import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import "./Menu.css";

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
 const handleDragEnd = async (result) => {
  if (!result.destination) return;

  // Only reorder categories that are visible in navbar
  const visibleCategories = categories.filter(cat => cat.is_visible);

  if (visibleCategories.length === 0) {
    toast.info("No items in navbar to reorder");
    return;
  }

  const items = Array.from(categories);

  const [movedItem] = items.splice(result.source.index, 1);
  items.splice(result.destination.index, 0, movedItem);

  setCategories(items);

  // Prepare only visible items for navbar reorder
  const navbarItems = items
    .filter(item => item.is_visible)
    .map((item, index) => ({
      id: item.menu_id,           // ← Important: use menu_id, not category id
      display_order: index,
    }));

  if (navbarItems.length === 0) return;

  try {
    const response = await fetch(`${API_URL}/api/navbar-menu/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: navbarItems }),
    });

    const result = await response.json();

    if (result.success) {
      toast.success("Navbar order saved successfully!");
    } else {
      toast.error(result.message || "Failed to save order");
    }
  } catch (error) {
    console.error(error);
    toast.error("Failed to save navbar order");
  }
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
      res = await fetch(`${API_URL}/api/navbar-menu/${category.menu_id}`, {
        method: "DELETE",
      });
    } else {
      res = await fetch(`${API_URL}/api/navbar-menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: category.id,
          display_order: 999, // high number so it goes to bottom
        }),
      });
    }

    const result = await res.json();

    if (res.ok && result.success) {
      toast.success(category.is_visible ? "Removed from Navbar" : "Added to Navbar");
      fetchCategories();        // ← Refetch instead of manual state update
    } else {
      toast.error(result.message || "Failed to update navbar");
    }
  } catch (error) {
    console.error(error);
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
    <div className="menu-container">
  <ToastContainer />

  {/* Confirm Dialog */}
  {confirmDialog.isOpen && (
    <div className="menu-modal-backdrop" onClick={closeConfirmDialog}>
      <div className="menu-confirm-box" onClick={e => e.stopPropagation()}>
        <div className="menu-confirm-header">
          <h3>{confirmDialog.title}</h3>
        </div>

        <div className="menu-confirm-body">
          <p>{confirmDialog.message}</p>
        </div>

        <div className="menu-confirm-footer">
          <button onClick={closeConfirmDialog} className="menu-btn menu-btn-light">
            Cancel
          </button>
          <button onClick={confirmDialog.onConfirm} className="menu-btn menu-btn-danger">
            {confirmDialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Header */}
  <div className="menu-header">
    <div>
      <h1>Navbar Management</h1>
      <p>Control which categories appear in the main navigation bar.</p>
    </div>

    <button className="menu-btn menu-btn-primary" onClick={() => setShowAddModal(true)}>
      Add Category
    </button>
  </div>

  {paginatedCategories.length === 0 ? (
    <div className="menu-empty">
      <h3>No categories found</h3>
      <button className="menu-btn menu-btn-outline" onClick={() => setShowAddModal(true)}>
        Create First Category
      </button>
    </div>
  ) : (
    <>
      {/* TABLE */}
      <div className="menu-table-wrapper">
        <table className="menu-table">
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Description</th>
              <th>Products</th>
              <th>Sub-categories</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <DragDropContext onDragEnd={handleDragEnd}>
  <Droppable droppableId="categories">
    {(provided) => (
      <tbody ref={provided.innerRef} {...provided.droppableProps}>
        {paginatedCategories.map((category, index) => (
          <Draggable
            key={category.id}
            draggableId={category.id.toString()}
            index={index}
          >
            {(provided) => (
              <tr
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
              >
                <td><strong>{category.name}</strong></td>
                <td>{category.description || '—'}</td>
                <td>{category.product_count || 0}</td>
                <td>{category.sub_categories?.length || 'None'}</td>

                <td>
                  <span className={`menu-status ${category.is_visible ? 'menu-active' : 'menu-inactive'}`}>
                    {category.is_visible ? '✓ In Navbar' : 'Not in Navbar'}
                  </span>
                </td>

                <td className="menu-actions">
                  <button
                    onClick={() => toggleNavbar(category)}
                    className={`menu-action-btn ${category.is_visible ? "menu-remove-btn" : "menu-add-btn"}`}
                  >
                    {category.is_visible ? "Remove from Navbar" : "Add to Navbar"}
                  </button>
                </td>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="menu-pagination">
          <button onClick={() => goToPage(currentPage - 1)}>Prev</button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={currentPage === page ? 'active' : ''}
              onClick={() => goToPage(page)}
            >
              {page}
            </button>
          ))}

          <button onClick={() => goToPage(currentPage + 1)}>Next</button>
        </div>
      )}
    </>
  )}
</div>
  );
};

export default Menu;