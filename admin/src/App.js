// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext/AuthContext.js';
import ProtectedRoute from './AuthContext/ProtectedRoute.js';

import Navbar from './components/Navbar/Navbar.js';
import Sidebar from './components/Sidebar/Sidebar.js';

import Login from './pages/Login/Login.js';
import Add from './pages/Add/Add.js';
import List from './pages/List/List.js';
import Orders from './pages/Orders/Orders.js';
import NewCategory from './pages/Category/Categories.js';
import SubCategory from './pages/Category/SubCategories.js';
import Dashboard from './pages/Dashboard/Dashboard.js';
import Menu from './pages/Menu/Menu.js';

import './App.css';

const AppLayout = ({ children }) => (
  <div className="app-container">
    <Navbar />
    <div className="app-main">
      <Sidebar />
      <div className="app-content">{children}</div>
    </div>
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/add"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Add />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/list"
          element={
            <ProtectedRoute>
              <AppLayout>
                <List />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Orders />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/menu"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Menu />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/new-category"
          element={
            <ProtectedRoute>
              <AppLayout>
                <NewCategory />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/sub-category"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SubCategory />
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
};

export default App;