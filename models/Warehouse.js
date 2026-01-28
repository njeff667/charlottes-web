import mongoose from 'mongoose';

const WarehouseSchema = new mongoose.Schema(
  {
    buildingName: { type: String, required: true, trim: true },
    address: {
      address1: { type: String, trim: true },
      unit: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zip: { type: String, trim: true }
    },
    mainPhone: { type: String, trim: true },
    gps: {
      lat: Number,
      lng: Number
    },
    // Optional type references (keep flexible for now)
    warehouseTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseType' },
    storageTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'StorageType' },
    dimsIn: {
      length: Number,
      width: Number,
      height: Number
    },
    sqft: Number,
    monthlyRent: Number,
    security: { type: String, default: 'unknown' },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

WarehouseSchema.index(
  {
    buildingName: 1,
    'address.unit': 1,
    'address.city': 1,
    'address.state': 1
  },
  { unique: true }
);

export default mongoose.model('Warehouse', WarehouseSchema);
