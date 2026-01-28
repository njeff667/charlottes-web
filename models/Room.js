import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema(
  {
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true
    },
    roomTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType' },
    roomName: { type: String, required: true, trim: true }, // e.g. "main"
    dimsIn: {
      length: Number,
      width: Number,
      height: Number
    },
    security: { type: String, default: 'inherited' },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

RoomSchema.index({ warehouseId: 1, roomName: 1 }, { unique: true });

export default mongoose.model('Room', RoomSchema);
