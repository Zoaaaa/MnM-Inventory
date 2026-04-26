const pool = require('../db/pool');
const slugify = require('slugify');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

/**
 * GET /api/products
 * List products with filtering, search, sort, pagination (public)
 */
async function getAll(req, res, next) {
  try {
    const {
      category,
      search,
      sort = 'name',
      order = 'asc',
      page = 1,
      limit = 50,
      active_only = 'true',
    } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    // Only show active products for public
    if (active_only === 'true') {
      conditions.push(`p.is_active = true`);
    }

    // Category filter (by slug or id)
    if (category) {
      conditions.push(`(c.slug = $${paramIndex} OR c.id::text = $${paramIndex})`);
      params.push(category);
      paramIndex++;
    }

    // Search filter
    if (search) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Sort options
    const sortMap = {
      name: 'p.name',
      price: 'p.price',
      stock: 'p.stock',
      newest: 'p.created_at',
      category: 'c.name',
    };
    const sortColumn = sortMap[sort] || 'p.name';
    const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Count total
    const countQuery = `
      SELECT COUNT(*) FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get products
    const query = `
      SELECT 
        p.id, p.name, p.slug, p.description, p.price, p.stock, 
        p.low_stock_threshold, p.image_url, p.is_active,
        p.created_at, p.updated_at,
        p.category_id,
        c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limitNum, offset);

    const result = await pool.query(query, params);

    // Add stock status to each product
    const products = result.rows.map((p) => ({
      ...p,
      stock_status: getStockStatus(p.stock, p.low_stock_threshold),
    }));

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/products/:slug
 * Get single product by slug (public)
 */
async function getBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `SELECT 
        p.*, 
        c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = $1`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const product = {
      ...result.rows[0],
      stock_status: getStockStatus(result.rows[0].stock, result.rows[0].low_stock_threshold),
    };

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/products
 * Create a new product (admin)
 */
async function create(req, res, next) {
  try {
    const {
      name,
      description = '',
      category_id,
      price,
      stock = 0,
      low_stock_threshold = 5,
      image_url = '',
      is_active = true,
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }
    if (price === undefined || price === null || price < 0) {
      return res.status(400).json({ success: false, message: 'Valid price is required.' });
    }

    const slug = slugify(name, { lower: true, strict: true });

    // Check for duplicate slug
    const existing = await pool.query('SELECT id FROM products WHERE slug = $1', [slug]);
    let finalSlug = slug;
    if (existing.rows.length > 0) {
      finalSlug = slug + '-' + Date.now();
    }

    const result = await pool.query(
      `INSERT INTO products (name, slug, description, category_id, price, stock, low_stock_threshold, image_url, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [name.trim(), finalSlug, description, category_id || null, price, stock, low_stock_threshold, image_url, is_active]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/products/:id
 * Update a product (admin)
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category_id,
      price,
      stock,
      low_stock_threshold,
      image_url,
      is_active,
    } = req.body;

    // Check if product exists
    const existing = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const current = existing.rows[0];
    const updatedName = name !== undefined ? name.trim() : current.name;
    const updatedSlug = name !== undefined ? slugify(name, { lower: true, strict: true }) : current.slug;
    const updatedDescription = description !== undefined ? description : current.description;
    const updatedCategoryId = category_id !== undefined ? (category_id || null) : current.category_id;
    const updatedPrice = price !== undefined ? price : current.price;
    const updatedStock = stock !== undefined ? stock : current.stock;
    const updatedThreshold = low_stock_threshold !== undefined ? low_stock_threshold : current.low_stock_threshold;
    const updatedImageUrl = image_url !== undefined ? image_url : current.image_url;
    const updatedIsActive = is_active !== undefined ? is_active : current.is_active;

    const result = await pool.query(
      `UPDATE products 
       SET name = $1, slug = $2, description = $3, category_id = $4, 
           price = $5, stock = $6, low_stock_threshold = $7, image_url = $8, 
           is_active = $9, updated_at = NOW()
       WHERE id = $10 
       RETURNING *`,
      [updatedName, updatedSlug, updatedDescription, updatedCategoryId,
       updatedPrice, updatedStock, updatedThreshold, updatedImageUrl,
       updatedIsActive, id]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/products/:id/stock
 * Quick stock update (admin)
 */
async function updateStock(req, res, next) {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (stock === undefined || stock === null || stock < 0) {
      return res.status(400).json({ success: false, message: 'Valid stock value is required.' });
    }

    const result = await pool.query(
      'UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, stock, low_stock_threshold',
      [stock, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = result.rows[0];
    res.json({
      success: true,
      data: {
        ...product,
        stock_status: getStockStatus(product.stock, product.low_stock_threshold),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/products/:id
 * Delete a product (admin)
 */
async function remove(req, res, next) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/products/admin/low-stock
 * Get products with low stock (admin)
 */
async function getLowStock(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT 
        p.*, 
        c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.stock <= p.low_stock_threshold AND p.is_active = true
       ORDER BY p.stock ASC`
    );

    const products = result.rows.map((p) => ({
      ...p,
      stock_status: getStockStatus(p.stock, p.low_stock_threshold),
    }));

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/products/admin/stats
 * Get product statistics (admin)
 */
async function getStats(req, res, next) {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE is_active = true) as active_products,
        COUNT(*) FILTER (WHERE stock = 0) as out_of_stock,
        COUNT(*) FILTER (WHERE stock > 0 AND stock <= low_stock_threshold) as low_stock,
        COALESCE(SUM(stock * price), 0) as total_inventory_value
      FROM products
    `);

    res.json({
      success: true,
      data: stats.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/products/import
 * Import products from CSV/Excel (admin)
 */
async function importProducts(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    if (data.length === 0) {
      return res.status(400).json({ success: false, message: 'File is empty.' });
    }

    // Get category map
    const catResult = await pool.query('SELECT id, name, slug FROM categories');
    const catMap = {};
    catResult.rows.forEach((row) => {
      catMap[row.name.toLowerCase()] = row.id;
      catMap[row.slug.toLowerCase()] = row.id;
    });

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // Account for header row

      try {
        const name = (row.name || row.Name || row.PRODUCT || row.product || '').toString().trim();
        if (!name) {
          errors.push(`Row ${rowNum}: Missing product name`);
          skipped++;
          continue;
        }

        const categoryName = (row.category || row.Category || row.CATEGORY || '').toString().trim().toLowerCase();
        const categoryId = catMap[categoryName] || null;

        const price = parseFloat(row.price || row.Price || row.PRICE || 0);
        const stock = parseInt(row.stock || row.Stock || row.STOCK || 0);
        const description = (row.description || row.Description || row.DESCRIPTION || '').toString().trim();

        if (isNaN(price) || price < 0) {
          errors.push(`Row ${rowNum}: Invalid price for "${name}"`);
          skipped++;
          continue;
        }

        const slug = slugify(name, { lower: true, strict: true });

        // Upsert: update if slug exists, insert if not
        await pool.query(
          `INSERT INTO products (name, slug, description, category_id, price, stock, is_active) 
           VALUES ($1, $2, $3, $4, $5, $6, true)
           ON CONFLICT (slug) DO UPDATE SET 
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             category_id = EXCLUDED.category_id,
             price = EXCLUDED.price,
             stock = EXCLUDED.stock,
             updated_at = NOW()`,
          [name, slug, description, categoryId, price, stock]
        );

        imported++;
      } catch (err) {
        errors.push(`Row ${rowNum}: ${err.message}`);
        skipped++;
      }
    }

    res.json({
      success: true,
      data: {
        total: data.length,
        imported,
        skipped,
        errors: errors.slice(0, 20), // Limit error messages
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/products/upload-image
 * Upload a product image and return the URL (admin)
 */
async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    // Build the URL path for the uploaded image
    const imageUrl = `/uploads/images/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        image_url: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Helper: Determine stock status
 */
function getStockStatus(stock, threshold = 5) {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= threshold) return 'low_stock';
  return 'in_stock';
}

module.exports = {
  getAll,
  getBySlug,
  create,
  update,
  updateStock,
  remove,
  getLowStock,
  getStats,
  importProducts,
  uploadImage,
};
