import React, { useEffect } from "react";


import "./BookingPolicy.css";

const BookingPolicy = () => {
   // Set document title for the Home page
    useEffect(() => {
      document.title = "Booking Policy | Demotents";
    }, []);
  return (
    <div className="booking-policy-page">

      {/* HEADER */}
      <section className="booking-header">
        <div className="container text-center">
          <h1>Booking Policy</h1>
          <p>
            Please read our booking terms carefully before confirming your
            tent rental with <strong>DemoTents by Punna Graphics</strong>.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="booking-content">
        <div className="container">

          <div className="policy-card">
            <h3>1. Booking Confirmation</h3>
            <p>
              All bookings are confirmed only after receiving an advance
              payment. Verbal or written communication without payment does not
              guarantee reservation.
            </p>
          </div>

          <div className="policy-card">
            <h3>2. Advance Payment</h3>
            <p>
              A minimum advance payment is required to block the booking date.
              The remaining balance must be cleared before or on the event day.
            </p>
          </div>

          <div className="policy-card">
            <h3>3. Cancellation Policy</h3>
            <p>
              In case of cancellation, the advance amount is non-refundable.
              Cancellations made close to the event date may incur additional
              charges.
            </p>
          </div>

          <div className="policy-card">
            <h3>4. Date Changes</h3>
            <p>
              Date changes are subject to availability. Any changes must be
              informed at least 3 days prior to the scheduled event date.
            </p>
          </div>

          <div className="policy-card">
            <h3>5. Setup & Dismantling</h3>
            <p>
              Tent setup and dismantling will be handled by our professional
              team. Clients must provide sufficient space and access at the
              venue.
            </p>
          </div>

          <div className="policy-card">
            <h3>6. Damage Responsibility</h3>
            <p>
              Any damage to tents, structures, or accessories caused during the
              event will be chargeable and must be paid by the client.
            </p>
          </div>

          <div className="policy-card">
            <h3>7. Weather Conditions</h3>
            <p>
              DemoTents is not responsible for delays or issues caused due to
              extreme weather conditions, natural calamities, or unforeseen
              circumstances.
            </p>
          </div>

          <div className="policy-card">
            <h3>8. Final Decision</h3>
            <p>
              DemoTents by Punna Graphics reserves the right to make the final
              decision regarding bookings, setup feasibility, and service
              availability.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};

export default BookingPolicy;
