import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  // Notification type
  type: {
    type: String,
    enum: [
      'sale',
      'price_change',
      'quantity_change',
      'listing_ended',
      'question',
      'offer',
      'review',
      'return_request',
      'dispute',
      'sync_error',
      'low_stock',
      'out_of_stock',
      'third_party_action'
    ],
    required: true
  },
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Related entities
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  
  platformListing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlatformListing'
  },
  
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  // Platform information
  platform: {
    type: String,
    enum: ['ebay', 'facebook', 'depop', 'craigslist', 'own-store', 'system']
  },
  
  // Notification content
  title: {
    type: String,
    required: true
  },
  
  message: {
    type: String,
    required: true
  },
  
  // Action details
  actionRequired: {
    type: Boolean,
    default: false
  },
  
  actionUrl: String,
  
  actionButtons: [{
    label: String,
    action: String,
    url: String
  }],
  
  // Third-party action details
  thirdPartyAction: {
    isThirdParty: { type: Boolean, default: false },
    actionType: String, // e.g., 'price_change', 'quantity_update', 'listing_ended'
    performedBy: String, // platform or user identifier
    timestamp: Date,
    details: mongoose.Schema.Types.Mixed,
    requiresApproval: { type: Boolean, default: false },
    approved: Boolean,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['unread', 'read', 'archived', 'actioned'],
    default: 'unread'
  },
  
  readAt: Date,
  archivedAt: Date,
  actionedAt: Date,
  
  // User assignment
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Metadata
  metadata: {
    source: String,
    webhookId: String,
    eventId: String,
    rawData: mongoose.Schema.Types.Mixed
  },
  
  // Expiration
  expiresAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ priority: 1 });
NotificationSchema.index({ status: 1 });
NotificationSchema.index({ assignedTo: 1 });
NotificationSchema.index({ platform: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
NotificationSchema.index({ 'thirdPartyAction.requiresApproval': 1, 'thirdPartyAction.approved': 1 });

// Virtual for age
NotificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt;
});

// Method to mark as read
NotificationSchema.methods.markAsRead = async function() {
  this.status = 'read';
  this.readAt = new Date();
  await this.save();
};

// Method to archive
NotificationSchema.methods.archive = async function() {
  this.status = 'archived';
  this.archivedAt = new Date();
  await this.save();
};

// Method to approve third-party action
NotificationSchema.methods.approveThirdPartyAction = async function(userId) {
  if (this.thirdPartyAction.isThirdParty && this.thirdPartyAction.requiresApproval) {
    this.thirdPartyAction.approved = true;
    this.thirdPartyAction.approvedBy = userId;
    this.thirdPartyAction.approvedAt = new Date();
    this.status = 'actioned';
    this.actionedAt = new Date();
    await this.save();
  }
};

// Static method to get unread notifications
NotificationSchema.statics.getUnread = function(userId) {
  return this.find({
    assignedTo: userId,
    status: 'unread'
  })
  .sort({ priority: -1, createdAt: -1 })
  .populate('product', 'title images')
  .populate('platformListing', 'platform platformListingId')
  .lean();
};

// Static method to get pending approvals
NotificationSchema.statics.getPendingApprovals = function(userId) {
  return this.find({
    assignedTo: userId,
    'thirdPartyAction.isThirdParty': true,
    'thirdPartyAction.requiresApproval': true,
    'thirdPartyAction.approved': { $ne: true }
  })
  .sort({ createdAt: -1 })
  .populate('product', 'title images price')
  .populate('platformListing', 'platform platformListingId')
  .lean();
};

export default mongoose.model('Notification', NotificationSchema);