import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Dashboard.css';

const API_URL = "https://api.demotents.com";

const Dashboard = () => {
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, totalCustomers: 0, recentOrders: [] });
  const [loading, setLoading] = useState(true);

  const getAuthToken = () => localStorage.getItem('adminToken');

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) setStats(result.stats);
      else toast.error(result.message || 'Failed to load statistics');
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Network error. Please try again.');
    } finally { setLoading(false); }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;

  return (
    <div className="dashboard-page-wrapper">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="dashboard-header"><h2>Dashboard Overview</h2><p>Welcome back! Here's what's happening with your store today.</p></div>
      <div className="stats-grid">
        <div className="ui-stat-card"><div className="stat-icon-wrapper blue"><span className="stat-icon">📦</span></div><div className="stat-details"><p className="stat-label">Total Products</p><h3 className="stat-value">{stats.totalProducts}</h3></div></div>
        <div className="ui-stat-card"><div className="stat-icon-wrapper green"><span className="stat-icon">💰</span></div><div className="stat-details"><p className="stat-label">Total Revenue</p><h3 className="stat-value">{formatCurrency(stats.totalRevenue)}</h3></div></div>
        <div className="ui-stat-card"><div className="stat-icon-wrapper purple"><span className="stat-icon">🛒</span></div><div className="stat-details"><p className="stat-label">Total Orders</p><h3 className="stat-value">{stats.totalOrders}</h3></div></div>
        <div className="ui-stat-card"><div className="stat-icon-wrapper orange"><span className="stat-icon">👥</span></div><div className="stat-details"><p className="stat-label">Unique Customers</p><h3 className="stat-value">{stats.totalCustomers}</h3></div></div>
      </div>
      <div className="ui-card recent-orders-card"><div className="card-header flex-between"><h3>Recent Orders</h3><a href="/orders" className="ui-link-btn">View All Orders</a></div>
        {stats.recentOrders.length === 0 ? <div className="empty-state"><p>No orders received yet.</p></div> : <div className="table-responsive"><table className="ui-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th className="text-right">Total</th></tr></thead><tbody>{stats.recentOrders.map(order => (<tr key={order.id}><td className="fw-600">#{order.id}</td><td>{order.customer_name}</td><td className="text-muted">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td><td><span className={`ui-badge badge-${(order.status || 'pending').toLowerCase()}`}>{order.status}</span></td><td className="text-right fw-600">{formatCurrency(order.amount)}</td></tr>))}</tbody></table></div>}
      </div>
    </div>
  );
};

export default Dashboard;