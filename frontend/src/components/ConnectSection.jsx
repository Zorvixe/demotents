import React from "react";
import "./ConnectSection.css";

const ConnectSection = () => {
  return (
    <div
      className="connect-wrapper"
      data-aos="fade-up"
      data-aos-duration="1200"
      data-aos-easing="ease-out-cubic"
      data-aos-once="true"
      id="connect"
    >

      <div
        className="connect-left"
        data-aos="fade-right"
        data-aos-duration="1200"
        data-aos-easing="ease-out-cubic"
        data-aos-once="true"
      >
        <h2>We Connect Event Organizers & Tent Providers</h2>
        <p>
          We help you find reliable tent suppliers and event setup services
          at the best price, quickly and easily.
        </p>

        <div className="trust-icons">
          <div data-aos="zoom-in" data-aos-delay="100" data-aos-duration="1200" data-aos-once="true">
            <i className="bi bi-star-fill"></i>
            <p>Trusted Vendors</p>
          </div>
          <div data-aos="zoom-in" data-aos-delay="200" data-aos-duration="1200" data-aos-once="true">
            <i className="bi bi-shield-check"></i>
            <p>Secure Bookings</p>
          </div>
          <div data-aos="zoom-in" data-aos-delay="300" data-aos-duration="1200" data-aos-once="true">
            <i className="bi bi-lightning-charge-fill"></i>
            <p>Quick Assistance</p>
          </div>
        </div>
      </div>

      <div
        className="connect-center"
        data-aos="zoom-in"
        data-aos-duration="1200"
        data-aos-easing="ease-out-cubic"
        data-aos-once="true"
      >
        <div className="feature-box">
          <i className="bi bi-cart-check-fill"></i>
          <p>Easy Booking</p>
        </div>
        <div className="feature-box">
          <i className="bi bi-chat-left-dots-fill"></i>
          <p>Multiple Quotes</p>
        </div>
        <div className="feature-box">
          <i className="bi bi-shield-lock-fill"></i>
          <p>Quality Guaranteed</p>
        </div>
        <div className="feature-box">
          <i className="bi bi-people-fill"></i>
          <p>Trusted by Thousands</p>
        </div>
      </div>

      <div
        className="connect-right"
        data-aos="fade-left"
        data-aos-duration="1200"
        data-aos-easing="ease-out-cubic"
        data-aos-once="true"
      >
        <h3>TELL US WHAT YOU NEED</h3>
        <input type="text" placeholder="Enter Tent Type / Service" data-aos="fade-up" data-aos-delay="100" data-aos-once="true" />
        <input type="text" placeholder="Enter your mobile number" data-aos="fade-up" data-aos-delay="200" data-aos-once="true" />
        <button data-aos="fade-up" data-aos-delay="300" data-aos-once="true">Submit Requirement</button>
      </div>

    </div>
  );
};

export default ConnectSection;
