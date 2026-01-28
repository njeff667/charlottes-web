import mongoose from 'mongoose';

// Storage unit reference (integrating your existing data)
const StorageLocationSchema = new mongoose.Schema({
  unitId: String,
  facilityName: String,
  facilityType: {
    type: String,
    enum: ['public warehouse', 'private warehouse', 'climate-controlled', 'outdoor storage', 'vehicle storage'],
    default: 'public warehouse'
  },
  section: String,
  shelf: String,
  bin: String,
  lastInventoryDate: Date
});

const ProductSchema = new mongoose.Schema({
  // Basic product info
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 200
  },
  brand: {
    type: String,
    trim: true,
    maxlength: 100
  },
  model: String,
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  upc: String,
  isbn: String,
  asin: String, // Amazon identifier
  
  // Product details
  description: {
    type: String,
    maxlength: 2000
  },
  shortDescription: {
    type: String,
    maxlength: 500
  },
  condition: { 
    type: String, 
    enum: ["new", "like-new", "good", "fair", "acceptable"], 
    default: "new" 
  },
  conditionNotes: String,
  
  // Pricing
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  originalPrice: Number,
  salePrice: Number,
  cost: Number, // for profit tracking
  
  // Inventory
  quantity: { 
    type: Number, 
    default: 1,
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 5
  },
  weight: Number, // in pounds
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  
  // Media
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  videos: [{
    url: String,
    title: String,
    duration: Number
  }],
  
  // Categorization
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  collections: [String], // e.g., ["Re-Home the Duplicates", "New-in-Box", "Storage Solutions"]
  tags: [String],
  
  // Source and origin
  source: { 
    type: String, 
    enum: ["family-duplicate", "donation", "consignment", "wholesale", "other"], 
    default: "family-duplicate" 
  },
  acquisitionDate: Date,
  acquisitionCost: Number,
  storageLocation: StorageLocationSchema,
  
  // Seller information
  sellerProfile: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "SellerProfile",
    required: true
  },
  
  // Duplicate detection
  duplicateScore: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 1
  },
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  
  // Listing and visibility
  status: {
    type: String,
    enum: ['draft', 'active', 'sold', 'reserved', 'archived'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public'
  },
  featured: {
    type: Boolean,
    default: false
  },
  
  // SEO
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  metaTitle: String,
  metaDescription: String,
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  favorites: {
    type: Number,
    default: 0
  },
  lastViewed: Date,
  
  // Quality control
  qualityCheck: {
    isChecked: { type: Boolean, default: false },
    checkedBy: String,
    checkedDate: Date,
    notes: String
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes for performance
ProductSchema.index({ title: "text", brand: "text", model: "text" });
ProductSchema.index({ upc: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ collections: 1 });
ProductSchema.index({ sellerProfile: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ "storageLocation.unitId": 1 });
ProductSchema.index({ duplicateScore: 1 });

// Virtual for inventory status
ProductSchema.virtual('inventoryStatus').get(function() {
  if (this.quantity === 0) return 'out_of_stock';
  if (this.quantity <= this.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

// Virtual for display price
ProductSchema.virtual('displayPrice').get(function() {
  return this.salePrice || this.price;
});

// Generate slug before saving
ProductSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + this._id.toString().slice(-6);
  }
  next();
});

export default mongoose.model("Product", ProductSchema);