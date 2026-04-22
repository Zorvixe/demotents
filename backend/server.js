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

// Helper: generate unique slug
const generateSlug = async (name, parentId = null) => {
  let base = slugify(name);
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await pool.query('SELECT id FROM categories WHERE slug = $1', [slug]);
    if (existing.rows.length === 0) break;
    slug = `${base}-${counter++}`;
  }
  return slug;
}; 


const initDatabase = async () => {
  try {
    // 1. Carousel (unchanged)
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

    // 2. Unified categories table (with parent_id, slug, level)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        level INTEGER DEFAULT 0,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);`);
    console.log("✅ Unified categories table initialized");

    // 3. Products table (remove sub_category_id)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        main_image_url VARCHAR(500),
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        sku VARCHAR(100) UNIQUE,
        stock_quantity INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
        product_detail VARCHAR(50),
        without_print_price NUMERIC,
        core_price NUMERIC,
        elite_price NUMERIC,
        pro_price NUMERIC,
        cloth_colors TEXT[],
        size VARCHAR(50),
        product_type VARCHAR(50),
        slug VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Products table initialized");

    // 4. Product images
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        image_url TEXT,
        display_order INTEGER DEFAULT 0
      )
    `);

    // 5. Orders
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

    // 6. Admin users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Admin users table initialized");

    // 7. Menu items (no subcategory type)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        parent_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        target_id INTEGER NULL,
        link_url VARCHAR(500) NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_visible BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_menu_items_parent ON menu_items(parent_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_menu_items_order ON menu_items(display_order);`);
    console.log("✅ Menu items table initialized");

    // 8. Create default admin
    const defaultUsername = 'DemoTents';
    const defaultPassword = process.env.DEFAULT_ADMIN_PHONE;
    const existingAdmin = await pool.query('SELECT id FROM admin_users WHERE username = $1', [defaultUsername]);
    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await pool.query('INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)', [defaultUsername, hashedPassword]);
      console.log(`✅ Default admin created: ${defaultUsername} / ${defaultPassword}`);
    }

    // 9. Fix image URLs (unchanged)
    await pool.query(`
      UPDATE products 
        SET main_image_url = regexp_replace(main_image_url, '^https?://[^/]+', '')
        WHERE main_image_url LIKE 'http%';
      UPDATE product_images 
        SET image_url = regexp_replace(image_url, '^https?://[^/]+', '')
        WHERE image_url LIKE 'http%';
    `);

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

async function getMenuTree(parentId = null, client = pool) {
  const res = await client.query(
    `SELECT * FROM menu_items 
     WHERE parent_id IS NOT DISTINCT FROM $1 AND is_visible = true 
     ORDER BY display_order ASC`,
    [parentId]
  );
  const items = res.rows;
  for (let item of items) {
    item.children = await getMenuTree(item.id, client);
    if (item.type === 'category' && item.target_id) {
      const cat = await client.query('SELECT name, slug FROM categories WHERE id = $1', [item.target_id]);
      if (cat.rows[0]) {
        item.category_slug = cat.rows[0].slug;
      }
    }
    // Remove subcategory handling – you may want to convert existing 'subcategory' items:
    if (item.type === 'subcategory' && item.target_id) {
      // Optionally, convert to category by fetching the category from old sub_categories
      // But better to run a one-time migration: update menu_items set type='category' where type='subcategory';
      console.warn(`Legacy subcategory item found: ${item.id} – please migrate to category type.`);
    }
  }
  return items;
}

app.get('/api/menu', async (req, res) => {
  try {
    const tree = await getMenuTree();
    res.json({ success: true, menu: tree });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Create menu item
app.post('/api/menu', verifyToken, async (req, res) => {
  const { parent_id, title, type, target_id, link_url, display_order } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO menu_items (parent_id, title, type, target_id, link_url, display_order, is_visible)
       VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING *`,
      [parent_id || null, title, type, target_id || null, link_url || null, display_order || 0]
    );
    res.status(201).json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create menu item' });
  }
});

// Update menu item
app.put('/api/menu/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { parent_id, title, type, target_id, link_url, display_order, is_visible } = req.body;
  try {
    const result = await pool.query(
      `UPDATE menu_items SET
        parent_id = COALESCE($1, parent_id),
        title = COALESCE($2, title),
        type = COALESCE($3, type),
        target_id = $4,
        link_url = $5,
        display_order = COALESCE($6, display_order),
        is_visible = COALESCE($7, is_visible),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [parent_id || null, title, type, target_id || null, link_url || null, display_order, is_visible, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update' });
  }
});

// Delete menu item (cascade will delete children)
app.delete('/api/menu/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM menu_items WHERE id = $1', [id]);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

// Reorder (drag & drop) – updates display_order for a list of items
app.post('/api/menu/reorder', verifyToken, async (req, res) => {
  const { items } = req.body; // [{ id, display_order, parent_id }]
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of items) {
      await client.query(
        `UPDATE menu_items SET display_order = $1, parent_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
        [item.display_order, item.parent_id || null, item.id]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, message: 'Reorder failed' });
  } finally {
    client.release();
  }
});

app.get('/api/menu/flat', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM menu_items ORDER BY parent_id NULLS FIRST, display_order ASC`
    );
    res.json({ success: true, items: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

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




// 3. Get Single Category
app.get('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      WITH RECURSIVE cat_tree AS (
        SELECT * FROM categories WHERE id = $1
        UNION ALL
        SELECT c.* FROM categories c
        JOIN cat_tree ct ON ct.id = c.parent_id
      )
      SELECT * FROM cat_tree;
    `, [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false });
    // Build tree for this branch
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({ ...item, children: buildTree(items, item.id) }));
    };
    const tree = buildTree(result.rows);
    res.json({ success: true, category: tree[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// GET /api/categories – returns full tree
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      WITH RECURSIVE cat_tree AS (
        SELECT id, name, slug, description, parent_id, level, display_order, is_active,
               created_at, updated_at, ARRAY[id] AS path
        FROM categories
        WHERE parent_id IS NULL AND is_active = true
        UNION ALL
        SELECT c.id, c.name, c.slug, c.description, c.parent_id, c.level, c.display_order,
               c.is_active, c.created_at, c.updated_at, path || c.id
        FROM categories c
        JOIN cat_tree ct ON ct.id = c.parent_id
        WHERE c.is_active = true
      )
      SELECT id, name, slug, description, parent_id, level, display_order, is_active,
             created_at, updated_at, path
      FROM cat_tree
      ORDER BY path;
    `);
    // Build nested tree
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id)
        }));
    };
    const tree = buildTree(result.rows);
    res.json({ success: true, categories: tree });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// POST /api/categories – create new category (can be nested)
app.post('/api/categories', verifyToken, async (req, res) => {
  const { name, description, parent_id } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name required' });
  try {
    const slug = await generateSlug(name);
    let level = 0;
    if (parent_id) {
      const parent = await pool.query('SELECT level FROM categories WHERE id = $1', [parent_id]);
      if (parent.rows.length === 0) return res.status(400).json({ success: false, message: 'Invalid parent' });
      level = parent.rows[0].level + 1;
    }
    const result = await pool.query(
      `INSERT INTO categories (name, slug, description, parent_id, level)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, slug, description || null, parent_id || null, level]
    );
    res.status(201).json({ success: true, category: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
});

// PUT /api/categories/:id – update
app.put('/api/categories/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, description, is_active } = req.body;
  try {
    const updates = [];
    const values = [];
    let idx = 1;
    if (name !== undefined) {
      updates.push(`name = $${idx++}, slug = $${idx++}`);
      const newSlug = await generateSlug(name);
      values.push(name, newSlug);
    }
    if (description !== undefined) updates.push(`description = $${idx++}`), values.push(description);
    if (is_active !== undefined) updates.push(`is_active = $${idx++}`), values.push(is_active);
    if (updates.length === 0) return res.status(400).json({ success: false, message: 'No fields' });
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    const query = `UPDATE categories SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await pool.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ success: false });
    res.json({ success: true, category: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// DELETE /api/categories/:id – cascade delete (children will be deleted)
app.delete('/api/categories/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Check if any product uses this category
    const prodCheck = await client.query('SELECT id FROM products WHERE category_id = $1 LIMIT 1', [id]);
    if (prodCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Category has products, cannot delete' });
    }
    await client.query('DELETE FROM categories WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false });
  } finally {
    client.release();
  }
});


// ==================== PRODUCT ROUTES ====================

const getProductWithImages = async (productId, client = pool) => {
  const productQuery = await client.query(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
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
app.get('/api/products', async (req, res) => {
  try {
    const { category_id, type, is_active } = req.query;

    let baseQuery = `
      SELECT 
        p.*, 
        c.name as category_name,
        (SELECT COUNT(*) FROM product_images WHERE product_id = p.id) as sub_images_count
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (category_id) {
      // Include products that belong to this category or any descendant category
      baseQuery += ` AND p.category_id IN (
        WITH RECURSIVE cat_tree AS (
          SELECT id FROM categories WHERE id = $${paramIndex}
          UNION ALL
          SELECT c.id FROM categories c
          JOIN cat_tree ct ON ct.id = c.parent_id
        )
        SELECT id FROM cat_tree
      )`;
      values.push(category_id);
      paramIndex++;
    }

    if (is_active === 'true') baseQuery += ` AND p.is_active = true`;
    if (type === 'without-print') baseQuery += ` AND p.without_print_price IS NOT NULL`;
    else if (type === 'custom') baseQuery += ` AND (p.core_price IS NOT NULL OR p.elite_price IS NOT NULL OR p.pro_price IS NOT NULL)`;

    baseQuery += ` ORDER BY p.created_at DESC`;
    const result = await pool.query(baseQuery, values);
    res.json({ success: true, products: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching products' });
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
      name, description, price, category_id, sku,
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
        name, description, price, category_id, main_image_url,
        sku, stock_quantity, is_featured, product_detail, without_print_price,
        core_price, elite_price, pro_price, cloth_colors, size, product_type, slug
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `, [
      name, description || null, parseFloat(price), category_id,
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
// 14. Update Product (with empty string → null conversion)
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
      name, description, price, category_id, sku,
      stock_quantity, is_featured, is_active, product_detail,
      without_print_price, core_price, elite_price, pro_price,
      cloth_colors, size, product_type
    } = req.body;

    // Helper: convert empty string to null for price fields
    const toNullIfEmpty = (val) => (val === '' || val === undefined) ? null : val;

    const finalWithoutPrint = toNullIfEmpty(without_print_price);
    const finalCore = toNullIfEmpty(core_price);
    const finalElite = toNullIfEmpty(elite_price);
    const finalPro = toNullIfEmpty(pro_price);

    // Get existing product
    const oldProduct = await client.query(
      'SELECT main_image_url, name FROM products WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (oldProduct.rows.length === 0) throw new Error('Product not found');
    oldMainUrl = oldProduct.rows[0].main_image_url;

    // Generate new slug if name changed
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
        colorsArray = cloth_colors.split(',').map(c => c.trim()).filter(c => c);
      }
    }

    // Update product (slug only if changed)
   await client.query(`
  UPDATE products SET
    name = COALESCE($1, name),
    description = COALESCE($2, description),
    price = COALESCE($3, price),
    category_id = COALESCE($4, category_id),
    main_image_url = $5,
    sku = COALESCE($6, sku),
    stock_quantity = COALESCE($7, stock_quantity),
    is_featured = COALESCE($8, is_featured),
    is_active = COALESCE($9, is_active),
    product_detail = $10,
    without_print_price = $11,
    core_price = $12,
    elite_price = $13,
    pro_price = $14,
    cloth_colors = $15,
    size = $16,
    product_type = $17,
    slug = COALESCE($18, slug),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = $19
`, [
  name, description, price ? parseFloat(price) : null,
  category_id, mainImageUrl,
  sku, stock_quantity ? parseInt(stock_quantity) : null,
  is_featured === 'true', is_active === 'true',
  product_detail || null, finalWithoutPrint, finalCore, finalElite, finalPro,
  colorsArray, size || null, product_type || null,
  finalSlug, id
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

