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
