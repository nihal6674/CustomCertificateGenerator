const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    certificateNumber: {
      type: String,
      unique: true,
      required: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    // ✅ OPTIONAL
    middleName: {
      type: String,
      trim: true,
      default: null,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    className: {
      type: String,
      required: true,
    },

    trainingDate: {
      type: Date,
      required: true,
    },

    issueDate: {
      type: Date,
      required: true,
    },

    instructorName: {
      type: String,
      required: true,
    },

    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      required: true,
    },

    pdfFilePath: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["ISSUED", "REVOKED"],
      default: "ISSUED",
    },
  },
  { timestamps: true }
);

/* ---------------- INDEXES ---------------- */

// Prevent duplicate certificates (middleName ignored on purpose)
certificateSchema.index(
  { firstName: 1, lastName: 1, className: 1 },
  { unique: true }
);

module.exports = mongoose.model("Certificate", certificateSchema);
