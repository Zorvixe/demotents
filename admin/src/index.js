import React from 'react'
import ReactDom from 'react-dom/client'
import './index.css'
import App from './App.js'
import {BrowserRouter} from "react-router-dom"
ReactDom.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
