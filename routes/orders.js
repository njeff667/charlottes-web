import express from 'express';
import { auth, requireRole } from '../middleware/auth.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * GET /api/orders
 * Get orders with filtering (admin/caregiver only)
 */
router.get('/', auth, requireRole(['admin', 'caregiver']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { orderNumber: new RegExp(search, 'i') },
        { customerName: new RegExp(search, 'i') },
        { customerEmail: new RegExp(search, 'i') }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customer', 'name email')
        .populate('items.product')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(query)
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalOrders: total,
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

/**
 * GET /api/orders/:id
 * Get single order
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('items.product')
      .populate('items.product.category');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check permissions
    if (req.user.role === 'customer' && !order.customer._id.equals(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
});

/**
 * POST /api/orders
 * Create new order
 */
router.post('/', auth, async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      shippingMethod = 'standard',
      paymentMethod = 'stripe',
      orderNotes,
      donationAmount = 0
    } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    // Check inventory and calculate totals
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(400).json({ message: `Product not found: ${item.product}` });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.title}. Available: ${product.quantity}, Requested: ${item.quantity}` 
        });
      }

      const itemTotal = product.displayPrice * item.quantity;
      subtotal += itemTotal;

      processedItems.push({
        product: product._id,
        title: product.title,
        price: product.displayPrice,
        quantity: item.quantity,
        total: itemTotal,
        condition: product.condition,
        images: product.images.map(img => img.url)
      });

      // Update inventory
      product.quantity -= item.quantity;
      await product.save();
    }

    // Calculate shipping (simple logic - can be enhanced)
    let shippingCost = 0;
    if (shippingMethod !== 'pickup') {
      shippingCost = subtotal >= 50 ? 0 : 7.99; // Free shipping over $50
    }

    // Calculate tax (simple 8.25% - can be enhanced based on location)
    const tax = subtotal * 0.0825;
    const total = subtotal + shippingCost + tax + donationAmount;

    // Create order
    const order = new Order({
      customer: req.user.id,
      customerEmail: req.user.email,
      customerName: req.user.name,
      items: processedItems,
      subtotal,
      shippingCost,
      tax,
      donationAmount,
      total,
      shippingAddress,
      shippingMethod,
      paymentMethod,
      orderNotes
    });

    await order.save();

    // Add thank you message for Mom's story
    order.thankYouMessage = "Thank you for helping us re-home these items with dignity and purpose.";
    order.impactMessage = `You've given ${processedItems.length} item(s) a new home instead of sitting in storage.`;

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email')
      .populate('items.product')
      .populate('items.product.category');

    res.status(201).json({
      success: true,
      order: populatedOrder,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

/**
 * PUT /api/orders/:id/status
 * Update order status (admin/caregiver only)
 */
router.put('/:id/status', auth, requireRole(['admin', 'caregiver']), async (req, res) => {
  try {
    const { status, trackingNumber, notes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update status and timestamps
    order.status = status;
    
    const now = new Date();
    switch (status) {
      case 'confirmed':
        order.confirmedAt = now;
        break;
      case 'processing':
        order.processedAt = now;
        break;
      case 'shipped':
        order.shippedAt = now;
        if (trackingNumber) order.trackingNumber = trackingNumber;
        break;
      case 'delivered':
        order.deliveredAt = now;
        break;
      case 'cancelled':
        order.cancelledAt = now;
        if (notes) order.cancellationReason = notes;
        // Restore inventory
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { quantity: item.quantity }
          });
        }
        break;
    }

    if (notes) order.orderNotes = notes;

    await order.save();

    res.json({
      success: true,
      order,
      message: `Order status updated to ${status}`
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
});

/**
 * PUT /api/orders/:id/payment
 * Update payment status (admin only)
 */
router.put('/:id/payment', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { paymentStatus, paymentId, amount } = req.body;

    const validStatuses = ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentStatus = paymentStatus;
    if (paymentId) order.paymentId = paymentId;
    if (paymentStatus === 'paid') order.paidAt = new Date();

    await order.save();

    res.json({
      success: true,
      order,
      message: `Payment status updated to ${paymentStatus}`
    });

  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Failed to update payment status', error: error.message });
  }
});

/**
 * GET /api/orders/stats
 * Get order statistics (admin/caregiver only)
 */
router.get('/stats/admin', auth, requireRole(['admin', 'caregiver']), async (req, res) => {
  try {
    const [
      totalOrders,
      totalRevenue,
      ordersByStatus,
      recentOrders,
      monthlyRevenue
    ] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Order.find()
        .populate('customer', 'name email')
        .sort({ createdAt: -1 })
        .limit(10),
      Order.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        ordersByStatus: ordersByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentOrders,
        monthlyRevenue
      }
    });

  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ message: 'Failed to fetch order statistics', error: error.message });
  }
});

export default router;