import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const SubcategoryProducts = () => {
  const { subcategoryId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Attempt to fetch category info for this ID (if it exists as a category)
    const redirectToCategory = async () => {
      try {
        const res = await fetch(`https://api.demotents.com/api/categories/${subcategoryId}`);
        const data = await res.json();
        if (data.success && data.category) {
          navigate(`/category/${data.category.slug}`, { replace: true });
        } else {
          navigate("/categories", { replace: true });
        }
      } catch {
        navigate("/categories", { replace: true });
      }
    };
    redirectToCategory();
  }, [subcategoryId, navigate]);

  return <div className="global-loader"><div className="spinner"></div></div>;
};

export default SubcategoryProducts;