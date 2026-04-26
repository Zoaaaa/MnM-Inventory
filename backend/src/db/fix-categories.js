/**
 * Fix categories - clean up and re-add with correct sort orders
 * Run: node src/db/fix-categories.js
 */
const pool = require('./pool');

async function fixCategories() {
  try {
    console.log('🔧 Cleaning up categories...');

    // First, unlink products from categories (set category_id to null)
    await pool.query('UPDATE products SET category_id = NULL');
    console.log('  ✅ Unlinked products from categories');

    // Delete all categories
    await pool.query('DELETE FROM categories');
    console.log('  ✅ Deleted all categories');

    // Insert new categories with correct sort orders
    const categories = [
      { name: '2x2', slug: '2x2', sort_order: 1 },
      { name: '3x3', slug: '3x3', sort_order: 2 },
      { name: '4x4', slug: '4x4', sort_order: 3 },
      { name: '5x5', slug: '5x5', sort_order: 4 },
      { name: '6x6', slug: '6x6', sort_order: 5 },
      { name: '7x7', slug: '7x7', sort_order: 6 },
      { name: 'Megaminx', slug: 'megaminx', sort_order: 7 },
      { name: 'Pyraminx', slug: 'pyraminx', sort_order: 8 },
      { name: 'Skewb', slug: 'skewb', sort_order: 9 },
      { name: 'Square-1', slug: 'square-1', sort_order: 10 },
      { name: 'Clock', slug: 'clock', sort_order: 11 },
      { name: 'Non-WCA', slug: 'non-wca', sort_order: 12 },
    ];

    for (const cat of categories) {
      await pool.query(
        'INSERT INTO categories (name, slug, sort_order, is_active) VALUES ($1, $2, $3, true)',
        [cat.name, cat.slug, cat.sort_order]
      );
    }
    console.log(`  ✅ Created ${categories.length} categories`);

    // Now re-link products to matching categories based on the seed data mapping
    const catResult = await pool.query('SELECT id, slug FROM categories');
    const catMap = {};
    catResult.rows.forEach((row) => {
      catMap[row.slug] = row.id;
    });

    // Re-link existing products by matching their old category names
    const productMappings = [
      { pattern: '%3x3%', category: '3x3' },
      { pattern: '%2x2%', category: '2x2' },
      { pattern: '%4x4%', category: '4x4' },
      { pattern: '%5x5%', category: '5x5' },
      { pattern: '%pyraminx%', category: 'pyraminx' },
      { pattern: '%megaminx%', category: 'megaminx' },
      { pattern: '%square%', category: 'square-1' },
    ];

    for (const mapping of productMappings) {
      if (catMap[mapping.category]) {
        const result = await pool.query(
          'UPDATE products SET category_id = $1 WHERE LOWER(slug) LIKE $2 AND category_id IS NULL',
          [catMap[mapping.category], mapping.pattern]
        );
        if (result.rowCount > 0) {
          console.log(`  ✅ Linked ${result.rowCount} product(s) to ${mapping.category}`);
        }
      }
    }

    // Show final state
    const finalCategories = await pool.query('SELECT name, slug, sort_order FROM categories ORDER BY sort_order');
    console.log('\n📋 Categories:');
    finalCategories.rows.forEach((cat) => {
      console.log(`  ${cat.sort_order}. ${cat.name} (${cat.slug})`);
    });

    console.log('\n🎉 Categories fixed!');
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixCategories();
