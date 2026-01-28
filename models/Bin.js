import mongoose from 'mongoose';

const BinSchema = new mongoose.Schema(
  {
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true
    },
    binTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'BinType' },
    shelfTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ShelfType' },
    label: { type: String, required: true, trim: true }, // e.g. "K1"
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

// A label must be unique within the same room
BinSchema.index({ roomId: 1, label: 1 }, { unique: true });

export default mongoose.model('Bin', BinSchema);
