// src/AuthContext/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.js';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // ✅ SHOW LOADER INSTEAD OF WHITE SCREEN
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;