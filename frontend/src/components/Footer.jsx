import React from "react";
import { useNavigate } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="footer-section">
      <div className="container py-4">
        <div className="row">

          {/* Left side - Company logo and description */}
          <div className="col-lg-4 mb-4">
            <div className="company-info">
              <a onClick={() => navigate("/")} role="button">
                 <h1 className = "Logo-Text">Demotents.com</h1>
              </a>

              <p className="company-description mb-3">
                Punna Graphics is your trusted partner for premium tent and event
                rental services. We provide all types of tents for weddings,
                parties, corporate events, exhibitions, and outdoor celebrations.
                With quality materials, creative setups, and reliable service,
                we help make every event memorable and stress-free.
              </p>
            </div>
          </div>

          {/* Center - Links */}
          <div className="col-lg-4 mb-4">
            <div className="row">
              <div className="col-6">
                <h6 className="fw-bold mb-3 mt-4">Information</h6>
                <ul className="list-unstyled footer-links">
                  <li onClick={() => navigate("/about")}>About Us</li>
                  <li onClick={() => navigate("/booking-policy")}>Booking Policy</li>
                  <li onClick={() => navigate("/terms")}>Terms & Conditions</li>
                  <li onClick={() => navigate("/privacy-policy")}>Privacy Policy</li>
                </ul>
              </div>

              <div className="col-6">
                <h6 className="fw-bold mb-3 mt-4">Our Services</h6>
                <ul className="list-unstyled footer-links">
                  <li>Wedding Tent Setup</li>
                  <li>Party & Event Tents</li>
                  <li>Corporate Event Arrangements</li>
                  <li>Custom Decorations</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right side - Contact information */}
          <div className="col-lg-4 mb-4 mt-4">
            <div className="contact-info">
              <h6 className="fw-bold mb-3">Contact Information</h6>

              <p>
                <i className="bi bi-geo-alt me-2"></i>
                Dilsukhnagar, Hyderabad, Telangana
              </p>

              <p>
                <i className="bi bi-envelope me-2"></i>
                punna.graphics@email.com
              </p>

              <p>
                <i className="bi bi-telephone me-2"></i>
                +91 9052899000
              </p>

              <div className="social-icons">
                <a href="#"><i className="bi bi-facebook"></i></a>
                <a href="#"><i className="bi bi-whatsapp"></i></a>
                <a href="#"><i className="bi bi-instagram"></i></a>
                <a href="tel:+919052899000">
                  <i className="bi bi-telephone-fill"></i>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Footer bottom */}
        <div className="footer-bottom text-center mt-4">
          <p className="mb-0">
            © {new Date().getFullYear()} Punna Graphics. All Rights Reserved.
          </p>
          <p className="small text-muted">
            Maintained by Zorvixe Technologies
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
