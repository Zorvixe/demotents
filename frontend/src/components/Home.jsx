import React from "react";
import "./Home.css";
import Navbar from "./Navbar";


const Home = () => {
 
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
              <h1 className="fw-bold">Premium Tent Rentals</h1>
              <p>Quality tents, quick setup & best service.</p>
            </div>
          </div>

          {/* Slide 2 */}
          <div
            className="carousel-item hero-slide"
            style={{ backgroundImage: "url('/carousel_image_2.jpg')" }}
          >
            <div className="hero-overlay"></div>
            <div className="hero-center-content container text-center text-white d-flex flex-column justify-content-center align-items-center h-100">
              <h1 className="fw-bold">Make Your Event Memorable</h1>
              <p>Elegant styling & reliable tent solutions.</p>
            </div>
          </div>

          {/* Slide 3 */}
          <div
            className="carousel-item hero-slide"
            style={{ backgroundImage: "url('/carousel_image_3.jpg')" }}
          >
            <div className="hero-overlay"></div>
            <div className="hero-center-content container text-center text-white d-flex flex-column justify-content-center align-items-center h-100">
              <h1 className="fw-bold">Best Outdoor Setup</h1>
              <p>Trusted tents for every occasion.</p>
            </div>
          </div>

        </div>
      </div>
      

    </div>
  );
};

export default Home;