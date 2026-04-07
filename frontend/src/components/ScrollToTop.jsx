import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { FaArrowUp } from "react-icons/fa6";
import "./ScrollToTop.css";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const [showArrow, setShowArrow] = useState(false);

  // ✅ Scroll to top on route change (FIXED)
  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
  }, [pathname]);

  // ✅ Show / hide arrow on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowArrow(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ Smooth scroll when clicking arrow
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {showArrow && (
        <div className="scroll-top-arrow" onClick={scrollToTop}>
          <FaArrowUp />
        </div>
      )}
    </>
  );
};

export default ScrollToTop;