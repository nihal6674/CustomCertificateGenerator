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

    templateFilePath: {
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
