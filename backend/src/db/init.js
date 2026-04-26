/**
 * Database Auto-Initialization
 * Checks if tables exist, creates them and seeds if not.
 * Called automatically on server startup in production.
 */
const bcrypt = require('bcryptjs');
const pool = require('./pool');

const setupSQL = `
-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT '',
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  image_url VARCHAR(500) DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Featured items table (for storefront carousel)
CREATE TABLE IF NOT EXISTS featured_items (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  image_url VARCHAR(500) DEFAULT '',
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  show_original_price BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table: featured items can have multiple products (bundles)
CREATE TABLE IF NOT EXISTS featured_item_products (
  id SERIAL PRIMARY KEY,
  featured_item_id INTEGER NOT NULL REFERENCES featured_items(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(featured_item_id, product_id)
);

-- Indexes (CREATE INDEX IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_featured_items_sort ON featured_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_featured_items_active ON featured_items(is_active);
CREATE INDEX IF NOT EXISTS idx_fip_featured ON featured_item_products(featured_item_id);
CREATE INDEX IF NOT EXISTS idx_fip_product ON featured_item_products(product_id);
`;

async function initDatabase() {
  try {
    // Check if tables already exist
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'admins'
      );
    `);

    const tablesExist = tableCheck.rows[0].exists;

    if (tablesExist) {
      console.log('  ✅ Database tables already exist — skipping init');
      return;
    }

    console.log('  🔧 First run detected — creating database tables...');
    await pool.query(setupSQL);
    console.log('  ✅ Database tables created');

    // Seed initial data
    console.log('  🌱 Seeding initial data...');

    // Create default admin
    const passwordHash = await bcrypt.hash('admin123', 12);
    await pool.query(
      `INSERT INTO admins (email, password_hash, name, role) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      ['admin@mnmcubes.ph', passwordHash, 'MnM Admin', 'admin']
    );

    // Create categories
    const categories = [
      { name: '3x3', slug: '3x3', sort_order: 1 },
      { name: '2x2', slug: '2x2', sort_order: 2 },
      { name: '4x4', slug: '4x4', sort_order: 3 },
      { name: '5x5', slug: '5x5', sort_order: 4 },
      { name: 'Pyraminx', slug: 'pyraminx', sort_order: 5 },
      { name: 'Megaminx', slug: 'megaminx', sort_order: 6 },
      { name: 'Square-1', slug: 'square-1', sort_order: 7 },
      { name: 'Lubes', slug: 'lubes', sort_order: 8 },
      { name: 'Accessories', slug: 'accessories', sort_order: 9 },
    ];

    for (const cat of categories) {
      await pool.query(
        `INSERT INTO categories (name, slug, sort_order) 
         VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO NOTHING`,
        [cat.name, cat.slug, cat.sort_order]
      );
    }

    // Get category IDs
    const catResult = await pool.query('SELECT id, slug FROM categories');
    const catMap = {};
    catResult.rows.forEach((row) => {
      catMap[row.slug] = row.id;
    });

    // Create sample products
    const products = [
      { name: 'MoYu RS3M 2024', slug: 'moyu-rs3m-2024', description: 'Budget-friendly magnetic 3x3 speedcube. Great for beginners and intermediate cubers.', category_slug: '3x3', price: 450, stock: 25 },
      { name: 'QiYi Tornado V3 M', slug: 'qiyi-tornado-v3-m', description: 'Premium magnetic 3x3 with adjustable magnets and spring compression.', category_slug: '3x3', price: 850, stock: 12 },
      { name: 'GAN 356 M', slug: 'gan-356-m', description: 'Flagship GAN 3x3 with GAN Magnet System. Lightweight, fast, and incredibly smooth.', category_slug: '3x3', price: 1800, stock: 8 },
      { name: 'MoYu WeiLong WRM V9', slug: 'moyu-weilong-wrm-v9', description: 'Top-tier magnetic 3x3 with MagLev technology.', category_slug: '3x3', price: 1200, stock: 6 },
      { name: 'YJ MGC 3x3', slug: 'yj-mgc-3x3', description: 'Excellent mid-range magnetic 3x3. Great value for money.', category_slug: '3x3', price: 380, stock: 20 },
      { name: 'MoYu RS2M', slug: 'moyu-rs2m', description: 'Affordable magnetic 2x2 speedcube.', category_slug: '2x2', price: 280, stock: 15 },
      { name: 'QiYi MS 2x2 M', slug: 'qiyi-ms-2x2-m', description: 'Compact magnetic 2x2 with smooth performance.', category_slug: '2x2', price: 250, stock: 18 },
      { name: 'MoYu AoSu WRM V2', slug: 'moyu-aosu-wrm-v2', description: 'Premium magnetic 4x4 with smooth layers.', category_slug: '4x4', price: 1100, stock: 5 },
      { name: 'YJ MGC 4x4 M', slug: 'yj-mgc-4x4-m', description: 'Budget-friendly magnetic 4x4 with great performance.', category_slug: '4x4', price: 550, stock: 10 },
      { name: 'MoYu AoChuang WRM V2', slug: 'moyu-aochuang-wrm-v2', description: 'High-end magnetic 5x5 with smooth turning.', category_slug: '5x5', price: 1300, stock: 4 },
      { name: 'YJ MGC 5x5 M', slug: 'yj-mgc-5x5-m', description: 'Affordable magnetic 5x5 that punches above its weight.', category_slug: '5x5', price: 650, stock: 7 },
      { name: 'MoYu RS Pyraminx M', slug: 'moyu-rs-pyraminx-m', description: 'Magnetic pyraminx with smooth turning.', category_slug: 'pyraminx', price: 350, stock: 12 },
      { name: 'QiYi MS Pyraminx M', slug: 'qiyi-ms-pyraminx-m', description: 'Budget magnetic pyraminx with reliable performance.', category_slug: 'pyraminx', price: 280, stock: 15 },
      { name: 'YJ YuHu V2 M', slug: 'yj-yuhu-v2-m', description: 'Magnetic megaminx with smooth turning. Best budget option.', category_slug: 'megaminx', price: 750, stock: 3 },
      { name: 'DaYan Megaminx V2 M', slug: 'dayan-megaminx-v2-m', description: 'Premium magnetic megaminx with excellent performance.', category_slug: 'megaminx', price: 1100, stock: 2 },
      { name: 'MoYu RS Square-1 M', slug: 'moyu-rs-square-1-m', description: 'Magnetic Square-1 with smooth shape-shifting.', category_slug: 'square-1', price: 450, stock: 8 },
      { name: 'MoYu Lube (5ml)', slug: 'moyu-lube-5ml', description: 'General-purpose cube lubricant.', category_slug: 'lubes', price: 120, stock: 30 },
      { name: 'QiYi M-Lube (10ml)', slug: 'qiyi-m-lube-10ml', description: 'Silicone-based cube lubricant. Long-lasting smoothness.', category_slug: 'lubes', price: 180, stock: 25 },
      { name: 'Angstrom Gravitas', slug: 'angstrom-gravitas', description: 'Premium heavy cube lube for a controlled, gummy feel.', category_slug: 'lubes', price: 350, stock: 10 },
      { name: 'Cube Timer (YuXin)', slug: 'cube-timer-yuxin', description: 'Stackmat-compatible speed cube timer.', category_slug: 'accessories', price: 650, stock: 5 },
      { name: 'Cube Stand (Acrylic)', slug: 'cube-stand-acrylic', description: 'Clear acrylic display stand for your cube collection.', category_slug: 'accessories', price: 80, stock: 40 },
      { name: 'Cube Bag (Small)', slug: 'cube-bag-small', description: 'Padded carrying bag for 1-2 cubes.', category_slug: 'accessories', price: 150, stock: 20 },
      { name: 'Cube Mat (Competition Size)', slug: 'cube-mat-competition', description: 'Official competition-size solving mat. Non-slip surface.', category_slug: 'accessories', price: 350, stock: 0 },
    ];

    for (const product of products) {
      const categoryId = catMap[product.category_slug];
      await pool.query(
        `INSERT INTO products (name, slug, description, category_id, price, stock, image_url, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (slug) DO NOTHING`,
        [product.name, product.slug, product.description, categoryId, product.price, product.stock, '', true]
      );
    }

    console.log(`  ✅ ${products.length} products seeded`);
    console.log('  ✅ Admin: admin@mnmcubes.ph / admin123');
    console.log('  🎉 Database initialization complete!');
  } catch (error) {
    console.error('  ❌ Database init failed:', error.message);
    // Don't exit — let the server start anyway so we can debug via health endpoint
    throw error;
  }
}

module.exports = initDatabase;
