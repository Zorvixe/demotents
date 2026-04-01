import React, { useState, useEffect } from 'react'
import "./Add.css"
import uploadImg from "../../assets/upload_img.png";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Add = () => {
    const [mainImage, setMainImage] = useState(null);
    const [subImages, setSubImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [data, setData] = useState({
        name: "",
        description: "",
        price: "",
        category_id: "",
        sub_category_id: "",
        sku: "",
        stock_quantity: 0,
        is_featured: false
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
            const response = await fetch('http://localhost:5004/api/categories');
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
            const response = await fetch(`http://localhost:5004/api/categories/${categoryId}/sub-categories`);
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
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        
        if (name === 'category_id') {
            setData(prev => ({ 
                ...prev, 
                [name]: value,
                sub_category_id: "" // Reset sub-category when category changes
            }));
        } else {
            setData(prev => ({ ...prev, [name]: value }));
        }
    }

    const handleMainImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setMainImage(e.target.files[0]);
        }
    }

    const handleSubImagesChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            
            // Check total number of images
            if (subImages.length + filesArray.length > 10) {
                toast.error('Maximum 10 sub-images allowed');
                return;
            }

            // Check file sizes
            const oversizedFiles = filesArray.filter(file => file.size > 5 * 1024 * 1024);
            if (oversizedFiles.length > 0) {
                toast.error('Some files exceed 5MB limit');
                return;
            }

            setSubImages(prev => [...prev, ...filesArray]);
        }
    }

    const removeSubImage = (index) => {
        setSubImages(prev => prev.filter((_, i) => i !== index));
    }

    const generateSku = () => {
        const skuPrefix = 'PROD-' + Date.now().toString().slice(-6);
        setData(prev => ({ ...prev, sku: skuPrefix }));
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        setLoading(true);

        // Validate inputs
        if (!data.name || !data.description || !data.price || !mainImage || !data.category_id) {
            toast.error('Please fill all required fields');
            setLoading(false);
            return;
        }

        if (parseFloat(data.price) <= 0) {
            toast.error('Price must be greater than 0');
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("description", data.description);
        formData.append("price", Number(data.price));
        formData.append("category_id", data.category_id);
        formData.append("mainImage", mainImage);
        
        if (data.sub_category_id) {
            formData.append("sub_category_id", data.sub_category_id);
        }
        
        if (data.sku) {
            formData.append("sku", data.sku);
        }
        
        formData.append("stock_quantity", data.stock_quantity);
        formData.append("is_featured", data.is_featured);
        
        // Append sub-images
        subImages.forEach((image) => {
            formData.append("subImages", image);
        });

        try {
            const response = await fetch('http://localhost:5004/api/products', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                toast.success('Product added successfully!');
                // Reset form
                setData({
                    name: "",
                    description: "",
                    price: "",
                    category_id: "",
                    sub_category_id: "",
                    sku: "",
                    stock_quantity: 0,
                    is_featured: false
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
    }

    return (
        <div className='add'>
            <ToastContainer position="top-right" autoClose={3000} />
            <form className='flex-col' onSubmit={onSubmitHandler}>
                {/* Main Image Upload */}
                <div className="add-img-upload flex-col">
                    <p>Main Product Image*</p>
                    <label htmlFor="mainImage">
                        <img 
                            src={mainImage ? URL.createObjectURL(mainImage) : uploadImg} 
                            alt="Upload main image" 
                        />
                    </label>
                    <input
                        onChange={handleMainImageChange}
                        type="file"
                        id='mainImage'
                        hidden
                        required
                        accept="image/*"
                    />
                    {mainImage && (
                        <p className="file-name">{mainImage.name}</p>
                    )}
                </div>

                {/* Sub Images Upload */}
                <div className="sub-images-upload flex-col">
                    <p>Additional Images (Optional - Max 10)</p>
                    <div className="sub-images-container">
                        <label htmlFor="subImages" className="sub-images-upload-btn">
                            <span>+ Add Images</span>
                        </label>
                        <input
                            onChange={handleSubImagesChange}
                            type="file"
                            id='subImages'
                            hidden
                            multiple
                            accept="image/*"
                        />
                        
                        {subImages.length > 0 && (
                            <div className="sub-images-preview">
                                {subImages.map((image, index) => (
                                    <div key={index} className="sub-image-item">
                                        <img 
                                            src={URL.createObjectURL(image)} 
                                            alt={`Sub ${index + 1}`}
                                        />
                                        <button 
                                            type="button"
                                            className="remove-sub-image"
                                            onClick={() => removeSubImage(index)}
                                        >
                                            ×
                                        </button>
                                        <span className="sub-image-name">
                                            {image.name.length > 15 
                                                ? `${image.name.substring(0, 12)}...` 
                                                : image.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <p className="image-count">
                        {subImages.length} / 10 images selected
                    </p>
                </div>

                {/* Product Name */}
                <div className="add-product-name flex-col">
                    <p>Product name*</p>
                    <input
                        onChange={onChangeHandler}
                        value={data.name}
                        type="text"
                        name='name'
                        placeholder='Type here'
                        required
                    />
                </div>

                {/* Product Description */}
                <div className="add-product-description flex-col">
                    <p>Product description*</p>
                    <textarea
                        onChange={onChangeHandler}
                        value={data.description}
                        name="description"
                        rows="6"
                        placeholder='Write content here'
                        required
                    ></textarea>
                </div>

                {/* Category and Sub-Category */}
                <div className="add-category-price">
                    <div className="add-category flex-col">
                        <p>Product Category*</p>
                        <select
                            name="category_id"
                            value={data.category_id}
                            onChange={onChangeHandler}
                            required
                        >
                            <option value="">Select Category</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="add-category flex-col">
                        <p>Product Sub-Category (Optional)</p>
                        <select
                            name="sub_category_id"
                            value={data.sub_category_id}
                            onChange={onChangeHandler}
                            disabled={!data.category_id}
                        >
                            <option value="">Select Sub-Category</option>
                            {subCategories.map(subCategory => (
                                <option key={subCategory.id} value={subCategory.id}>
                                    {subCategory.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Price and Stock */}
                <div className="add-category-price">
                    <div className="add-price flex-col">
                        <p>Product Price*</p>
                        <input
                            onChange={onChangeHandler}
                            value={data.price}
                            type="number"
                            name='price'
                            placeholder='$20'
                            min="0.01"
                            step="0.01"
                            required
                        />
                    </div>
                    
                    <div className="add-price flex-col">
                        <p>Stock Quantity</p>
                        <input
                            onChange={onChangeHandler}
                            value={data.stock_quantity}
                            type="number"
                            name='stock_quantity'
                            placeholder='0'
                            min="0"
                            step="1"
                        />
                    </div>
                </div>

                {/* SKU and Featured */}
                <div className="add-category-price">
                    <div className="add-price flex-col">
                        <p>SKU (Stock Keeping Unit)</p>
                        <div className="sku-container">
                            <input
                                onChange={onChangeHandler}
                                value={data.sku}
                                type="text"
                                name='sku'
                                placeholder='Auto-generate or enter custom SKU'
                            />
                            <button 
                                type="button" 
                                className="generate-sku-btn"
                                onClick={generateSku}
                            >
                                Generate SKU
                            </button>
                        </div>
                    </div>
                    
                    <div className="add-category flex-col">
                        <p>Featured Product</p>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="is_featured"
                                checked={data.is_featured}
                                onChange={onChangeHandler}
                            />
                            <span>Mark as featured product</span>
                        </label>
                    </div>
                </div>

                <button
                    type='submit'
                    className='add-btn'
                    disabled={loading}
                >
                    {loading ? 'Adding...' : 'ADD PRODUCT'}
                </button>
            </form>
        </div>
    )
}

export default Add;