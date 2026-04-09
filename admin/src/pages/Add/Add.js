import React, { useState, useEffect } from 'react';
import "./Add.css";
import uploadImg from "../../assets/upload_img.png";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "https://api.demotents.com" || "http://localhost:5004";
const MAX_TOTAL_SIZE_BYTES = 1024 * 1024 * 1024; // 1 GB

const Add = () => {
    const [mainImage, setMainImage] = useState(null);
    const [subImages, setSubImages] = useState([]);
    const [totalSubImagesSize, setTotalSubImagesSize] = useState(0);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [data, setData] = useState({
        name: "",
        description: "",
        category_id: "",
        sub_category_id: "",
        sku: "",
        price: "",
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

    // Recalculate total size whenever subImages changes
    useEffect(() => {
        const total = subImages.reduce((sum, file) => sum + file.size, 0);
        setTotalSubImagesSize(total);
    }, [subImages]);

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
            setData((prev) => ({ ...prev, [name]: value, sub_category_id: "" }));
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
            const newFiles = Array.from(e.target.files);
            const currentCount = subImages.length;
            const newCount = currentCount + newFiles.length;

            if (newCount > 10) {
                toast.error(`Maximum 10 sub‑images allowed. You have ${currentCount} and tried to add ${newFiles.length}.`);
                return;
            }

            // Calculate new total size
            const currentTotal = totalSubImagesSize;
            const addedSize = newFiles.reduce((sum, file) => sum + file.size, 0);
            const newTotal = currentTotal + addedSize;

            if (newTotal > MAX_TOTAL_SIZE_BYTES) {
                const currentMB = (currentTotal / (1024 * 1024)).toFixed(2);
                const addedMB = (addedSize / (1024 * 1024)).toFixed(2);
                toast.error(`Total image size would exceed 1 GB limit (current ${currentMB} MB + ${addedMB} MB). Please remove some images first.`);
                return;
            }

            setSubImages(prev => [...prev, ...newFiles]);
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

        if (!data.name || !data.description || !mainImage || !data.category_id || !data.price || data.stock_quantity === undefined) {
            toast.error('Please fill all required fields (Name, Description, Main Image, Category, Price, Stock)');
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("description", data.description);
        formData.append("price", Number(data.price));
        formData.append("stock_quantity", Number(data.stock_quantity));
        formData.append("category_id", data.category_id);
        formData.append("mainImage", mainImage);
        formData.append("size", data.size);
        formData.append("product_type", data.product_type);
        if (data.sub_category_id) formData.append("sub_category_id", data.sub_category_id);
        if (data.sku) formData.append("sku", data.sku);
        formData.append("is_featured", data.is_featured);

        if (data.product_type === "without_print") {
            const price = Number(data.without_print_price);
            if (isNaN(price)) {
                toast.error("Without Print Price must be a number");
                setLoading(false);
                return;
            }
            formData.append("without_print_price", price);
        }

        if (data.product_type === "customization") {
            const core = Number(data.core_price);
            const elite = Number(data.elite_price);
            const pro = Number(data.pro_price);

            if (isNaN(core) || isNaN(elite) || isNaN(pro)) {
                toast.error("Core, Elite, and Pro prices must be numbers");
                setLoading(false);
                return;
            }
            formData.append("core_price", core);
            formData.append("elite_price", elite);
            formData.append("pro_price", pro);
        }

        if (data.product_type === "without_print" && !data.without_print_price) {
            toast.error("Please enter Without Print Price");
            setLoading(false);
            return;
        }

        if (data.product_type === "customization" && (!data.core_price || !data.elite_price || !data.pro_price)) {
            toast.error("Please fill Core, Elite and Pro prices");
            setLoading(false);
            return;
        }

        if (data.cloth_colors) {
            const colorsArray = data.cloth_colors.split(",").map(c => c.trim());
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
                    sku: "", price: "", stock_quantity: 0, is_featured: false, size: "",
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

    // Helper to format bytes to MB with 2 decimals
    const formatSize = (bytes) => {
        return (bytes / (1024 * 1024)).toFixed(2);
    };

    const totalMB = formatSize(totalSubImagesSize);
    const limitMB = formatSize(MAX_TOTAL_SIZE_BYTES);
    const isOverLimit = totalSubImagesSize > MAX_TOTAL_SIZE_BYTES;

    return (
        <div className='add-page-wrapper'>
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="add-header">
                <h2>Add New Product</h2>
            </div>

            <form onSubmit={onSubmitHandler} className="add-form-grid">
                <div className="main-column">
                    <div className="ui-card">
                        <div className="card-header">Basic Information</div>
                        <div className="form-group">
                            <label>Product Title <span className="required">*</span></label>
                            <input
                                onChange={onChangeHandler}
                                value={data.name}
                                type="text"
                                name='name'
                                placeholder='e.g. Premium Canopy Tent'
                                className="ui-input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Description <span className="required">*</span></label>
                            <textarea
                                onChange={onChangeHandler}
                                value={data.description}
                                name="description"
                                rows="6"
                                placeholder='Describe the product features, material, etc.'
                                className="ui-input ui-textarea"
                                required
                            />
                        </div>
                    </div>

                    <div className="ui-card">
                        <div className="card-header">Media</div>

                        <div className="form-group">
                            <label>Main Product Image <span className="required">*</span></label>
                            <div className="main-image-upload-zone">
                                <label htmlFor="mainImage" className="upload-label">
                                    <img
                                        src={mainImage ? URL.createObjectURL(mainImage) : uploadImg}
                                        alt="Upload main"
                                        className={mainImage ? "preview-img" : "placeholder-img"}
                                    />
                                    {!mainImage && <span>Click to upload main image</span>}
                                </label>
                                <input onChange={handleMainImageChange} type="file" id='mainImage' hidden required accept="image/*" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Additional Images (Max 10, total ≤ 1 GB)</label>
                            <div className="sub-images-upload-zone">
                                <label htmlFor="subImages" className="sub-images-add-btn">
                                    <span className="plus-icon">+</span>
                                    <span>Add Media</span>
                                </label>
                                <input onChange={handleSubImagesChange} type="file" id='subImages' hidden multiple accept="image/*" />

                                {subImages.length > 0 && (
                                    <div className="sub-images-gallery">
                                        {subImages.map((image, index) => (
                                            <div key={index} className="gallery-item">
                                                <img src={URL.createObjectURL(image)} alt={`Sub ${index + 1}`} />
                                                <button type="button" className="remove-btn" onClick={() => removeSubImage(index)}>&times;</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="helper-text" style={{ marginTop: '8px' }}>
                                <span>{subImages.length} / 10 images</span>
                                <span style={{ marginLeft: '16px', color: isOverLimit ? 'red' : 'inherit' }}>
                                    Total size: {totalMB} MB / {limitMB} MB
                                    {isOverLimit && <strong> (exceeds limit!)</strong>}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="ui-card">
                        <div className="card-header">Pricing & Inventory</div>

                        <div className="grid-2-col">
                            <div className="form-group">
                                <label>SKU (Stock Keeping Unit)</label>
                                <div className="sku-input-group">
                                    <input
                                        onChange={onChangeHandler} value={data.sku}
                                        type="text" name='sku' placeholder='Auto-generate or enter custom'
                                        className="ui-input"
                                    />
                                    <button type="button" className="ui-btn-secondary" onClick={generateSku}>Generate</button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Product Type <span className="required">*</span></label>
                                <select name="product_type" value={data.product_type} onChange={onChangeHandler} className="ui-input" required>
                                    <option value="">Select Type</option>
                                    <option value="without_print">Without Print</option>
                                    <option value="customization">With Customization</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Base Price <span className="required">*</span></label>
                            <div className="input-prefix">
                                <span>$</span>
                                <input
                                    type="number"
                                    name="price"
                                    value={data.price}
                                    onChange={onChangeHandler}
                                    className="ui-input"
                                    required
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Stock Quantity <span className="required">*</span></label>
                            <input
                                type="number"
                                name="stock_quantity"
                                value={data.stock_quantity}
                                onChange={onChangeHandler}
                                className="ui-input"
                                required
                                placeholder="0"
                                min="0"
                            />
                        </div>

                        {data.product_type === "without_print" && (
                            <div className="form-group price-box">
                                <label>Without Print Price</label>
                                <div className="input-prefix">
                                    <span>$</span>
                                    <input type="text" name="without_print_price" value={data.without_print_price} onChange={onChangeHandler} className="ui-input" placeholder="0.00" />
                                </div>
                            </div>
                        )}

                        {data.product_type === "customization" && (
                            <div className="grid-3-col price-box">
                                <div className="form-group">
                                    <label>Core Price</label>
                                    <div className="input-prefix">
                                        <span>$</span>
                                        <input type="text" name="core_price" value={data.core_price} onChange={onChangeHandler} className="ui-input" placeholder="0.00" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Elite Price</label>
                                    <div className="input-prefix">
                                        <span>$</span>
                                        <input type="text" name="elite_price" value={data.elite_price} onChange={onChangeHandler} className="ui-input" placeholder="0.00" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Pro Price</label>
                                    <div className="input-prefix">
                                        <span>$</span>
                                        <input type="text" name="pro_price" value={data.pro_price} onChange={onChangeHandler} className="ui-input" placeholder="0.00" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="sidebar-column">
                    <div className="ui-card">
                        <div className="card-header">Product Status</div>
                        <label className="ui-checkbox-label">
                            <input
                                type="checkbox"
                                name="is_featured"
                                checked={data.is_featured}
                                onChange={onChangeHandler}
                                className="ui-checkbox"
                            />
                            <div className="checkbox-text">
                                <strong>Featured Product</strong>
                                <span>Show this product on the homepage featured section.</span>
                            </div>
                        </label>
                    </div>

                    <div className="ui-card">
                        <div className="card-header">Product Organization</div>
                        <div className="form-group">
                            <label>Category <span className="required">*</span></label>
                            <select name="category_id" value={data.category_id} onChange={onChangeHandler} className="ui-input" required>
                                <option value="">Select Category</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Sub-Category</label>
                            <select name="sub_category_id" value={data.sub_category_id} onChange={onChangeHandler} disabled={!data.category_id} className="ui-input">
                                <option value="">Select Sub-Category</option>
                                {subCategories.map(subCategory => (
                                    <option key={subCategory.id} value={subCategory.id}>{subCategory.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="ui-card">
                        <div className="card-header">Variants & Options</div>
                        <div className="form-group">
                            <label>Size <span className="required">*</span></label>
                            <input
                                type="text"
                                name="size"
                                value={data.size}
                                onChange={onChangeHandler}
                                placeholder="Enter size (e.g. 10x10, 12x12, Custom)"
                                className="ui-input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Cloth Colors</label>
                            <input
                                type="text"
                                name="cloth_colors"
                                value={data.cloth_colors}
                                onChange={onChangeHandler}
                                placeholder="Red, Blue, Green (comma separated)"
                                className="ui-input"
                            />
                        </div>
                    </div>

                    <button type='submit' className='ui-btn-primary' disabled={loading || isOverLimit}>
                        {loading ? 'Saving...' : 'Save Product'}
                    </button>
                    {isOverLimit && <p className="error-text" style={{color: 'red', marginTop: '8px'}}>Please remove some images – total size exceeds 1 GB.</p>}
                </div>
            </form>
        </div>
    );
};

export default Add;