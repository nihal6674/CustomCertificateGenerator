const path = require('path');
const Template = require('../models/Template');
const Certificate = require('../models/Certificate');

const generateCertificateNumber = require('../utils/certificateNumber');
const generateDocx = require('../utils/docxGenerator');
const generateQR = require('../utils/qrGenerator');

exports.issueSingleCertificate = async (req, res) => {
  try {
    console.log(req.body);
    const { firstName, lastName, className, trainingDate } = req.body;

    if (!firstName || !lastName || !className || !trainingDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // 1️⃣ Prevent duplicate certificate
    const existing = await Certificate.findOne({
      firstName,
      lastName,
      className
    });

    if (existing) {
      return res.status(400).json({
        message: 'Certificate already exists for this student and class'
      });
    }

    // 2️⃣ Fetch active template
    const template = await Template.findOne({
      className,
      active: true
    });

    if (!template) {
      return res.status(404).json({
        message: 'No active template found for this class'
      });
    }

    // 3️⃣ Generate certificate number
    const certificateNumber = await generateCertificateNumber();
    
    console.log("Certificate Number", certificateNumber)
    // 4️⃣ Generate QR code
    const qrBuffer = await generateQR(certificateNumber);

    
    // 5️⃣ Prepare DOCX data
    const docxData = {
      first_name: firstName,
      last_name: lastName,
      class_name: className,
      training_date: trainingDate,
      issue_date: new Date().toISOString().split('T')[0],
      certificate_number: certificateNumber,
      instructor_name: template.instructorName,
      qr_code: qrBuffer
    };

    // 6️⃣ Generate DOCX
    const outputDocxPath = path.join(
      __dirname,
      '..',
      'uploads',
      'certificates',
      `${certificateNumber}.docx`
    );

    generateDocx(
      template.templateFilePath,
      docxData,
      outputDocxPath
    );

    // 7️⃣ Save certificate record (PDF step comes later)
    const certificate = await Certificate.create({
      certificateNumber,
      firstName,
      lastName,
      className,
      trainingDate,
      issueDate: new Date(),
      instructorName: template.instructorName,
      templateId: template._id,
      pdfFilePath: null // will be filled after PDF step
    });

    res.status(201).json({
      message: 'Certificate issued successfully',
      certificate
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
