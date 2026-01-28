import express from 'express';
import { auth, optionalAuth, requireRole } from '../middleware/auth.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import duplicateDetector from '../lib/dedup.js';

const router = express.Router();

/**
 * GET /api/products
 * Get products with filtering and pagination
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      collections,
      condition,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      featured
    } = req.query;

    // Build query
    const query = { status: 'active' };

    if (category) query.category = category;
    if (collections) query.collections = { $in: collections.split(',') };
    if (condition) query.condition = condition;
    if (featured === 'true') query.featured = true;

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Search
    if (search) {
      query.$text = { $search: search };
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category')
        .populate('sellerProfile', 'displayName')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(query)
    ]);

    // Increment view counts if authenticated
    if (req.user && products.length > 0) {
      const productIds = products.map(p => p._id);
      await Product.updateMany(
        { _id: { $in: productIds } },
        { $inc: { views: 1 }, lastViewed: new Date() }
      );
    }

    res.json({
      success: true,
      products,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalProducts: total,
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
});

/**
 * GET /api/products/:id
 * Get single product
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category')
      .populate('sellerProfile', 'displayName storyShort consentToShare');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check visibility
    if (product.status !== 'active' && (!req.user || req.user.role === 'customer')) {
      return res.status(404).json({ message: 'Product not available' });
    }

    // Increment view count
    if (req.user) {
      await Product.findByIdAndUpdate(req.params.id, {
        $inc: { views: 1 },
        lastViewed: new Date()
      });
    }

    // Get related products
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      status: 'active',
      $or: [
        { category: product.category },
        { collections: { $in: product.collections } }
      ]
    })
    .populate('category')
    .limit(6);

    res.json({
      success: true,
      product,
      relatedProducts
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
});

/**
 * POST /api/products
 * Create new product (admin/caregiver only)
 */
router.post('/', auth, requireRole(['admin', 'caregiver', 'helper']), async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate('category')
      .populate('sellerProfile');

    res.status(201).json({
      success: true,
      product: populatedProduct,
      message: 'Product created successfully'
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
});

/**
 * PUT /api/products/:id
 * Update product (admin/caregiver only)
 */
router.put('/:id', auth, requireRole(['admin', 'caregiver', 'helper']), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category').populate('sellerProfile');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      success: true,
      product,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
});

/**
 * DELETE /api/products/:id
 * Delete product (admin only)
 */
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
});

/**
 * GET /api/products/collections
 * Get all available collections
 */
router.get('/collections/list', async (req, res) => {
  try {
    const collections = await Product.distinct('collections', {
      status: 'active',
      collections: { $exists: true, $ne: [] }
    });

    const collectionStats = await Promise.all(
      collections.map(async (collection) => {
        const count = await Product.countDocuments({
          collections: collection,
          status: 'active'
        });
        return { name: collection, count };
      })
    );

    res.json({
      success: true,
      collections: collectionStats.sort((a, b) => b.count - a.count)
    });

  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({ message: 'Failed to fetch collections', error: error.message });
  }
});

/**
 * GET /api/products/featured
 * Get featured products
 */
router.get('/featured/list', async (req, res) => {
  try {
    const products = await Product.find({
      status: 'active',
      featured: true
    })
    .populate('category')
    .populate('sellerProfile', 'displayName')
    .limit(12)
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      products
    });

  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ message: 'Failed to fetch featured products', error: error.message });
  }
});

export default router;