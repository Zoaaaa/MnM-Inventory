const express = require('express');
const router = express.Router();
const featuredController = require('../controllers/featuredController');
const { authenticate } = require('../middleware/auth');

// Public route
router.get('/', featuredController.getAll);

// Admin routes
router.get('/admin', authenticate, featuredController.adminGetAll);
router.post('/', authenticate, featuredController.create);
router.put('/reorder', authenticate, featuredController.reorder);
router.put('/:id', authenticate, featuredController.update);
router.delete('/:id', authenticate, featuredController.remove);

module.exports = router;
