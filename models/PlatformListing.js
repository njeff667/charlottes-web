import mongoose from 'mongoose';

const PlatformListingSchema = new mongoose.Schema({
  // Reference to the main product
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  
  // Platform information
  platform: {
    type: String,
    enum: ['ebay', 'facebook', 'depop', 'craigslist', 'own-store'],
    required: true
  },
  
  // Platform-specific listing ID
  platformListingId: {
    type: String,
    required: true
  },
  
  // Platform-specific URL
  listingUrl: String,
  
  // Listing details (may differ from main product)
  title: String,
  description: String,
  price: Number,
  
  // Platform-specific data
  platformData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'sold', 'ended', 'error', 'delisted'],
    default: 'draft'
  },
  
  // Listing dates
  listedAt: Date,
  endedAt: Date,
  soldAt: Date,
  
  // Performance metrics
  views: {
    type: Number,
    default: 0
  },
  watchers: {
    type: Number,
    default: 0
  },
  questions: {
    type: Number,
    default: 0
  },
  
  // Sale information
  salePrice: Number,
  buyerInfo: {
    platformUserId: String,
    username: String,
    email: String
  },
  
  // Fees and costs
  platformFees: {
    listingFee: { type: Number, default: 0 },
    finalValueFee: { type: Number, default: 0 },
    paymentProcessingFee: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  
  // Synchronization tracking
  lastSyncedAt: Date,
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'error', 'manual'],
    default: 'pending'
  },
  syncErrors: [{
    timestamp: Date,
    error: String,
    details: mongoose.Schema.Types.Mixed
  }],
  
  // Auto-sync settings
  autoSync: {
    enabled: { type: Boolean, default: true },
    syncPrice: { type: Boolean, default: true },
    syncQuantity: { type: Boolean, default: true },
    syncDescription: { type: Boolean, default: false }
  },
  
  // Notes and flags
  notes: String,
  isManuallyManaged: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes
PlatformListingSchema.index({ product: 1, platform: 1 });
PlatformListingSchema.index({ platformListingId: 1, platform: 1 }, { unique: true });
PlatformListingSchema.index({ status: 1 });
PlatformListingSchema.index({ listedAt: 1 });
PlatformListingSchema.index({ soldAt: 1 });

// Virtual for net profit
PlatformListingSchema.virtual('netProfit').get(function() {
  if (!this.salePrice) return 0;
  return this.salePrice - (this.platformFees.total || 0);
});

// Virtual for listing age in days
PlatformListingSchema.virtual('listingAgeDays').get(function() {
  if (!this.listedAt) return 0;
  const now = new Date();
  const diff = now - this.listedAt;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Method to mark as sold
PlatformListingSchema.methods.markAsSold = async function(saleData) {
  this.status = 'sold';
  this.soldAt = new Date();
  this.salePrice = saleData.price;
  if (saleData.buyerInfo) {
    this.buyerInfo = saleData.buyerInfo;
  }
  if (saleData.fees) {
    this.platformFees = saleData.fees;
  }
  await this.save();
};

// Method to delist
PlatformListingSchema.methods.delist = async function(reason) {
  this.status = 'delisted';
  this.endedAt = new Date();
  this.notes = (this.notes || '') + `\nDelisted: ${reason}`;
  await this.save();
};

export default mongoose.model('PlatformListing', PlatformListingSchema);