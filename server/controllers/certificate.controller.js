const path = require('path');
const Template = require('../models/Template');
const Certificate = require('../models/Certificate');
const XLSX = require("xlsx");
const BulkJob = require("../models/BulkJob");

const generateCertificateNumber = require('../utils/certificateNumber');
const generateDocx = require('../utils/docxGenerator');
const generateQR = require('../utils/qrGenerator');
const fs = require("fs");
const convertToPdf = require("../utils/docxToPdf");
// const addWatermark = require("../utils/addWatermark");
const normalizeDate = require("../utils/normalizeDate");


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
    
    // Signature MUST be a Buffer
if (!template.instructorSignaturePath) {
  throw new Error("Instructor signature path missing in template");
}

const instructorSignatureBuffer = fs.readFileSync(
  template.instructorSignaturePath
);
    
    // 5️⃣ Prepare DOCX data
    const docxData = {
      first_name: firstName,
      last_name: lastName,
      class_name: className,
      training_date: trainingDate,
      issue_date: new Date().toISOString().split('T')[0],
      certificate_number: certificateNumber,
      instructor_name: template.instructorName,
      qr_code: qrBuffer,
      instructor_signature: instructorSignatureBuffer // Buffer

    };

    // 6️⃣ Generate DOCX
    const outputDocxPath = path.join(
      __dirname,
      '..',
      'uploads',
      'certificates',
      `${certificateNumber}.docx`
    );

    console.log("QR buffer:", Buffer.isBuffer(qrBuffer));
console.log(
  "Signature buffer:",
  Buffer.isBuffer(instructorSignatureBuffer)
);


    generateDocx(
      template.templateFilePath,
      docxData,
      outputDocxPath
    );


    // Convert to PDF
const pdfPath = await convertToPdf(outputDocxPath);

// Add watermark
// await addWatermark(pdfPath, certificateNumber);
fs.unlinkSync(outputDocxPath);

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
      pdfFilePath: pdfPath // will be filled after PDF step
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



exports.issueBulkCertificates = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Excel file is required" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (!rows.length) {
      return res.status(400).json({ message: "Excel file is empty" });
    }

    // 1️⃣ Create bulk job
    const job = await BulkJob.create({
      total: rows.length,
    });

    // 2️⃣ Respond immediately (frontend starts polling)
    res.status(202).json({
      message: "Bulk certificate generation started",
      jobId: job._id,
      total: rows.length,
    });

    // 3️⃣ Process in background
    process.nextTick(async () => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        try {
          const { firstName, lastName, className } = row;
          const trainingDate = normalizeDate(row.trainingDate);

          if (!firstName || !lastName || !className || !trainingDate) {
            throw new Error("Missing or invalid required fields");
          }

          const existing = await Certificate.findOne({
            firstName,
            lastName,
            className,
          });

          if (existing) {
            throw new Error("Certificate already exists");
          }

          const template = await Template.findOne({
            className,
            active: true,
          });

          if (!template || !template.instructorSignaturePath) {
            throw new Error("Template or instructor signature missing");
          }

          const certificateNumber = await generateCertificateNumber();
          const qrBuffer = await generateQR(certificateNumber);

          const instructorSignatureBuffer = fs.readFileSync(
            template.instructorSignaturePath
          );

          const docxData = {
            first_name: firstName,
            last_name: lastName,
            training_date: trainingDate,
            issue_date: new Date().toISOString().split("T")[0],
            certificate_number: certificateNumber,
            instructor_name: template.instructorName,
            qr_code: qrBuffer,
            instructor_signature: instructorSignatureBuffer,
          };

          const outputDocxPath = path.join(
            __dirname,
            "..",
            "uploads",
            "certificates",
            `${certificateNumber}.docx`
          );

          generateDocx(template.templateFilePath, docxData, outputDocxPath);

          const pdfPath = await convertToPdf(outputDocxPath);
          // await addWatermark(pdfPath, certificateNumber);
          fs.unlinkSync(outputDocxPath);

          await Certificate.create({
            certificateNumber,
            firstName,
            lastName,
            className,
            trainingDate,
            issueDate: new Date(),
            instructorName: template.instructorName,
            templateId: template._id,
            pdfFilePath: pdfPath,
          });

          await BulkJob.findByIdAndUpdate(job._id, {
            $inc: { processed: 1, success: 1 },
          });
        } catch (err) {
          await BulkJob.findByIdAndUpdate(job._id, {
            $inc: { processed: 1, failed: 1 },
            $push: {
  errorss: {
    rowNumber: i + 2,
    rowData: row,
    error: err.message
  }
}
,
          });
        }
      }

      await BulkJob.findByIdAndUpdate(job._id, {
        status: "COMPLETED",
      });
    });
  } catch (err) {
    console.error(err);
  }
};


exports.getBulkJobStatus = async (req, res) => {
  const job = await BulkJob.findById(req.params.jobId);

  if (!job) {
    return res.status(404).json({ message: "Bulk job not found" });
  }

  res.json({
    total: job.total,
    processed: job.processed,
    success: job.success,
    failed: job.failed,
    status: job.status,
    errors: job.errors,
  });
};


exports.reissueFailedCertificates = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await BulkJob.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Bulk job not found" });
    }

    const unresolvedErrors = job.errors.filter(e => !e.resolved);

    if (!unresolvedErrors.length) {
      return res.json({ message: "No failed certificates to re-issue" });
    }

    let reissued = 0;
    let stillFailed = [];

    for (let i = 0; i < unresolvedErrors.length; i++) {
      const errorItem = unresolvedErrors[i];
      const row = errorItem.rowData;

      try {
        const { firstName, lastName, className, trainingDate } = row;
        const normalizedDate = normalizeDate(trainingDate);

        if (!firstName || !lastName || !className || !normalizedDate) {
          throw new Error("Invalid data");
        }

        // Prevent duplicate issuance
        const existing = await Certificate.findOne({
          firstName,
          lastName,
          className,
        });

        if (existing) {
          throw new Error("Certificate already exists");
        }

        const template = await Template.findOne({
          className,
          active: true,
        });

        if (!template || !template.instructorSignaturePath) {
          throw new Error("Template or signature missing");
        }

        const certificateNumber = await generateCertificateNumber();
        const qrBuffer = await generateQR(certificateNumber);

        const instructorSignatureBuffer = fs.readFileSync(
          template.instructorSignaturePath
        );

        const docxData = {
          first_name: firstName,
          last_name: lastName,
          training_date: normalizedDate,
          issue_date: new Date().toISOString().split("T")[0],
          certificate_number: certificateNumber,
          instructor_name: template.instructorName,
          qr_code: qrBuffer,
          instructor_signature: instructorSignatureBuffer,
        };

        const outputDocxPath = path.join(
          __dirname,
          "..",
          "uploads",
          "certificates",
          `${certificateNumber}.docx`
        );

        generateDocx(template.templateFilePath, docxData, outputDocxPath);

        const pdfPath = await convertToPdf(outputDocxPath);
        // await addWatermark(pdfPath, certificateNumber);
        fs.unlinkSync(outputDocxPath);

        await Certificate.create({
          certificateNumber,
          firstName,
          lastName,
          className,
          trainingDate: normalizedDate,
          issueDate: new Date(),
          instructorName: template.instructorName,
          templateId: template._id,
          pdfFilePath: pdfPath,
        });

        // ✅ Mark error as resolved
        errorItem.resolved = true;
        errorItem.error = "Resolved successfully";

        reissued++;
      } catch (err) {
        stillFailed.push({
          rowNumber: errorItem.rowNumber,
          error: err.message,
        });
      }
    }

    await job.save();

    res.json({
      message: "Re-issue attempt completed",
      reissued,
      stillFailed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Re-issue failed" });
  }
};



exports.exportFailedBulkRows = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await BulkJob.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Bulk job not found" });
    }

    const failedRows = job.errors.filter(e => !e.resolved);

    if (!failedRows.length) {
      return res.status(400).json({
        message: "No failed rows to export",
      });
    }

    // Prepare rows for Excel
    const excelRows = failedRows.map(e => ({
      ...e.rowData,
      error: e.error, // append error reason
    }));

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Failed Rows");

    // Write to buffer
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Send file
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=bulk_failed_rows_${jobId}.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to export failed rows" });
  }
};


exports.verifyCertificate = async (req, res) => {
  try {
    const certificateNumber = req.params.certificateNumber.trim();

    const certificate = await Certificate.findOne({ certificateNumber });

    if (!certificate) {
      return res.status(404).json({
        valid: false,
        message: "Certificate not found",
      });
    }

    // 🔴 Revocation check using STATUS
    if (certificate.status === "REVOKED") {
      return res.status(200).json({
        valid: false,
        revoked: true,
        status: certificate.status,
        message: "This certificate has been revoked",
        certificateNumber: certificate.certificateNumber,
        studentName: `${certificate.firstName} ${certificate.lastName}`,
        className: certificate.className,
      });
    }

    // ✅ Valid certificate
    res.status(200).json({
      valid: true,
      revoked: false,
      status: certificate.status,
      certificateNumber: certificate.certificateNumber,
      studentName: `${certificate.firstName} ${certificate.lastName}`,
      className: certificate.className,
      trainingDate: certificate.trainingDate,
      issueDate: certificate.issueDate,
      instructorName: certificate.instructorName,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      valid: false,
      message: "Verification failed",
    });
  }
};

exports.toggleCertificateStatus = async (req, res) => {
  try {
    const certificateNumber = req.params.certificateNumber.trim();

    const certificate = await Certificate.findOne({ certificateNumber });

    if (!certificate) {
      return res.status(404).json({
        message: "Certificate not found",
      });
    }

    // 🔁 Toggle logic
    const newStatus =
      certificate.status === "ISSUED" ? "REVOKED" : "ISSUED";

    certificate.status = newStatus;
    await certificate.save();

    res.json({
      message:
        newStatus === "REVOKED"
          ? "Certificate revoked successfully"
          : "Certificate reinstated successfully",
      certificateNumber: certificate.certificateNumber,
      status: certificate.status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to toggle certificate status",
    });
  }
};

exports.getCertificates = async (req, res) => {
  try {
    const {
      search,
      status,
      page = 1,
      limit = 10
    } = req.query;

    const role = req.user.role; // ADMIN or STAFF
    const query = {};

    // 🔍 Search logic
    if (search) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { certificateNumber: regex },
        { firstName: regex },
        { lastName: regex }
      ];
    }

    // 🔘 Status filter
    if (status && ["ISSUED", "REVOKED"].includes(status)) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    // 🔐 Role-based projection
    let projection = {};

    if (role === "STAFF") {
      projection = {
        pdfFilePath: 0,     // hide
        templateId: 0,      // hide internal
        __v: 0
      };
    }

    // ADMIN sees everything (no projection)

    const [certificates, total] = await Promise.all([
      Certificate.find(query, projection)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Certificate.countDocuments(query)
    ]);

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      certificates
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch certificates"
    });
  }
};

