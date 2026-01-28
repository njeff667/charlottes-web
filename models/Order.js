import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  title: String,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  total: {
    type: Number,
    required: true
  },
  condition: String,
  images: [String]
});

const ShippingAddressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, default: 'USA' },
  phone: String
});

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Customer information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  
  // Order items
  items: [OrderItemSchema],
  
  // Pricing
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  donationAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Shipping
  shippingAddress: ShippingAddressSchema,
  shippingMethod: {
    type: String,
    enum: ['standard', 'express', 'overnight', 'pickup'],
    default: 'standard'
  },
  trackingNumber: String,
  estimatedDelivery: Date,
  
  // Payment
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'cash', 'check'],
    required: true
  },
  paymentId: String, // Stripe payment intent ID, etc.
  paidAt: Date,
  
  // Order status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  orderNotes: String,
  
  // Timestamps
  confirmedAt: Date,
  processedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  
  // Special messages (for Mom's story)
  thankYouMessage: {
    type: String,
    maxlength: 500
  },
  impactMessage: {
    type: String,
    maxlength: 300
  },
  
  // Analytics
  source: {
    type: String,
    enum: ['web', 'mobile', 'social', 'direct', 'other'],
    default: 'web'
  },
  referralCode: String
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes
OrderSchema.index({ customer: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });

// Generate order number before saving
OrderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    // Format: CW-YYYYMMDD-XXXX where XXXX is random
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `CW-${date}-${random}`;
  }
  next();
});

// Calculate totals before saving
OrderSchema.pre('save', function(next) {
  if (this.isModified('items') || this.isModified('shippingCost') || this.isModified('tax') || this.isModified('donationAmount') || this.isModified('discount')) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
    this.total = this.subtotal + this.shippingCost + this.tax + this.donationAmount - this.discount;
  }
  next();
});

export default mongoose.model("Order", OrderSchema);