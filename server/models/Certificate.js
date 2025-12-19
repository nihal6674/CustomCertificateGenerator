const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateNumber: {
      type: String,
      unique: true
    },

    firstName: String,
    lastName: String,
    className: String,

    trainingDate: Date,
    issueDate: Date,

    instructorName: String,

    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template'
    },

    pdfFilePath: String,

    status: {
      type: String,
      enum: ['ISSUED', 'REVOKED'],
      default: 'ISSUED'
    }
  },
  { timestamps: true }
);

// Prevent duplicate certificates
certificateSchema.index(
  { firstName: 1, lastName: 1, className: 1 },
  { unique: true }
);

module.exports = mongoose.model('Certificate', certificateSchema);
