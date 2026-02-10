import "./Contact.css";

const Contact = () => {
  return (
    <div className="contact-page">

      {/* HEADER */}
      <section className="contact-header text-center">
        <div className="container">
          <h1>Contact Us</h1>
          <p>
            Have an event in mind? Reach out to us and let’s make it happen.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="contact-main py-5">
        <div className="container">
          <div className="row g-5 align-items-stretch">

            {/* LEFT INFO PANEL */}
            <div className="col-lg-4">
              <div className="contact-info-panel">

                <div className="info-item">
                  <div className="icon">
                    <i className="bi bi-geo-alt"></i>
                  </div>
                  <div>
                    <h5>Our Location</h5>
                    <p>Dilsukhnagar, Hyderabad, Telangana</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="icon">
                    <i className="bi bi-telephone"></i>
                  </div>
                  <div>
                    <h5>Call Us</h5>
                    <p>+91 9052899000</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="icon">
                    <i className="bi bi-envelope"></i>
                  </div>
                  <div>
                    <h5>Email</h5>
                    <p>punna.graphics@email.com</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="icon">
                    <i className="bi bi-clock"></i>
                  </div>
                  <div>
                    <h5>Working Hours</h5>
                    <p>
                      Mon – Fri: 9:00 – 18:00<br />
                      Sat – Sun: Closed
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT FORM PANEL */}
            <div className="col-lg-8">
              <div className="contact-form-box">
                <h3 className="mb-4">Send Us a Message</h3>

                <form>
                  <div className="row g-4">
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Your Name*"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Email Address*"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="Phone Number*"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <select className="form-select" required>
                        <option value="">Select Service*</option>
                        <option>Wedding Tents</option>
                        <option>Canopy Tents</option>
                        <option>Waterproof Tents</option>
                        <option>Camping Tents</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <textarea
                        className="form-control"
                        rows="5"
                        placeholder="Write your message*"
                        required
                      ></textarea>
                    </div>

                    <div className="col-12 text-end">
                      <button type="submit" className="btn contact-btn">
                        Submit Message <i className="bi bi-arrow-right ms-2"></i>
                      </button>
                    </div>
                  </div>
                </form>

              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default Contact;
