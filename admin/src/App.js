import React from 'react';
import Navbar from './components/Navbar/Navbar.js';
import Sidebar from './components/Sidebar/Sidebar.js';
import { Route, Routes } from 'react-router-dom';
import Add from './pages/Add/Add.js';
import List from './pages/List/List.js';
import Orders from './pages/Orders/Orders.js';
import NewCategory from './pages/Category/Categories.js';
import SubCategory from './pages/Category/SubCategories.js';
import Dashboard from './pages/Dashboard/Dashboard.js';
import Menu from './pages/Menu/Menu.js';
import './App.css'; // we'll add the new styles here

const App = () => {
  return (
    <div className="app-container">
      <Navbar />
      <div className="app-main">
        <Sidebar />
        <div className="app-content">
          <Routes>
              <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<Add />} />
            <Route path="/list" element={<List />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/new-category" element={<NewCategory />} />
            <Route path="/sub-category" element={<SubCategory />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;