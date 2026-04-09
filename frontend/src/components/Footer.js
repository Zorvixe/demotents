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
                We are the leading demo tent manufacturers in Hyderabad, offering high-quality, durable, and customizable tents for promotions, events, and corporate branding. With 15 years of experience, we provide gazebo tents, marketing tents, and bulk supply solutions with expert stitching and branding options.
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
                  {/* <li onClick={() => navigate("/booking-policy")}>Booking Policy</li>
                  <li onClick={() => navigate("/terms")}>Terms & Conditions</li>
                  <li onClick={() => navigate("/privacy-policy")}>Privacy Policy</li> */}
                </ul>
              </div>

              <div className="col-6">
                <h6 className="fw-bold mb-3 mt-4">Our Services</h6>
                <ul className="list-unstyled footer-links">
<li onClick={() => navigate("/subcategory/1?type=without-print")}>Canopy</li>
<li onClick={() => navigate("/subcategory/4?type=without-print")}>Gazebo</li>
<li onClick={() => navigate("/subcategory/6?type=without-print")}>Roll up Standee</li>
<li onClick={() => navigate("/subcategory/7?type=without-print")}>Promotable</li>
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
  <a
    href="https://www.google.com/maps/search/?api=1&query=Piller+No.+1540,+Uco+Bank+Lane,+Dilsukhnagar,+Hyderabad"
    target="_blank"
    rel="noopener noreferrer"
    className="map-link"
  >
    Piller No. 1540, Uco Bank Lane, H.No.13-4-129,5-5/101, Sree Gayathri Nivas, Durga Nagar, Dilsukhnagar, Hyderabad, Telangana 500060
  </a>
</p>

              <p>
                <i className="bi bi-envelope me-2"></i>
                punnagfx@gmail.com
              </p>

              <p>
                <i className="bi bi-telephone me-2"></i>
                +91 9010864897
              </p>

              <div className="social-icons">
                <a href="#"><i className="bi bi-facebook"></i></a>
                <a href="https://wa.me/919010864897"><i className="bi bi-whatsapp"></i></a>
                <a href="#"><i className="bi bi-instagram"></i></a>
                <a href="tel:+919010864897">
                  <i className="bi bi-telephone-fill"></i>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Footer bottom */}
        <div className="footer-bottom text-center mt-4">
           <p>© {new Date().getFullYear()} <a className="sitename" href='/'>Demo Tents</a> . Developed by <a className="sitename" href='https://www.zorvixetechnologies.com'>Zorvixe Technologies</a></p>
    
        </div>
      </div>
    </footer>
  );
};

export default Footer;
