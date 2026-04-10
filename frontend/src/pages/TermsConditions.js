import React, { useEffect } from "react";


import "./TermsConditions.css";

const TermsConditions = () => {

      // Set document title for the Home page
      useEffect(() => {
        document.title = "Terms & Conditions | Demotents";
      }, []);

  return (
    <div className="terms-page">

      {/* HEADER */}
      <section className="terms-header">
        <div className="container text-center">
          <h1>Terms & Conditions</h1>
          <p>
            These terms govern the use of services provided by
            <strong> DemoTents by Punna Graphics</strong>. Please read them
            carefully.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="terms-content">
        <div className="container">

          <div className="terms-card">
            <h3>1. Acceptance of Terms</h3>
            <p>
              By booking or using our services, you agree to comply with and be
              bound by these Terms & Conditions. If you do not agree, please do
              not proceed with the booking.
            </p>
          </div>

          <div className="terms-card">
            <h3>2. Services Offered</h3>
            <p>
              DemoTents provides tent rentals, canopies, event setups, and
              related infrastructure services for weddings, corporate events,
              exhibitions, and outdoor programs.
            </p>
          </div>

          <div className="terms-card">
            <h3>3. Booking & Payment</h3>
            <p>
              Bookings are confirmed only after advance payment. The remaining
              balance must be settled before or on the event date. Failure to
              complete payment may result in cancellation of services.
            </p>
          </div>

          <div className="terms-card">
            <h3>4. Cancellation Policy</h3>
            <p>
              Any cancellation by the client will result in forfeiture of the
              advance payment. Cancellation charges may vary depending on the
              event date and preparation status.
            </p>
          </div>

          <div className="terms-card">
            <h3>5. Client Responsibilities</h3>
            <p>
              Clients must ensure proper access to the venue, availability of
              electricity if required, and sufficient space for setup. Any
              delays caused due to lack of access will not be our responsibility.
            </p>
          </div>

          <div className="terms-card">
            <h3>6. Damage & Liability</h3>
            <p>
              Any damage to tents, structures, or accessories during the event
              will be chargeable. DemoTents is not liable for loss or damage to
              personal belongings at the venue.
            </p>
          </div>

          <div className="terms-card">
            <h3>7. Weather & Force Majeure</h3>
            <p>
              We are not responsible for service delays or disruptions caused by
              weather conditions, natural disasters, or other unforeseen events
              beyond our control.
            </p>
          </div>

          <div className="terms-card">
            <h3>8. Changes to Services</h3>
            <p>
              DemoTents reserves the right to modify or substitute services if
              required due to availability or safety concerns, without affecting
              service quality.
            </p>
          </div>

          <div className="terms-card">
            <h3>9. Intellectual Property</h3>
            <p>
              All content, branding, and designs associated with DemoTents by
              Punna Graphics are the intellectual property of the company and
              may not be used without permission.
            </p>
          </div>

          <div className="terms-card">
            <h3>10. Governing Law</h3>
            <p>
              These Terms & Conditions are governed by the laws of India. Any
              disputes shall be subject to the jurisdiction of local courts.
            </p>
          </div>

          <div className="terms-note">
            <p>
              DemoTents by Punna Graphics reserves the right to update these
              Terms & Conditions at any time without prior notice.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};

export default TermsConditions;
