// src/AuthContext/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Base URL for all axios requests
  axios.defaults.baseURL = "https://api.demotents.com";

  // Decode JWT and check expiry safely
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      const exp = payload.exp * 1000;
      return Date.now() >= exp;
    } catch (e) {
      console.error('Invalid token format', e);
      return true; // treat any decoding error as expired
    }
  };

  // Logout function (clears storage, redirects)
  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setAdmin(null);
    navigate('/login');
  };

  // Set up axios interceptors ONCE
  useEffect(() => {
    // Request interceptor: attach token to every request
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const currentToken = localStorage.getItem('adminToken');
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: catch 401 errors and logout
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount (optional)
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []); // empty dependency -> run once

  // Check token validity on mount
  useEffect(() => {
    if (token) {
      if (isTokenExpired(token)) {
        logout();
      } else {
        const storedAdmin = localStorage.getItem('adminUser');
        if (storedAdmin) setAdmin(JSON.parse(storedAdmin));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Auto logout when token expires (timer)
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));
          const timeToExpiry = payload.exp * 1000 - Date.now();
          if (timeToExpiry > 0) {
            const timer = setTimeout(() => logout(), timeToExpiry);
            return () => clearTimeout(timer);
          }
        } catch (e) {
          logout();
        }
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/admin/login', { username, password });
      const { token, admin } = response.data;
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(admin));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setAdmin(admin);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  return (
    <AuthContext.Provider value={{ token, admin, login, logout, isAuthenticated: !!token && !isTokenExpired(token) }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};