/**
 * Database Seed Script
 * Populates initial data for MnM Inventory
 * Run: npm run db:seed
 */
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Create default admin
    const passwordHash = await bcrypt.hash('admin123', 12);
    await pool.query(
      `INSERT INTO admins (email, password_hash, name, role) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      ['admin@mnmcubes.ph', passwordHash, 'MnM Admin', 'admin']
    );
    console.log('  ✅ Admin user created (admin@mnmcubes.ph / admin123)');

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
    console.log('  ✅ Categories created');

    // Get category IDs
    const catResult = await pool.query('SELECT id, slug FROM categories');
    const catMap = {};
    catResult.rows.forEach((row) => {
      catMap[row.slug] = row.id;
    });

    // Create sample products
    const products = [
      // 3x3
      {
        name: 'MoYu RS3M 2024',
        slug: 'moyu-rs3m-2024',
        description: 'Budget-friendly magnetic 3x3 speedcube. Great for beginners and intermediate cubers. Smooth turning with excellent corner cutting.',
        category_slug: '3x3',
        price: 450,
        stock: 25,
      },
      {
        name: 'QiYi Tornado V3 M',
        slug: 'qiyi-tornado-v3-m',
        description: 'Premium magnetic 3x3 with adjustable magnets and spring compression. Competition-ready performance.',
        category_slug: '3x3',
        price: 850,
        stock: 12,
      },
      {
        name: 'GAN 356 M',
        slug: 'gan-356-m',
        description: 'Flagship GAN 3x3 with GAN Magnet System. Lightweight, fast, and incredibly smooth.',
        category_slug: '3x3',
        price: 1800,
        stock: 8,
      },
      {
        name: 'MoYu WeiLong WRM V9',
        slug: 'moyu-weilong-wrm-v9',
        description: 'Top-tier magnetic 3x3 with MagLev technology. Used by world-class speedcubers.',
        category_slug: '3x3',
        price: 1200,
        stock: 6,
      },
      {
        name: 'YJ MGC 3x3',
        slug: 'yj-mgc-3x3',
        description: 'Excellent mid-range magnetic 3x3. Great value for money with competition-level performance.',
        category_slug: '3x3',
        price: 380,
        stock: 20,
      },
      // 2x2
      {
        name: 'MoYu RS2M',
        slug: 'moyu-rs2m',
        description: 'Affordable magnetic 2x2 speedcube. Perfect for learning and casual solving.',
        category_slug: '2x2',
        price: 280,
        stock: 15,
      },
      {
        name: 'QiYi MS 2x2 M',
        slug: 'qiyi-ms-2x2-m',
        description: 'Compact magnetic 2x2 with smooth performance. Great pocket cube.',
        category_slug: '2x2',
        price: 250,
        stock: 18,
      },
      // 4x4
      {
        name: 'MoYu AoSu WRM V2',
        slug: 'moyu-aosu-wrm-v2',
        description: 'Premium magnetic 4x4 with smooth layers and excellent stability.',
        category_slug: '4x4',
        price: 1100,
        stock: 5,
      },
      {
        name: 'YJ MGC 4x4 M',
        slug: 'yj-mgc-4x4-m',
        description: 'Budget-friendly magnetic 4x4 with great performance for its price.',
        category_slug: '4x4',
        price: 550,
        stock: 10,
      },
      // 5x5
      {
        name: 'MoYu AoChuang WRM V2',
        slug: 'moyu-aochuang-wrm-v2',
        description: 'High-end magnetic 5x5 with smooth turning and excellent corner cutting.',
        category_slug: '5x5',
        price: 1300,
        stock: 4,
      },
      {
        name: 'YJ MGC 5x5 M',
        slug: 'yj-mgc-5x5-m',
        description: 'Affordable magnetic 5x5 that punches above its weight class.',
        category_slug: '5x5',
        price: 650,
        stock: 7,
      },
      // Pyraminx
      {
        name: 'MoYu RS Pyraminx M',
        slug: 'moyu-rs-pyraminx-m',
        description: 'Magnetic pyraminx with smooth turning. Great for beginners and competitors.',
        category_slug: 'pyraminx',
        price: 350,
        stock: 12,
      },
      {
        name: 'QiYi MS Pyraminx M',
        slug: 'qiyi-ms-pyraminx-m',
        description: 'Budget magnetic pyraminx with reliable performance.',
        category_slug: 'pyraminx',
        price: 280,
        stock: 15,
      },
      // Megaminx
      {
        name: 'YJ YuHu V2 M',
        slug: 'yj-yuhu-v2-m',
        description: 'Magnetic megaminx with smooth turning and great stability. Best budget option.',
        category_slug: 'megaminx',
        price: 750,
        stock: 3,
      },
      {
        name: 'DaYan Megaminx V2 M',
        slug: 'dayan-megaminx-v2-m',
        description: 'Premium magnetic megaminx with excellent performance.',
        category_slug: 'megaminx',
        price: 1100,
        stock: 2,
      },
      // Square-1
      {
        name: 'MoYu RS Square-1 M',
        slug: 'moyu-rs-square-1-m',
        description: 'Magnetic Square-1 with smooth shape-shifting. Great for learning this unique puzzle.',
        category_slug: 'square-1',
        price: 450,
        stock: 8,
      },
      // Lubes
      {
        name: 'MoYu Lube (5ml)',
        slug: 'moyu-lube-5ml',
        description: 'General-purpose cube lubricant. Makes your cube smoother and faster.',
        category_slug: 'lubes',
        price: 120,
        stock: 30,
      },
      {
        name: 'QiYi M-Lube (10ml)',
        slug: 'qiyi-m-lube-10ml',
        description: 'Silicone-based cube lubricant. Long-lasting smoothness.',
        category_slug: 'lubes',
        price: 180,
        stock: 25,
      },
      {
        name: 'Angstrom Gravitas',
        slug: 'angstrom-gravitas',
        description: 'Premium heavy cube lube for a controlled, gummy feel. Competition favorite.',
        category_slug: 'lubes',
        price: 350,
        stock: 10,
      },
      // Accessories
      {
        name: 'Cube Timer (YuXin)',
        slug: 'cube-timer-yuxin',
        description: 'Stackmat-compatible speed cube timer. Essential for tracking your solves.',
        category_slug: 'accessories',
        price: 650,
        stock: 5,
      },
      {
        name: 'Cube Stand (Acrylic)',
        slug: 'cube-stand-acrylic',
        description: 'Clear acrylic display stand for your cube collection.',
        category_slug: 'accessories',
        price: 80,
        stock: 40,
      },
      {
        name: 'Cube Bag (Small)',
        slug: 'cube-bag-small',
        description: 'Padded carrying bag for 1-2 cubes. Protect your puzzles on the go.',
        category_slug: 'accessories',
        price: 150,
        stock: 20,
      },
      {
        name: 'Cube Mat (Competition Size)',
        slug: 'cube-mat-competition',
        description: 'Official competition-size solving mat. Non-slip surface for smooth solves.',
        category_slug: 'accessories',
        price: 350,
        stock: 0,
      },
    ];

    for (const product of products) {
      const categoryId = catMap[product.category_slug];
      await pool.query(
        `INSERT INTO products (name, slug, description, category_id, price, stock, image_url, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (slug) DO NOTHING`,
        [
          product.name,
          product.slug,
          product.description,
          categoryId,
          product.price,
          product.stock,
          '',
          true,
        ]
      );
    }
    console.log(`  ✅ ${products.length} products created`);

    console.log('🎉 Database seeded successfully!');
    console.log('\n📋 Default admin credentials:');
    console.log('   Email: admin@mnmcubes.ph');
    console.log('   Password: admin123');
    console.log('   ⚠️  Change this password after first login!\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
