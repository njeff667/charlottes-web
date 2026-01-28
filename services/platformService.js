import PlatformListing from '../models/PlatformListing.js';
import PlatformConfig from '../models/PlatformConfig.js';
import SyncLog from '../models/SyncLog.js';
import Notification from '../models/Notification.js';
import Product from '../models/Product.js';

class PlatformService {
  constructor() {
    this.platforms = {
      ebay: null,
      facebook: null,
      depop: null,
      craigslist: null
    };
  }

  /**
   * Initialize platform integrations
   */
  async initialize() {
    const configs = await PlatformConfig.find({ isActive: true });
    
    for (const config of configs) {
      if (config.isConnected) {
        await this.loadPlatformAdapter(config.platform, config);
      }
    }
  }

  /**
   * Load platform-specific adapter
   */
  async loadPlatformAdapter(platform, config) {
    try {
      const adapter = await import(`./platforms/${platform}Adapter.js`);
      this.platforms[platform] = new adapter.default(config);
      console.log(`✅ ${platform} adapter loaded`);
    } catch (error) {
      console.error(`❌ Failed to load ${platform} adapter:`, error.message);
    }
  }

  /**
   * Create listing on a specific platform
   */
  async createListing(productId, platform, customData = {}) {
    const syncLog = new SyncLog({
      entityType: 'product',
      entityId: productId,
      operation: 'create',
      triggeredBy: 'user',
      platforms: [{ platform, status: 'pending' }]
    });

    try {
      // Get product details
      const product = await Product.findById(productId)
        .populate('category')
        .populate('sellerProfile');

      if (!product) {
        throw new Error('Product not found');
      }

      // Get platform config
      const config = await PlatformConfig.findOne({ platform, isActive: true });
      if (!config || !config.isConnected) {
        throw new Error(`${platform} is not connected`);
      }

      // Check if listing already exists
      const existingListing = await PlatformListing.findOne({
        product: productId,
        platform,
        status: { $in: ['active', 'pending'] }
      });

      if (existingListing) {
        throw new Error(`Active listing already exists on ${platform}`);
      }

      // Prepare listing data
      const listingData = this.prepareListingData(product, platform, config, customData);

      // Create listing on platform
      const adapter = this.platforms[platform];
      if (!adapter) {
        throw new Error(`${platform} adapter not loaded`);
      }

      const platformResponse = await adapter.createListing(listingData);

      // Save listing to database
      const listing = new PlatformListing({
        product: productId,
        platform,
        platformListingId: platformResponse.listingId,
        listingUrl: platformResponse.url,
        title: listingData.title,
        description: listingData.description,
        price: listingData.price,
        status: 'active',
        listedAt: new Date(),
        platformData: platformResponse.data || {},
        lastSyncedAt: new Date(),
        syncStatus: 'synced'
      });

      await listing.save();

      // Update sync log
      syncLog.platforms[0].status = 'success';
      syncLog.platforms[0].platformListingId = platformResponse.listingId;
      syncLog.platforms[0].response = platformResponse;
      await syncLog.complete('success');

      // Update product status
      product.status = 'active';
      await product.save();

      // Update platform usage
      config.usage.totalListings += 1;
      config.usage.activeListings += 1;
      config.usage.lastListingDate = new Date();
      await config.save();

      return {
        success: true,
        listing,
        platformResponse
      };

    } catch (error) {
      // Log error
      syncLog.platforms[0].status = 'failed';
      syncLog.platforms[0].error = error.message;
      syncLog.errors.push({
        platform,
        code: error.code || 'CREATE_ERROR',
        message: error.message,
        details: error.details || {}
      });
      await syncLog.complete('failed');

      // Create notification
      await this.createErrorNotification(productId, platform, 'create', error);

      throw error;
    }
  }

  /**
   * Create listings on multiple platforms
   */
  async createMultiPlatformListing(productId, platforms, customData = {}) {
    const results = [];
    const syncLog = new SyncLog({
      entityType: 'product',
      entityId: productId,
      operation: 'create',
      triggeredBy: 'user',
      platforms: platforms.map(p => ({ platform: p, status: 'pending' }))
    });

    for (const platform of platforms) {
      try {
        const result = await this.createListing(productId, platform, customData[platform] || {});
        results.push({
          platform,
          success: true,
          listing: result.listing
        });
        
        // Update sync log
        const platformLog = syncLog.platforms.find(p => p.platform === platform);
        if (platformLog) {
          platformLog.status = 'success';
          platformLog.platformListingId = result.listing.platformListingId;
        }
      } catch (error) {
        results.push({
          platform,
          success: false,
          error: error.message
        });
        
        // Update sync log
        const platformLog = syncLog.platforms.find(p => p.platform === platform);
        if (platformLog) {
          platformLog.status = 'failed';
          platformLog.error = error.message;
        }
      }
    }

    // Determine overall status
    const successCount = results.filter(r => r.success).length;
    const status = successCount === 0 ? 'failed' : 
                   successCount === platforms.length ? 'success' : 'partial';
    
    await syncLog.complete(status);

    return {
      results,
      syncLog,
      successCount,
      totalCount: platforms.length
    };
  }

  /**
   * Update listing on a platform
   */
  async updateListing(listingId, updates) {
    const listing = await PlatformListing.findById(listingId).populate('product');
    if (!listing) {
      throw new Error('Listing not found');
    }

    const syncLog = new SyncLog({
      entityType: 'listing',
      entityId: listingId,
      operation: 'update',
      triggeredBy: 'user',
      platforms: [{ platform: listing.platform, status: 'pending' }],
      changes: {
        before: listing.toObject(),
        after: updates
      }
    });

    try {
      const adapter = this.platforms[listing.platform];
      if (!adapter) {
        throw new Error(`${listing.platform} adapter not loaded`);
      }

      // Update on platform
      const platformResponse = await adapter.updateListing(
        listing.platformListingId,
        updates
      );

      // Update local listing
      Object.assign(listing, updates);
      listing.lastSyncedAt = new Date();
      listing.syncStatus = 'synced';
      await listing.save();

      syncLog.platforms[0].status = 'success';
      syncLog.platforms[0].response = platformResponse;
      await syncLog.complete('success');

      return {
        success: true,
        listing,
        platformResponse
      };

    } catch (error) {
      syncLog.platforms[0].status = 'failed';
      syncLog.platforms[0].error = error.message;
      await syncLog.complete('failed');

      listing.syncStatus = 'error';
      listing.syncErrors.push({
        timestamp: new Date(),
        error: error.message,
        details: error.details || {}
      });
      await listing.save();

      throw error;
    }
  }

  /**
   * Synchronize product across all platforms
   */
  async syncProduct(productId, changes) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Get all active listings for this product
    const listings = await PlatformListing.find({
      product: productId,
      status: 'active',
      'autoSync.enabled': true
    });

    if (listings.length === 0) {
      return { message: 'No active listings to sync' };
    }

    const syncLog = new SyncLog({
      entityType: 'product',
      entityId: productId,
      operation: 'sync',
      triggeredBy: 'system',
      platforms: listings.map(l => ({ platform: l.platform, status: 'pending' })),
      changes: {
        before: product.toObject(),
        after: changes
      }
    });

    const results = [];

    for (const listing of listings) {
      try {
        // Determine what needs to be synced based on autoSync settings
        const updates = {};
        
        if (listing.autoSync.syncPrice && changes.price !== undefined) {
          updates.price = changes.price;
        }
        
        if (listing.autoSync.syncQuantity && changes.quantity !== undefined) {
          updates.quantity = changes.quantity;
        }
        
        if (listing.autoSync.syncDescription && changes.description !== undefined) {
          updates.description = changes.description;
        }

        if (Object.keys(updates).length === 0) {
          results.push({
            platform: listing.platform,
            status: 'skipped',
            message: 'No syncable changes'
          });
          continue;
        }

        // Update listing
        await this.updateListing(listing._id, updates);
        
        results.push({
          platform: listing.platform,
          status: 'success',
          updates
        });

        const platformLog = syncLog.platforms.find(p => p.platform === listing.platform);
        if (platformLog) {
          platformLog.status = 'success';
        }

      } catch (error) {
        results.push({
          platform: listing.platform,
          status: 'failed',
          error: error.message
        });

        const platformLog = syncLog.platforms.find(p => p.platform === listing.platform);
        if (platformLog) {
          platformLog.status = 'failed';
          platformLog.error = error.message;
        }
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const status = successCount === 0 ? 'failed' : 
                   successCount === listings.length ? 'success' : 'partial';
    
    await syncLog.complete(status);

    return {
      results,
      syncLog,
      successCount,
      totalCount: listings.length
    };
  }

  /**
   * Handle sale - delist from all other platforms
   */
  async handleSale(listingId, saleData) {
    const soldListing = await PlatformListing.findById(listingId).populate('product');
    if (!soldListing) {
      throw new Error('Listing not found');
    }

    const syncLog = new SyncLog({
      entityType: 'listing',
      entityId: listingId,
      operation: 'delist',
      triggeredBy: 'system'
    });

    try {
      // Mark listing as sold
      await soldListing.markAsSold(saleData);

      // Update product
      const product = soldListing.product;
      product.quantity = Math.max(0, product.quantity - 1);
      product.status = product.quantity === 0 ? 'sold' : 'active';
      await product.save();

      // Get all other active listings for this product
      const otherListings = await PlatformListing.find({
        product: product._id,
        _id: { $ne: listingId },
        status: 'active'
      });

      syncLog.platforms = otherListings.map(l => ({ 
        platform: l.platform, 
        status: 'pending',
        platformListingId: l.platformListingId
      }));

      // Delist from other platforms
      const delistResults = [];
      for (const listing of otherListings) {
        try {
          const adapter = this.platforms[listing.platform];
          if (adapter) {
            await adapter.endListing(listing.platformListingId, 'Sold on another platform');
          }
          
          await listing.delist(`Sold on ${soldListing.platform}`);
          
          delistResults.push({
            platform: listing.platform,
            status: 'success'
          });

          const platformLog = syncLog.platforms.find(p => p.platform === listing.platform);
          if (platformLog) {
            platformLog.status = 'success';
          }

        } catch (error) {
          delistResults.push({
            platform: listing.platform,
            status: 'failed',
            error: error.message
          });

          const platformLog = syncLog.platforms.find(p => p.platform === listing.platform);
          if (platformLog) {
            platformLog.status = 'failed';
            platformLog.error = error.message;
          }
        }
      }

      await syncLog.complete('success');

      // Create sale notification
      await Notification.create({
        type: 'sale',
        priority: 'high',
        product: product._id,
        platformListing: listingId,
        platform: soldListing.platform,
        title: 'Item Sold!',
        message: `${product.title} sold on ${soldListing.platform} for $${saleData.price}`,
        actionRequired: false,
        metadata: {
          salePrice: saleData.price,
          platform: soldListing.platform,
          delistResults
        }
      });

      return {
        success: true,
        soldListing,
        delistResults,
        product
      };

    } catch (error) {
      await syncLog.complete('failed');
      throw error;
    }
  }

  /**
   * Prepare listing data for platform
   */
  prepareListingData(product, platform, config, customData) {
    const baseData = {
      title: customData.title || product.title,
      description: customData.description || product.description,
      price: customData.price || product.price,
      quantity: customData.quantity || product.quantity,
      condition: product.condition,
      images: product.images.map(img => img.url),
      category: product.category?.name,
      brand: product.brand,
      model: product.model,
      sku: product.sku,
      upc: product.upc
    };

    // Add platform-specific data
    const platformSettings = config.settings[platform] || {};
    
    return {
      ...baseData,
      ...platformSettings,
      ...customData
    };
  }

  /**
   * Create error notification
   */
  async createErrorNotification(productId, platform, operation, error) {
    const product = await Product.findById(productId);
    
    await Notification.create({
      type: 'sync_error',
      priority: 'high',
      product: productId,
      platform,
      title: `${platform} ${operation} failed`,
      message: `Failed to ${operation} listing for "${product?.title || 'Unknown'}": ${error.message}`,
      actionRequired: true,
      metadata: {
        error: error.message,
        operation,
        platform
      }
    });
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats() {
    const configs = await PlatformConfig.find({ isActive: true });
    const stats = {};

    for (const config of configs) {
      const activeListings = await PlatformListing.countDocuments({
        platform: config.platform,
        status: 'active'
      });

      const totalSales = await PlatformListing.countDocuments({
        platform: config.platform,
        status: 'sold'
      });

      const totalRevenue = await PlatformListing.aggregate([
        {
          $match: {
            platform: config.platform,
            status: 'sold',
            salePrice: { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$salePrice' }
          }
        }
      ]);

      stats[config.platform] = {
        isConnected: config.isConnected,
        activeListings,
        totalSales,
        totalRevenue: totalRevenue[0]?.total || 0,
        lastSync: config.usage.lastSyncDate,
        errorCount: config.errorCount
      };
    }

    return stats;
  }
}

export default new PlatformService();