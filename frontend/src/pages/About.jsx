import React from "react";
import "./About.css";

const About = () => {
  return (
    <div className="about-wrapper">
      
      {/* ================= HERO SECTION ================= */}
      <section className="about-hero">
        <div className="hero-background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
        </div>
        
        <div className="container hero-content">
          <span className="modern-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            Trusted Event Infrastructure Experts
          </span>

          <h1 className="hero-headline">
            Best Demo Tent Manufacturers<br /> in <span className="text-gradient">Hyderabad</span>
          </h1>
          
          <p className="hero-subtext">
            Delivering high-quality tents, canopies, and event infrastructures for weddings, corporate events, roadshows, and promotional campaigns across Telangana for over 15 years.
          </p>
        </div>
      </section>

      {/* ================= OVERLAPPING STATS ================= */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <h2 className="stat-number">15+</h2>
              <p className="stat-label">Years of Experience</p>
            </div>
            <div className="stat-card">
              <h2 className="stat-number">500+</h2>
              <p className="stat-label">Events Delivered</p>
            </div>
            <div className="stat-card">
              <h2 className="stat-number">100%</h2>
              <p className="stat-label">Client Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= THE STORY (SEO TEXT) ================= */}
      <section id="who-we-are" className="story-section">
        <div className="container">
          <div className="story-grid">
            <div className="story-text-content">
              <h4 className="section-subtitle">Who We Are</h4>
              <h2 className="section-title">DemoTents by Punna Graphics</h2>
              <p className="story-paragraph">
                With over 15 years of experience, we are recognized as the leading demo tent manufacturers in Hyderabad. Our products are designed to combine durability, style, and easy setup for any occasion.
              </p>
              <p className="story-paragraph">
                From gazebo tents and marketing tents to fully customized shamiyana setups, we ensure every solution meets the highest standards of safety, weather resistance, and brand visibility. Our in-house stitching and customization team crafts tents in various sizes, colors, and branding options to suit your unique requirements.
              </p>
              <p className="story-paragraph">
                Trusted by event organizers, businesses, and marketing agencies across Hyderabad and Telangana, we also handle bulk orders efficiently without compromising quality. Whether you are planning a corporate launch, wedding celebration, or public promotion, our professional tent solutions ensure your event stands out seamlessly.
              </p>
            </div>

            <div className="story-features">
              <div className="feature-box primary-feature">
                <h3>Why Choose Us?</h3>
                <p>We are a professionally managed tent rental and event infrastructure company delivering reliable, high-quality solutions for events of all sizes.</p>
                
                <ul className="custom-checklist">
                  <li>Trusted demo tent manufacturers in Dilsukhnagar</li>
                  <li>High-quality gazebo tents & canopies</li>
                  <li>Reliable demotents for promotions</li>
                  <li>Custom branding & printing options</li>
                  <li>Expert canopy stitching & bulk order handling</li>
                  <li>One-stop solution including roll-up standees</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= BENTO GRID SERVICES ================= */}
      <section className="services-bento-section">
        <div className="container">
          <div className="text-center mb-5">
            <h4 className="section-subtitle">What We Offer</h4>
            <h2 className="section-title">Premium Event Solutions</h2>
          </div>

          <div className="bento-grid">
            {[
              { title: "Elegant & Durable Event Tents", desc: "Perfect for weddings and large gatherings, ensuring presentation standards.", span: "col-span-2" },
              { title: "Outdoor Canopies", desc: "High-visibility promotional setups.", span: "col-span-1" },
              { title: "Waterproof Shelters", desc: "100% rain-proof protection.", span: "col-span-1" },
              { title: "Custom Shamiyanas", desc: "Professionally crafted wedding and shamiyana tents combining safety, durability, and elegant presentation.", span: "col-span-2" },
              { title: "Pro Installation", desc: "Flawless execution & setup.", span: "col-span-1" },
              { title: "On-Time Support", desc: "Dependable event assistance.", span: "col-span-1" }
            ].map((item, index) => (
              <div key={index} className={`bento-card ${item.span}`}>
                <div className="bento-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffb703" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 22h20L12 2z"></path></svg>
                </div>
                <h5>{item.title}</h5>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= VALUES SECTION ================= */}
      <section className="values-section">
        <div className="container">
          <div className="text-center mb-5">
            <h4 className="section-subtitle text-white-50">Our Core Pillars</h4>
            <h2 className="section-title text-white">The DemoTents Commitment</h2>
          </div>

          <div className="values-grid">
            <div className="value-card-modern">
              <div className="value-icon">💎</div>
              <h3>Quality</h3>
              <p>Premium, weather-resistant materials ensuring absolute safety and long-lasting durability.</p>
            </div>

            <div className="value-card-modern">
              <div className="value-icon">⚡</div>
              <h3>Efficiency</h3>
              <p>Timely setup with professional coordination and flawless, hassle-free execution.</p>
            </div>

            <div className="value-card-modern">
              <div className="value-icon">🤝</div>
              <h3>Trust</h3>
              <p>Transparent pricing, clear communication, and dependable service you can count on.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CTA / FOOTER ================= */}
      <section className="cta-section">
        <div className="container text-center">
          <h2>Partner with the Best in Hyderabad</h2>
          <p>If you are searching for a reliable canopy tent supplier, we are your perfect partner. Contact us today for customized demo tents and complete promotional solutions.</p>
          <div className="cta-buttons">
            <button className="btn-primary-modern">Get a Quote Today</button>
            <button className="btn-outline-modern">Explore Products</button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;