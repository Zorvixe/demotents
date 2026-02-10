import React from 'react'
import Navbar from './components/Navbar/Navbar.js'
import Sidebar from './components/Sidebar/Sidebar.js'
import {Route,Routes} from 'react-router-dom'
import Add from './pages/Add/Add.js'
import List from './pages/List/List.js'
import Orders from './pages/Orders/Orders.js'
import NewCategory from './pages/Category/Categories.js'
import SubCategory from './pages/Category/SubCategories.js'

const App = () => {
  return (
    <div>
      <Navbar/>
      <hr/>
      <div className='app-content'>
        <Sidebar/>
     <Routes>
      <Route path="/add" element={<Add/>}/>
      <Route path="/list" element={<List/>}/>
      <Route path="/orders" element={<Orders/>}/>
      <Route path="/orders" element={<Orders/>}/>
      <Route path="/new-category" element={<NewCategory/>}/>
      <Route path="/sub-category" element={<SubCategory/>}/>
      
     </Routes>
      </div>
    </div>
  )
}

export default App
