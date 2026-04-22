import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './Categories.css';

const API_URL = 'https://api.demotents.com';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', parent_id: '' });

  const getAuthToken = () => localStorage.getItem('adminToken');

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories`);
      const data = await res.json();
      if (data.success) setCategories(data.categories);
    } catch (err) { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const openModal = (cat = null) => {
    setEditingCat(cat);
    setFormData({
      name: cat ? cat.name : '',
      description: cat ? cat.description || '' : '',
      parent_id: cat ? cat.parent_id || '' : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Name required');
    try {
      const url = editingCat ? `${API_URL}/api/categories/${editingCat.id}` : `${API_URL}/api/categories`;
      const method = editingCat ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingCat ? 'Updated' : 'Created');
        setShowModal(false);
        fetchCategories();
      } else {
        toast.error(data.message);
      }
    } catch (err) { toast.error('Operation failed'); }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category and all its children? Cannot undo.')) return;
    try {
      const res = await fetch(`${API_URL}/api/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Deleted');
        fetchCategories();
      } else {
        toast.error(data.message);
      }
    } catch (err) { toast.error('Delete failed'); }
  };

  const renderTree = (cats, level = 0) => {
    return cats.map(cat => (
      <div key={cat.id} className="category-tree-item" style={{ marginLeft: `${level * 20}px` }}>
        <div className="category-row">
          {cat.children && cat.children.length > 0 && (
            <button onClick={() => toggleExpand(cat.id)} className="expand-btn">
              {expanded[cat.id] ? <FaChevronDown /> : <FaChevronRight />}
            </button>
          )}
          <span className="cat-name">{cat.name}</span>
          <div className="cat-actions">
            <button onClick={() => openModal(cat)}><FaEdit /></button>
            <button onClick={() => deleteCategory(cat.id)}><FaTrash /></button>
            <button onClick={() => openModal({ parent_id: cat.id })}><FaPlus /></button>
          </div>
        </div>
        {expanded[cat.id] && cat.children && (
          <div className="category-children">{renderTree(cat.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  if (loading) return <div className="loader">Loading...</div>;

  return (
    <div className="categories-container">
      <div className="header">
        <h1>Categories</h1>
        <button className="btn-primary" onClick={() => openModal()}>+ Add root category</button>
      </div>
      <div className="category-tree">{renderTree(categories)}</div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingCat ? 'Edit Category' : 'New Category'}</h2>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              <select value={formData.parent_id} onChange={e => setFormData({ ...formData, parent_id: e.target.value })}>
                <option value="">No parent (root)</option>
                {renderCategoryOptions(categories, 0, editingCat?.id)}
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

// Helper to render category options recursively (avoid self/child as parent)
const renderCategoryOptions = (cats, level = 0, excludeId = null) => {
  let opts = [];
  for (let cat of cats) {
    if (cat.id === excludeId) continue;
    opts.push(<option key={cat.id} value={cat.id}>{'—'.repeat(level)} {cat.name}</option>);
    if (cat.children) opts.push(...renderCategoryOptions(cat.children, level + 1, excludeId));
  }
  return opts;
};

export default Categories;