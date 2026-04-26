/**
 * Migration: Add featured_items and featured_item_products tables
 * Run: node src/db/migrate-featured.js
 */
const pool = require('./pool');

const migrationSQL = `
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

-- Drop old product_id column if it exists (from previous schema)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'featured_items' AND column_name = 'product_id'
  ) THEN
    INSERT INTO featured_item_products (featured_item_id, product_id, sort_order)
    SELECT id, product_id, 0 FROM featured_items WHERE product_id IS NOT NULL
    ON CONFLICT DO NOTHING;
    
    ALTER TABLE featured_items DROP COLUMN product_id;
  END IF;
END $$;

-- Add price column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'featured_items' AND column_name = 'price'
  ) THEN
    ALTER TABLE featured_items ADD COLUMN price DECIMAL(10, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add show_original_price column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'featured_items' AND column_name = 'show_original_price'
  ) THEN
    ALTER TABLE featured_items ADD COLUMN show_original_price BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add stock column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'featured_items' AND column_name = 'stock'
  ) THEN
    ALTER TABLE featured_items ADD COLUMN stock INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_featured_items_sort ON featured_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_featured_items_active ON featured_items(is_active);
CREATE INDEX IF NOT EXISTS idx_fip_featured ON featured_item_products(featured_item_id);
CREATE INDEX IF NOT EXISTS idx_fip_product ON featured_item_products(product_id);
`;

async function migrate() {
  try {
    console.log('🔧 Running featured_items migration...');
    await pool.query(migrationSQL);
    console.log('✅ featured_items tables created/updated successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
