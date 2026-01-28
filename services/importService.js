import path from "path";
// Import your sub-importers using ESM syntax at the top
import { importCsv } from "./importers/importCsv.js";
import { importXlsx } from "./importers/importXlsx.js";

/**
 * Detects file extension and calls the correct importer.
 * Added 'export' keyword to fix the SyntaxError.
 */
export async function importInventoryFile({ filePath, facilityName, unitId, roomName }) {
  const ext = path.extname(filePath).toLowerCase();

  console.log(ext)

  if (ext === ".csv") {
    return importCsv({ filePath, facilityName, unitId, roomName });
  }

  if (ext === ".xlsx" || ext === ".xls") {
    return importXlsx({ filePath, facilityName, unitId, roomName });
  }

  throw new Error("Unsupported file type: " + ext);
}
