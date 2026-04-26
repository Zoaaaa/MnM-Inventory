const pool = require('../db/pool');
const slugify = require('slugify');

/**
 * GET /api/categories
 * List all categories (public)
 */
async function getAll(req, res, next) {
  try {
    const { include_inactive } = req.query;
    
    let query = 'SELECT * FROM categories';
    if (!include_inactive) {
      query += ' WHERE is_active = true';
    }
    query += ' ORDER BY sort_order ASC, name ASC';

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/categories/:id
 * Get single category
 */
async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/categories
 * Create a new category (admin)
 */
async function create(req, res, next) {
  try {
    const { name, sort_order = 0, is_active = true } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.',
      });
    }

    const slug = slugify(name, { lower: true, strict: true });

    // Shift existing categories at or above this sort_order up by 1
    await pool.query(
      'UPDATE categories SET sort_order = sort_order + 1, updated_at = NOW() WHERE sort_order >= $1',
      [sort_order]
    );

    const result = await pool.query(
      `INSERT INTO categories (name, slug, sort_order, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), slug, sort_order, is_active]
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
 * PUT /api/categories/:id
 * Update a category (admin)
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { name, sort_order, is_active } = req.body;

    // Check if category exists
    const existing = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    const current = existing.rows[0];
    const updatedName = name !== undefined ? name.trim() : current.name;
    const updatedSlug = name !== undefined ? slugify(name, { lower: true, strict: true }) : current.slug;
    const updatedSortOrder = sort_order !== undefined ? sort_order : current.sort_order;
    const updatedIsActive = is_active !== undefined ? is_active : current.is_active;

    // If sort_order changed, shift other categories to make room
    if (sort_order !== undefined && sort_order !== current.sort_order) {
      if (sort_order < current.sort_order) {
        // Moving up: shift categories in [newOrder, oldOrder-1] down by 1
        await pool.query(
          'UPDATE categories SET sort_order = sort_order + 1, updated_at = NOW() WHERE sort_order >= $1 AND sort_order < $2 AND id != $3',
          [sort_order, current.sort_order, id]
        );
      } else {
        // Moving down: shift categories in [oldOrder+1, newOrder] up by 1
        await pool.query(
          'UPDATE categories SET sort_order = sort_order - 1, updated_at = NOW() WHERE sort_order > $1 AND sort_order <= $2 AND id != $3',
          [current.sort_order, sort_order, id]
        );
      }
    }

    const result = await pool.query(
      `UPDATE categories
       SET name = $1, slug = $2, sort_order = $3, is_active = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [updatedName, updatedSlug, updatedSortOrder, updatedIsActive, id]
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
 * DELETE /api/categories/:id
 * Delete a category (admin)
 */
async function remove(req, res, next) {
  try {
    const { id } = req.params;

    // Check if products exist in this category
    const productCount = await pool.query(
      'SELECT COUNT(*) FROM products WHERE category_id = $1',
      [id]
    );

    if (parseInt(productCount.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. ${productCount.rows[0].count} product(s) are assigned to it. Reassign or delete them first.`,
      });
    }

    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, getById, create, update, remove };
