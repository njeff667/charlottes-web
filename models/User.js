import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return this.role !== 'customer';
    }
  },
  role: { 
    type: String, 
    enum: ["admin", "caregiver", "helper", "customer"], 
    default: "customer" 
  },
  avatar: String,
  phone: String,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' }
  },
  // Addresses for customers
  addresses: [{
    type: { type: String, enum: ['shipping', 'billing'], required: true },
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    isDefault: { type: Boolean, default: false }
  }]
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Indexes
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

export default mongoose.model("User", UserSchema);