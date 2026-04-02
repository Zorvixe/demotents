const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5004;

// Middleware
app.use(cors());
app.use(express.json());


// Create absolute paths
const uploadsDir = path.join(__dirname, 'uploads');

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Initialize database tables
const initDatabase = async () => {
  try {
    // Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sub_categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sub_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, category_id)
      )
    `);

    // Create products table (UPDATED - removed old category column)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        main_image_url VARCHAR(500),
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        sub_category_id INTEGER REFERENCES sub_categories(id) ON DELETE SET NULL,
        sku VARCHAR(100) UNIQUE,
        stock_quantity INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check and drop the old 'category' column if it exists
    try {
      const checkColumn = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'category'
      `);

      if (checkColumn.rows.length > 0) {
        console.log('Dropping old category column...');
        await pool.query(`ALTER TABLE products DROP COLUMN category`);
      }
    } catch (error) {
      console.log('Error checking/dropping old category column:', error.message);
    }

    // Create product_images table for sub-images
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        image_url VARCHAR(500) NOT NULL,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255),
        phone VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        items JSONB NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};


// ... (your existing code above)

// Update storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// ADD THIS SECTION HERE:
// Initialize multer middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 11 // 1 main image + 10 sub-images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Update static file serving
app.use('/uploads', express.static(uploadsDir));

// ... (your existing code continues)

// Helper function to delete files
const deleteFiles = (filePaths) => {
  filePaths.forEach(filePath => {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error deleting file:', filePath, err);
      }
    }
  });
};

// ==================== CATEGORY ROUTES ====================

// 1. Create Category
app.post('/api/categories', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if category already exists (case-insensitive)
    const existingCategory = await pool.query(
      'SELECT * FROM categories WHERE LOWER(name) = LOWER($1)',
      [name.trim()]
    );

    if (existingCategory.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }

    const result = await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [name.trim(), description]
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating category:', error);

    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating category'
    });
  }
});

// 2. Get All Categories
// 2. Get All Categories
app.get('/api/categories', async (req, res) => {
  try {
    const { includeSubCategories = 'false' } = req.query;

    let categories;

    if (includeSubCategories === 'true') {
      // Get categories with their sub-categories
      const result = await pool.query(`
        SELECT 
          c.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', sc.id,
                'name', sc.name,
                'description', sc.description,
                'is_active', sc.is_active,
                'product_count', (
                  SELECT COUNT(*) FROM products p 
                  WHERE p.sub_category_id = sc.id AND p.is_active = true
                )
              ) ORDER BY sc.name
            ) FILTER (WHERE sc.id IS NOT NULL),
            '[]'
          ) as sub_categories,
          (
            SELECT COUNT(*) FROM products p 
            WHERE p.category_id = c.id AND p.is_active = true
          ) as product_count,
          (
            SELECT p2.main_image_url
            FROM products p2
            WHERE p2.category_id = c.id
              AND p2.is_active = true
              AND p2.main_image_url IS NOT NULL
            ORDER BY p2.created_at DESC
            LIMIT 1
          ) as preview_image
        FROM categories c
        LEFT JOIN sub_categories sc ON sc.category_id = c.id AND sc.is_active = true
        WHERE c.is_active = true
        GROUP BY c.id
        ORDER BY c.name
      `);

      categories = result.rows;
    } else {
      // Get only categories with preview image
      const result = await pool.query(`
        SELECT 
          c.*,
          COUNT(p.id) as product_count,
          (
            SELECT p2.main_image_url
            FROM products p2
            WHERE p2.category_id = c.id
              AND p2.is_active = true
              AND p2.main_image_url IS NOT NULL
            ORDER BY p2.created_at DESC
            LIMIT 1
          ) as preview_image
        FROM categories c
        LEFT JOIN products p 
          ON p.category_id = c.id 
          AND p.is_active = true
        WHERE c.is_active = true
        GROUP BY c.id
        ORDER BY c.name
      `);

      categories = result.rows;
    }

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

// 3. Get Single Category
app.get('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT c.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', sc.id,
              'name', sc.name,
              'description', sc.description,
              'is_active', sc.is_active,
              'product_count', (
                SELECT COUNT(*) FROM products p 
                WHERE p.sub_category_id = sc.id AND p.is_active = true
              )
            ) ORDER BY sc.name
          ) FILTER (WHERE sc.id IS NOT NULL),
          '[]'
        ) as sub_categories
      FROM categories c
      LEFT JOIN sub_categories sc ON sc.category_id = c.id AND sc.is_active = true
      WHERE c.id = $1 AND c.is_active = true
      GROUP BY c.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category'
    });
  }
});

// 4. Update Category
app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    // Check if new name already exists (excluding current category)
    if (name !== undefined) {
      const existingCategory = await pool.query(
        'SELECT * FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2',
        [name.trim(), id]
      );

      if (existingCategory.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Category name already exists'
        });
      }
    }

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      values.push(name.trim());
      paramIndex++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }

    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      values.push(is_active);
      paramIndex++;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);
    const query = `
      UPDATE categories 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating category:', error);

    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating category'
    });
  }
});

// 5. Delete Category
app.delete('/api/categories/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Check if category exists
    const categoryResult = await client.query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );

    if (categoryResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has products
    const productCountResult = await client.query(
      'SELECT COUNT(*) FROM products WHERE category_id = $1',
      [id]
    );

    const productCount = parseInt(productCountResult.rows[0].count);

    if (productCount > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${productCount} product(s) associated.`
      });
    }

    // Delete category (cascade will delete sub-categories)
    await client.query('DELETE FROM categories WHERE id = $1', [id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category'
    });
  } finally {
    client.release();
  }
});

// ==================== SUB-CATEGORY ROUTES ====================

// 6. Create Sub-Category
app.post('/api/sub-categories', async (req, res) => {
  try {
    const { name, description, category_id } = req.body;

    if (!name || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Sub-category name and category ID are required'
      });
    }

    // Check if category exists
    const categoryResult = await pool.query(
      'SELECT * FROM categories WHERE id = $1 AND is_active = true',
      [category_id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or inactive'
      });
    }

    // Check if sub-category already exists in this category (case-insensitive)
    const existingSubCategory = await pool.query(
      'SELECT * FROM sub_categories WHERE LOWER(name) = LOWER($1) AND category_id = $2',
      [name.trim(), category_id]
    );

    if (existingSubCategory.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Sub-category name already exists in this category'
      });
    }

    const result = await pool.query(
      'INSERT INTO sub_categories (name, description, category_id) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), description, category_id]
    );

    res.status(201).json({
      success: true,
      message: 'Sub-category created successfully',
      sub_category: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating sub-category:', error);

    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Sub-category name already exists in this category'
      });
    }

    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating sub-category'
    });
  }
});

// 7. Get Sub-Categories by Category
app.get('/api/categories/:categoryId/sub-categories', async (req, res) => {
  try {
    const { categoryId } = req.params;

    const result = await pool.query(`
      SELECT sc.*, 
        COUNT(p.id) as product_count
      FROM sub_categories sc
      LEFT JOIN products p ON p.sub_category_id = sc.id AND p.is_active = true
      WHERE sc.category_id = $1 AND sc.is_active = true
      GROUP BY sc.id
      ORDER BY sc.name
    `, [categoryId]);

    res.json({
      success: true,
      sub_categories: result.rows
    });
  } catch (error) {
    console.error('Error fetching sub-categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sub-categories'
    });
  }
});

// 8. Get All Sub-Categories
app.get('/api/sub-categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sc.*, 
        c.name as category_name,
        COUNT(p.id) as product_count
      FROM sub_categories sc
      JOIN categories c ON c.id = sc.category_id
      LEFT JOIN products p ON p.sub_category_id = sc.id AND p.is_active = true
      WHERE sc.is_active = true AND c.is_active = true
      GROUP BY sc.id, c.name
      ORDER BY c.name, sc.name
    `);

    res.json({
      success: true,
      sub_categories: result.rows
    });
  } catch (error) {
    console.error('Error fetching sub-categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sub-categories'
    });
  }
});

// 9. Update Sub-Category
app.put('/api/sub-categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category_id, is_active } = req.body;

    // Check if new name already exists in the same category
    if (name !== undefined && category_id !== undefined) {
      const existingSubCategory = await pool.query(
        'SELECT * FROM sub_categories WHERE LOWER(name) = LOWER($1) AND category_id = $2 AND id != $3',
        [name.trim(), category_id, id]
      );

      if (existingSubCategory.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Sub-category name already exists in this category'
        });
      }
    }

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      values.push(name.trim());
      paramIndex++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }

    if (category_id !== undefined) {
      updateFields.push(`category_id = $${paramIndex}`);
      values.push(category_id);
      paramIndex++;
    }

    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      values.push(is_active);
      paramIndex++;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);
    const query = `
      UPDATE sub_categories 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sub-category not found'
      });
    }

    res.json({
      success: true,
      message: 'Sub-category updated successfully',
      sub_category: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating sub-category:', error);

    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Sub-category name already exists in this category'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating sub-category'
    });
  }
});

// 10. Delete Sub-Category
app.delete('/api/sub-categories/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Check if sub-category exists
    const subCategoryResult = await client.query(
      'SELECT * FROM sub_categories WHERE id = $1',
      [id]
    );

    if (subCategoryResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Sub-category not found'
      });
    }

    // Check if sub-category has products
    const productCountResult = await client.query(
      'SELECT COUNT(*) FROM products WHERE sub_category_id = $1',
      [id]
    );

    const productCount = parseInt(productCountResult.rows[0].count);

    if (productCount > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Cannot delete sub-category. It has ${productCount} product(s) associated.`
      });
    }

    // Delete sub-category
    await client.query('DELETE FROM sub_categories WHERE id = $1', [id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Sub-category deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting sub-category:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting sub-category'
    });
  } finally {
    client.release();
  }
});

// ==================== PRODUCT ROUTES ====================

// Helper function to get product with images
const getProductWithImages = async (productId, client = pool) => {
  const productQuery = await client.query(`
    SELECT p.*, 
      c.name as category_name,
      sc.name as sub_category_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
    WHERE p.id = $1
  `, [productId]);

  const imagesQuery = await client.query(
    'SELECT * FROM product_images WHERE product_id = $1 ORDER BY display_order',
    [productId]
  );

  return {
    ...productQuery.rows[0],
    sub_images: imagesQuery.rows
  };
};

// 11. Add Product with multiple images
app.post('/api/products', upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'subImages', maxCount: 10 }
]), async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category_id,
      sub_category_id,
      sku,
      stock_quantity,
      is_featured
    } = req.body;

    // Check if main image is uploaded
    if (!req.files || !req.files.mainImage || req.files.mainImage.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Main image is required'
      });
    }

    // Validate required fields
    if (!name || !price || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and category are required'
      });
    }

    const BASE_URL = `${req.protocol}://${req.get('host')}`;

  const mainImageUrl = `${BASE_URL}/uploads/${req.files.mainImage[0].filename}`;

    // Start transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Generate SKU if not provided
      let finalSku = sku;
      if (!finalSku) {
        const skuPrefix = 'PROD-' + Date.now().toString().slice(-6);
        finalSku = skuPrefix;
      }

      // Insert product
      const productResult = await client.query(
        `INSERT INTO products (
          name, description, price, category_id, sub_category_id, 
          main_image_url, sku, stock_quantity, is_featured
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          name,
          description,
          parseFloat(price),
          category_id,
          sub_category_id || null,
          mainImageUrl,
          finalSku,
          parseInt(stock_quantity) || 0,
          is_featured === 'true'
        ]
      );

      const product = productResult.rows[0];

      // Insert sub-images if any
      if (req.files.subImages && req.files.subImages.length > 0) {
        for (let i = 0; i < req.files.subImages.length; i++) {
          await client.query(
            'INSERT INTO product_images (product_id, image_url, display_order) VALUES ($1, $2, $3)',
            [product.id, `${BASE_URL}/uploads/${req.files.subImages[i].filename}`, i]
          );
        }
      }

      await client.query('COMMIT');

      // Get product with images
      const fullProduct = await getProductWithImages(product.id, client);

      res.status(201).json({
        success: true,
        message: 'Product added successfully',
        product: fullProduct
      });
    } catch (error) {
      await client.query('ROLLBACK');

      // Cleanup uploaded files
      const allFiles = [
        ...(req.files.mainImage || []),
        ...(req.files.subImages || [])
      ];
      const filePaths = allFiles.map(file => file.path);
      deleteFiles(filePaths);

      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error adding product:', error);

    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'SKU already exists'
      });
    }

    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error adding product'
    });
  }
});

// 12. Get All Products
// 12. Get All Products
app.get('/api/products', async (req, res) => {
  try {
    const {
      category_id,
      sub_category_id,
      is_featured,
      is_active = 'true',
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query with proper parameter handling
    let whereClauses = ['p.is_active = $1'];
    const values = [is_active === 'true'];
    let paramIndex = 2;

    if (category_id) {
      whereClauses.push(`p.category_id = $${paramIndex}`);
      values.push(parseInt(category_id));
      paramIndex++;
    }

    if (sub_category_id) {
      whereClauses.push(`p.sub_category_id = $${paramIndex}`);
      values.push(parseInt(sub_category_id));
      paramIndex++;
    }

    if (is_featured !== undefined) {
      whereClauses.push(`p.is_featured = $${paramIndex}`);
      values.push(is_featured === 'true');
      paramIndex++;
    }

    const whereQuery = whereClauses.join(' AND ');
    
    const query = `
      SELECT p.*, 
        c.name as category_name,
        sc.name as sub_category_name,
        (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = p.id) as sub_images_count
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
      WHERE ${whereQuery}
      ORDER BY p.created_at DESC 
      LIMIT $${paramIndex} 
      OFFSET $${paramIndex + 1}
    `;

    values.push(parseInt(limit), offset);

    const result = await pool.query(query, values);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) 
      FROM products p 
      WHERE ${whereQuery}
    `;

    const countResult = await pool.query(countQuery, values.slice(0, -2)); // Remove limit and offset values
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});

// 13. Get Single Product
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await getProductWithImages(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product'
    });
  }
});

// 14. Update Product
app.put('/api/products/:id', upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'subImages', maxCount: 10 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      category_id,
      sub_category_id,
      sku,
      stock_quantity,
      is_featured,
      is_active
    } = req.body;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get current product data
      const currentProduct = await client.query(
        'SELECT main_image_url, sku FROM products WHERE id = $1',
        [id]
      );

      if (currentProduct.rows.length === 0) {
        throw new Error('Product not found');
      }

      let mainImageUrl = currentProduct.rows[0].main_image_url;

      // Update main image if new one is uploaded
      if (req.files?.mainImage?.[0]) {
        // Delete old main image
        if (mainImageUrl) {
          const oldImagePath = mainImageUrl.replace('/uploads/', 'uploads/');
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }

        const BASE_URL = `${req.protocol}://${req.get('host')}`;
mainImageUrl = `${BASE_URL}/uploads/${req.files.mainImage[0].filename}`;
      }

      // Build update query
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        values.push(name);
        paramIndex++;
      }

      if (description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        values.push(description);
        paramIndex++;
      }

      if (price !== undefined) {
        updateFields.push(`price = $${paramIndex}`);
        values.push(parseFloat(price));
        paramIndex++;
      }

      if (category_id !== undefined) {
        updateFields.push(`category_id = $${paramIndex}`);
        values.push(category_id);
        paramIndex++;
      }

      if (sub_category_id !== undefined) {
        updateFields.push(`sub_category_id = $${paramIndex}`);
        values.push(sub_category_id || null);
        paramIndex++;
      }

      if (sku !== undefined && sku !== currentProduct.rows[0].sku) {
        updateFields.push(`sku = $${paramIndex}`);
        values.push(sku);
        paramIndex++;
      }

      if (stock_quantity !== undefined) {
        updateFields.push(`stock_quantity = $${paramIndex}`);
        values.push(parseInt(stock_quantity));
        paramIndex++;
      }

      if (is_featured !== undefined) {
        updateFields.push(`is_featured = $${paramIndex}`);
        values.push(is_featured === 'true');
        paramIndex++;
      }

      if (is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex}`);
        values.push(is_active === 'true');
        paramIndex++;
      }

      if (mainImageUrl !== currentProduct.rows[0].main_image_url) {
        updateFields.push(`main_image_url = $${paramIndex}`);
        values.push(mainImageUrl);
        paramIndex++;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      if (updateFields.length > 0) {
        values.push(id);
        const query = `UPDATE products SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        await client.query(query, values);
      }

      // Add new sub-images
      if (req.files?.subImages?.length > 0) {
        // Get current max display order
        const orderResult = await client.query(
          'SELECT COALESCE(MAX(display_order), 0) as max_order FROM product_images WHERE product_id = $1',
          [id]
        );

        let nextOrder = orderResult.rows[0].max_order + 1;

        for (const file of req.files.subImages) {
          await client.query(
            'INSERT INTO product_images (product_id, image_url, display_order) VALUES ($1, $2, $3)',
            [id, `/uploads/${file.filename}`, nextOrder++]
          );
        }
      }

      await client.query('COMMIT');

      // Get updated product
      const updatedProduct = await getProductWithImages(id, client);

      res.json({
        success: true,
        message: 'Product updated successfully',
        product: updatedProduct
      });
    } catch (error) {
      await client.query('ROLLBACK');

      // Cleanup uploaded files if transaction fails
      const allFiles = [
        ...(req.files?.mainImage || []),
        ...(req.files?.subImages || [])
      ];
      const filePaths = allFiles.map(file => file?.path).filter(Boolean);
      deleteFiles(filePaths);

      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating product:', error);

    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'SKU already exists'
      });
    }

    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating product'
    });
  }
});

// 15. Delete Product Image
app.delete('/api/products/:productId/images/:imageId', async (req, res) => {
  try {
    const { productId, imageId } = req.params;

    // Get image URL
    const imageResult = await pool.query(
      'SELECT image_url FROM product_images WHERE id = $1 AND product_id = $2',
      [imageId, productId]
    );

    if (imageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Delete file
    const imageUrl = imageResult.rows[0].image_url;
    const imagePath = imageUrl.replace('/uploads/', 'uploads/');
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Delete from database
    await pool.query(
      'DELETE FROM product_images WHERE id = $1 AND product_id = $2',
      [imageId, productId]
    );

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image'
    });
  }
});

// 16. Delete Product
app.delete('/api/products/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Get all images to delete
    const imagesToDelete = await client.query(
      `SELECT image_url FROM product_images WHERE product_id = $1 
       UNION ALL 
       SELECT main_image_url as image_url FROM products WHERE id = $1`,
      [id]
    );

    // Delete product and images (cascade will delete sub-images)
    await client.query('DELETE FROM products WHERE id = $1', [id]);

    // Delete image files
    imagesToDelete.rows.forEach(row => {
      if (row.image_url) {
        const imagePath = row.image_url.replace('/uploads/', 'uploads/');
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    });

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product'
    });
  } finally {
    client.release();
  }
});

// ==================== ORDER ROUTES ====================

// 17. Create Order
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, customerEmail, phone, address, items, amount } = req.body;

    const result = await pool.query(
      'INSERT INTO orders (customer_name, customer_email, phone, address, items, amount) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [customerName, customerEmail, phone, address, JSON.stringify(items), parseFloat(amount)]
    );

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order'
    });
  }
});

// 18. Get All Orders
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );
    res.json({
      success: true,
      orders: result.rows
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
});

// 19. Update Order Status
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status'
    });
  }
});

// 20. Delete Order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM orders WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting order'
    });
  }
});

// 21. Get Single Sub-Category
app.get('/api/sub-categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT sc.*, 
        c.id as category_id,
        c.name as category_name,
        COUNT(p.id) as product_count
      FROM sub_categories sc
      LEFT JOIN categories c ON c.id = sc.category_id
      LEFT JOIN products p ON p.sub_category_id = sc.id AND p.is_active = true
      WHERE sc.id = $1 AND sc.is_active = true
      GROUP BY sc.id, c.id, c.name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sub-category not found'
      });
    }

    res.json({
      success: true,
      sub_category: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching sub-category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sub-category'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum 5MB allowed.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded. Maximum 10 sub-images allowed.'
      });
    }
  }

  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Uploads directory: ${path.join(__dirname, 'uploads')}`);
  });
});