const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5004;

// Seed default admin if not exists
const bcrypt = require('bcrypt');


// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));// Debug: List all routes (add temporarily)
app.get('/debug-routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((r) => {
    if (r.route && r.route.path) {
      routes.push(`${Object.keys(r.route.methods)} ${r.route.path}`);
    }
  });
  res.json({ routes });
});


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
    await pool.query(`
  CREATE TABLE IF NOT EXISTS carousel (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    subtitle TEXT,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
    console.log("✅ Carousel table initialized");
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
    await pool.query(`
  ALTER TABLE categories 
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
`);

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

    // Add to your initDatabase() function
    await pool.query(`
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL
      `);

    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS product_detail VARCHAR(50),
      ADD COLUMN IF NOT EXISTS without_print_price NUMERIC,
      ADD COLUMN IF NOT EXISTS core_price NUMERIC,
      ADD COLUMN IF NOT EXISTS elite_price NUMERIC,
      ADD COLUMN IF NOT EXISTS pro_price NUMERIC,
      ADD COLUMN IF NOT EXISTS cloth_colors TEXT[];
    `);

    await pool.query(`
  ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS size VARCHAR(50),
  ADD COLUMN IF NOT EXISTS product_type VARCHAR(50)
`);
    // Add this inside initDatabase() function
    await pool.query(`
      CREATE TABLE IF NOT EXISTS navbar_menu (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_visible BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category_id)
      )
    `);

    console.log("✅ Navbar menu table initialized");

    // ✅ THIS WAS MISSING
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        image_url TEXT,
        display_order INTEGER DEFAULT 0
      )
    `);

    await pool.query(`
      UPDATE products 
        SET main_image_url = regexp_replace(main_image_url, '^https?://[^/]+', '')
        WHERE main_image_url LIKE 'http%';

        UPDATE product_images 
        SET image_url = regexp_replace(image_url, '^https?://[^/]+', '')
        WHERE image_url LIKE 'http%';
    `);



    await pool.query(`
  CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    items JSONB NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

    await pool.query(`ALTER TABLE products  ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
      CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
      `);


    // ========== Admin users table ==========
    await pool.query(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
    console.log("✅ Admin users table initialized");
    
    // ✅ MOVED THIS HERE - Admin user creation after table is created
    const defaultUsername = 'DemoTents';
    const defaultPassword = process.env.DEFAULT_ADMIN_PHONE;
    
    const existingAdmin = await pool.query(
      'SELECT id FROM admin_users WHERE username = $1',
      [defaultUsername]
    );
    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await pool.query(
        'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
        [defaultUsername, hashedPassword]
      );
      console.log(`✅ Default admin created: ${defaultUsername} / ${defaultPassword}`);
    }


    console.log("✅ Database tables initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization error:", error);
  }
};



const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded; // { id, username }
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
};


// ==================== ADMIN LOGIN ====================
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const result = await pool.query(
      'SELECT id, username, password_hash FROM admin_users WHERE username = $1',
      [username]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: { id: admin.id, username: admin.username }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Update storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = uploadsDir;
    if (file.fieldname === 'video') folder = path.join(uploadsDir, 'videos');
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const prefix = file.fieldname === 'video' ? 'video-' : 'product-';
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else if (file.mimetype.startsWith('video/')) cb(null, true);
  else cb(new Error('Only image or video files allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: Infinity,  // No size limit
    files: 100          // Allow up to 100 files (or adjust as needed)
  }
});
// Update static file serving
app.use('/uploads', express.static(uploadsDir));


function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // replace spaces with -
    .replace(/[^\w\-]+/g, '')       // remove all non-word chars
    .replace(/\-\-+/g, '-')         // replace multiple - with single -
    .replace(/^-+/, '')             // trim - from start
    .replace(/-+$/, '');            // trim - from end
}

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

//carousel 
app.get('/api/carousel', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * 
      FROM carousel 
      WHERE is_active = true
      ORDER BY display_order ASC, id ASC
    `);
    res.json({ success: true, carousel: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch carousel' });
  }
});
app.post('/api/carousel', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { title, subtitle, display_order } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const result = await pool.query(`
      INSERT INTO carousel (title, subtitle, image_url, display_order) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `, [title || null, subtitle || null, imageUrl, display_order || 0]);

    res.status(201).json({ success: true, carousel: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add carousel item' });
  }
});
app.put('/api/carousel/:id', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, display_order, is_active } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title); }
    if (subtitle !== undefined) { fields.push(`subtitle = $${idx++}`); values.push(subtitle); }
    if (display_order !== undefined) { fields.push(`display_order = $${idx++}`); values.push(display_order); }
    if (is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(is_active); }

    if (req.file) {
      fields.push(`image_url = $${idx++}`);
      values.push(`/uploads/${req.file.filename}`);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    const query = `
      UPDATE carousel 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${idx} 
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Carousel item not found' });
    }

    res.json({ success: true, carousel: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update carousel' });
  }
});
app.delete('/api/carousel/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM carousel WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Carousel item not found' });
    }
    res.json({ success: true, message: 'Carousel item deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete carousel' });
  }
});
// ==================== CATEGORY ROUTES ====================

// 1. Create Category
app.post('/api/categories', verifyToken, async (req, res) => {
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
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        nm.id as menu_id,
        nm.is_visible,
        nm.display_order,
        COALESCE(
          json_agg(
            json_build_object(
              'id', sc.id,
              'name', sc.name,
              'description', sc.description,
              'product_count', (
                SELECT COUNT(*) FROM products p 
                WHERE p.sub_category_id = sc.id AND p.is_active = true
              )
            ) ORDER BY sc.name
          ) FILTER (WHERE sc.id IS NOT NULL), '[]'
        ) as sub_categories,
        (
          SELECT COUNT(*) FROM products p 
          WHERE p.category_id = c.id AND p.is_active = true
        ) as product_count,
        (
          SELECT main_image_url FROM products 
          WHERE category_id = c.id AND is_active = true 
          LIMIT 1
        ) as preview_image
      FROM categories c
      LEFT JOIN navbar_menu nm ON nm.category_id = c.id
      LEFT JOIN sub_categories sc ON sc.category_id = c.id AND sc.is_active = true
      WHERE c.is_active = true
      GROUP BY c.id, nm.id, nm.display_order
      ORDER BY COALESCE(nm.display_order, c.display_order) ASC, c.name ASC
    `);

    res.json({ success: true, categories: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
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
app.put('/api/categories/:id', verifyToken, async (req, res) => {
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
app.delete('/api/categories/:id', verifyToken, async (req, res) => {
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

// NAVBAR MENU ROUTES

// ==================== NAVBAR MENU ROUTES - FINAL CLEAN BLOCK ====================

// GET - Used by public Navbar component
app.get('/api/navbar-menu', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id, c.name, c.description,
        nm.id as menu_id,
        nm.display_order,
        COALESCE(
          json_agg(json_build_object('id', sc.id, 'name', sc.name)) 
          FILTER (WHERE sc.id IS NOT NULL), '[]'
        ) as sub_categories
      FROM navbar_menu nm
      JOIN categories c ON c.id = nm.category_id
      LEFT JOIN sub_categories sc ON sc.category_id = c.id AND sc.is_active = true
      WHERE nm.is_visible = true AND c.is_active = true
      GROUP BY c.id, nm.id, nm.display_order
      ORDER BY nm.display_order ASC, c.name ASC
    `);

    res.json({ success: true, menu: result.rows || [] });
  } catch (error) {
    console.error('Navbar GET error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST - Add to Navbar  ← This is the one failing
app.post('/api/navbar-menu', verifyToken, async (req, res) => {
  try {
    const { category_id, display_order = 0 } = req.body;

    if (!category_id) {
      return res.status(400).json({ success: false, message: 'Category ID is required' });
    }

    const result = await pool.query(`
      INSERT INTO navbar_menu (category_id, display_order, is_visible)
      VALUES ($1, $2, true)
      ON CONFLICT (category_id) 
      DO UPDATE SET 
        is_visible = true, 
        display_order = EXCLUDED.display_order, 
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [category_id, display_order]);

    res.status(201).json({
      success: true,
      message: 'Category added to navbar',
      menu_item: result.rows[0]
    });
  } catch (error) {
    console.error('Navbar POST error:', error);
    res.status(500).json({ success: false, message: 'Failed to add to navbar' });
  }
});

// DELETE - Remove from Navbar
app.delete('/api/navbar-menu/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE navbar_menu SET is_visible = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    res.json({ success: true, message: 'Category removed from navbar' });
  } catch (error) {
    console.error('Navbar DELETE error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ==================== SUB-CATEGORY ROUTES ====================

// 6. Create Sub-Category
app.post('/api/sub-categories', verifyToken, async (req, res) => {
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
app.put('/api/sub-categories/:id', verifyToken, async (req, res) => {
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
app.delete('/api/sub-categories/:id', verifyToken, async (req, res) => {
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


// 12. Get All Products
// Inside GET /api/products, after extracting query params
// Replace your existing GET /api/products route with this:

// Replace your existing GET /api/products route with this:
app.get('/api/products', async (req, res) => {
  try {
    const { category_id, sub_category_id, type, is_active } = req.query;

    let baseQuery = `
      SELECT 
        p.*, 
        c.name as category_name,
        sc.name as sub_category_name,
        (SELECT COUNT(*) FROM product_images WHERE product_id = p.id) as sub_images_count
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    // ✅ If category_id is provided, include products that belong to this category
    //    either directly (p.category_id) OR through any subcategory under this category
    if (category_id) {
      baseQuery += ` AND (
        p.category_id = $${paramIndex} 
        OR p.sub_category_id IN (
          SELECT id FROM sub_categories WHERE category_id = $${paramIndex}
        )
      )`;
      values.push(category_id);
      paramIndex++;
    }

    if (sub_category_id) {
      baseQuery += ` AND p.sub_category_id = $${paramIndex}`;
      values.push(sub_category_id);
      paramIndex++;
    }

    // Only show active products for public API
    if (is_active === 'true') {
      baseQuery += ` AND p.is_active = true`;
    }

    // Apply type filter only if explicitly provided
    if (type === 'without-print') {
      baseQuery += ` AND p.without_print_price IS NOT NULL`;
    } else if (type === 'custom') {
      baseQuery += ` AND (p.core_price IS NOT NULL OR p.elite_price IS NOT NULL OR p.pro_price IS NOT NULL)`;
    }

    baseQuery += ` ORDER BY p.created_at DESC`;

    const result = await pool.query(baseQuery, values);
    
    console.log(`📦 Products returned: ${result.rows.length} for category_id=${category_id}, subcat=${sub_category_id}, type=${type}`);

    res.json({
      success: true,
      products: result.rows
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
// Updated GET product by UUID or slug
app.get('/api/products/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    let product;

    // Check if identifier is UUID format (8-4-4-4-12 pattern)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(identifier)) {
      // Fetch by UUID
      const result = await pool.query(
        `SELECT * FROM products WHERE uuid = $1`,
        [identifier]
      );
      if (result.rows.length) {
        product = await getProductWithImages(result.rows[0].id);
      }
    } else {
      // Fetch by slug
      const result = await pool.query(
        `SELECT * FROM products WHERE slug = $1`,
        [identifier]
      );
      if (result.rows.length) {
        product = await getProductWithImages(result.rows[0].id);
      }
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching product' });
  }
});

// Updated POST product with UUID generation
app.post('/api/products', verifyToken, upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'subImages', maxCount: 100 }  // Increase from 10 to 100
]), async (req, res) => {
  const client = await pool.connect();
  let uploadedFiles = [];

  try {
    await client.query('BEGIN');

    const {
      name, description, price, category_id, sub_category_id, sku,
      stock_quantity, is_featured, product_detail, without_print_price,
      core_price, elite_price, pro_price, cloth_colors, size, product_type
    } = req.body;

    // Validation
    if (!req.files?.mainImage?.[0]) {
      throw new Error('Main image is required');
    }
    if (!name || !price || !category_id) {
      throw new Error('Name, price, and category are required');
    }

    // Collect uploaded file paths for rollback
    if (req.files.mainImage) uploadedFiles.push(req.files.mainImage[0].path);
    if (req.files.subImages) uploadedFiles.push(...req.files.subImages.map(f => f.path));

    const mainImageUrl = `/uploads/${req.files.mainImage[0].filename}`;

    // Parse array fields
    let colorsArray = null;
    if (cloth_colors) {
      try {
        colorsArray = JSON.parse(cloth_colors);
      } catch {
        colorsArray = cloth_colors.split(',').map(c => c.trim());
      }
    }

    // Generate unique slug
    let baseSlug = slugify(name);
    let finalSlug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await client.query('SELECT id FROM products WHERE slug = $1', [finalSlug]);
      if (existing.rows.length === 0) break;
      finalSlug = `${baseSlug}-${counter++}`;
    }

    // Generate UUID (will be auto-generated by PostgreSQL if DEFAULT set)
    const productResult = await client.query(`
      INSERT INTO products (
        name, description, price, category_id, sub_category_id, main_image_url,
        sku, stock_quantity, is_featured, product_detail, without_print_price,
        core_price, elite_price, pro_price, cloth_colors, size, product_type, slug
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `, [
      name, description || null, parseFloat(price), category_id, sub_category_id || null,
      mainImageUrl, sku || null, parseInt(stock_quantity) || 0, is_featured === 'true',
      product_detail || null, without_print_price || null, core_price || null,
      elite_price || null, pro_price || null, colorsArray, size || null, product_type || null,
      finalSlug
    ]);

    const productId = productResult.rows[0].id;
    const productUuid = productResult.rows[0].uuid;

    // Insert sub-images
    if (req.files.subImages) {
      for (let i = 0; i < req.files.subImages.length; i++) {
        const subUrl = `/uploads/${req.files.subImages[i].filename}`;
        await client.query(
          `INSERT INTO product_images (product_id, image_url, display_order)
           VALUES ($1, $2, $3)`,
          [productId, subUrl, i]
        );
      }
    }

    await client.query('COMMIT');

    const fullProduct = await getProductWithImages(productId, client);
    // Add uuid to response
    fullProduct.uuid = productUuid;

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      product: fullProduct
    });
  } catch (error) {
    await client.query('ROLLBACK');
    uploadedFiles.forEach(file => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
    console.error('Product creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add product'
    });
  } finally {
    client.release();
  }
});

// 14. Update Product
app.put('/api/products/:id', verifyToken, upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'subImages', maxCount: 10 }
]), async (req, res) => {
  const client = await pool.connect();
  let newUploadedFiles = [];
  let oldMainUrl = null;

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      name, description, price, category_id, sub_category_id, sku,
      stock_quantity, is_featured, is_active, product_detail,
      without_print_price, core_price, elite_price, pro_price,
      cloth_colors, size, product_type
    } = req.body;

    // Get existing product
    const oldProduct = await client.query(
      'SELECT main_image_url, name FROM products WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (oldProduct.rows.length === 0) throw new Error('Product not found');
    oldMainUrl = oldProduct.rows[0].main_image_url;

    // ✅ Generate new slug if name changed
    let finalSlug = null;
    if (name !== undefined && name !== oldProduct.rows[0].name) {
      let baseSlug = slugify(name);
      finalSlug = baseSlug;
      let counter = 1;
      while (true) {
        const existing = await client.query(
          'SELECT id FROM products WHERE slug = $1 AND id != $2',
          [finalSlug, id]
        );
        if (existing.rows.length === 0) break;
        finalSlug = `${baseSlug}-${counter++}`;
      }
    }

    // Handle new main image
    let mainImageUrl = oldMainUrl;
    if (req.files?.mainImage?.[0]) {
      mainImageUrl = `/uploads/${req.files.mainImage[0].filename}`;
      newUploadedFiles.push(req.files.mainImage[0].path);
    }

    // Parse array field
    let colorsArray = null;
    if (cloth_colors) {
      try {
        colorsArray = JSON.parse(cloth_colors);
      } catch {
        colorsArray = cloth_colors.split(',').map(c => c.trim());
      }
    }

    // Update product (slug only if changed)
    await client.query(`
      UPDATE products SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        category_id = COALESCE($4, category_id),
        sub_category_id = $5,
        main_image_url = $6,
        sku = COALESCE($7, sku),
        stock_quantity = COALESCE($8, stock_quantity),
        is_featured = COALESCE($9, is_featured),
        is_active = COALESCE($10, is_active),
        product_detail = $11,
        without_print_price = $12,
        core_price = $13,
        elite_price = $14,
        pro_price = $15,
        cloth_colors = $16,
        size = $17,
        product_type = $18,
        slug = COALESCE($19, slug),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $20
    `, [
      name, description, price ? parseFloat(price) : null,
      category_id, sub_category_id || null, mainImageUrl,
      sku, stock_quantity ? parseInt(stock_quantity) : null,
      is_featured === 'true', is_active === 'true',
      product_detail || null, without_print_price || null,
      core_price || null, elite_price || null, pro_price || null,
      colorsArray, size || null, product_type || null,
      finalSlug,   // may be null
      id
    ]);

    // Handle sub-images: delete existing and insert new ones if provided
    if (req.files?.subImages?.length) {
      const oldSubImages = await client.query(
        'SELECT image_url FROM product_images WHERE product_id = $1',
        [id]
      );
      await client.query('DELETE FROM product_images WHERE product_id = $1', [id]);
      for (let i = 0; i < req.files.subImages.length; i++) {
        const subUrl = `/uploads/${req.files.subImages[i].filename}`;
        newUploadedFiles.push(req.files.subImages[i].path);
        await client.query(
          `INSERT INTO product_images (product_id, image_url, display_order)
           VALUES ($1, $2, $3)`,
          [id, subUrl, i]
        );
      }
      // Schedule old sub-image files for deletion after commit
      oldSubImages.rows.forEach(row => {
        const oldPath = path.join(__dirname, row.image_url);
        if (fs.existsSync(oldPath)) newUploadedFiles.push(oldPath);
      });
    }

    await client.query('COMMIT');

    // After successful commit, delete old main image (if replaced)
    if (req.files?.mainImage?.[0] && oldMainUrl && oldMainUrl !== mainImageUrl) {
      const oldPath = path.join(__dirname, oldMainUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Delete old sub-images
    for (const filePath of newUploadedFiles) {
      if (filePath !== req.files?.mainImage?.[0]?.path && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const updatedProduct = await getProductWithImages(id, client);
    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    await client.query('ROLLBACK');
    newUploadedFiles.forEach(file => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
    console.error('Product update error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update product'
    });
  } finally {
    client.release();
  }
});

// 15. Delete Product Image
app.delete('/api/products/:productId/images/:imageId', verifyToken, async (req, res) => {
  try {
    const { productId, imageId } = req.params;

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

    const imageUrl = imageResult.rows[0].image_url;
    // ✅ Build filesystem path from relative URL
    const imagePath = path.join(__dirname, imageUrl);

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

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
app.delete('/api/products/:id', verifyToken, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    const imagesToDelete = await client.query(
      `SELECT image_url FROM product_images WHERE product_id = $1 
       UNION ALL 
       SELECT main_image_url as image_url FROM products WHERE id = $1`,
      [id]
    );

    await client.query('DELETE FROM products WHERE id = $1', [id]);

    // ✅ Delete files using relative URL → absolute path
    imagesToDelete.rows.forEach(row => {
      if (row.image_url) {
        const imagePath = path.join(__dirname, row.image_url);
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
app.post('/api/orders',  async (req, res) => {
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
app.get('/api/orders', verifyToken, async (req, res) => {
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
app.put('/api/orders/:id/status', verifyToken, async (req, res) => {
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
app.delete('/api/orders/:id', verifyToken, async (req, res) => {
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

//reorder
//  Reorder Categories
app.put('/api/categories/reorder', verifyToken, async (req, res) => {
  const { categories } = req.body;

  if (!categories || !Array.isArray(categories)) {
    return res.status(400).json({
      success: false,
      message: "Invalid categories data"
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const item of categories) {
      await client.query(
        `UPDATE categories 
         SET display_order = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [item.display_order, item.id]
      );
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Categories reordered successfully"
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Reorder error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to reorder categories"
    });

  } finally {
    client.release();
  }
});
// Navbar reoerder
app.put('/api/navbar-menu/reorder', verifyToken, async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ success: false, message: "Invalid data" });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const item of items) {
      await client.query(
        `UPDATE navbar_menu 
         SET display_order = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [item.display_order, item.id]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: "Navbar reordered successfully" });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to reorder" });
  } finally {
    client.release();
  }
});

// ==================== STATS ENDPOINT ====================

app.get('/api/stats', verifyToken, async (req, res) => {
  try {
    // Total products
    const productResult = await pool.query('SELECT COUNT(*) as count FROM products WHERE is_active = true');
    const totalProducts = parseInt(productResult.rows[0].count);

    // Total orders
    const orderResult = await pool.query('SELECT COUNT(*) as count FROM orders');
    const totalOrders = parseInt(orderResult.rows[0].count);

    // Total revenue (sum of all order amounts)
    const revenueResult = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM orders');
    const totalRevenue = parseFloat(revenueResult.rows[0].total);

    // Total unique customers (distinct email or name – using email if available, else name)
    const customerResult = await pool.query(`
      SELECT COUNT(DISTINCT COALESCE(customer_email, customer_name)) as count 
      FROM orders
    `);
    const totalCustomers = parseInt(customerResult.rows[0].count);

    // Recent 5 orders
    const recentOrders = await pool.query(`
      SELECT id, customer_name, amount, status, created_at 
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        totalRevenue,
        totalCustomers,
        recentOrders: recentOrders.rows
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

// GET /api/categories-with-images
app.get('/api/categories-with-images', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        (SELECT main_image_url FROM products 
         WHERE category_id = c.id AND is_active = true 
         LIMIT 1) as preview_image
      FROM categories c
      WHERE c.is_active = true
      ORDER BY c.display_order ASC, c.name ASC
    `);
    res.json({ success: true, categories: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
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
    console.log(`Uploads directory: ${uploadsDir}`);
  });

});

