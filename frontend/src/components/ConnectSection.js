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
        <h2>Best Demo Tent Manufacturers in Hyderabad
</h2>
        <p>
         We are the leading demo tent manufacturers in Hyderabad, offering high-quality, durable, and customizable tents for promotions, events, and corporate branding. With 15 years of experience, we provide gazebo tents, marketing tents, and bulk supply solutions with expert stitching and branding options.</p>

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

    </div>
  );
};

export default ConnectSection;
