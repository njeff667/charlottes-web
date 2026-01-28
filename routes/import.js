import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import crypto from 'crypto';
import XLSX from 'xlsx';

import { auth, requireRole } from '../middleware/auth.js';
import Warehouse from '../models/Warehouse.js';
import Room from '../models/Room.js';
import Bin from '../models/Bin.js';
import Item from '../models/Item.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Upload XLSX/CSV inventory files
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/imports');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `inventory-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') return cb(null, true);
  return cb(new Error('Only .xlsx, .xls, or .csv files are allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

const normalizeBinLabel = (v) => {
  if (!v) return null;
  return String(v).trim().toUpperCase();
};

const normalizeStatus = (v) => {
  const s = String(v || '').trim().toLowerCase();
  if (!s) return 'available';
  if (s.startsWith('sold')) return 'sold';
  if (s.startsWith('hold')) return 'hold';
  if (s.startsWith('list')) return 'listed';
  if (s.startsWith('draft')) return 'draft';
  return 'available';
};

const numOrNull = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

function hashRow(obj) {
  const raw = JSON.stringify(obj);
  return crypto.createHash('sha256').update(raw).digest('hex');
}

async function ensureDefaultWarehouseAndRoom() {
  // Your chosen facility/unit
  const buildingName = 'USA Storage Centers - Evans';
  const unit = '2170';

  let warehouse = await Warehouse.findOne({
    buildingName,
    'address.unit': unit,
    'address.city': 'Evans',
    'address.state': 'GA'
  });

  if (!warehouse) {
    warehouse = await Warehouse.create({
      buildingName,
      address: {
        address1: '5090 Washington Rd.',
        unit,
        city: 'Evans',
        state: 'GA'
      },
      mainPhone: '7069175001',
      gps: { lat: 33.569912858426754, lng: -82.1896866307515 },
      security: 'included'
    });
  }

  let room = await Room.findOne({ warehouseId: warehouse._id, roomName: 'main' });
  if (!room) {
    room = await Room.create({
      warehouseId: warehouse._id,
      roomName: 'main',
      security: 'inherited'
    });
  }

  return { warehouse, room };
}

/**
 * POST /api/import/inventory-xlsx
 * Upload an inventory spreadsheet and import into: warehouse -> room -> bins -> items
 *
 * Form-data:
 *  - file: .xlsx/.xls/.csv
 */
router.post(
  '/inventory-xlsx',
  auth,
  requireRole(['admin', 'caregiver', 'helper']),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded. Use form-data field name "file".' });
      }

      const { warehouse, room } = await ensureDefaultWarehouseAndRoom();

      const workbook = XLSX.readFile(req.file.path, { cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const ws = workbook.Sheets[sheetName];

      // Convert to JSON rows. defval keeps empty cells.
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!rows.length) {
        return res.status(400).json({ message: 'Spreadsheet has no rows.' });
      }

      let created = 0;
      let updated = 0;
      let skipped = 0;
      const binCache = new Map(); // label -> binId

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];

        // Support both your XLSX headers and your earlier JSON field names.
        const itemDescr = (r.item_descr || r.itemDescr || r.title || '').toString().trim();
        if (!itemDescr) {
          skipped++;
          continue;
        }

        const binLabel = normalizeBinLabel(r.box_id || r.boxId || r.bin || r.Bin || r.Box || r.box || r.location);
        const safeBinLabel = binLabel || 'UNSORTED';

        let binId = binCache.get(safeBinLabel);
        if (!binId) {
          let bin = await Bin.findOne({ roomId: room._id, label: safeBinLabel });
          if (!bin) {
            bin = await Bin.create({
              warehouseId: warehouse._id,
              roomId: room._id,
              label: safeBinLabel
            });
          }
          binId = bin._id;
          binCache.set(safeBinLabel, binId);
        }

        const manufacturer = (r.manufacturer || r.brand || '').toString().trim();
        const model = (r.model || '').toString().trim();
        const sku = (r.SKU || r.sku || '').toString().trim();
        const serialNum = (r.serial_num || r.serialNum || '').toString().trim();

        const height = numOrNull(r.height);
        const width = numOrNull(r.width);
        const length = numOrNull(r.length);
        const pounds = numOrNull(r.pounds);
        const ounces = numOrNull(r.ounces);

        const priceAmount = numOrNull(r.price);
        const qty = numOrNull(r.qty) ?? 1;
        const statusCode = normalizeStatus(r.status_id || r.status);

        // Normalize image refs if provided
        const images = [];
        const imgFront = (r.front || r.image_front || '').toString().trim();
        const imgLeft = (r.left || r.image_left || '').toString().trim();
        const imgRight = (r.right || r.image_right || '').toString().trim();
        if (imgFront) images.push({ view: 'front', ref: imgFront });
        if (imgLeft) images.push({ view: 'left', ref: imgLeft });
        if (imgRight) images.push({ view: 'right', ref: imgRight });

        // If your spreadsheet has a JSON-like images column, try to parse it.
        if (!images.length && r.images) {
          try {
            const parsed = typeof r.images === 'string' ? JSON.parse(r.images) : r.images;
            if (Array.isArray(parsed)) {
              for (const obj of parsed) {
                for (const [k, v] of Object.entries(obj || {})) {
                  if (v) images.push({ view: k, ref: String(v).trim() });
                }
              }
            } else if (parsed && typeof parsed === 'object') {
              for (const [k, v] of Object.entries(parsed)) {
                if (v) images.push({ view: k, ref: String(v).trim() });
              }
            }
          } catch {
            // ignore
          }
        }

        const identityForHash = {
          itemDescr,
          manufacturer,
          model,
          sku,
          serialNum,
          bin: safeBinLabel
        };
        const sourceRowHash = hashRow(identityForHash);

        // Upsert: treat same (hash) as same item record
        const updateDoc = {
          sku: sku || undefined,
          internalSku: sku ? undefined : `BIN-${safeBinLabel}-${i + 1}`,
          itemDescr,
          manufacturer: manufacturer || undefined,
          model: model || undefined,
          serialNum: serialNum || undefined,
          dimsIn: { length, width, height },
          weight: { pounds, ounces },
          price: { amount: priceAmount, currency: 'USD' },
          qty: qty ?? 1,
          statusCode,
          binId,
          images,
          sourceRowHash,
          sourceSystem: 'xlsx'
        };

        const existing = await Item.findOne({ sourceRowHash });
        if (existing) {
          await Item.updateOne({ _id: existing._id }, { $set: updateDoc });
          updated++;
        } else {
          await Item.create(updateDoc);
          created++;
        }
      }

      return res.status(201).json({
        success: true,
        warehouse,
        room,
        summary: { created, updated, skipped, totalRows: rows.length }
      });
    } catch (error) {
      console.error('Inventory import failed:', error);
      return res.status(500).json({
        message: 'Inventory import failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

export default router;
