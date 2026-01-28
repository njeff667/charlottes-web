import express from 'express';
import PlatformConfig from '../models/PlatformConfig.js';
import PlatformListing from '../models/PlatformListing.js';
import SyncLog from '../models/SyncLog.js';
import Notification from '../models/Notification.js';
import platformService from '../services/platformService.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * Get all platform configurations
 */
router.get('/configs', authenticate, async (req, res) => {
  try {
    const configs = await PlatformConfig.find()
      .select('-credentials.apiSecret -credentials.refreshToken');
    
    res.json({
      success: true,
      configs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platform configs',
      error: error.message
    });
  }
});

/**
 * Get platform statistics
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await platformService.getPlatformStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platform stats',
      error: error.message
    });
  }
});

/**
 * Update platform configuration
 */
router.put('/configs/:platform', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { platform } = req.params;
    const updates = req.body;

    let config = await PlatformConfig.findOne({ platform });
    
    if (!config) {
      config = new PlatformConfig({ platform });
    }

    // Update fields
    if (updates.credentials) {
      config.credentials = { ...config.credentials, ...updates.credentials };
    }
    if (updates.settings) {
      config.settings = { ...config.settings, ...updates.settings };
    }
    if (updates.defaultSettings) {
      config.defaultSettings = { ...config.defaultSettings, ...updates.defaultSettings };
    }
    if (updates.isActive !== undefined) {
      config.isActive = updates.isActive;
    }

    await config.save();

    res.json({
      success: true,
      message: 'Platform configuration updated',
      config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update platform config',
      error: error.message
    });
  }
});

/**
 * Connect to a platform
 */
router.post('/configs/:platform/connect', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { platform } = req.params;
    const { credentials } = req.body;

    const config = await PlatformConfig.findOne({ platform });
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Platform configuration not found'
      });
    }

    await config.updateCredentials(credentials);

    res.json({
      success: true,
      message: `Connected to ${platform}`,
      config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to connect to platform',
      error: error.message
    });
  }
});

/**
 * Disconnect from a platform
 */
router.post('/configs/:platform/disconnect', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { platform } = req.params;

    const config = await PlatformConfig.findOne({ platform });
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Platform configuration not found'
      });
    }

    await config.disconnect();

    res.json({
      success: true,
      message: `Disconnected from ${platform}`,
      config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect from platform',
      error: error.message
    });
  }
});

/**
 * Create listing on a single platform
 */
router.post('/listings/create', authenticate, async (req, res) => {
  try {
    const { productId, platform, customData } = req.body;

    if (!productId || !platform) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and platform are required'
      });
    }

    const result = await platformService.createListing(productId, platform, customData);

    res.json({
      success: true,
      message: 'Listing created successfully',
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create listing',
      error: error.message
    });
  }
});

/**
 * Create listing on multiple platforms
 */
router.post('/listings/create-multi', authenticate, async (req, res) => {
  try {
    const { productId, platforms, customData } = req.body;

    if (!productId || !platforms || !Array.isArray(platforms)) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and platforms array are required'
      });
    }

    const result = await platformService.createMultiPlatformListing(
      productId,
      platforms,
      customData
    );

    res.json({
      success: true,
      message: `Created listings on ${result.successCount}/${result.totalCount} platforms`,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create multi-platform listings',
      error: error.message
    });
  }
});

/**
 * Update a listing
 */
router.put('/listings/:listingId', authenticate, async (req, res) => {
  try {
    const { listingId } = req.params;
    const updates = req.body;

    const result = await platformService.updateListing(listingId, updates);

    res.json({
      success: true,
      message: 'Listing updated successfully',
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update listing',
      error: error.message
    });
  }
});

/**
 * Get all listings for a product
 */
router.get('/listings/product/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;

    const listings = await PlatformListing.find({ product: productId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      listings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listings',
      error: error.message
    });
  }
});

/**
 * Get all active listings
 */
router.get('/listings/active', authenticate, async (req, res) => {
  try {
    const { platform, page = 1, limit = 50 } = req.query;

    const query = { status: 'active' };
    if (platform) {
      query.platform = platform;
    }

    const listings = await PlatformListing.find(query)
      .populate('product', 'title images price')
      .sort({ listedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PlatformListing.countDocuments(query);

    res.json({
      success: true,
      listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active listings',
      error: error.message
    });
  }
});

/**
 * Mark listing as sold
 */
router.post('/listings/:listingId/sold', authenticate, async (req, res) => {
  try {
    const { listingId } = req.params;
    const saleData = req.body;

    const result = await platformService.handleSale(listingId, saleData);

    res.json({
      success: true,
      message: 'Sale processed and other listings delisted',
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process sale',
      error: error.message
    });
  }
});

/**
 * Sync product across platforms
 */
router.post('/sync/product/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;
    const changes = req.body;

    const result = await platformService.syncProduct(productId, changes);

    res.json({
      success: true,
      message: 'Product synced across platforms',
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to sync product',
      error: error.message
    });
  }
});

/**
 * Get sync logs
 */
router.get('/sync/logs', authenticate, async (req, res) => {
  try {
    const { entityType, entityId, limit = 50 } = req.query;

    const query = {};
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;

    const logs = await SyncLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'name email');

    res.json({
      success: true,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sync logs',
      error: error.message
    });
  }
});

/**
 * Get notifications
 */
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const { status, type, limit = 50 } = req.query;

    const query = { assignedTo: req.user._id };
    if (status) query.status = status;
    if (type) query.type = type;

    const notifications = await Notification.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .populate('product', 'title images')
      .populate('platformListing', 'platform platformListingId');

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

/**
 * Mark notification as read
 */
router.put('/notifications/:notificationId/read', authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

/**
 * Approve third-party action
 */
router.post('/notifications/:notificationId/approve', authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.approveThirdPartyAction(req.user._id);

    res.json({
      success: true,
      message: 'Third-party action approved',
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve action',
      error: error.message
    });
  }
});

/**
 * Get pending approvals
 */
router.get('/notifications/pending-approvals', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.getPendingApprovals(req.user._id);

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending approvals',
      error: error.message
    });
  }
});

export default router;