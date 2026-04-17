import React from "react";
import "./About.css";
import { useEffect, useState, useRef } from "react";

const About = () => {
  const [years, setYears] = useState(0);
  const [events, setEvents] = useState(0);
  const [commitment, setCommitment] = useState(0);

  const statsRef = useRef(null);
  const hasAnimated = useRef(false);   // To prevent multiple animations at once

  // Counter Animation Function
  const startCounter = () => {
    hasAnimated.current = true;

    // Reset to 0 first
    setYears(0);
    setEvents(0);
    setCommitment(0);

    // Years Counter
    let yearInterval = setInterval(() => {
      setYears(prev => {
        if (prev < 5) return prev + 1;   // Changed to 15 as per your website text
        clearInterval(yearInterval);
        return 5;
      });
    }, 150);

    // Events Counter
    let eventInterval = setInterval(() => {
      setEvents(prev => {
        if (prev < 500) return prev + 10;
        clearInterval(eventInterval);
        return 500;
      });
    }, 25);

    // Commitment Counter
    let commitmentInterval = setInterval(() => {
      setCommitment(prev => {
        if (prev < 100) return prev + 2;
        clearInterval(commitmentInterval);
        return 100;
      });
    }, 25);

    // Clear intervals after animation
    setTimeout(() => {
      clearInterval(yearInterval);
      clearInterval(eventInterval);
      clearInterval(commitmentInterval);
    }, 3000);
  };

  // Set document title for the About page
  useEffect(() => {
    document.title = "About Us | Puna Graphics";
  }, []);

  // Intersection Observer - Triggers when section is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          startCounter();
        }
      },
      {
        threshold: 0.3,        // Trigger when 30% of section is visible
        rootMargin: "-50px 0px" // Optional: trigger a bit earlier
      }
    );

    const currentRef = statsRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // Reset animation when scrolling away (so it can re-trigger when coming back)
  useEffect(() => {
    const handleScroll = () => {
      if (statsRef.current) {
        const rect = statsRef.current.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (!isVisible) {
          hasAnimated.current = false;   // Reset so it can animate again
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <div className="about-container">

      {/* ================= HERO ================= */}

      <section className="about-hero-modern">
        <div className="container text-center">
          <span className="hero-badge">
            ⭐ Trusted Event Infrastructure Experts
          </span>

          <h1 className="hero-headline">
            Best Demo Tent Manufacturers<br /> in <span className="text-gradient">Hyderabad</span>
          </h1>

          <p className="hero-subtext">
            Delivering high-quality tents, canopies, and event infrastructures for weddings, corporate events, roadshows, and promotional campaigns across Telangana for over 15 years.
          </p>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section
        ref={statsRef}
        className="bg-white py-5"
      >
        <div className="container">
          <div className="row text-center g-4">
            <div className="col-md-4">
              <div className="stat-box">
                <h3>{years}+</h3>
                <span>Years of Experience</span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-box">
                <h3>{events}+</h3>
                <span>Events Delivered</span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-box">
                <h3>{commitment}%</h3>
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
              {
                title: "Elegant & Durable Event Tents",
                desc: "High-quality tents designed for weddings, corporate events, and large gatherings with a perfect balance of strength and visual appeal."
              },
              {
                title: "Outdoor & Promotional Canopies",
                desc: "Custom-branded canopies ideal for marketing campaigns, exhibitions, and outdoor promotions to maximize visibility."
              },
              {
                title: "Waterproof & Rain-Proof Tents",
                desc: "Weather-resistant tents built to handle rain and harsh conditions, ensuring uninterrupted events in any season."
              },
              {
                title: "Camping & Temporary Shelters",
                desc: "Lightweight and durable shelter solutions suitable for camping, temporary setups, and emergency requirements."
              },
              {
                title: "Professional Installation & Support",
                desc: "Experienced team providing quick setup, dismantling, and on-site support for smooth event execution."
              },
              {
                title: "On-Time Event Assistance",
                desc: "Reliable service with strict timelines to ensure your event setup is completed efficiently without delays."
              }
            ].map((item, index) => (
              <div key={index} className="col-md-6 col-lg-4">
                <div className="offer-card h-100">
                  <h5>{item.title}</h5>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= VALUES SECTION ================= */}
      <section className="values-section">
        <div className="container">
          <div className="text-center mb-5">
            <h4 className="section-subtitle">Our Core Pillars</h4>
            <h2 className="section-title">The DemoTents Commitment</h2>
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