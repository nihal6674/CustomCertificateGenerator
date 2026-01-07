const path = require('path');
const Template = require('../models/Template');
const Certificate = require('../models/Certificate');
const XLSX = require("xlsx");
const BulkJob = require("../models/BulkJob");

const generateCertificateNumber = require('../utils/certificateNumber');
const formatCertificateNumber = require('../utils/formatCertificateNumber')
const generateDocx = require('../utils/docxGenerator');
const generateQR = require('../utils/qrGenerator');
const fs = require("fs");
const convertToPdf = require("../utils/docxToPdf");
const uploadToR2 = require("../utils/uploadToR2");
const downloadFromR2= require("../utils/downloadFromR2")
const { getSignedViewUrl } = require("../utils/r2SignedUrl");

// const addWatermark = require("../utils/addWatermark");
const normalizeDate = require("../utils/normalizeDate");














exports.issueSingleCertificate = async (req, res) => {
  console.log("STEP 1: Request received");

  try {
    const {
      firstName,
      middleName,
      lastName,
      className,
      trainingDate,
    } = req.body;

    /* ---------------- VALIDATION ---------------- */
    if (!firstName || !lastName || !className || !trainingDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    /* ---------------- DUPLICATE CHECK ---------------- */
    const existing = await Certificate.findOne({
      firstName,
      lastName,
      className,
    });

    if (existing) {
      return res.status(400).json({
        message: "Certificate already exists for this student and class",
      });
    }

    /* ---------------- TEMPLATE ---------------- */
    const template = await Template.findOne({
      className,
      active: true,
    });

    if (!template) {
      return res.status(404).json({
        message: "No active template found for this class",
      });
    }
    console.log("STEP 2: Template fetched", {
  hasTemplate: !!template,
  templateFilePath: template?.templateFilePath,
});

    /* ---------------- CERT NUMBER ---------------- */
    const baseCertNumber = await generateCertificateNumber();

    const certificateNumber = formatCertificateNumber({
      certNumber: baseCertNumber,
      firstName,
      middleName: middleName || null,
      lastName,
    });

    /* ---------------- QR ---------------- */
    // const qrBuffer = await generateQR(baseCertNumber);

    const testImagePath = path.join(__dirname, "..", "assets", "test-image.png");
    const qrBuffer = fs.readFileSync(testImagePath);
    console.log("USING STATIC IMAGE INSTEAD OF QR", {
      isBuffer: Buffer.isBuffer(qrBuffer),
      length: qrBuffer.length,
    });


    console.log("STEP 3: Static image loaded", {
  isBuffer: Buffer.isBuffer(qrBuffer),
  length: qrBuffer.length,
});

    /* ---------------- DOWNLOAD FROM R2 ---------------- */
    const templateBuffer = await downloadFromR2(
      template.templateFilePath
    );

    const instructorSignatureBuffer = await downloadFromR2(
      template.instructorSignaturePath
    );

    console.log("STEP 4: R2 downloads done", {
  templateIsBuffer: Buffer.isBuffer(templateBuffer),
  templateSize: templateBuffer?.length,
  signIsBuffer: Buffer.isBuffer(instructorSignatureBuffer),
  signSize: instructorSignatureBuffer?.length,
});

    // 🔐 HARD SAFETY CHECK (FIXES PROD CRASH)
    if (!Buffer.isBuffer(qrBuffer)) {
      throw new Error("QR code buffer invalid");
    }

    if (!Buffer.isBuffer(instructorSignatureBuffer)) {
      throw new Error("Instructor signature buffer invalid");
    }

    /* ---------------- DOCX DATA ---------------- */
    const docxData = {
      first_name: firstName,
      middle_name: middleName || "",
      last_name: lastName,
      class_name: className,
      training_date: trainingDate,
      issue_date: new Date().toISOString().split("T")[0],
      certificate_number: baseCertNumber,
      instructor_name: template.instructorName,
      qr_code: qrBuffer,
      instructor_signature: instructorSignatureBuffer,
    };

    /* ---------------- TEMP DOCX ---------------- */
    const tempId = `${certificateNumber}-${Date.now()}`;
    const outputDocxPath = path.join(
      __dirname,
      "..",
      "uploads",
      "certificates",
      `${tempId}.docx`
    );

    const uploadsDir = path.join(__dirname, "..", "uploads", "certificates");
fs.mkdirSync(uploadsDir, { recursive: true });

console.log("QR TYPE:", qrBuffer?.constructor?.name);
console.log("SIGN TYPE:", instructorSignatureBuffer?.constructor?.name);
console.log("QR IS BUFFER:", Buffer.isBuffer(qrBuffer));
console.log("SIGN IS BUFFER:", Buffer.isBuffer(instructorSignatureBuffer));

console.log("STEP 5: About to generate DOCX", {
  keys: Object.keys(docxData),
  qrType: qrBuffer.constructor.name,
  signType: instructorSignatureBuffer.constructor.name,
});

   try {
    
  await generateDocx(templateBuffer, docxData, outputDocxPath);
  
} catch (e) {
  console.error("DOCX ERROR:", e);
  console.error("ERROR PROPERTIES:", e.properties);
  throw e;
}

console.log("STEP 6: DOCX generated successfully");

    /* ---------------- PDF ---------------- */
    const pdfLocalPath = await convertToPdf(outputDocxPath);
    console.log("STEP 7: PDF generated", pdfLocalPath);

    /* ---------------- UPLOAD PDF ---------------- */
    const r2Key = `certificates/${certificateNumber}.pdf`;

    await uploadToR2({
      filePath: pdfLocalPath,
      key: r2Key,
    });

    console.log("STEP 8: PDF uploaded to R2", r2Key);


    /* ---------------- CLEANUP ---------------- */
    if (fs.existsSync(outputDocxPath)) fs.unlinkSync(outputDocxPath);
    if (fs.existsSync(pdfLocalPath)) fs.unlinkSync(pdfLocalPath);

    /* ---------------- SAVE ---------------- */
    const certificate = await Certificate.create({
      certificateNumber: baseCertNumber,
      firstName,
      middleName: middleName || null,
      lastName,
      className,
      trainingDate,
      issueDate: new Date(),
      instructorName: template.instructorName,
      templateId: template._id,
      pdfFilePath: r2Key,
    });

    res.status(201).json({
      message: "Certificate issued successfully",
      certificate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
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
      processed: 0,
      success: 0,
      failed: 0,
      errors: [],
      status: "PROCESSING",
    });

    // 2️⃣ Respond immediately
    res.status(202).json({
      message: "Bulk certificate generation started",
      jobId: job._id,
      total: rows.length,
    });

    // 3️⃣ Background processing
    process.nextTick(async () => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        try {
          const {
            firstName,
            middleName, // ✅ optional
            lastName,
            className,
          } = row;

          const trainingDate = normalizeDate(row.trainingDate);
          if (!trainingDate) {
  throw new Error("Invalid or missing trainingDate");
}

          // ---------------- VALIDATION ----------------
          if (!firstName || !lastName || !className || !trainingDate) {
            throw new Error("Missing or invalid required fields");
          }

          // ---------------- DUPLICATE CHECK ----------------
          // middleName intentionally ignored
          const existing = await Certificate.findOne({
            firstName,
            lastName,
            className,
          });

          if (existing) {
            throw new Error("Certificate already exists");
          }

          // ---------------- TEMPLATE ----------------
          const template = await Template.findOne({
            className,
            active: true,
          });

          if (!template || !template.instructorSignaturePath) {
            throw new Error(
              "Template or instructor signature is not valid/active"
            );
          }

          // ---------------- CERTIFICATE NUMBER ----------------
          const baseCertNumber = await generateCertificateNumber();

          const certificateNumber = formatCertificateNumber({
            certNumber: baseCertNumber,
            firstName,
            middleName: middleName || null,
            lastName,
          });

          // ---------------- QR CODE ----------------
          const qrBuffer = await generateQR(baseCertNumber);

         const templateBuffer = await downloadFromR2(
  template.templateFilePath
);

const instructorSignatureBuffer = await downloadFromR2(
  template.instructorSignaturePath
);


          // ---------------- DOCX DATA ----------------
          const docxData = {
  first_name: firstName,
  middle_name: middleName || "",
  last_name: lastName,
  class_name: className,
  training_date: trainingDate,
  issue_date: new Date().toISOString().split("T")[0],
  certificate_number: baseCertNumber,
  instructor_name: template.instructorName,
  qr_code: qrBuffer,
  instructor_signature: instructorSignatureBuffer,
};
          // ---------------- TEMP FILE ----------------
          const tempId = `${certificateNumber}-${Date.now()}-${i}`;

          const outputDocxPath = path.join(
            __dirname,
            "..",
            "uploads",
            "certificates",
            `${tempId}.docx`
          );

         await generateDocx(
  templateBuffer,
  docxData,
  outputDocxPath
);


          // ---------------- PDF ----------------
          const pdfLocalPath = await convertToPdf(outputDocxPath);

          // R2 object key (clean naming)
          const r2Key = `certificates/${certificateNumber}.pdf`;

          // Upload to Cloudflare R2
          await uploadToR2({
            filePath: pdfLocalPath,
            key: r2Key,
          });

          // Cleanup temp files
          if (fs.existsSync(outputDocxPath)) fs.unlinkSync(outputDocxPath);
          if (fs.existsSync(pdfLocalPath)) fs.unlinkSync(pdfLocalPath);


          // ---------------- SAVE CERTIFICATE ----------------
          await Certificate.create({
            certificateNumber: baseCertNumber,
            firstName,
            middleName: middleName || null, // ✅ stored
            lastName,
            className,
            trainingDate,
            issueDate: new Date(),
            instructorName: template.instructorName,
            templateId: template._id,
            pdfFilePath: r2Key,
          });

          await BulkJob.findByIdAndUpdate(job._id, {
            $inc: { processed: 1, success: 1 },
          });
        } catch (err) {
          await BulkJob.findByIdAndUpdate(job._id, {
            $inc: { processed: 1, failed: 1 },
            $push: {
              errors: {
                rowNumber: i + 2,   // Excel row number
                rowData: row,
                error: err.message,
                resolved: false,
              },
            },
          });
        }
      }

      // 4️⃣ Final status
      const finalJob = await BulkJob.findById(job._id);

      await BulkJob.findByIdAndUpdate(job._id, {
        status:
          finalJob.errors.length > 0
            ? "COMPLETED_WITH_ERRORS"
            : "COMPLETED",
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

    const unresolvedErrors = job.errors.filter((e) => !e.resolved);
    if (!unresolvedErrors.length) {
      return res.json({ message: "No failed certificates to re-issue" });
    }

    let reissued = 0;
    let stillFailed = [];

    for (let i = 0; i < unresolvedErrors.length; i++) {
      const errorItem = unresolvedErrors[i];
      const row = errorItem.rowData;

      try {
        const {
          firstName,
          middleName,
          lastName,
          className,
          trainingDate,
        } = row;

        const normalizedDate = normalizeDate(trainingDate);


        /* ---------------- VALIDATION ---------------- */
        if (!firstName || !lastName || !className || !normalizedDate) {
          throw new Error("Invalid or missing required data");
        }

        /* ---------------- DUPLICATE CHECK ---------------- */
        const existing = await Certificate.findOne({
          firstName,
          lastName,
          className,
        });

        if (existing) {
          throw new Error("Certificate already exists");
        }

        /* ---------------- FETCH TEMPLATE ---------------- */
        const template = await Template.findOne({
          className,
          active: true,
        });

        if (
          !template ||
          !template.templateFilePath ||
          !template.instructorSignaturePath
        ) {
          throw new Error("Template or instructor signature missing");
        }

        /* ---------------- CERTIFICATE NUMBER ---------------- */
        const baseCertNumber = await generateCertificateNumber();

        const certificateNumber = formatCertificateNumber({
          certNumber: baseCertNumber,
          firstName,
          middleName: middleName || null,
          lastName,
        });

        /* ---------------- QR CODE ---------------- */
        const qrBuffer = await generateQR(baseCertNumber);

        /* ---------------- DOWNLOAD TEMPLATE & SIGNATURE FROM R2 ---------------- */
        const templateBuffer = await downloadFromR2(
          template.templateFilePath
        );

        const instructorSignatureBuffer = await downloadFromR2(
          template.instructorSignaturePath
        );

        /* ---------------- DOCX DATA ---------------- */
        const docxData = {
          first_name: firstName,
          middle_name: middleName || "",
          last_name: lastName,
          class_name: className,
          training_date: normalizedDate,
          issue_date: new Date().toISOString().split("T")[0],
          certificate_number: baseCertNumber,
          instructor_name: template.instructorName,
          qr_code: qrBuffer,
          instructor_signature: instructorSignatureBuffer,
        };

        /* ---------------- TEMP DOCX FILE ---------------- */
        const tempId = `${certificateNumber}-${Date.now()}-${i}`;

        const outputDocxPath = path.join(
          __dirname,
          "..",
          "uploads",
          "certificates",
          `${tempId}.docx`
        );

       await generateDocx(
          templateBuffer, // ✅ BUFFER FROM R2
          docxData,
          outputDocxPath
        );

        /* ---------------- PDF CONVERSION ---------------- */
        const pdfLocalPath = await convertToPdf(outputDocxPath);

        /* ---------------- UPLOAD PDF TO R2 ---------------- */
        const r2Key = `certificates/${certificateNumber}.pdf`;

        await uploadToR2({
          filePath: pdfLocalPath,
          key: r2Key,
        });

        /* ---------------- CLEANUP LOCAL FILES ---------------- */
        if (fs.existsSync(outputDocxPath)) fs.unlinkSync(outputDocxPath);
        if (fs.existsSync(pdfLocalPath)) fs.unlinkSync(pdfLocalPath);

        /* ---------------- SAVE CERTIFICATE ---------------- */
        await Certificate.create({
          certificateNumber: baseCertNumber,
          firstName,
          middleName: middleName || null,
          lastName,
          className,
          trainingDate: normalizedDate,
          issueDate: new Date(),
          instructorName: template.instructorName,
          templateId: template._id,
          pdfFilePath: r2Key,
        });

        /* ---------------- MARK ERROR RESOLVED ---------------- */
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

    const failedRows = job.errors.filter((e) => !e.resolved);

    if (!failedRows.length) {
      return res.status(400).json({
        message: "No failed rows to export",
      });
    }

    /* ---------------- DATE FORMATTER ---------------- */
    const toMMDDYYYY = (value) => {
      // Excel serial date
      if (typeof value === "number" && value > 30000 && value < 60000) {
        const utc_days = Math.floor(value - 25569);
        const date = new Date(utc_days * 86400 * 1000);
        return formatDate(date);
      }

      // JS Date object
      if (value instanceof Date && !isNaN(value)) {
        return formatDate(value);
      }

      return value;
    };

    const formatDate = (date) => {
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    };

    /* ---------------- CLEAN ROW DATA ---------------- */
    const excelRows = failedRows.map((e) => {
      const cleanedRow = {};

      for (const key in e.rowData) {
        cleanedRow[key] = toMMDDYYYY(e.rowData[key]);
      }

      // Append error reason
      cleanedRow.error = e.error;

      return cleanedRow;
    });

    /* ---------------- CREATE EXCEL ---------------- */
    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Failed Rows");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    /* ---------------- SEND FILE ---------------- */
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

    // Helper to format full name safely
    const fullName = [
      certificate.firstName,
      certificate.middleName, // optional
      certificate.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    // 🔴 Revocation check
    if (certificate.status === "REVOKED") {
      return res.status(200).json({
        valid: false,
        revoked: true,
        status: certificate.status,
        message: "This certificate has been revoked",
        certificateNumber: certificate.certificateNumber,
        studentName: fullName,
        className: certificate.className,
      });
    }

    // ✅ Valid certificate
    return res.status(200).json({
      valid: true,
      revoked: false,
      status: certificate.status,
      certificateNumber: certificate.certificateNumber,
      studentName: fullName,
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchRaw = (req.query.search || "").trim();

    const skip = (page - 1) * limit;

    /* ---------------- SEARCH QUERY ---------------- */
    const query = {};

    // Escape regex special characters
    const escapeRegex = (text) =>
      text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    if (searchRaw) {
      const parts = searchRaw
        .split(/\s+/)       // split by spaces
        .map(escapeRegex); // escape regex chars

      query.$and = parts.map((part) => ({
        $or: [
          { firstName: { $regex: part, $options: "i" } },
          { middleName: { $regex: part, $options: "i" } }, // ✅ ADDED
          { lastName: { $regex: part, $options: "i" } },
          { className: { $regex: part, $options: "i" } },
          { certificateNumber: { $regex: part, $options: "i" } },
          { instructorName: { $regex: part, $options: "i" } },
        ],
      }));
    }

    /* ---------------- FETCH DATA ---------------- */
    const [certificates, total] = await Promise.all([
      Certificate.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Certificate.countDocuments(query),
    ]);

    res.json({
      total,
      page,
      limit,
      certificates,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUBLIC: Download certificate PDF
 * GET /api/certificates/download/:certificateNumber
 */
exports.downloadCertificate = async (req, res) => {
  try {
    const certificateNumber = req.params.certificateNumber?.trim();

    if (!certificateNumber) {
      return res.status(400).json({
        message: "Certificate number is required",
      });
    }

    const certificate = await Certificate.findOne({ certificateNumber });

    if (!certificate) {
      return res.status(404).json({
        message: "Certificate not found",
      });
    }

    // ❌ Revoked or invalid
    if (certificate.status !== "ISSUED") {
      return res.status(403).json({
        message: "Certificate is not valid for download",
        status: certificate.status,
      });
    }

    if (!certificate.pdfFilePath) {
      return res.status(500).json({
        message: "Certificate file not available",
      });
    }

    // 🔐 Generate short-lived signed URL (5 minutes)
    const signedUrl = await getSignedViewUrl(
      certificate.pdfFilePath,
      300 // seconds
    );

    // 🔁 Redirect browser to Cloudflare R2
    return res.redirect(signedUrl);
  } catch (err) {
    console.error("DOWNLOAD CERT ERROR:", err);
    res.status(500).json({
      message: "Failed to download certificate",
    });
  }
};

