import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema(
  {
    // Original data fields from inventory
    sku: { type: String, trim: true, index: true },
    internalSku: { type: String, trim: true, index: true },
    itemDescr: { type: String, required: true, trim: true },
    manufacturer: { type: String, trim: true },
    model: { type: String, trim: true },
    serialNum: { type: String, trim: true },

    dimsIn: {
      length: Number,
      width: Number,
      height: Number
    },
    weight: {
      pounds: Number,
      ounces: Number
    },

    price: {
      amount: Number,
      currency: { type: String, default: 'USD' }
    },
    qty: { type: Number, default: 1 },

    // Normalized operational fields
    statusCode: {
      type: String,
      default: 'available',
      enum: ['available', 'sold', 'hold', 'listed', 'draft', 'archived'],
      index: true
    },

    // Location: warehouse -> room -> bin (bin is the actual label, e.g., K1)
    binId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bin',
      required: true,
      index: true
    },

    images: [
      {
        view: {
          type: String,
          enum: ['front', 'left', 'right', 'top', 'bottom', 'other']
        },
        ref: { type: String, trim: true }
      }
    ],

    sourceRowHash: { type: String, trim: true, index: true },
    sourceSystem: { type: String, default: 'xlsx' }
  },
  { timestamps: true }
);

// Helpful compound indexes
ItemSchema.index({ manufacturer: 1, model: 1 });
ItemSchema.index({ itemDescr: 'text', manufacturer: 'text', model: 'text' });

export default mongoose.model('Item', ItemSchema);
