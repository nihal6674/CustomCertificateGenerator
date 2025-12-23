// models/BulkJob.js
const mongoose = require("mongoose");

const bulkJobSchema = new mongoose.Schema(
  {
    total: Number,
    processed: Number,
    success: Number,
    failed: Number,
    status: {
      type: String,
      enum: ["PROCESSING", "COMPLETED", "FAILED"],
      default: "PROCESSING",
    },
    errors: [
      {
        rowNumber: Number,
        rowData: Object,
        error: String,
        resolved: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("BulkJob", bulkJobSchema);
