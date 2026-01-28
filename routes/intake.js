import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { body, validationResult } from 'express-validator';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import duplicateDetector from '../lib/dedup.js';
import { auth, requireRole } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/products');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { files: 10, fileSize: 5 * 1024 * 1024 } // 5MB per file
});

/**
 * POST /api/intake/product
 * Add a new product with duplicate detection
 */
router.post('/product', auth, requireRole(['admin', 'caregiver', 'helper']), 
  upload.array('images', 10),
  [
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').isMongoId().withMessage('Valid category ID required'),
    body('condition').optional().isIn(['new', 'like-new', 'good', 'fair', 'acceptable']),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('storageLocation.unitId').optional().trim(),
    body('storageLocation.facilityName').optional().trim(),
    body('upc').optional().trim(),
    body('brand').optional().trim(),
    body('model').optional().trim()
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          errors: errors.array(),
          message: 'Validation failed'
        });
      }

      const {
        title,
        brand,
        model,
        upc,
        description,
        condition = 'new',
        price,
        quantity = 1,
        category,
        collections = [],
        tags = [],
        storageLocation = {},
        source = 'family-duplicate'
      } = req.body;

      // Get user's seller profile (assuming admin/caregiver has access to Mom's profile)
      // For now, we'll use the first seller profile
      const sellerProfile = await User.findById(req.user.id).populate('sellerProfile');
      if (!sellerProfile) {
        return res.status(400).json({ message: 'Seller profile required' });
      }

      // Process uploaded images
      let processedImages = [];
      if (req.files && req.files.length > 0) {
        processedImages = await Promise.all(req.files.map(async (file, index) => {
          // Create thumbnail
          const thumbnailPath = file.path.replace(/\.[^/.]+$/, '_thumb.jpg');
          await sharp(file.path)
            .resize(300, 300, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);

          return {
            url: `/uploads/products/${path.basename(file.path)}`,
            alt: `${title} - Image ${index + 1}`,
            isPrimary: index === 0, // First image is primary
            thumbnail: `/uploads/products/${path.basename(thumbnailPath)}`
          };
        }));
      }

      // Check for duplicates
      const duplicateCandidates = await duplicateDetector.findDuplicateCandidates({
        title,
        brand,
        model,
        upc,
        price,
        category,
        sellerProfile: sellerProfile.sellerProfile._id
      });

      let product;
      let action = 'created';

      // If high-confidence duplicate found, merge or increment
      if (duplicateCandidates.length > 0 && duplicateCandidates[0].score >= 0.8) {
        const candidate = duplicateCandidates[0];
        
        if (candidate.reason === 'Exact UPC match') {
          // Exact match - increment quantity
          candidate.product.quantity += quantity;
          candidate.product.duplicateScore = Math.max(candidate.product.duplicateScore, candidate.score);
          
          // Add new images if they're better/different
          const existingUrls = candidate.product.images.map(img => img.url);
          processedImages.forEach(img => {
            if (!existingUrls.includes(img.url)) {
              candidate.product.images.push(img);
            }
          });
          
          await candidate.product.save();
          product = candidate.product;
          action = 'merged';
        } else {
          // High similarity - create new product but flag as duplicate
          product = await Product.create({
            title,
            brand,
            model,
            upc,
            description,
            condition,
            price,
            quantity,
            category,
            collections: [...collections, 'Re-Home the Duplicates'],
            tags,
            images: processedImages,
            source,
            sellerProfile: sellerProfile.sellerProfile._id,
            duplicateScore: candidate.score,
            status: 'draft' // Keep as draft for review
          });
          action = 'flagged';
        }
      } else {
        // No duplicate - create new product
        product = await Product.create({
          title,
          brand,
          model,
          upc,
          description,
          condition,
          price,
          quantity,
          category,
          collections,
          tags,
          images: processedImages,
          source,
          sellerProfile: sellerProfile.sellerProfile._id,
          status: 'draft'
        });
      }

      res.status(201).json({
        success: true,
        action,
        product: await product.populate(['category', 'sellerProfile']),
        duplicateCandidates: duplicateCandidates.slice(0, 3), // Return top 3 candidates
        message: action === 'created' ? 'Product created successfully' :
                 action === 'merged' ? 'Product merged with existing item' :
                 'Product created - possible duplicate detected'
      });

    } catch (error) {
      console.error('Product intake error:', error);
      res.status(500).json({ 
        message: 'Failed to create product',
        error: error.message 
      });
    }
  }
);

/**
 * POST /api/intake/batch
 * Add multiple products from bulk data
 */
router.post('/batch', auth, requireRole(['admin', 'caregiver']), 
  [
    body('products').isArray().withMessage('Products must be an array'),
    body('products.*.title').trim().isLength({ min: 3 }),
    body('products.*.price').isFloat({ min: 0 }),
    body('products.*.category').isMongoId()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { products } = req.body;
      const results = [];
      
      for (const productData of products) {
        try {
          // Check for duplicates first
          const duplicateCandidates = await duplicateDetector.findDuplicateCandidates(productData);
          
          let result;
          if (duplicateCandidates.length > 0 && duplicateCandidates[0].score >= 0.8) {
            // Merge with existing
            const candidate = duplicateCandidates[0];
            candidate.product.quantity += productData.quantity || 1;
            await candidate.product.save();
            
            result = {
              action: 'merged',
              productId: candidate.product._id,
              duplicateScore: candidate.score
            };
          } else {
            // Create new
            const product = await Product.create({
              ...productData,
              status: 'draft',
              collections: [...(productData.collections || []), 'Re-Home the Duplicates']
            });
            
            result = {
              action: 'created',
              productId: product._id,
              duplicateScore: 0
            };
          }
          
          results.push(result);
        } catch (error) {
          results.push({
            action: 'error',
            error: error.message,
            data: productData
          });
        }
      }

      res.json({
        success: true,
        results,
        summary: {
          total: products.length,
          created: results.filter(r => r.action === 'created').length,
          merged: results.filter(r => r.action === 'merged').length,
          errors: results.filter(r => r.action === 'error').length
        }
      });

    } catch (error) {
      console.error('Batch intake error:', error);
      res.status(500).json({ message: 'Batch intake failed', error: error.message });
    }
  }
);

/**
 * GET /api/intake/check-duplicate
 * Check if a product might be a duplicate
 */
router.get('/check-duplicate', auth, requireRole(['admin', 'caregiver', 'helper']), async (req, res) => {
  try {
    const { title, brand, model, upc, price, category } = req.query;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const candidates = await duplicateDetector.findDuplicateCandidates({
      title,
      brand,
      model,
      upc,
      price: price ? parseFloat(price) : undefined,
      category
    });

    res.json({
      duplicates: candidates,
      isDuplicate: candidates.length > 0 && candidates[0].score >= 0.6,
      confidence: candidates.length > 0 ? candidates[0].confidence : 'low'
    });

  } catch (error) {
    console.error('Duplicate check error:', error);
    res.status(500).json({ message: 'Duplicate check failed', error: error.message });
  }
});

/**
 * GET /api/intake/storage-locations
 * Get storage locations from existing products
 */
router.get('/storage-locations', auth, requireRole(['admin', 'caregiver', 'helper']), async (req, res) => {
  try {
    const locations = await Product.aggregate([
      { $match: { 'storageLocation.unitId': { $exists: true, $ne: '' } } },
      { $group: {
        _id: '$storageLocation.unitId',
        facilityName: { $first: '$storageLocation.facilityName' },
        facilityType: { $first: '$storageLocation.facilityType' },
        productCount: { $sum: 1 }
      }},
      { $sort: { facilityName: 1 } }
    ]);

    res.json({ locations });

  } catch (error) {
    console.error('Storage locations error:', error);
    res.status(500).json({ message: 'Failed to fetch storage locations' });
  }
});

/**
 * GET /api/intake/stats
 * Get intake statistics
 */
router.get('/stats', auth, requireRole(['admin', 'caregiver']), async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          avgPrice: { $avg: '$price' }
        }
      }
    ]);

    const duplicateStats = await Product.aggregate([
      { $match: { duplicateScore: { $gte: 0.6 } } },
      {
        $group: {
          _id: null,
          duplicateCount: { $sum: 1 },
          avgDuplicateScore: { $avg: '$duplicateScore' }
        }
      }
    ]);

    res.json({
      byStatus: stats,
      duplicates: duplicateStats[0] || { duplicateCount: 0, avgDuplicateScore: 0 }
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Failed to fetch intake stats' });
  }
});

export default router;