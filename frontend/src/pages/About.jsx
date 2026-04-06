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
            Best Demo Tent Manufacturers in <span>Hyderabad</span>
          </h1>
         <p className="hero-description">
  With over 15 years of experience, we are recognized as the leading demo tent manufacturers in Hyderabad, delivering high-quality tents and canopies for weddings, corporate events, roadshows, and promotional campaigns. Our products are designed to combine durability, style, and easy setup for any occasion.

  From gazebo tents and marketing tents to fully customized shamiyana setups, we ensure every solution meets the highest standards of safety, weather resistance, and brand visibility. Our in-house stitching and customization team crafts tents in various sizes, colors, and branding options to suit your unique requirements.

  Trusted by event organizers, businesses, and marketing agencies across Hyderabad and Telangana, we also handle bulk orders efficiently without compromising quality. Whether you are planning a corporate launch, wedding celebration, or public promotion, our professional tent solutions ensure your event stands out seamlessly.
</p>
<p>We provide professionally crafted wedding and shamiyana tents that combine safety, durability, and elegant presentation, perfect for memorable events and celebrations.</p>
        </div>
      </section>

      {/* ================= INTRO ================= */}
      <section id="who-we-are" className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-9 text-center">
              <h2 className="section-title mb-3">Why Choose Us?</h2>
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
              <p>Trusted demo tent manufacturers in Dilsukhnagar
High-quality gazebo tents & canopys
Reliable demotents for promotions
Custom branding & printing options
Expert canopy stiching
Affordable prices for bulk orders
One-stop solution including roll up standees
Contact the Best Demo Tent Manufacturers in Hyderabad

If you are searching for the best demo tent manufacturers in Hyderabad or a reliable canopy tent supplier, we are your perfect partner. Contact us today for customized demo tents, gazebo tents, and complete promotional solutions.</p>
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
              "Elegant & Durable Event Tents",
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
