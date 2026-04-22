import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Menu.css';

const API_URL = 'https://api.demotents.com';

const DragHandleIcon = () => (
  <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
  </svg>
);

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'custom_link',
    target_id: '',
    link_url: '',
    parent_id: '',
  });
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', parent_id: '' });

  const getAuthToken = () => localStorage.getItem('adminToken');

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_URL}/api/menu/flat`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const data = await res.json();
      if (data.success) setMenuItems(data.items);
    } catch (err) { toast.error('Failed to load menu'); }
  };

  const fetchCategoriesTree = async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories`);
      const data = await res.json();
      if (data.success) setCategoriesTree(data.categories);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    Promise.all([fetchMenu(), fetchCategoriesTree()]).finally(() => setLoading(false));
  }, []);

  const buildTree = (items, parentId = null) => {
    return items
      .filter(item => (item.parent_id === null && parentId === null) || item.parent_id === parentId)
      .sort((a, b) => a.display_order - b.display_order)
      .map(item => ({ ...item, children: buildTree(items, item.id) }));
  };
  const tree = buildTree(menuItems);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceId = parseInt(source.droppableId);
    const destId = parseInt(destination.droppableId);
    const sourceIndex = source.index;
    const destIndex = destination.index;

    if (sourceId === destId && sourceIndex === destIndex) return;

    // Clone current items
    const newItems = [...menuItems];
    const draggedItem = newItems.find((i) => i.id === parseInt(draggableId));
    if (!draggedItem) return;

    // Remove from old parent list
    const oldParentItems = newItems.filter((i) => i.parent_id === sourceId || (sourceId === -1 && i.parent_id === null));
    const movedItem = oldParentItems.splice(sourceIndex, 1)[0];
    movedItem.parent_id = destId === -1 ? null : destId;

    // Insert into new parent list
    let newParentItems = newItems.filter((i) => i.parent_id === destId || (destId === -1 && i.parent_id === null));
    newParentItems.splice(destIndex, 0, movedItem);

    const updateOrders = (parentId, itemList) => {
      itemList.forEach((item, idx) => {
        const existing = newItems.find((i) => i.id === item.id);
        if (existing) {
          existing.display_order = idx;
          existing.parent_id = parentId === -1 ? null : parentId;
        }
      });
    };
    updateOrders(sourceId, oldParentItems);
    updateOrders(destId, newParentItems);

    setMenuItems([...newItems]);

    const allItems = newItems.map((item) => ({
      id: item.id,
      display_order: item.display_order,
      parent_id: item.parent_id,
    }));

    try {
      const res = await fetch(`${API_URL}/api/menu/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ items: allItems }),
      });
      const data = await res.json();
      if (data.success) toast.success('Menu order saved');
      else toast.error('Reorder failed');
    } catch (err) {
      toast.error('Network error');
    }
  };

  const openModal = (item = null) => {
    setEditingItem(item);
    setFormData(item ? {
      title: item.title,
      type: item.type,
      target_id: item.target_id || '',
      link_url: item.link_url || '',
      parent_id: item.parent_id || '',
    } : { title: '', type: 'custom_link', target_id: '', link_url: '', parent_id: '' });
    setShowCreateCategory(false);
    setShowModal(true);
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name required');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({
          name: newCategory.name,
          description: newCategory.description,
          parent_id: newCategory.parent_id || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Category created');
        await fetchCategoriesTree();
        setFormData(prev => ({ ...prev, type: 'category', target_id: data.category.id }));
        setShowCreateCategory(false);
        setNewCategory({ name: '', description: '', parent_id: '' });
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to create category');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let payload = {
      title: formData.title,
      type: formData.type,
      target_id: formData.target_id ? parseInt(formData.target_id) : null,
      link_url: formData.link_url,
      parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
      display_order: 0,
    };
    try {
      const url = editingItem ? `${API_URL}/api/menu/${editingItem.id}` : `${API_URL}/api/menu`;
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingItem ? 'Updated' : 'Added');
        setShowModal(false);
        fetchMenu();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this item and all its children?')) return;
    try {
      const res = await fetch(`${API_URL}/api/menu/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        toast.success('Deleted');
        fetchMenu();
      } else {
        toast.error('Delete failed');
      }
    } catch (err) { toast.error('Delete failed'); }
  };

  const renderCategoryOptions = (categories, level = 0) => {
    let options = [];
    for (let cat of categories) {
      options.push(
        <option key={cat.id} value={cat.id}>
          {'—'.repeat(level)} {cat.name}
        </option>
      );
      if (cat.children) options.push(...renderCategoryOptions(cat.children, level + 1));
    }
    return options;
  };

  const renderTree = (items, level = 0) => {
    return items.map((item, index) => (
      <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.draggableProps} className="menu-tree-item">
            <div className="menu-item-row">
              <div {...provided.dragHandleProps} className="drag-handle"><DragHandleIcon /></div>
              <div className="item-info">
                <strong>{item.title}</strong> <span className="item-type">({item.type})</span>
              </div>
              <div className="item-actions">
                <button onClick={() => openModal(item)}>Edit</button>
                <button onClick={() => deleteItem(item.id)}>Delete</button>
              </div>
            </div>
            {item.children.length > 0 && (
              <Droppable droppableId={String(item.id)}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="menu-children">
                    {renderTree(item.children, level + 1)}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
          </div>
        )}
      </Draggable>
    ));
  };

  if (loading) return <div className="loader">Loading...</div>;

  return (
    <div className="menu-builder">
      <ToastContainer />
      <div className="menu-builder-header">
        <h1>Navigation Menu</h1>
        <button className="btn-primary" onClick={() => openModal()}>+ Add menu item</button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="-1">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="menu-tree-root">
              {renderTree(tree)}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingItem ? 'Edit menu item' : 'Add menu item'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Link type</label>
                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value, target_id: '', link_url: '' })}>
                  <option value="custom_link">Custom link</option>
                  <option value="category">Category</option>
                </select>
              </div>

              {formData.type === 'category' && (
                <div className="form-group">
                  <label>Category</label>
                  <select value={formData.target_id} onChange={e => setFormData({ ...formData, target_id: e.target.value })} required>
                    <option value="">Select a category</option>
                    {renderCategoryOptions(categoriesTree)}
                  </select>
                  <button type="button" className="btn-link" onClick={() => setShowCreateCategory(!showCreateCategory)}>
                    + Create new category
                  </button>
                  {showCreateCategory && (
                    <div className="nested-form">
                      <input type="text" placeholder="New category name" value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} />
                      <textarea placeholder="Description (optional)" value={newCategory.description} onChange={e => setNewCategory({ ...newCategory, description: e.target.value })} />
                      <select value={newCategory.parent_id} onChange={e => setNewCategory({ ...newCategory, parent_id: e.target.value })}>
                        <option value="">Parent category (optional)</option>
                        {renderCategoryOptions(categoriesTree)}
                      </select>
                      <button type="button" onClick={handleCreateCategory}>Create category</button>
                    </div>
                  )}
                </div>
              )}

              {formData.type === 'custom_link' && (
                <div className="form-group">
                  <label>URL</label>
                  <input type="text" value={formData.link_url} onChange={e => setFormData({ ...formData, link_url: e.target.value })} placeholder="/path" required />
                </div>
              )}

              <div className="form-group">
                <label>Parent item (optional)</label>
                <select value={formData.parent_id} onChange={e => setFormData({ ...formData, parent_id: e.target.value })}>
                  <option value="">Root level</option>
                  {menuItems.filter(i => i.id !== editingItem?.id).map(item => (
                    <option key={item.id} value={item.id}>{item.title}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;