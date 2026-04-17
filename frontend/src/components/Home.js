import React, { useEffect } from "react";
import "./Home.css";
import Navbar from "./Navbar";

const Home = () => {
  // Set document title for the Home page
  useEffect(() => {
    document.title = "Home | Puna Graphics";
  }, []);

  return (
    <div className="home-hero-wrapper position-relative">

      {/* NAVBAR */}
      <div className="home-navbar">
        <Navbar />
      </div>

      {/* CAROUSEL */}
      <div
        id="heroCarousel"
        className="carousel slide"
        data-bs-ride="carousel"
        data-bs-interval="4500"
        data-bs-pause="false"
        data-bs-wrap="true"
      >

        {/* Indicators */}
        <div className="carousel-indicators">
          <button data-bs-target="#heroCarousel" data-bs-slide-to="0" className="active"></button>
          <button data-bs-target="#heroCarousel" data-bs-slide-to="1"></button>
          <button data-bs-target="#heroCarousel" data-bs-slide-to="2"></button>
        </div>

        <div className="carousel-inner">

          {/* Slide 1 */}
          <div
            className="carousel-item active hero-slide"
            style={{ backgroundImage: "url('/carousel_image_1.jpg')" }}
          >
            <div className="hero-overlay"></div>
            <div className="hero-center-content container text-center text-white d-flex flex-column justify-content-center align-items-center h-100">
              <h3 className="fw-bold">Best Demo Tent Manufacturers in Hyderabad</h3>
              <p>Design | Print | Stich | Deliver</p>
            </div>
          </div>

          {/* Slide 2 */}
          <div
            className="carousel-item hero-slide"
            style={{ backgroundImage: "url('/carousel_image_2.jpg')" }}
          >
            <div className="hero-overlay"></div>
            <div className="hero-center-content container text-center text-white d-flex flex-column justify-content-center align-items-center h-100">
              {/* Optional content can go here */}
            </div>
          </div>

          {/* Slide 3 */}
          <div
            className="carousel-item hero-slide"
            style={{ backgroundImage: "url('/famt.jpg')" }}
          >
            <div className="hero-overlay"></div>
            <div className="hero-center-content container text-center text-white d-flex flex-column justify-content-center align-items-center h-100">
              {/* Optional content can go here */}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;