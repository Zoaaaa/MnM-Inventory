const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const { importUpload, imageUpload } = require('../middleware/upload');

// Admin routes (must come before :slug to avoid conflicts)
router.get('/admin/low-stock', authenticate, productController.getLowStock);
router.get('/admin/stats', authenticate, productController.getStats);
router.post('/import', authenticate, importUpload.single('file'), productController.importProducts);
router.post('/upload-image', authenticate, imageUpload.single('image'), productController.uploadImage);

// Public routes
router.get('/', productController.getAll);
router.get('/:slug', productController.getBySlug);

// Protected CRUD (admin)
router.post('/', authenticate, productController.create);
router.put('/:id', authenticate, productController.update);
router.patch('/:id/stock', authenticate, productController.updateStock);
router.delete('/:id', authenticate, productController.remove);

module.exports = router;
