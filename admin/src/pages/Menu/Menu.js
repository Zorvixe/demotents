import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Menu.css';

const API_URL = 'https://api.demotents.com';

const Menu = () => {
  const [items, setItems] = useState([]);
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
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  const getAuthToken = () => localStorage.getItem('adminToken');

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_URL}/api/menu/flat`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const data = await res.json();
      if (data.success) setItems(data.items);
    } catch (err) {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesAndSubs = async () => {
    try {
      const [catRes, subRes] = await Promise.all([
        fetch(`${API_URL}/api/categories`),
        fetch(`${API_URL}/api/sub-categories`),
      ]);
      const catData = await catRes.json();
      const subData = await subRes.json();
      if (catData.success) setCategories(catData.categories);
      if (subData.success) setSubCategories(subData.sub_categories);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchCategoriesAndSubs();
  }, []);

  const buildTree = (items, parentId = null) => {
    return items
      .filter(item => (item.parent_id === null && parentId === null) || item.parent_id === parentId)
      .sort((a, b) => a.display_order - b.display_order)
      .map(item => ({
        ...item,
        children: buildTree(items, item.id),
      }));
  };

  const tree = buildTree(items);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceId = parseInt(source.droppableId);
    const destId = parseInt(destination.droppableId);
    const sourceIndex = source.index;
    const destIndex = destination.index;

    // Reorder locally first
    const newItems = [...items];
    const draggedItem = newItems.find(i => i.id === parseInt(draggableId));
    if (!draggedItem) return;

    // Remove from old position
    const oldParentItems = newItems.filter(i => (i.parent_id === sourceId) || (sourceId === -1 && i.parent_id === null));
    const movedItem = oldParentItems.splice(sourceIndex, 1)[0];
    movedItem.parent_id = destId === -1 ? null : destId;

    // Insert into new parent's children
    let newParentItems = newItems.filter(i => (i.parent_id === destId) || (destId === -1 && i.parent_id === null));
    newParentItems.splice(destIndex, 0, movedItem);

    // Recalculate display_order for both affected groups
    const updateOrders = (parentId, itemList) => {
      itemList.forEach((item, idx) => {
        const existing = newItems.find(i => i.id === item.id);
        if (existing) {
          existing.display_order = idx;
          existing.parent_id = parentId === -1 ? null : parentId;
        }
      });
    };
    updateOrders(sourceId, oldParentItems);
    updateOrders(destId, newParentItems);

    setItems([...newItems]);

    // Prepare payload for backend
    const allItems = newItems.map(item => ({
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
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        type: item.type,
        target_id: item.target_id || '',
        link_url: item.link_url || '',
        parent_id: item.parent_id || '',
      });
    } else {
      setEditingItem(null);
      setFormData({ title: '', type: 'custom_link', target_id: '', link_url: '', parent_id: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: formData.title,
      type: formData.type,
      target_id: formData.target_id ? parseInt(formData.target_id) : null,
      link_url: formData.link_url,
      parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
      display_order: 0,
    };
    try {
      const url = editingItem
        ? `${API_URL}/api/menu/${editingItem.id}`
        : `${API_URL}/api/menu`;
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingItem ? 'Updated' : 'Created');
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
      const data = await res.json();
      if (data.success) {
        toast.success('Deleted');
        fetchMenu();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const renderTree = (items, level = 0) => {
    return items.map((item, index) => (
      <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className="menu-tree-item"
            style={{ paddingLeft: `${level * 24}px`, ...provided.draggableProps.style }}
          >
            <div className="menu-item-content">
              <span {...provided.dragHandleProps} className="drag-handle">⋮⋮</span>
              <div className="item-info">
                <strong>{item.title}</strong> <span className="item-type">({item.type})</span>
                {item.type === 'category' && <span className="badge">Category</span>}
                {item.type === 'subcategory' && <span className="badge">SubCategory</span>}
                {item.type === 'custom_link' && <span className="badge">Custom Link</span>}
              </div>
              <div className="item-actions">
                <button onClick={() => openModal(item)}>Edit</button>
                <button onClick={() => deleteItem(item.id)} className="delete">Delete</button>
              </div>
            </div>
            {item.children.length > 0 && (
              <Droppable droppableId={String(item.id)}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="menu-tree-children">
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
        <h1>Navigation Menu Builder</h1>
        <button className="btn-primary" onClick={() => openModal()}>+ Add Menu Item</button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="-1" type="MENU">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="menu-tree-root">
              {renderTree(tree)}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
            <form onSubmit={handleSubmit}>
              <label>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <label>Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value, target_id: '', link_url: '' })}
              >
                <option value="custom_link">Custom Link</option>
                <option value="category">Category</option>
                <option value="subcategory">Subcategory</option>
              </select>

              {formData.type === 'category' && (
                <>
                  <label>Category</label>
                  <select
                    value={formData.target_id}
                    onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </>
              )}

              {formData.type === 'subcategory' && (
                <>
                  <label>Subcategory</label>
                  <select
                    value={formData.target_id}
                    onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                    required
                  >
                    <option value="">Select Subcategory</option>
                    {subCategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.category_name})</option>
                    ))}
                  </select>
                </>
              )}

              {formData.type === 'custom_link' && (
                <>
                  <label>URL</label>
                  <input
                    type="text"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="/products/special"
                    required
                  />
                </>
              )}

              <label>Parent Item (optional)</label>
              <select
                value={formData.parent_id}
                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
              >
                <option value="">Root level</option>
                {items.filter(i => i.id !== editingItem?.id).map(item => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>

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