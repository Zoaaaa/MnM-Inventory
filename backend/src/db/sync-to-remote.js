/**
 * Sync Local Database to Remote (Railway)
 * 
 * Usage: DATABASE_URL="postgresql://..." node src/db/sync-to-remote.js
 * 
 * This script:
 * 1. Reads all data from the LOCAL database
 * 2. Connects to the REMOTE database (via DATABASE_URL env var)
 * 3. Drops and recreates all tables on remote
 * 4. Inserts all local data into remote
 */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Local DB connection (from .env individual params)
const localPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'mnm_inventory',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

// Remote DB connection (from DATABASE_URL argument or env)
const remoteUrl = process.argv[2] || process.env.REMOTE_DATABASE_URL;
if (!remoteUrl) {
  console.error('❌ Usage: node src/db/sync-to-remote.js <DATABASE_URL>');
  console.error('   Or set REMOTE_DATABASE_URL in your .env');
  process.exit(1);
}

const remotePool = new Pool({
  connectionString: remoteUrl,
  ssl: { rejectUnauthorized: false },
});

const setupSQL = `
DROP TABLE IF EXISTS featured_item_products CASCADE;
DROP TABLE IF EXISTS featured_items CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT '',
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE products (
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

CREATE TABLE featured_items (
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

CREATE TABLE featured_item_products (
  id SERIAL PRIMARY KEY,
  featured_item_id INTEGER NOT NULL REFERENCES featured_items(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(featured_item_id, product_id)
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('english', name));
CREATE INDEX idx_featured_items_sort ON featured_items(sort_order);
CREATE INDEX idx_featured_items_active ON featured_items(is_active);
CREATE INDEX idx_fip_featured ON featured_item_products(featured_item_id);
CREATE INDEX idx_fip_product ON featured_item_products(product_id);
`;

async function sync() {
  try {
    console.log('📖 Reading local database...');

    // Read local data
    const localCategories = (await localPool.query('SELECT * FROM categories ORDER BY sort_order')).rows;
    const localProducts = (await localPool.query('SELECT * FROM products ORDER BY id')).rows;
    const localAdmins = (await localPool.query('SELECT * FROM admins')).rows;

    let localFeatured = [];
    let localFeaturedProducts = [];
    try {
      localFeatured = (await localPool.query('SELECT * FROM featured_items ORDER BY sort_order')).rows;
      localFeaturedProducts = (await localPool.query('SELECT * FROM featured_item_products ORDER BY id')).rows;
    } catch (e) {
      console.log('  ℹ️  No featured items table locally (skipping)');
    }

    console.log(`  📦 ${localCategories.length} categories`);
    console.log(`  📦 ${localProducts.length} products`);
    console.log(`  📦 ${localAdmins.length} admins`);
    console.log(`  📦 ${localFeatured.length} featured items`);

    // Connect to remote
    console.log('\n🔗 Connecting to remote database...');
    await remotePool.query('SELECT 1');
    console.log('  ✅ Connected to remote');

    // Recreate tables
    console.log('\n🔧 Recreating tables on remote...');
    await remotePool.query(setupSQL);
    console.log('  ✅ Tables created');

    // Insert admins (re-hash password for fresh admin)
    console.log('\n🌱 Syncing admins...');
    const passwordHash = await bcrypt.hash('admin123', 12);
    for (const admin of localAdmins) {
      await remotePool.query(
        `INSERT INTO admins (email, password_hash, name, role) VALUES ($1, $2, $3, $4)`,
        [admin.email, passwordHash, admin.name, admin.role]
      );
    }
    console.log(`  ✅ ${localAdmins.length} admins synced`);

    // Insert categories with their original IDs (important for foreign keys)
    console.log('\n🌱 Syncing categories...');
    for (const cat of localCategories) {
      await remotePool.query(
        `INSERT INTO categories (id, name, slug, sort_order, is_active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [cat.id, cat.name, cat.slug, cat.sort_order, cat.is_active, cat.created_at, cat.updated_at]
      );
    }
    // Reset sequence to max id
    const maxCatId = Math.max(...localCategories.map(c => c.id));
    await remotePool.query(`SELECT setval('categories_id_seq', $1)`, [maxCatId]);
    console.log(`  ✅ ${localCategories.length} categories synced`);

    // Insert products with their original IDs
    console.log('\n🌱 Syncing products...');
    for (const p of localProducts) {
      await remotePool.query(
        `INSERT INTO products (id, name, slug, description, category_id, price, stock, low_stock_threshold, image_url, is_active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [p.id, p.name, p.slug, p.description, p.category_id, p.price, p.stock, p.low_stock_threshold, p.image_url, p.is_active, p.created_at, p.updated_at]
      );
    }
    const maxProdId = Math.max(...localProducts.map(p => p.id));
    await remotePool.query(`SELECT setval('products_id_seq', $1)`, [maxProdId]);
    console.log(`  ✅ ${localProducts.length} products synced`);

    // Insert featured items
    if (localFeatured.length > 0) {
      console.log('\n🌱 Syncing featured items...');
      for (const f of localFeatured) {
        await remotePool.query(
          `INSERT INTO featured_items (id, title, description, image_url, price, stock, show_original_price, sort_order, is_active, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [f.id, f.title, f.description, f.image_url, f.price, f.stock, f.show_original_price, f.sort_order, f.is_active, f.created_at, f.updated_at]
        );
      }
      const maxFeatId = Math.max(...localFeatured.map(f => f.id));
      await remotePool.query(`SELECT setval('featured_items_id_seq', $1)`, [maxFeatId]);

      for (const fp of localFeaturedProducts) {
        await remotePool.query(
          `INSERT INTO featured_item_products (id, featured_item_id, product_id, sort_order) VALUES ($1, $2, $3, $4)`,
          [fp.id, fp.featured_item_id, fp.product_id, fp.sort_order]
        );
      }
      if (localFeaturedProducts.length > 0) {
        const maxFpId = Math.max(...localFeaturedProducts.map(fp => fp.id));
        await remotePool.query(`SELECT setval('featured_item_products_id_seq', $1)`, [maxFpId]);
      }
      console.log(`  ✅ ${localFeatured.length} featured items synced`);
    }

    console.log('\n🎉 Database sync complete!');
    console.log('   Admin login: admin@mnmcubes.ph / admin123');

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  } finally {
    await localPool.end();
    await remotePool.end();
  }
}

sync();
