import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import uploadImg from "../../assets/upload_img.png";
import "./Add.css";

const API_URL = "https://demotents-dhia.onrender.com" || "http://localhost:5004";

const Add = () => {
    const [mainImage, setMainImage] = useState(null);
    const [subImages, setSubImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    
    const [data, setData] = useState({
        name: "",
        description: "",
        category_id: "",
        sub_category_id: "",
        sku: "",
        stock_quantity: 0,
        is_featured: false,
        size: "",
        product_type: "",
        without_print_price: "",
        core_price: "",
        elite_price: "",
        pro_price: "",
        cloth_colors: ""
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (data.category_id) {
            fetchSubCategories(data.category_id);
        } else {
            setSubCategories([]);
        }
    }, [data.category_id]);

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_URL}/api/categories`);
            const result = await response.json();
            if (result.success) {
                setCategories(result.categories);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        }
    };

    const fetchSubCategories = async (categoryId) => {
        try {
            const response = await fetch(`${API_URL}/api/categories/${categoryId}/sub-categories`);
            const result = await response.json();
            if (result.success) {
                setSubCategories(result.sub_categories);
            }
        } catch (error) {
            console.error('Error fetching sub-categories:', error);
            toast.error('Failed to load sub-categories');
        }
    };

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;

        if (name === "category_id") {
            setData((prev) => ({
                ...prev,
                [name]: value,
                sub_category_id: "",
            }));
        } else if (name === "product_type") {
            setData((prev) => ({
                ...prev,
                product_type: value,
                without_print_price: "",
                core_price: "",
                elite_price: "",
                pro_price: "",
            }));
        } else {
            setData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleMainImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setMainImage(e.target.files[0]);
        }
    };

    const handleSubImagesChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            
            if (subImages.length + filesArray.length > 10) {
                toast.error('Maximum 10 sub-images allowed');
                return;
            }

            const oversizedFiles = filesArray.filter(file => file.size > 5 * 1024 * 1024);
            if (oversizedFiles.length > 0) {
                toast.error('Some files exceed 5MB limit');
                return;
            }

            setSubImages(prev => [...prev, ...filesArray]);
        }
    };

    const removeSubImage = (index) => {
        setSubImages(prev => prev.filter((_, i) => i !== index));
    };

    const generateSku = () => {
        const skuPrefix = 'PROD-' + Date.now().toString().slice(-6);
        setData(prev => ({ ...prev, sku: skuPrefix }));
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        setLoading(true);

        if (!data.name || !data.description || !mainImage || !data.category_id || !data.size || !data.product_type) {
            toast.error('Please fill all required fields');
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("description", data.description);
        formData.append("category_id", data.category_id);
        formData.append("mainImage", mainImage);
        formData.append("size", data.size);
        formData.append("product_type", data.product_type);
        
        if (data.sub_category_id) formData.append("sub_category_id", data.sub_category_id);
        if (data.sku) formData.append("sku", data.sku);
        
        formData.append("stock_quantity", data.stock_quantity);
        formData.append("is_featured", data.is_featured);

        if (data.product_type === "without_print") {
            const price = Number(data.without_print_price);
            if (isNaN(price) || !data.without_print_price) {
                toast.error("Valid Without Print Price is required");
                setLoading(false);
                return;
            }
            formData.append("without_print_price", price);
        }

        if (data.product_type === "customization") {
            const core = Number(data.core_price);
            const elite = Number(data.elite_price);
            const pro = Number(data.pro_price);

            if (isNaN(core) || isNaN(elite) || isNaN(pro) || !data.core_price || !data.elite_price || !data.pro_price) {
                toast.error("Core, Elite, and Pro prices must be valid numbers");
                setLoading(false);
                return;
            }

            formData.append("core_price", core);
            formData.append("elite_price", elite);
            formData.append("pro_price", pro);
        }

        if (data.cloth_colors) {
            const colorsArray = data.cloth_colors.split(",").map(c => c.trim()).filter(c => c);
            formData.append("cloth_colors", JSON.stringify(colorsArray));
        }
        
        subImages.forEach((image) => {
            formData.append("subImages", image);
        });

        try {
            const response = await fetch(`${API_URL}/api/products`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                toast.success('Product added successfully!');
                setData({
                    name: "", description: "", category_id: "", sub_category_id: "",
                    sku: "", stock_quantity: 0, is_featured: false, size: "",
                    product_type: "", without_print_price: "", core_price: "",
                    elite_price: "", pro_price: "", cloth_colors: ""
                });
                setMainImage(null);
                setSubImages([]);
                setSubCategories([]);
            } else {
                toast.error(result.message || 'Error adding product');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-add-container">
            <ToastContainer position="top-right" autoClose={3000} />
            
            <div className="admin-header">
                <h2>Create New Product</h2>
                <p>Fill in the details below to add a new product to your catalog.</p>
            </div>

            <form className="admin-form-layout" onSubmit={onSubmitHandler}>
                
                {/* LEFT COLUMN */}
                <div className="form-column main-column">
                    
                    {/* Basic Info Card */}
                    <div className="form-card">
                        <h3 className="card-title">Basic Information</h3>
                        <div className="form-group">
                            <label>Product Name <span className="required">*</span></label>
                            <input
                                onChange={onChangeHandler}
                                value={data.name}
                                type="text"
                                name="name"
                                placeholder="e.g., Premium Outdoor Tent"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Description <span className="required">*</span></label>
                            <textarea
                                onChange={onChangeHandler}
                                value={data.description}
                                name="description"
                                rows="5"
                                placeholder="Describe the product features, material, and benefits..."
                                required
                            ></textarea>
                        </div>
                    </div>

                    {/* Media Card */}
                    <div className="form-card">
                        <h3 className="card-title">Media</h3>
                        
                        <div className="media-section">
                            <label className="media-label">Main Product Image <span className="required">*</span></label>
                            <div className="main-image-upload-zone">
                                <input
                                    onChange={handleMainImageChange}
                                    type="file"
                                    id="mainImage"
                                    hidden
                                    required
                                    accept="image/*"
                                />
                                <label htmlFor="mainImage" className="main-image-label">
                                    {mainImage ? (
                                        <div className="image-preview-wrapper">
                                            <img src={URL.createObjectURL(mainImage)} alt="Main preview" />
                                            <div className="image-overlay">Change Image</div>
                                        </div>
                                    ) : (
                                        <div className="upload-placeholder">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                            <span>Click or drag to upload main image</span>
                                            <small>PNG, JPG, WEBP up to 5MB</small>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div className="media-section">
                            <div className="flex-between">
                                <label className="media-label">Additional Images</label>
                                <span className="image-counter">{subImages.length} / 10 limit</span>
                            </div>
                            
                            <div className="sub-images-grid">
                                <input
                                    onChange={handleSubImagesChange}
                                    type="file"
                                    id="subImages"
                                    hidden
                                    multiple
                                    accept="image/*"
                                />
                                <label htmlFor="subImages" className="add-sub-image-btn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    <span>Add More</span>
                                </label>

                                {subImages.map((image, index) => (
                                    <div key={index} className="sub-image-card">
                                        <img src={URL.createObjectURL(image)} alt={`Sub ${index + 1}`} />
                                        <button 
                                            type="button"
                                            className="delete-img-btn"
                                            onClick={() => removeSubImage(index)}
                                            title="Remove image"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Attributes & Pricing Card */}
                    <div className="form-card">
                        <h3 className="card-title">Attributes & Pricing</h3>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Size <span className="required">*</span></label>
                                <select name="size" value={data.size} onChange={onChangeHandler} required>
                                    <option value="" disabled>Select Size</option>
                                    <option value="4x4">4x4</option>
                                    <option value="6x6">6x6</option>
                                    <option value="10x10">10x10</option>
                                    <option value="10x20">10x20</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Product Type <span className="required">*</span></label>
                                <select name="product_type" value={data.product_type} onChange={onChangeHandler} required>
                                    <option value="" disabled>Select Type</option>
                                    <option value="without_print">Without Print</option>
                                    <option value="customization">With Customization</option>
                                </select>
                            </div>
                        </div>

                        {data.product_type === "without_print" && (
                            <div className="pricing-box">
                                <h4>Simple Pricing</h4>
                                <div className="form-group">
                                    <label>Price (Without Print) <span className="required">*</span></label>
                                    <div className="input-with-icon">
                                        <span className="currency-icon">$</span>
                                        <input
                                            type="number"
                                            name="without_print_price"
                                            value={data.without_print_price}
                                            onChange={onChangeHandler}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {data.product_type === "customization" && (
                            <div className="pricing-box tiered-pricing">
                                <h4>Tiered Customization Pricing</h4>
                                <div className="form-row three-cols">
                                    <div className="form-group">
                                        <label>Core Price <span className="required">*</span></label>
                                        <div className="input-with-icon">
                                            <span className="currency-icon">$</span>
                                            <input type="number" name="core_price" value={data.core_price} onChange={onChangeHandler} placeholder="0.00" required />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Elite Price <span className="required">*</span></label>
                                        <div className="input-with-icon">
                                            <span className="currency-icon">$</span>
                                            <input type="number" name="elite_price" value={data.elite_price} onChange={onChangeHandler} placeholder="0.00" required />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Pro Price <span className="required">*</span></label>
                                        <div className="input-with-icon">
                                            <span className="currency-icon">$</span>
                                            <input type="number" name="pro_price" value={data.pro_price} onChange={onChangeHandler} placeholder="0.00" required />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="form-column side-column">
                    
                    {/* Organization Card */}
                    <div className="form-card">
                        <h3 className="card-title">Organization</h3>
                        <div className="form-group">
                            <label>Category <span className="required">*</span></label>
                            <select name="category_id" value={data.category_id} onChange={onChangeHandler} required>
                                <option value="" disabled>Select Category</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Sub-Category</label>
                            <select name="sub_category_id" value={data.sub_category_id} onChange={onChangeHandler} disabled={!data.category_id}>
                                <option value="">Select Sub-Category (Optional)</option>
                                {subCategories.map(subCategory => (
                                    <option key={subCategory.id} value={subCategory.id}>{subCategory.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Inventory & Meta Card */}
                    <div className="form-card">
                        <h3 className="card-title">Inventory & Variants</h3>
                        
                        <div className="form-group">
                            <label>SKU (Stock Keeping Unit)</label>
                            <div className="sku-input-group">
                                <input
                                    onChange={onChangeHandler}
                                    value={data.sku}
                                    type="text"
                                    name="sku"
                                    placeholder="e.g. TENT-BLK-01"
                                />
                                <button type="button" className="generate-btn" onClick={generateSku}>Generate</button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Stock Quantity</label>
                            <input
                                onChange={onChangeHandler}
                                value={data.stock_quantity}
                                type="number"
                                name="stock_quantity"
                                placeholder="0"
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>Cloth Colors</label>
                            <input
                                type="text"
                                name="cloth_colors"
                                value={data.cloth_colors}
                                onChange={onChangeHandler}
                                placeholder="Red, Blue, Green"
                            />
                            {data.cloth_colors && (
                                <div className="color-tags">
                                    {data.cloth_colors.split(',').map((color, i) => {
                                        const trimmed = color.trim();
                                        if(!trimmed) return null;
                                        return <span key={i} className="color-tag">{trimmed}</span>;
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="divider"></div>

                        <div className="form-group toggle-group">
                            <div className="toggle-text">
                                <label>Featured Product</label>
                                <span>Show this product on the homepage</span>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    name="is_featured"
                                    checked={data.is_featured}
                                    onChange={onChangeHandler}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>

                    <button type="submit" className="submit-product-btn" disabled={loading}>
                        {loading ? (
                            <>
                                <svg className="spinner" viewBox="0 0 50 50"><circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle></svg>
                                Publishing...
                            </>
                        ) : (
                            'Publish Product'
                        )}
                    </button>

                </div>
            </form>
        </div>
    );
};

export default Add;