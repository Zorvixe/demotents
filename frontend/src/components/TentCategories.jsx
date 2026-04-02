import React, { useEffect, useState } from "react";
import "./TentCategories.css";
import { useNavigate } from "react-router-dom";

const BASE_URL = "https://demotents-dhia.onrender.com";

const TentCategories = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/categories`
        );

        const data = await res.json();

        if (data.success) {

          // 🔥 filter only tent categories (edit logic if needed)
          const tentCats = data.categories.filter(cat =>
            cat.name.toLowerCase().includes("tent")
          );

          setCategories(tentCats.slice(0, 4)); // limit grid
        }
      } catch (err) {
        console.error("Category fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="tent-section py-5 text-center">
        Loading tent categories...
      </section>
    );
  }

  return (
    <section
      className="tent-section"
      id="tent-categories"
      data-aos="fade-up"
      data-aos-duration="1200"
      data-aos-once="true"
    >
      <h2 className="section-title">
        Tent Categories
      </h2>

      <div className="tent-layout">

        {/* LEFT LIST */}
        <div
          className="tent-left-box"
          data-aos="fade-right"
          data-aos-duration="1200"
        >
          <ul className="tent-left-list">
            {categories.map(cat => (
              <li
                key={cat.id}
                onClick={() =>
                  navigate(`/category/${cat.id}`)
                }
              >
                {cat.name}
              </li>
            ))}
          </ul>

          <button
            className="view-btn"
            onClick={() => navigate("/categories")}
          >
            View All
          </button>
        </div>

        {/* RIGHT GRID */}
        <div className="tent-right-grid">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="tent-card"
            >
              <img
                src={
                  cat.preview_image
                    ? `${BASE_URL}${cat.preview_image}`
                    : "/placeholder.jpg"
                }
                alt={cat.name}
              />

              <div className="tent-details">

                <div
                  onClick={() =>
                    navigate(`/category/${cat.id}`)
                  }
                >
                  <h3>{cat.name}</h3>
                </div>

                {/* optional placeholder descriptions */}
                <p>Premium Quality</p>
                <p>Heavy Duty Build</p>
                <p>Outdoor Ready</p>

              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default TentCategories;
