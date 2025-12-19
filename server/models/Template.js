const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    templateName: {
      type: String,
      required: true
    },

    className: {
      type: String,
      required: true,
      unique: true
    },

    // Original uploaded DOCX (reference / audit)
    docxFilePath: {
      type: String,
      required: true
    },

    // Converted HTML (USED for certificate generation)
    htmlFilePath: {
      type: String,
      required: true
    },

    instructorName: {
      type: String,
      required: true
    },

    instructorSignaturePath: {
      type: String,
      required: true
    },

    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Template', templateSchema);