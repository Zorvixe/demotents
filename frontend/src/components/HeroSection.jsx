import React from "react";
import "./HeroSection.css";

const HeroSection = () => {
  return (
    <div
      id="heroCarousel"
      className="carousel slide"
      data-bs-ride="carousel"
      data-bs-interval="4500"
      data-bs-pause="false"
      data-bs-wrap="true"
    >

   
      <div className="carousel-indicators">
        <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="0" className="active"></button>
        <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="1"></button>
      </div>

      <div className="carousel-inner">

        <div
          className="carousel-item active hero-slide"
          style={{ backgroundImage: "url('/hero1.png')" }}
        >
          <div className="hero-overlay"></div>

      
          <div className="hero-center-content container text-center text-white d-flex flex-column justify-content-center align-items-center h-100">
            <h1 className="hero-title display-5 display-md-4 fw-bold">
              Premium Tent Rentals
            </h1>
            <p className="hero-subtitle lead">
              Quality tents, quick setup & best service.
            </p>
            <a href="#connect">
              <button className="hero-btn btn btn-warning btn-lg rounded-pill">
                Book Now
              </button>
            </a>
          </div>
        </div>

        <div
          className="carousel-item hero-slide"
          style={{ backgroundImage: "url('/hero2.png')" }}
        >
          <div className="hero-overlay"></div>

          <div className="hero-center-content container text-center text-white d-flex flex-column justify-content-center align-items-center h-100">
            <h1 className="hero-title display-5 display-md-4 fw-bold">
              Make Your Event Memorable
            </h1>
            <p className="hero-subtitle lead">
              Elegant styling & reliable tent solutions.
            </p>
            <a href="#connect">
              <button className="hero-btn btn btn-warning btn-lg rounded-pill">
                Explore
              </button>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HeroSection;
