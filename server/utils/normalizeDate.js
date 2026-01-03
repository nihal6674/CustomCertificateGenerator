const XLSX = require("xlsx");

module.exports = function normalizeExcelDate(value) {
  if (!value) return null;

  // Case 1: Excel serial number
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (!date) return null;

    const month = String(date.m).padStart(2, "0");
    const day = String(date.d).padStart(2, "0");

    return `${date.y}-${month}-${day}`;
  }

  // Case 2: String date
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (isNaN(parsed)) return null;

    return parsed.toISOString().split("T")[0];
  }

  return null;
};
