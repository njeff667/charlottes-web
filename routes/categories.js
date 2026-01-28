import express from 'express';
import { auth, requireRole } from '../middleware/auth.js';
import Category from '../models/Category.js';

const router = express.Router();

/**
 * GET /api/categories
 * Get all categories (tree structure)
 */
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ level: 1, sortOrder: 1, name: 1 });

    // Build tree structure
    const categoryMap = {};
    const rootCategories = [];

    // Create map of all categories
    categories.forEach(category => {
      categoryMap[category._id] = { ...category.toObject(), children: [] };
    });

    // Build tree
    categories.forEach(category => {
      if (category.parent) {
        const parent = categoryMap[category.parent];
        if (parent) {
          parent.children.push(categoryMap[category._id]);
        }
      } else {
        rootCategories.push(categoryMap[category._id]);
      }
    });

    res.json({
      success: true,
      categories: rootCategories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
});

/**
 * GET /api/categories/flat
 * Get all categories in flat list (for dropdowns)
 */
router.get('/flat', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ level: 1, name: 1 });

    res.json({
      success: true,
      categories
    });

  } catch (error) {
    console.error('Get flat categories error:', error);
    res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
});

/**
 * GET /api/categories/:id
 * Get single category
 */
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({
      success: true,
      category
    });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Failed to fetch category', error: error.message });
  }
});

/**
 * GET /api/categories/:id/products
 * Get products in category
 */
router.get('/:id/products', async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Get all subcategories
    const subcategories = await Category.find({ 
      parent: req.params.id,
      isActive: true 
    });

    const categoryIds = [req.params.id, ...subcategories.map(cat => cat._id)];

    const query = {
      category: { $in: categoryIds },
      status: 'active'
    };

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category')
        .populate('sellerProfile', 'displayName')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(query)
    ]);

    res.json({
      success: true,
      category,
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
    console.error('Get category products error:', error);
    res.status(500).json({ message: 'Failed to fetch category products', error: error.message });
  }
});

/**
 * POST /api/categories
 * Create new category (admin only)
 */
router.post('/', auth, requireRole(['admin']), async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();

    res.status(201).json({
      success: true,
      category,
      message: 'Category created successfully'
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category with this slug already exists' });
    }
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Failed to create category', error: error.message });
  }
});

/**
 * PUT /api/categories/:id
 * Update category (admin only)
 */
router.put('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({
      success: true,
      category,
      message: 'Category updated successfully'
    });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Failed to update category', error: error.message });
  }
});

/**
 * DELETE /api/categories/:id
 * Delete category (admin only)
 */
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    // Check if category has products
    const Product = (await import('../models/Product.js')).default;
    const productCount = await Product.countDocuments({ category: req.params.id });

    if (productCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with existing products',
        productCount 
      });
    }

    // Check if category has subcategories
    const subcategoryCount = await Category.countDocuments({ parent: req.params.id });

    if (subcategoryCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with subcategories',
        subcategoryCount 
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Failed to delete category', error: error.message });
  }
});

export default router;