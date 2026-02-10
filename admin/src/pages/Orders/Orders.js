import React, { useState, useEffect } from "react";
import "./Orders.css";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('https://demotents-backend.onrender.com/api/orders');
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await fetch(`https://demotents-backend.onrender.com/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Order status updated successfully');
        fetchOrders(); // Refresh orders
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      const response = await fetch(`https://demotents-backend.onrender.com/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Order deleted successfully');
        fetchOrders(); // Refresh orders
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Loading Ordere...</p>
      </div>
    );
  }

  return (
    <div className="order add">
      <ToastContainer position="top-right" autoClose={3000} />
      <h3>Order Page</h3>
      <p className="total-orders">Total Orders: {orders.length}</p>

      <div className="order-list">
        {orders.length === 0 ? (
          <div className="no-orders">
            <p>No orders found.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-item">
              <img
                src="https://cdn.pixabay.com/photo/2022/05/10/10/35/box-7186750_1280.png"
                alt="order"
                className="order-image"
              />

              <div className="order-details">
                <div className="order-info">
                  <p className="order-customer">
                    <strong>{order.customer_name}</strong>
                  </p>

                  {order.customer_email && (
                    <p className="order-email">{order.customer_email}</p>
                  )}

                  <p className="order-phone">
                    <i className="phone-icon">📱</i> {order.phone}
                  </p>

                  <div className="order-address">
                    <p>{order.address}</p>
                  </div>
                </div>

                <div className="order-items-section">
                  <h4>Order Items:</h4>
                  <ul className="order-items-list">
                    {Array.isArray(order.items) ? (
                      order.items.map((item, idx) => (
                        <li key={idx}>
                          {item.name} x {item.quantity}
                        </li>
                      ))
                    ) : (
                      <li>No items details available</li>
                    )}
                  </ul>
                </div>

                <div className="order-meta">
                  <p className="order-date">
                    Ordered: {new Date(order.created_at).toLocaleDateString()}
                  </p>
                  <p className="order-amount">
                    <strong>Amount: ${parseFloat(order.amount).toFixed(2)}</strong>
                  </p>
                </div>
              </div>

              <div className="order-actions">
                <div className="order-status">
                  <label>Status:</label>
                  <select
                    value={order.status || 'Pending'}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="action-buttons">
                  <button
                    onClick={() => handleDeleteOrder(order.id)}
                    className="delete-order-btn"
                  >
                    Delete Order
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;