import express from 'express';
import Item from '../models/Item.js';
import Bin from '../models/Bin.js';

const router = express.Router();

/**
 * GET /api/items
 * Get all items with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      status,
      manufacturer,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    if (status) {
      query.statusCode = status;
    }

    if (manufacturer) {
      query.manufacturer = manufacturer;
    }

    // Search across multiple fields
    if (search) {
      query.$or = [
        { itemDescr: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const items = await Item.find(query)
      .populate('binId')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Item.countDocuments(query);

    res.json({
      success: true,
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch items',
      error: error.message
    });
  }
});

/**
 * GET /api/items/:id
 * Get single item by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('binId');
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      item
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch item',
      error: error.message
    });
  }
});

/**
 * POST /api/items
 * Create new item
 */
router.post('/', async (req, res) => {
  try {
    const item = new Item(req.body);
    await item.save();

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      item
    });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create item',
      error: error.message
    });
  }
});

/**
 * PUT /api/items/:id
 * Update item
 */
router.put('/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item updated successfully',
      item
    });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update item',
      error: error.message
    });
  }
});

/**
 * DELETE /api/items/:id
 * Delete item
 */
router.delete('/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete item',
      error: error.message
    });
  }
});

/**
 * GET /api/items/stats/summary
 * Get inventory statistics
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const totalItems = await Item.countDocuments();
    const availableItems = await Item.countDocuments({ statusCode: 'available' });
    const soldItems = await Item.countDocuments({ statusCode: 'sold' });
    const listedItems = await Item.countDocuments({ statusCode: 'listed' });

    const totalValue = await Item.aggregate([
      { $match: { statusCode: { $in: ['available', 'listed'] } } },
      { $group: { _id: null, total: { $sum: '$price.amount' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalItems,
        availableItems,
        soldItems,
        listedItems,
        totalValue: totalValue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

export default router;