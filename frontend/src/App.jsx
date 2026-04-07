import React, { useEffect, useState, createContext, useContext } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

import Navbar from "./components/Navbar";
import CategoriesScroller from "./components/CategoriesScroller";
import ConnectSection from "./components/ConnectSection";
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
import SubcategoryProducts from "./pages/SubcategoryProducts";
import ScrollToTop from "./components/ScrollToTop";
// Create Context for global categories
export const CategoriesContext = createContext();

export const useCategories = () => {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error("useCategories must be used within CategoriesProvider");
  }
  return context;
};

const BASE_URL = "https://demotents-dhia.onrender.com";

function App() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BASE_URL}/api/categories?includeSubCategories=true`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
          setCategories(data.categories);
        } else {
          setError(data.message || "Failed to load categories");
        }
      } catch (err) {
        console.error("Global fetch error:", err);
        setError("Network error. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Show full‑screen loader until everything is ready
  if (loading) {
    return (
      <div className="global-loader">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="global-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <CategoriesContext.Provider value={{ categories, setCategories, BASE_URL }}>
      {/* Show normal navbar ONLY if not home */}
      {!isHome && <Navbar />}

      {/* Wrap all page content with conditional class for margin-top */}
      <div className={!isHome ? "page-with-navbar" : ""}>
           <ScrollToTop />
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Home />
                <CategoriesScroller />
                <ConnectSection />
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
          <Route path="/category/:categorySlug" element={<CategoryProducts />} />
          <Route path="/subcategory/:subcategoryId" element={<SubcategoryProducts />} />
        </Routes>

        <Footer />
      </div>

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
    </CategoriesContext.Provider>
  );
}

export default App;