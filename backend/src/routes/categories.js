const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');

// Public
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);

// Protected (admin)
router.post('/', authenticate, categoryController.create);
router.put('/:id', authenticate, categoryController.update);
router.delete('/:id', authenticate, categoryController.remove);

module.exports = router;
