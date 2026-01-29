import mongoose from 'mongoose';

const PlatformConfigSchema = new mongoose.Schema({
  // Platform identification
  platform: {
    type: String,
    enum: ['ebay', 'facebook', 'depop', 'craigslist'],
    required: true,
    unique: true
  },
  
  // Connection status
  isConnected: {
    type: Boolean,
    default: false
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Authentication credentials (encrypted in production)
  credentials: {
    apiKey: String,
    apiSecret: String,
    accessToken: String,
    refreshToken: String,
    tokenExpiry: Date,
    userId: String,
    username: String
  },
  
  // Platform-specific settings
  settings: {
    // eBay specific
    ebay: {
      siteId: { type: Number, default: 0 }, // 0 = US
      categoryId: String,
      listingDuration: { type: String, default: 'GTC' }, // Good Till Cancelled
      paymentMethods: [String],
      shippingServices: [String],
      returnPolicy: mongoose.Schema.Types.Mixed
    },
    
    // Facebook Marketplace specific
    facebook: {
      pageId: String,
      pageName: String,
      location: {
        latitude: Number,
        longitude: Number,
        address: String
      },
      deliveryOptions: [String]
    },
    
    // Depop specific
    depop: {
      shopName: String,
      shippingProfiles: [mongoose.Schema.Types.Mixed]
    },
    
    // Craigslist specific
    craigslist: {
      city: String,
      area: String,
      email: String,
      phoneNumber: String
    }
  },
  
  // Default listing settings
  defaultSettings: {
    autoRelist: { type: Boolean, default: false },
    autoSync: { type: Boolean, default: true },
    priceMarkup: { type: Number, default: 0 }, // percentage
    minPrice: { type: Number, default: 0 },
    maxPrice: { type: Number, default: 10000 },
    defaultShippingCost: { type: Number, default: 0 },
    defaultHandlingTime: { type: Number, default: 2 } // days
  },
  
  // Fee structure
  fees: {
    listingFee: { type: Number, default: 0 },
    finalValueFeePercentage: { type: Number, default: 0 },
    paymentProcessingFeePercentage: { type: Number, default: 0 },
    fixedFee: { type: Number, default: 0 }
  },
  
  // Rate limits
  rateLimits: {
    listingsPerDay: { type: Number, default: 100 },
    listingsPerHour: { type: Number, default: 20 },
    apiCallsPerMinute: { type: Number, default: 60 }
  },
  
  // Usage tracking
  usage: {
    totalListings: { type: Number, default: 0 },
    activeListings: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    lastListingDate: Date,
    lastSyncDate: Date
  },
  
  // Webhook configuration
  webhooks: {
    enabled: { type: Boolean, default: false },
    url: String,
    secret: String,
    events: [String]
  },
  
  // Error tracking
  lastError: {
    timestamp: Date,
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed
  },
  
  errorCount: {
    type: Number,
    default: 0
  },
  
  // Connection history
  connectionHistory: [{
    timestamp: Date,
    action: String, // 'connected', 'disconnected', 'refreshed'
    status: String,
    details: String
  }],
  
  // Notes
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes
PlatformConfigSchema.index({ unique: true });
PlatformConfigSchema.index({ isActive: 1 });
PlatformConfigSchema.index({ isConnected: 1 });

// Virtual for connection status
PlatformConfigSchema.virtual('connectionStatus').get(function() {
  if (!this.isActive) return 'inactive';
  if (!this.isConnected) return 'disconnected';
  if (this.credentials.tokenExpiry && this.credentials.tokenExpiry < new Date()) {
    return 'expired';
  }
  return 'connected';
});

// Method to update credentials
PlatformConfigSchema.methods.updateCredentials = async function(credentials) {
  this.credentials = { ...this.credentials, ...credentials };
  this.isConnected = true;
  this.connectionHistory.push({
    timestamp: new Date(),
    action: 'connected',
    status: 'success',
    details: 'Credentials updated'
  });
  await this.save();
};

// Method to disconnect
PlatformConfigSchema.methods.disconnect = async function() {
  this.isConnected = false;
  this.connectionHistory.push({
    timestamp: new Date(),
    action: 'disconnected',
    status: 'success',
    details: 'Platform disconnected'
  });
  await this.save();
};

// Method to log error
PlatformConfigSchema.methods.logError = async function(error) {
  this.lastError = {
    timestamp: new Date(),
    code: error.code || 'UNKNOWN',
    message: error.message,
    details: error.details || {}
  };
  this.errorCount += 1;
  await this.save();
};

// Method to reset error count
PlatformConfigSchema.methods.resetErrors = async function() {
  this.errorCount = 0;
  this.lastError = null;
  await this.save();
};

export default mongoose.model('PlatformConfig', PlatformConfigSchema);