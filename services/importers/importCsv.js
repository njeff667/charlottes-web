import fs from "fs";
import csv from "csv-parser";

/**
 * Parses a CSV file and returns the data as an array of objects.
 */
export async function importCsv({ filePath, facilityName, unitId, roomName }) {
  return new Promise((resolve, reject) => {
    const results = [];

    // Create a readable stream from the CSV file
    fs.createReadStream(filePath)
      .pipe(csv()) // Parse the CSV into JS objects
      .on("data", (data) => {
        // You can attach your extra metadata (facilityName, etc.) to each row here
        results.push({
          ...data,
          facilityName,
          unitId,
          roomName,
          importedAt: new Date(),
        });
      })
      .on("end", () => {
        console.log(`Successfully processed ${results.length} rows from ${filePath}`);
        resolve(results);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}
