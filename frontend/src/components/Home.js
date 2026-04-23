import React, { useEffect } from "react";
import "./Home.css";
import Navbar from "./Navbar";
import VideoGallery from "../components/VideoGallery/VideoGallery.js"; // <-- import

const Home = () => {
  useEffect(() => {
    document.title = "Home | Puna Graphics";
  }, []);

  return (
    <div className="home-hero-wrapper position-relative">
      <div className="home-navbar">
        <Navbar />
      </div>

      {/* Hero Carousel remains same */}
      <div id="heroCarousel" className="carousel slide" data-bs-ride="carousel" data-bs-interval="4500" data-bs-pause="false" data-bs-wrap="true">
        <div className="carousel-indicators">
          <button data-bs-target="#heroCarousel" data-bs-slide-to="0" className="active"></button>
          <button data-bs-target="#heroCarousel" data-bs-slide-to="1"></button>
          <button data-bs-target="#heroCarousel" data-bs-slide-to="2"></button>
        </div>
        <div className="carousel-inner">
          <div className="carousel-item active hero-slide" style={{ backgroundImage: "url('/carousel_image_1.jpg')" }}>
            <div className="hero-overlay"></div>
            <div className="hero-center-content container text-center text-white d-flex flex-column justify-content-center align-items-center h-100">
              <h1 className="hero-title fw-bold">Best Demo Tent Manufacturers in Hyderabad</h1>
              <p className="hero-subtitle">Design | Print | Stich | Deliver</p>
            </div>
          </div>
          <div className="carousel-item hero-slide" style={{ backgroundImage: "url('/carousel_image_2.jpg')" }}>
            <div className="hero-overlay"></div>
          </div>
          <div className="carousel-item hero-slide" style={{ backgroundImage: "url('/famt.jpg')" }}>
            <div className="hero-overlay"></div>
          </div>
        </div>
      </div>

      {/* 👇 VIDEO GALLERY SECTION */}
      <VideoGallery />
    </div>
  );
};

export default Home;