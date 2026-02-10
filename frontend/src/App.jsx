import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

import Navbar from "./components/Navbar";
import CategoriesScroller from "./components/CategoriesScroller";
import ConnectSection from "./components/ConnectSection";
import TentCategories from "./components/TentCategories";
import Footer from "./components/Footer";
import AllCategories from "./pages/AllCategories"; 
import Home from "./components/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import BookingPolicy from "./pages/BookingPolicy";
import TermsConditions from "./pages/TermsConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ProductDetails from "./pages/ProductDetails";
import CategoryProducts from "./pages/CategoryProducts";
import SubcategoryProducts from "./pages/SubcategoryProducts"; // New component

function App() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  
  return (
    <>
      {/* Show normal navbar ONLY if not home */}
      {!isHome && <Navbar />}
        
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Home />
              <CategoriesScroller />
              <ConnectSection />
              <TentCategories />
            </>
          }
        />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/booking-policy" element={<BookingPolicy />} />
        <Route path="/terms" element={<TermsConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/product/:productId" element={<ProductDetails />} />
        <Route path="/categories" element={<AllCategories />} />
        
        {/* Dynamic routes */}
        <Route path="/category/:categorySlug" element={<CategoryProducts />} />
        <Route path="/subcategory/:subcategoryId" element={<SubcategoryProducts />} />
      </Routes>

      <div className="social-fixed">
        <a className="whatsapp" href="https://wa.me/919052899000" target="_blank" rel="noreferrer">
          <i className="bi bi-whatsapp"></i>
        </a>

        <a className="phone" href="tel:+919052899000">
          <i className="bi bi-telephone-fill"></i>
        </a>
        
        <a className="instagram" href="https://instagram.com" target="_blank" rel="noreferrer">
          <i className="bi bi-instagram"></i>
        </a>

        <a className="facebook" href="https://facebook.com" target="_blank" rel="noreferrer">
          <i className="bi bi-facebook"></i>
        </a>
      </div>

      <Footer />
    </>
  );
}

export default App;