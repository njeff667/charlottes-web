import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Warehouse from '../models/Warehouse.js';
import Room from '../models/Room.js';
import Bin from '../models/Bin.js';
import Item from '../models/Item.js';
import { generateToken, auth } from '../middleware/auth.js';

import path from "path";
import multer from "multer";

// Importer function (adjust to match your importer)
import { importInventoryFile } from "../services/importService.js";

const router = express.Router();

// Store uploads temporarily
const upload = multer({
  dest: path.join(process.cwd(), "tmp_uploads"),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// --- Admin home redirect ---
router.get("/", (req, res) => res.redirect("/admin/import"));

// --- Upload/import page ---
router.get("/import", async (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Admin - Import Inventory</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; max-width: 900px; }
          .card { border: 1px solid #ddd; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
          input, button { font-size: 16px; }
          .row { display: flex; gap: 12px; flex-wrap: wrap; }
          .row > div { flex: 1; min-width: 240px; }
          label { display:block; margin-bottom: 6px; color:#333; }
          .hint { color:#666; font-size: 13px; }
        </style>
      </head>
      <body>
        <h1>Import Inventory</h1>

        <div class="card">
          <form action="/admin/import" method="post" enctype="multipart/form-data">
            <div class="row">
              <div>
                <label>Facility Name</label>
                <input name="facilityName" value="USA Storage Centers - Evans" style="width:100%" />
                <div class="hint">Defaults to your Evans facility.</div>
              </div>
              <div>
                <label>Unit ID</label>
                <input name="unitId" value="2170" style="width:100%" />
                <div class="hint">Warehouse unit number.</div>
              </div>
            </div>

            <div style="margin-top:12px;">
              <label>File (CSV or XLSX)</label>
              <input type="file" name="file" accept=".csv,.xlsx,.xls" required />
              <div class="hint">Uploads to server and imports into MongoDB.</div>
            </div>

            <div style="margin-top:12px;">
              <button type="submit">Import Now</button>
              <a href="/admin/inventory" style="margin-left:12px;">Go to Inventory</a>
            </div>
          </form>
        </div>

        <div class="card">
          <h3>What happens during import?</h3>
          <ul>
            <li>Ensures Warehouse: <b>USA Storage Centers - Evans</b> unit <b>2170</b></li>
            <li>Ensures Room: <b>main</b></li>
            <li>Creates Bins from <b>box_id / Box ID</b> (K1, K2, ...)</li>
            <li>Creates/updates Items linked to the correct Bin</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// --- Handle import upload ---
router.post("/import", upload.single("file"), async (req, res) => {
  try {
    const facilityName = (req.body.facilityName || "USA Storage Centers - Evans").trim();
    const unitId = String(req.body.unitId || "2170").trim();
    const filePath = req.file?.path;

    if (!filePath) return res.status(400).send("No file uploaded.");

    const result = await importInventoryFile({
      filePath,
      facilityName,
      unitId,
      roomName: "main",
    });

    res.send(`
      <html><body style="font-family:Arial;margin:24px;">
        <h2>Import Complete</h2>
        <pre>${escapeHtml(JSON.stringify(result, null, 2))}</pre>
        <p><a href="/admin/inventory">Go to Inventory Browser</a></p>
        <p><a href="/admin/import">Import another file</a></p>
      </body></html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send(`Import failed: ${escapeHtml(err.message || String(err))}`);
  }
});

// --- Inventory browser (warehouse → room → bin → items) ---
router.get("/inventory", async (req, res) => {
  const warehouses = await Warehouse.find().sort({ buildingName: 1, "address.unit": 1 }).lean();

  res.send(`
    <html>
      <head>
        <title>Admin - Inventory</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; max-width: 1200px; }
          .row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
          select, input, button { font-size: 16px; padding: 6px; }
          table { border-collapse: collapse; width: 100%; margin-top: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
          th { background: #f7f7f7; text-align: left; }
          .muted { color:#666; font-size: 13px; }
          .pill { display:inline-block; padding:2px 8px; border:1px solid #ccc; border-radius:999px; font-size:12px; }
        </style>
      </head>
      <body>
        <h1>Inventory Browser</h1>
        <div class="row">
          <a href="/admin/import">← Import</a>
        </div>

        <div class="row">
          <div>
            <div class="muted">Warehouse</div>
            <select id="warehouse">
              <option value="">-- Select --</option>
              ${warehouses
                .map(
                  (w) =>
                    `<option value="${w._id}">${escapeHtml(
                      `${w.buildingName || "Warehouse"} (Unit ${w.address?.unit || ""})`
                    )}</option>`
                )
                .join("")}
            </select>
          </div>

          <div>
            <div class="muted">Room</div>
            <select id="room"><option value="">--</option></select>
          </div>

          <div>
            <div class="muted">Bin</div>
            <select id="bin"><option value="">--</option></select>
          </div>

          <div style="flex:2;">
            <div class="muted">Search</div>
            <input id="q" placeholder="Search description / manufacturer / model / SKU" style="width:100%;" />
          </div>

          <div>
            <div class="muted">Status</div>
            <select id="status">
              <option value="">All</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="hold">Hold</option>
              <option value="listed">Listed</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div>
            <div class="muted">&nbsp;</div>
            <button id="load">Load</button>
          </div>
        </div>

        <div id="summary" class="muted"></div>
        <div id="table"></div>

        <script>
          async function fetchJSON(url) {
            const r = await fetch(url);
            if (!r.ok) throw new Error(await r.text());
            return r.json();
          }

          const warehouseSel = document.getElementById("warehouse");
          const roomSel = document.getElementById("room");
          const binSel = document.getElementById("bin");

          warehouseSel.addEventListener("change", async () => {
            roomSel.innerHTML = '<option value="">--</option>';
            binSel.innerHTML = '<option value="">--</option>';
            const wid = warehouseSel.value;
            if (!wid) return;
            const rooms = await fetchJSON('/admin/api/rooms?warehouseId=' + encodeURIComponent(wid));
            roomSel.innerHTML = '<option value="">--</option>' + rooms.map(r => 
              '<option value="' + r._id + '">' + (r.roomName || r.name || 'room') + '</option>'
            ).join('');
          });

          roomSel.addEventListener("change", async () => {
            binSel.innerHTML = '<option value="">--</option>';
            const rid = roomSel.value;
            if (!rid) return;
            const bins = await fetchJSON('/admin/api/bins?roomId=' + encodeURIComponent(rid));
            binSel.innerHTML = '<option value="">--</option>' + bins.map(b => 
              '<option value="' + b._id + '">' + (b.label || 'bin') + '</option>'
            ).join('');
          });

          document.getElementById("load").addEventListener("click", async () => {
            const params = new URLSearchParams();
            if (warehouseSel.value) params.set("warehouseId", warehouseSel.value);
            if (roomSel.value) params.set("roomId", roomSel.value);
            if (binSel.value) params.set("binId", binSel.value);
            const q = document.getElementById("q").value.trim();
            const status = document.getElementById("status").value;
            if (q) params.set("q", q);
            if (status) params.set("statusCode", status);

            const data = await fetchJSON('/admin/api/items?' + params.toString());
            document.getElementById("summary").textContent = "Items: " + data.count;

            const rows = data.items.map(it => {
              const price = it.price?.amount ?? it.price ?? 0;
              const sku = it.sku || it.internalSku || "";
              return \`
                <tr>
                  <td><b>\${escapeHtml(it.itemDescr || it.item_descr || "")}</b><div class="muted">\${escapeHtml(it.manufacturer || "")} \${escapeHtml(it.model || "")}</div></td>
                  <td>\${escapeHtml(sku)}</td>
                  <td>\${escapeHtml(String(it.qty ?? 1))}</td>
                  <td>$\${escapeHtml(String(price))}</td>
                  <td><span class="pill">\${escapeHtml(it.statusCode || it.status_id || "")}</span></td>
                  <td><button onclick="quickSold('\${it._id}')">Mark Sold</button></td>
                </tr>
              \`;
            }).join("");

            document.getElementById("table").innerHTML = \`
              <table>
                <thead><tr>
                  <th>Description</th><th>SKU</th><th>Qty</th><th>Price</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>\${rows}</tbody>
              </table>
            \`;
          });

          async function quickSold(id) {
            await fetch('/admin/api/items/' + id, {
              method: 'PATCH',
              headers: {'Content-Type':'application/json'},
              body: JSON.stringify({ statusCode: 'sold', qty: 0 })
            });
            document.getElementById("load").click();
          }

          function escapeHtml(s) {
            return String(s ?? "").replace(/[&<>"']/g, m => ({
              "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
            }[m]));
          }
        </script>
      </body>
    </html>
  `);
});

// --- API: rooms for warehouse ---
router.get("/api/rooms", async (req, res) => {
  const { warehouseId } = req.query;
  if (!warehouseId) return res.json([]);
  const rooms = await Room.find({ warehouseId }).sort({ roomName: 1 }).lean();
  res.json(rooms);
});

// --- API: bins for room ---
router.get("/api/bins", async (req, res) => {
  const { roomId } = req.query;
  if (!roomId) return res.json([]);
  const bins = await Bin.find({ roomId }).sort({ label: 1 }).lean();
  res.json(bins);
});

// --- API: items filterable ---
router.get("/api/items", async (req, res) => {
  const { binId, roomId, warehouseId, q, statusCode } = req.query;

  // Build bin scope
  let scopedBinIds = null;

  if (binId) {
    scopedBinIds = [binId];
  } else if (roomId) {
    const bins = await Bin.find({ roomId }).select("_id").lean();
    scopedBinIds = bins.map(b => b._id);
  } else if (warehouseId) {
    const rooms = await Room.find({ warehouseId }).select("_id").lean();
    const roomIds = rooms.map(r => r._id);
    const bins = await Bin.find({ roomId: { $in: roomIds } }).select("_id").lean();
    scopedBinIds = bins.map(b => b._id);
  }

  const filter = {};
  if (scopedBinIds) filter.binId = { $in: scopedBinIds };
  if (statusCode) filter.statusCode = statusCode;

  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { itemDescr: rx },
      { manufacturer: rx },
      { model: rx },
      { sku: rx },
      { internalSku: rx },
    ];
  }

  const items = await Item.find(filter).sort({ updatedAt: -1 }).limit(500).lean();
  res.json({ count: items.length, items });
});

// --- API: quick patch item ---
router.patch("/api/items/:id", async (req, res) => {
  const { id } = req.params;
  const patch = {};
  if (req.body.statusCode) patch.statusCode = req.body.statusCode;
  if (typeof req.body.qty !== "undefined") patch.qty = Number(req.body.qty);
  if (typeof req.body.price !== "undefined") patch["price.amount"] = Number(req.body.price);
  const updated = await Item.findByIdAndUpdate(id, patch, { new: true }).lean();
  res.json(updated);
});

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

export default router;