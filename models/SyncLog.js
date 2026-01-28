import mongoose from 'mongoose';

const SyncLogSchema = new mongoose.Schema({
  // What was synced
  entityType: {
    type: String,
    enum: ['product', 'listing', 'price', 'quantity', 'status', 'bulk'],
    required: true
  },
  
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityType'
  },
  
  // Sync operation details
  operation: {
    type: String,
    enum: ['create', 'update', 'delete', 'sync', 'delist', 'relist'],
    required: true
  },
  
  // Platform information
  platforms: [{
    platform: {
      type: String,
      enum: ['ebay', 'facebook', 'depop', 'craigslist', 'own-store']
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'skipped', 'pending']
    },
    platformListingId: String,
    error: String,
    response: mongoose.Schema.Types.Mixed
  }],
  
  // Sync trigger
  triggeredBy: {
    type: String,
    enum: ['user', 'system', 'webhook', 'scheduled', 'auto'],
    default: 'user'
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Changes made
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  
  // Overall status
  status: {
    type: String,
    enum: ['success', 'partial', 'failed', 'pending'],
    default: 'pending'
  },
  
  // Timing
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  duration: Number, // milliseconds
  
  // Error tracking
  errors: [{
    platform: String,
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed
  }],
  
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    source: String
  }
}, {
  timestamps: true
});

// Indexes
SyncLogSchema.index({ entityType: 1, entityId: 1 });
SyncLogSchema.index({ 'platforms.platform': 1 });
SyncLogSchema.index({ status: 1 });
SyncLogSchema.index({ triggeredBy: 1 });
SyncLogSchema.index({ createdAt: -1 });
SyncLogSchema.index({ userId: 1 });

// Method to mark as completed
SyncLogSchema.methods.complete = async function(status = 'success') {
  this.status = status;
  this.completedAt = new Date();
  this.duration = this.completedAt - this.startedAt;
  await this.save();
};

// Static method to get sync history for an entity
SyncLogSchema.statics.getHistory = function(entityType, entityId, limit = 50) {
  return this.find({ entityType, entityId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Static method to get recent sync activity
SyncLogSchema.statics.getRecentActivity = function(hours = 24, limit = 100) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({ createdAt: { $gte: since } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'name email')
    .lean();
};

export default mongoose.model('SyncLog', SyncLogSchema);