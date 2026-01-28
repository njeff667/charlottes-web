import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    unique: true,
    required: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0 // 0 for root categories, 1 for subcategories, etc.
  },
  image: String,
  icon: String, // for UI display
  color: String, // hex color for UI theming
  
  // Product count (cached for performance)
  productCount: {
    type: Number,
    default: 0
  },
  
  // SEO
  metaTitle: String,
  metaDescription: String,
  
  // Display settings
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  
  // Special categories (integrating your warehouse data)
  categoryType: {
    type: String,
    enum: ['general', 'storage', 'organization', 'household', 'electronics', 'clothing', 'books', 'other'],
    default: 'general'
  },
  
  // Storage-specific fields (from your existing data)
  storageType: {
    type: String,
    enum: ['climate-controlled', 'outdoor storage', 'business storage', 'portable storage unit', 'storage locker', 'vehicle storage'],
    default: null
  },
  warehouseFunction: {
    type: String,
    enum: ['distribution center', 'fulfillment center', 'cold storage warehouse', 'bulk storage warehouse', 'smart warehouse', 'climate-controlled warehouse', 'consolidated warehouse', 'cooperative warehouse', 'production warehouse'],
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes
CategorySchema.index({ parent: 1 });
CategorySchema.index({ level: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ categoryType: 1 });

// Virtual for path
CategorySchema.virtual('path').get(function() {
  // Will be populated with a method that builds the full path
  return this.slug;
});

// Pre-save middleware to generate slug and set level
CategorySchema.pre('save', async function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Set level based on parent
  if (this.parent) {
    const parent = await this.constructor.findById(this.parent);
    this.level = parent ? parent.level + 1 : 0;
  } else {
    this.level = 0;
  }
  
  next();
});

export default mongoose.model("Category", CategorySchema);