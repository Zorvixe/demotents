import React, { useEffect } from "react";

import "./PrivacyPolicy.css";

const PrivacyPolicy = () => {

    // Set document title for the Home page
    useEffect(() => {
      document.title = "Privacy Policy | Puna Graphics";
    }, []);
  return (
    <div className="privacy-page">

      {/* HERO */}
      <section className="privacy-hero">
        <div className="container text-center">
          <h1>Privacy Policy</h1>
          <p>
            Your privacy matters to us at <strong>DemoTents by Punna Graphics</strong>.
            This policy explains how we collect, use, and protect your information.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="privacy-content">
        <div className="container">

          <div className="privacy-block">
            <span className="privacy-index">01</span>
            <div>
              <h3>Information We Collect</h3>
              <p>
                We may collect personal details such as your name, phone number,
                email address, and event-related information when you contact us,
                make inquiries, or book our services.
              </p>
            </div>
          </div>

          <div className="privacy-block">
            <span className="privacy-index">02</span>
            <div>
              <h3>How We Use Your Information</h3>
              <p>
                Your information is used to communicate with you, process
                bookings, provide services, improve customer experience, and
                respond to inquiries or support requests.
              </p>
            </div>
          </div>

          <div className="privacy-block">
            <span className="privacy-index">03</span>
            <div>
              <h3>Data Protection</h3>
              <p>
                We take appropriate technical and organizational measures to
                protect your personal data against unauthorized access, misuse,
                or disclosure.
              </p>
            </div>
          </div>

          <div className="privacy-block">
            <span className="privacy-index">04</span>
            <div>
              <h3>Sharing of Information</h3>
              <p>
                We do not sell, trade, or rent your personal information to
                third parties. Data may be shared only when required by law or
                to fulfill service commitments.
              </p>
            </div>
          </div>

          <div className="privacy-block">
            <span className="privacy-index">05</span>
            <div>
              <h3>Cookies & Tracking</h3>
              <p>
                Our website may use basic cookies to enhance browsing
                experience. These cookies do not collect personally
                identifiable information.
              </p>
            </div>
          </div>

          <div className="privacy-block">
            <span className="privacy-index">06</span>
            <div>
              <h3>Your Rights</h3>
              <p>
                You have the right to request access, correction, or deletion
                of your personal information by contacting us directly.
              </p>
            </div>
          </div>

          <div className="privacy-block">
            <span className="privacy-index">07</span>
            <div>
              <h3>Policy Updates</h3>
              <p>
                This Privacy Policy may be updated from time to time. Any
                changes will be reflected on this page.
              </p>
            </div>
          </div>

          <div className="privacy-footer-note">
            <p>
              By using our website or services, you agree to this Privacy Policy.
              If you have any questions, please contact DemoTents by Punna Graphics.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};

export default PrivacyPolicy;
