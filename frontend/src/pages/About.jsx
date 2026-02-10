import "./About.css";

const About = () => {
  return (
    <div className="about-container">

      {/* ================= HERO ================= */}
      <section className="about-hero-modern">
        <div className="container text-center">
          <span className="hero-badge">
            ⭐ Trusted Event Infrastructure Experts
          </span>

          <h1 className="hero-title">
            DemoTents by <span>Punna Graphics</span>
          </h1>

          <h2 className="hero-subtitle">Transforming Events</h2>

          <p className="hero-description">
            Premium tent rentals, durable canopies, and professionally managed
            event infrastructure solutions for weddings, corporate events,
            exhibitions, and outdoor programs.
          </p>

          <a href="#who-we-are" className="hero-btn">
            Discover Our Story →
          </a>
        </div>
      </section>

      {/* ================= INTRO ================= */}
      <section id="who-we-are" className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-9 text-center">
              <h2 className="section-title mb-3">Who We Are</h2>
              <p>
                <strong>DemoTents by Punna Graphics</strong> is a professionally
                managed tent rental and event infrastructure company delivering
                reliable, high-quality solutions for events of all sizes.
              </p>
              <p>
                From elegant wedding tents to durable canopies and waterproof
                coverings, we ensure precision setup and dependable service for
                every occasion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="bg-white py-5">
        <div className="container">
          <div className="row text-center g-4">
            <div className="col-md-4">
              <div className="stat-box">
                <h3>10+</h3>
                <span>Years of Experience</span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-box">
                <h3>500+</h3>
                <span>Events Delivered</span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-box">
                <h3>100%</h3>
                <span>Client Commitment</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SERVICES ================= */}
      <section className="py-5">
        <div className="container">
          <h2 className="section-title text-center mb-5">What We Offer</h2>

          <div className="row g-4">
            {[
              "Wedding & Shamiyana Tents",
              "Outdoor & Promotional Canopies",
              "Waterproof & Rain-Proof Tents",
              "Camping & Temporary Shelters",
              "Professional Installation & Support",
              "On-Time Event Assistance"
            ].map((item, index) => (
              <div key={index} className="col-md-6 col-lg-4">
                <div className="offer-card h-100">
                  <h5>{item}</h5>
                  <p>
                    Professionally managed solutions designed to meet safety,
                    durability, and presentation standards.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= VALUES ================= */}
      <section className="about-values py-5">
        <div className="container text-center">
          <h2 className="section-title text-warning mb-5">Our Commitment</h2>

          <div className="row g-4 justify-content-center">
            <div className="col-md-4">
              <div className="value-card h-100">
                <h5>Quality</h5>
                <p>
                  Premium, weather-resistant materials ensuring safety and
                  durability.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="value-card h-100">
                <h5>Efficiency</h5>
                <p>
                  Timely setup with professional coordination and flawless
                  execution.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="value-card h-100">
                <h5>Trust</h5>
                <p>
                  Transparent pricing, clear communication, and dependable
                  service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <section className="py-4">
        <div className="container text-center">
          <p className="mb-0">
            At <strong>DemoTents</strong>, we deliver confidence, comfort, and
            peace of mind for every event.
          </p>
        </div>
      </section>

    </div>
  );
};

export default About;
