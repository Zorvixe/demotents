import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Menu.css';

const API_URL = "https://api.demotents.com";

const Menu = () => {
  const [flatData, setFlatData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({ id: null, name: '', url: '', parent_id: '' });

  // Authentication helper
  const getAuthToken = () => localStorage.getItem('adminToken');

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      // Replace with your actual endpoint. If seeding from categories initially:
      const res = await fetch(`${API_URL}/api/menu`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const data = await res.json();
      
      // Ensure data has required fields, default to empty array if undefined
      const sanitizedData = (Array.isArray(data) ? data : data.items || []).map(item => ({
        ...item,
        parent_id: item.parent_id || null,
        display_order: item.display_order || 0
      }));
      
      setFlatData(sanitizedData);
    } catch (err) {
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  // Convert flat array into nested tree for rendering
  const buildTree = (items) => {
    const itemMap = {};
    const tree = [];
    
    // Deep copy and map map
    items.forEach(item => { itemMap[item.id] = { ...item, children: [] }; });
    
    items.forEach(item => {
      if (item.parent_id && itemMap[item.parent_id]) {
        itemMap[item.parent_id].children.push(itemMap[item.id]);
      } else {
        tree.push(itemMap[item.id]);
      }
    });

    // Sort children recursively
    const sortItems = (nodes) => {
      nodes.sort((a, b) => a.display_order - b.display_order);
      nodes.forEach(node => sortItems(node.children));
    };
    
    sortItems(tree);
    return tree;
  };

  const toggleExpand = (id) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpanded(newExpanded);
  };

  // Drag and Drop Logic (Reorder within same parent)
  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, type } = result;
    if (source.index === destination.index) return;

    const parentIdStr = type.replace('DROP_', '');
    const parentId = parentIdStr === 'root' ? null : isNaN(parentIdStr) ? parentIdStr : Number(parentIdStr);

    // Get siblings in current order
    let siblings = flatData
      .filter(item => item.parent_id === parentId)
      .sort((a, b) => a.display_order - b.display_order);

    // Reorder array
    const [moved] = siblings.splice(source.index, 1);
    siblings.splice(destination.index, 0, moved);

    // Create updates
    const updates = siblings.map((item, idx) => ({ ...item, display_order: idx }));

    // Optimistically update UI state
    const newFlatData = flatData.map(item => {
      const update = updates.find(u => u.id === item.id);
      return update ? update : item;
    });
    setFlatData(newFlatData);

    try {
      await fetch(`${API_URL}/menu/reorder`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}` 
        },
        body: JSON.stringify({ items: updates.map(u => ({ id: u.id, parent_id: u.parent_id, display_order: u.display_order })) })
      });
    } catch (err) {
      toast.error('Failed to save new order');
      fetchMenu(); // Revert on failure
    }
  };

  // Modal actions
  const openAddModal = (parentId = null) => {
    setModalMode('add');
    setFormData({ id: null, name: '', url: '', parent_id: parentId || '' });
    setIsModalOpen(true);
    if (parentId && !expanded.has(parentId)) {
      toggleExpand(parentId); // auto-expand parent when adding child
    }
  };

  const openEditModal = (item) => {
    setModalMode('edit');
    setFormData({ id: item.id, name: item.name, url: item.url || '', parent_id: item.parent_id || '' });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Name is required');

    const isEditing = modalMode === 'edit';
    const endpoint = isEditing ? `${API_URL}/api/menu/${formData.id}` : `${API_URL}/api/menu`;
    const method = isEditing ? 'PUT' : 'POST';

    const payload = {
      name: formData.name,
      url: formData.url,
      parent_id: formData.parent_id || null,
      display_order: isEditing ? undefined : 999 // Put new items at bottom
    };

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(`Menu item ${isEditing ? 'updated' : 'added'}`);
        setIsModalOpen(false);
        fetchMenu();
      } else {
        toast.error('Operation failed');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? All nested child items will also be removed.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/menu/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        toast.success('Deleted successfully');
        fetchMenu();
      } else {
        toast.error('Failed to delete');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  // Recursive Tree Renderer
  const renderTree = (items, parentId = 'root') => (
    <Droppable droppableId={String(parentId)} type={`DROP_${parentId}`}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps} className={`menu-droppable ${parentId !== 'root' ? 'nested-droppable' : ''}`}>
          {items.map((item, index) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expanded.has(item.id);

            return (
              <Draggable key={String(item.id)} draggableId={String(item.id)} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`menu-item-wrapper ${snapshot.isDragging ? 'is-dragging' : ''}`}
                  >
                    <div className="menu-item-row">
                      <div className="menu-item-left">
                        <div {...provided.dragHandleProps} className="drag-handle" title="Drag to reorder">
                          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M7 2a2 2 0 10-4 0 2 2 0 004 0zm3 2a2 2 0 100-4 2 2 0 000 4zm7-2a2 2 0 10-4 0 2 2 0 004 0zm-10 7a2 2 0 10-4 0 2 2 0 004 0zm3 2a2 2 0 100-4 2 2 0 000 4zm7-2a2 2 0 10-4 0 2 2 0 004 0zm-10 7a2 2 0 10-4 0 2 2 0 004 0zm3 2a2 2 0 100-4 2 2 0 000 4zm7-2a2 2 0 10-4 0 2 2 0 004 0z" /></svg>
                        </div>
                        {hasChildren ? (
                          <button onClick={() => toggleExpand(item.id)} className="expand-btn">
                            <svg className={`chevron ${isExpanded ? 'open' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                          </button>
                        ) : (
                          <div className="expand-placeholder" />
                        )}
                        <span className="menu-item-title">{item.name}</span>
                        {item.url && <span className="menu-item-link">{item.url}</span>}
                      </div>
                      
                      <div className="menu-item-actions">
                        <button onClick={() => openAddModal(item.id)} className="action-link text-primary">Add child</button>
                        <button onClick={() => openEditModal(item)} className="action-link">Edit</button>
                        <button onClick={() => handleDelete(item.id, item.name)} className="action-link text-danger">Delete</button>
                      </div>
                    </div>

                    {/* Render Children Recursively if Expanded */}
                    {hasChildren && isExpanded && (
                      <div className="menu-children-container">
                        {renderTree(item.children, item.id)}
                      </div>
                    )}
                  </div>
                )}
              </Draggable>
            );
          })}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );

  const menuTree = buildTree(flatData);

  return (
    <div className="shopify-menu-builder">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />
      
      <div className="smb-header">
        <div>
          <h1 className="smb-title">Navigation Menu</h1>
          <p className="smb-subtitle">Build your store's categories, sub-categories, and nested menus.</p>
        </div>
        <button onClick={() => openAddModal()} className="smb-btn-primary">Add Menu Item</button>
      </div>

      <div className="smb-card">
        {loading ? (
          <div className="smb-loading">Loading menu...</div>
        ) : menuTree.length === 0 ? (
          <div className="smb-empty">
            <p>No menu items found.</p>
            <button onClick={() => openAddModal()} className="smb-btn-outline">Create First Item</button>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            {renderTree(menuTree)}
          </DragDropContext>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="smb-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="smb-modal" onClick={e => e.stopPropagation()}>
            <div className="smb-modal-header">
              <h2>{modalMode === 'edit' ? 'Edit menu item' : 'Add menu item'}</h2>
              <button className="smb-close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSave} className="smb-modal-body">
              <div className="smb-input-group">
                <label>Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Luxury Tents" 
                  autoFocus
                  required 
                />
              </div>
              <div className="smb-input-group">
                <label>Link / URL (Optional)</label>
                <input 
                  type="text" 
                  value={formData.url} 
                  onChange={e => setFormData({...formData, url: e.target.value})} 
                  placeholder="e.g. /collections/luxury-tents" 
                />
              </div>
              <div className="smb-input-group">
                <label>Parent Item (Nesting)</label>
                <select 
                  value={formData.parent_id || ''} 
                  onChange={e => setFormData({...formData, parent_id: e.target.value})}
                >
                  <option value="">None (Top Level)</option>
                  {/* Flat list for dropdown to prevent circular dependencies easily */}
                  {flatData
                    .filter(item => item.id !== formData.id) // Cannot be child of itself
                    .map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                <small className="smb-help-text">Select an item to nest this under as a sub-category.</small>
              </div>
              <div className="smb-modal-footer">
                <button type="button" className="smb-btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="smb-btn-primary">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;