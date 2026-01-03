const Template = require('../models/Template');
const uploadMulterToR2 = require("../utils/uploadMulterToR2");

// Create template
exports.createTemplate = async (req, res) => {
  try {
    const { templateName, className, instructorName } = req.body;

    const exists = await Template.findOne({ className });
    if (exists) {
      return res.status(400).json({ message: 'Template already exists for this class' });
    }

    if (!req.files?.template || !req.files?.signature) {
      return res.status(400).json({ message: 'Files missing' });
    }

    const templatePath = await uploadMulterToR2({
  file: req.files.template[0],
  key: `templates/${className}/template.docx`,
});

const signaturePath = await uploadMulterToR2({
  file: req.files.signature[0],
  key: `templates/${className}/signature.png`,
});


    const template = await Template.create({
      templateName,
      className,
      templateFilePath: templatePath,
      instructorName,
      instructorSignaturePath: signaturePath
    });

    res.status(201).json({ message: 'Template created', template });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all templates
exports.getTemplates = async (req, res) => {
  const templates = await Template.find();
  res.json(templates);
};

// Update template (ALL editable fields)
exports.updateTemplate = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    if (req.files?.template?.[0]) {
      template.templateFilePath = await uploadMulterToR2({
        file: req.files.template[0],
        key: `templates/${template.className}/template.docx`,
      });
    }

    if (req.files?.signature?.[0]) {
      template.instructorSignaturePath = await uploadMulterToR2({
        file: req.files.signature[0],
        key: `templates/${template.className}/signature.png`,
      });
    }

    if (req.body.templateName !== undefined)
      template.templateName = req.body.templateName;

    if (req.body.className !== undefined)
      template.className = req.body.className;

    if (req.body.instructorName !== undefined)
      template.instructorName = req.body.instructorName;

    if (req.body.active !== undefined)
      template.active = req.body.active === "true" || req.body.active === true;

    await template.save();

    // ✅ IMPORTANT: return the updated template directly
    res.json(template);
  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Class name must be unique",
      });
    }

    res.status(500).json({ message: "Server error" });
  }
};


// Deactivate / Activate template (TOGGLE) — name unchanged
exports.deactivateTemplate = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // 🔁 Toggle active status
    template.active = !template.active;
    await template.save();

    return res.json({
      message: template.active
        ? "Template activated"
        : "Template deactivated",
      active: template.active,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};


// Get only ACTIVE templates (for staff certificate issue dropdown)
exports.getActiveTemplates = async (req, res) => {
  try {
    const templates = await Template.find({ active: true }).select(
      "_id templateName className instructorName"
    );

    res.json({
      templates,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};







// JUST UNCOMMENT THIS WHEN MOVING TO R2


// const Template = require('../models/Template');
// const { uploadToR2 } = require('../utils/r2Upload');

// // Create template
// exports.createTemplate = async (req, res) => {
//   try {
//     const { templateName, className, instructorName } = req.body;

//     const exists = await Template.findOne({ className });
//     if (exists) {
//       return res.status(400).json({ message: 'Template already exists for this class' });
//     }

//     if (!req.files?.template || !req.files?.signature) {
//       return res.status(400).json({ message: 'Files missing' });
//     }

//     const templatePath = await uploadToR2(
//       req.files.template[0],
//       `templates/${className}/template.docx`
//     );

//     const signaturePath = await uploadToR2(
//       req.files.signature[0],
//       `templates/${className}/signature.png`
//     );

//     const template = await Template.create({
//       templateName,
//       className,
//       templateFilePath: templatePath,
//       instructorName,
//       instructorSignaturePath: signaturePath
//     });

//     res.status(201).json({ message: 'Template created', template });
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // Get all templates
// exports.getTemplates = async (req, res) => {
//   const templates = await Template.find();
//   res.json(templates);
// };

// // Update template
// exports.updateTemplate = async (req, res) => {
//   const template = await Template.findById(req.params.id);
//   if (!template) return res.status(404).json({ message: 'Template not found' });

//   if (req.files?.template) {
//     template.templateFilePath = await uploadToR2(
//       req.files.template[0],
//       `templates/${template.className}/template.docx`
//     );
//   }

//   if (req.files?.signature) {
//     template.instructorSignaturePath = await uploadToR2(
//       req.files.signature[0],
//       `templates/${template.className}/signature.png`
//     );
//   }

//   if (req.body.instructorName) {
//     template.instructorName = req.body.instructorName;
//   }

//   await template.save();
//   res.json({ message: 'Template updated' });
// };

// // Deactivate template
// exports.deactivateTemplate = async (req, res) => {
//   const template = await Template.findById(req.params.id);
//   if (!template) return res.status(404).json({ message: 'Template not found' });

//   template.active = false;
//   await template.save();

//   res.json({ message: 'Template deactivated' });
// };
