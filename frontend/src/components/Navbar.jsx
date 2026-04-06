import React, { useState, useEffect } from "react";
import "./Navbar.css";
import { RiCloseLine, RiArrowDropDownLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState([]);     // Only selected categories
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

//   useEffect(() => {
//   fetch("http://localhost:5004/api/navbar-menu")
//     .then(res => res.json())
//     .then(data => setMenuItems(data.menu));
// }, []);
  // Fetch only categories added to Navbar Menu
  // useEffect(() => {
  //   const fetchNavbarMenu = async () => {
  //     try {
  //       const response = await fetch("http://localhost:5004/api/navbar-menu");
  //       const data = await response.json();

  //       if (data.success) {
  //         setMenuItems(data.menu || []);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching navbar menu:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchNavbarMenu();
  // }, []);
  const API_URL = "https://demotents-dhia.onrender.com";

  useEffect(() => {
  const fetchNavbarMenu = async () => {
    try {
      const response = await fetch(`${API_URL}/api/navbar-menu`);
      if (!response.ok) throw new Error("API failed");

      const data = await response.json();
      if (data.success) {
        // Only show categories added to navbar
        setMenuItems(data.menu || []);
      } else {
        console.error("Navbar API error:", data.message);
      }
    } catch (error) {
      console.error("❌ Navbar fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchNavbarMenu();
}, []);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Filter based on search
  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNavigation = (path, state = {}) => {
    navigate(path, { state });
  };

  if (loading) {
    return (
      <nav className="navbar navbar-dark bg-dark navbar-custom fixed-top">
        <div className="container flex-column">
          <div className="d-flex w-100 align-items-center justify-content-between top-row">
            <div className="navbar-brand m-0 text-center">
              <h1 className="Logo-Text">Demotents.com</h1>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar navbar-dark bg-dark navbar-custom fixed-top">
      <div className="container flex-column">
        {/* Top Row */}
        <div className="d-flex w-100 align-items-center justify-content-between top-row">
          <div 
            className="navbar-brand m-0 text-center" 
            onClick={() => navigate("/")} 
            style={{ cursor: "pointer" }}
          >
            <h1 className="Logo-Text">Demotents.com</h1>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="menu" onClick={toggleMenu}>
            {menuOpen ? <RiCloseLine size={28} color="white" /> : <><span></span><span></span><span></span></>}
          </div>
        </div>

        {/* Navigation Links */}
        <div className={`w-100 mt-2 nav-links ${menuOpen ? "active" : ""}`}>
          <ul className="navbar-nav d-flex flex-row justify-content-center flex-wrap">
            {/* Home */}
            <li className="nav-item" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              <span className="nav-link">HOME</span>
            </li>

            {/* Dynamic Menu from Backend (only selected categories) */}
            {filteredMenuItems.map((item) => (
              <React.Fragment key={item.id}>
                {item.sub_categories && item.sub_categories.length > 0 ? (
                  // Dropdown
                  <li className="nav-item dropdown dropdown-hover">
                    <span
                      className="nav-link d-flex align-items-center gap-1"
                      onClick={() => handleNavigation("/category", { 
                        categoryId: item.id, 
                        categoryName: item.name 
                      })}
                      style={{ cursor: "pointer" }}
                    >
                      {item.name.toUpperCase()}
                      <RiArrowDropDownLine size={20} />
                    </span>

                    <ul className="dropdown-menu">
                      {item.sub_categories.map((sub, index) => (
                        <li key={index} className="dropdown-submenu">
                          <span className="dropdown-item d-flex justify-content-between align-items-center">
                            {sub.name}
                            <RiArrowDropDownLine size={18} />
                          </span>
                          <ul className="dropdown-menu nested-menu">
                            <li onClick={() => handleNavigation(`/subcategory/${sub.id}?type=without-print`)}>
                              <span className="dropdown-item">Without Print</span>
                            </li>
                            <li onClick={() => handleNavigation(`/subcategory/${sub.id}?type=custom`)}>
                              <span className="dropdown-item">With Customization</span>
                            </li>
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : (
                  // Simple Link
                  <li 
                    className="nav-item"
                    onClick={() => handleNavigation("/category", { 
                      categoryId: item.id, 
                      categoryName: item.name 
                    })}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="nav-link">{item.name.toUpperCase()}</span>
                  </li>
                )}
              </React.Fragment>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;