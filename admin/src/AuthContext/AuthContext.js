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

  // ✅ FIXED BASE URL (IMPORTANT)
  axios.defaults.baseURL =
    process.env.NODE_ENV === 'production'
      ? window.location.origin
      : 'https://api.demotents.com';

  // Decode JWT
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch (e) {
      console.error('Invalid token', e);
      return true;
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setAdmin(null);
    navigate('/login');
  };

  // ✅ Axios Interceptors
  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use((config) => {
      const t = localStorage.getItem('adminToken');
      if (t) config.headers.Authorization = `Bearer ${t}`;
      return config;
    });

    const resInterceptor = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) logout();
        return Promise.reject(err);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  // ✅ Token check
  useEffect(() => {
    if (token) {
      if (isTokenExpired(token)) {
        logout();
      } else {
        const storedAdmin = localStorage.getItem('adminUser');
        if (storedAdmin) setAdmin(JSON.parse(storedAdmin));

        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    }
    setLoading(false); // ✅ IMPORTANT FIX
  }, [token]);

  const login = async (username, password) => {
    try {
      const res = await axios.post('/api/admin/login', { username, password });

      const { token, admin } = res.data;

      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(admin));

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setToken(token);
      setAdmin(admin);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        admin,
        login,
        logout,
        loading,
        isAuthenticated: !!token && !isTokenExpired(token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};