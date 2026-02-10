import React from 'react'
import "./Siderbar.css"
import { FiPlusCircle } from "react-icons/fi";
import { FiClipboard } from "react-icons/fi";
import { LuBox } from "react-icons/lu";
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className='sidebar'>
      <div className="sider-options">
        <NavLink to='/add'className="sidebar-option">
         <FiPlusCircle size={22}/>
          <p>Add Items</p>
        </NavLink>
        <NavLink to='/list' className="sidebar-option">
          <FiClipboard size={22}/>
          <p>List Items</p>
        </NavLink>
        <NavLink to='/orders' className="sidebar-option">
          <LuBox size={22}/>
          <p>Orders Items</p>
        </NavLink>
        <NavLink to='/new-category' className="sidebar-option">
          <LuBox size={22}/>
          <p>New Category</p>
        </NavLink>
        <NavLink to='/sub-category' className="sidebar-option">
          <LuBox size={22}/>
          <p>Sub Category</p>
        </NavLink>
        
      </div>
    </div>
  )
}

export default Sidebar
