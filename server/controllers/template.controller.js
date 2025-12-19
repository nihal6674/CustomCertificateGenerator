const path = require('path');
const Template = require('../models/Template');
const { saveFile } = require('../utils/storage');
const convertDocxToHtml = require('../utils/docxToHtml');

exports.createTemplate = async (req, res) => {
  try {
    const { templateName, className, instructorName } = req.body;

    const exists = await Template.findOne({ className });
    if (exists) {
      return res.status(400).json({
        message: 'Template already exists for this class'
      });
    }

    if (!req.files?.template || !req.files?.signature) {
      return res.status(400).json({ message: 'Files missing' });
    }

    // 1️⃣ Save DOCX locally
    const docxPath = await saveFile(req.files.template[0], 'templates');

    // 2️⃣ Convert DOCX → HTML
    const htmlOutputPath = path.join(
      __dirname,
      '..',
      'uploads',
      'templates',
      `${className}.html`
    );

    await convertDocxToHtml(docxPath, htmlOutputPath);

    // 3️⃣ Save instructor signature
    const signaturePath = await saveFile(req.files.signature[0], 'signatures');

    // 4️⃣ Create template record
    const template = await Template.create({
      templateName,
      className,
      docxFilePath: docxPath,
      htmlFilePath: htmlOutputPath,
      instructorName,
      instructorSignaturePath: signaturePath
    });

    res.status(201).json({
      message: 'Template created successfully',
      template
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};








// const Template = require('../models/Template');
// const { saveFile } = require('../utils/storage');

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

//     const templatePath = await saveFile(req.files.template[0], 'templates');
//     const signaturePath = await saveFile(req.files.signature[0], 'signatures');

//     const template = await Template.create({
//       templateName,
//       className,
//       templateFilePath: templatePath,
//       instructorName,
//       instructorSignaturePath: signaturePath
//     });

//     res.status(201).json({ message: 'Template created', template });
//   } catch (err) {
//     console.error(err);
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
//     template.templateFilePath = await saveFile(req.files.template[0], 'templates');
//   }

//   if (req.files?.signature) {
//     template.instructorSignaturePath = await saveFile(req.files.signature[0], 'signatures');
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







//JUST UNCOMMENT THIS WHEN MOVING TO R2


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
