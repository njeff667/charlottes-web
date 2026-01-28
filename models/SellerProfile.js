import mongoose from 'mongoose';

const SellerProfileSchema = new mongoose.Schema({
  displayName: { 
    type: String, 
    required: true,
    trim: true
  }, // e.g., "Mom", "Charlotte"
  storyShort: { 
    type: String,
    maxlength: 200
  }, // for product micro-blurb
  storyLong: { 
    type: String,
    maxlength: 2000
  },  // for About page
  consentToShare: { 
    type: Boolean, 
    default: false 
  }, // only show specific health terms if true
  // Photo and personalization
  photo: String,
  signatureMessage: {
    type: String,
    maxlength: 300
  },
  // Location info (general, not specific address)
  location: {
    city: String,
    state: String,
    region: String
  },
  // Social links (optional)
  website: String,
  socialLinks: {
    facebook: String,
    instagram: String,
    twitter: String
  },
  // Business settings
  businessName: String,
  taxId: String, // for tax purposes
  // Donation settings
  donationSettings: {
    enabled: { type: Boolean, default: false },
    percentage: { type: Number, min: 0, max: 100, default: 0 },
    charityName: String,
    charityUrl: String,
    charityEIN: String
  },
  // Shipping preferences
  shippingSettings: {
    freeShippingThreshold: { type: Number, default: 50 },
    defaultShippingRate: { type: Number, default: 7.99 },
    handlingTime: { type: Number, default: 2 }, // days
    internationalShipping: { type: Boolean, default: false }
  },
  // Return policy
  returnPolicy: {
    acceptReturns: { type: Boolean, default: true },
    returnWindow: { type: Number, default: 30 }, // days
    restockFee: { type: Number, default: 0 },
    conditions: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true }
});

// Virtual for public story (respects consent)
SellerProfileSchema.virtual('publicStory').get(function() {
  if (this.consentToShare) {
    return this.storyLong;
  }
  return this.storyShort || "This shop began as a way to help re-home duplicate items with care and purpose.";
});

// Indexes
SellerProfileSchema.index({ displayName: 1 });
SellerProfileSchema.index({ isActive: 1 });

export default mongoose.model("SellerProfile", SellerProfileSchema);