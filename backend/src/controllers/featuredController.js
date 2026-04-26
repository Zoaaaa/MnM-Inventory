const pool = require('../db/pool');

/**
 * Helper: Load products for featured items
 * Returns a map of featured_item_id -> [products]
 */
async function loadFeaturedProducts(featuredIds) {
  if (featuredIds.length === 0) return {};

  const result = await pool.query(
    `SELECT 
      fip.featured_item_id,
      fip.sort_order as fip_sort_order,
      p.id, p.name, p.slug, p.description as product_description, 
      p.price, p.stock, p.low_stock_threshold, 
      p.image_url, p.is_active,
      c.name as category_name
    FROM featured_item_products fip
    JOIN products p ON fip.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE fip.featured_item_id = ANY($1)
    ORDER BY fip.sort_order ASC, p.name ASC`,
    [featuredIds]
  );

  const map = {};
  for (const row of result.rows) {
    if (!map[row.featured_item_id]) {
      map[row.featured_item_id] = [];
    }
    map[row.featured_item_id].push({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.product_description,
      price: row.price,
      stock: row.stock,
      low_stock_threshold: row.low_stock_threshold,
      image_url: row.image_url,
      is_active: row.is_active,
      category_name: row.category_name,
      stock_status: getStockStatus(row.stock, row.low_stock_threshold),
    });
  }
  return map;
}

/**
 * GET /api/featured
 * List active featured items with product data (public)
 */
async function getAll(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, title, description, image_url, price, stock, show_original_price,
              sort_order, is_active, created_at, updated_at
       FROM featured_items
       WHERE is_active = true
       ORDER BY sort_order ASC, created_at DESC`
    );

    const featuredIds = result.rows.map((r) => r.id);
    const productsMap = await loadFeaturedProducts(featuredIds);

    const items = result.rows.map((row) => {
      const products = productsMap[row.id] || [];
      const originalPrice = products.reduce((sum, p) => sum + parseFloat(p.price), 0);

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        image_url: row.image_url,
        price: parseFloat(row.price),
        stock: row.stock,
        show_original_price: row.show_original_price,
        original_price: originalPrice,
        sort_order: row.sort_order,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        products,
        stock_status: getStockStatus(row.stock, 5),
      };
    });

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/featured/admin
 * List all featured items including inactive (admin)
 */
async function adminGetAll(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, title, description, image_url, price, stock, show_original_price,
              sort_order, is_active, created_at, updated_at
       FROM featured_items
       ORDER BY sort_order ASC, created_at DESC`
    );

    const featuredIds = result.rows.map((r) => r.id);
    const productsMap = await loadFeaturedProducts(featuredIds);

    const items = result.rows.map((row) => {
      const products = productsMap[row.id] || [];
      const originalPrice = products.reduce((sum, p) => sum + parseFloat(p.price), 0);

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        image_url: row.image_url,
        price: parseFloat(row.price),
        stock: row.stock,
        show_original_price: row.show_original_price,
        original_price: originalPrice,
        sort_order: row.sort_order,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        products,
        product_ids: products.map((p) => p.id),
      };
    });

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/featured
 * Create a featured item (admin)
 */
async function create(req, res, next) {
  try {
    const {
      product_ids = [],
      title = '',
      description = '',
      image_url = '',
      price = 0,
      stock = 0,
      show_original_price = false,
      is_active = true,
    } = req.body;

    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one product is required.' });
    }

    if (!title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    if (price === undefined || price === null || parseFloat(price) < 0) {
      return res.status(400).json({ success: false, message: 'Valid price is required.' });
    }

    // Verify all products exist
    const productCheck = await pool.query(
      'SELECT id FROM products WHERE id = ANY($1)',
      [product_ids]
    );
    if (productCheck.rows.length !== product_ids.length) {
      return res.status(400).json({ success: false, message: 'One or more products not found.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get next sort_order
      const maxOrder = await client.query('SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM featured_items');
      const sort_order = maxOrder.rows[0].next_order;

      // Insert featured item
      const result = await client.query(
        `INSERT INTO featured_items (title, description, image_url, price, stock, show_original_price, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [title.trim(), description, image_url, parseFloat(price), parseInt(stock, 10), show_original_price, sort_order, is_active]
      );

      const featuredItem = result.rows[0];

      // Insert product associations
      for (let i = 0; i < product_ids.length; i++) {
        await client.query(
          'INSERT INTO featured_item_products (featured_item_id, product_id, sort_order) VALUES ($1, $2, $3)',
          [featuredItem.id, product_ids[i], i]
        );
      }

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        data: { ...featuredItem, product_ids },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/featured/:id
 * Update a featured item (admin)
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, image_url, product_ids, price, stock, show_original_price, is_active } = req.body;

    const existing = await pool.query('SELECT * FROM featured_items WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Featured item not found.' });
    }

    const current = existing.rows[0];
    const updatedTitle = title !== undefined ? title : current.title;
    const updatedDescription = description !== undefined ? description : current.description;
    const updatedImageUrl = image_url !== undefined ? image_url : current.image_url;
    const updatedPrice = price !== undefined ? parseFloat(price) : parseFloat(current.price);
    const updatedStock = stock !== undefined ? parseInt(stock, 10) : current.stock;
    const updatedShowOriginal = show_original_price !== undefined ? show_original_price : current.show_original_price;
    const updatedIsActive = is_active !== undefined ? is_active : current.is_active;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE featured_items
         SET title = $1, description = $2, image_url = $3, price = $4, stock = $5,
             show_original_price = $6, is_active = $7, updated_at = NOW()
         WHERE id = $8
         RETURNING *`,
        [updatedTitle, updatedDescription, updatedImageUrl, updatedPrice, updatedStock, updatedShowOriginal, updatedIsActive, id]
      );

      // Update product associations if provided
      if (Array.isArray(product_ids)) {
        if (product_ids.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ success: false, message: 'At least one product is required.' });
        }

        // Remove old associations
        await client.query('DELETE FROM featured_item_products WHERE featured_item_id = $1', [id]);

        // Insert new associations
        for (let i = 0; i < product_ids.length; i++) {
          await client.query(
            'INSERT INTO featured_item_products (featured_item_id, product_id, sort_order) VALUES ($1, $2, $3)',
            [id, product_ids[i], i]
          );
        }
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/featured/reorder
 * Reorder featured items (admin)
 */
async function reorder(req, res, next) {
  try {
    const { order } = req.body;

    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ success: false, message: 'Order array is required.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of order) {
        await client.query(
          'UPDATE featured_items SET sort_order = $1, updated_at = NOW() WHERE id = $2',
          [item.sort_order, item.id]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({
      success: true,
      message: 'Featured items reordered successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/featured/:id
 * Remove a featured item (admin)
 */
async function remove(req, res, next) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM featured_items WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Featured item not found.' });
    }

    res.json({
      success: true,
      message: 'Featured item removed successfully.',
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
  adminGetAll,
  create,
  update,
  reorder,
  remove,
};
