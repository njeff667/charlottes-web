import * as XLSX from 'xlsx';

/**
 * Parses an Excel file (.xlsx or .xls) and returns data as an array of objects.
 */
export async function importXlsx({ filePath, facilityName, unitId, roomName }) {
  try {
    // 1. Load the workbook from the file path
    const workbook = XLSX.readFile(filePath);

    // 2. Get the first sheet name
    const firstSheetName = workbook.SheetNames[0];

    // 3. Get the worksheet object
    const worksheet = workbook.Sheets[firstSheetName];

    // 4. Convert worksheet to JSON (array of objects)
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    // 5. Map through data to add your custom metadata to each row
    const processedData = rawData.map((row) => ({
      ...row,
      facilityName,
      unitId,
      roomName,
      importedAt: new Date(),
    }));

    console.log(`Successfully processed ${processedData.length} rows from ${filePath}`);
    return processedData;
  } catch (error) {
    console.error("Error parsing Excel file:", error);
    throw error;
  }
}
