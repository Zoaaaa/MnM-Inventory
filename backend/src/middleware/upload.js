const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const config = require('../config');

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

/**
 * File upload configuration for CSV/Excel imports
 * These are temporary files processed and deleted immediately, so disk storage is fine.
 */
const importStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'import-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const importUpload = multer({
  storage: importStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  },
});

/**
 * File upload configuration for product images
 * Uses memory storage (buffer) so we can stream directly to Cloudinary.
 */
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, GIF, WebP) are allowed'));
    }
  },
});

/**
 * Upload a buffer to Cloudinary
 * Returns a promise that resolves with the Cloudinary upload result.
 *
 * @param {Buffer} buffer - The file buffer from multer
 * @param {object} options - Cloudinary upload options
 * @returns {Promise<object>} Cloudinary upload result
 */
function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: config.cloudinary.folder,
      resource_type: 'image',
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Write the buffer to the upload stream
    uploadStream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by its public_id
 *
 * @param {string} publicId - The Cloudinary public_id of the image
 * @returns {Promise<object>} Cloudinary deletion result
 */
function deleteFromCloudinary(publicId) {
  return cloudinary.uploader.destroy(publicId);
}

/**
 * Extract the public_id from a Cloudinary URL
 * e.g., "https://res.cloudinary.com/demo/image/upload/v123/mnm-cubes/product-abc.jpg"
 * returns "mnm-cubes/product-abc"
 *
 * @param {string} url - The Cloudinary URL
 * @returns {string|null} The public_id or null if not a Cloudinary URL
 */
function getPublicIdFromUrl(url) {
  if (!url || !url.includes('cloudinary.com')) return null;

  try {
    // Match the path after /upload/vXXXX/ or /upload/
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

module.exports = {
  importUpload,
  imageUpload,
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
};
