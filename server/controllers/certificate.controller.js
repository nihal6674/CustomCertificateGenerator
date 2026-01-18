const path = require('path');
const Template = require('../models/Template');
const Certificate = require('../models/Certificate');
const XLSX = require("xlsx");
const BulkJob = require("../models/BulkJob");

const generateCertificateNumber = require('../utils/certificateNumber');
const formatCertificateNumber = require('../utils/formatCertificateNumber')
const generateDocx = require('../utils/docxGenerator');
const generateQR = require('../utils/qrGenerator');
const { sendCertificateEmail } = require("../services/emailService");
const { sendCertificateStatusEmail} = require("../utils/sendCertificateStatusEmail")
const fs = require("fs");
const convertToPdf = require("../utils/docxToPdf");
const uploadToR2 = require("../utils/uploadToR2");
const downloadFromR2 = require("../utils/downloadFromR2")
const { getSignedViewUrl } = require("../utils/r2SignedUrl");
const axios = require("axios");
const { generateCertificateDoc } = require("../utils/pythonDocx.service");
const BATCH_SIZE = Math.max(
  1,
  parseInt(process.env.CERT_EMAIL_BATCH_SIZE, 10) || 50
);
console.log("BATCH NUMBER",process.env.CERT_EMAIL_BATCH_SIZE);
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
      email
    } = req.body;

    /* ---------------- VALIDATION ---------------- */
    if (!firstName || !lastName || !className || !trainingDate || !email) {
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


    /* ---------------- DOCX (PYTHON SERVICE) ---------------- */

    const pythonPayload = {
      templateKey: template.templateFilePath,
      signatureKey: template.instructorSignaturePath,
      outputKey: "certificates/",

      data: {
        first_name: firstName,
        middle_name: middleName || "",
        last_name: lastName,
        class_name: className,
        training_date: trainingDate,
        issue_date: new Date().toISOString().split("T")[0],
        certificate_number: baseCertNumber,
        instructor_name: template.instructorName,
      },
    };

    const docxPdfResult=await generateCertificateDoc(pythonPayload);
  
    const r2Key = docxPdfResult.key;

    console.log("STEP 6: DOCX/PDF generated via Python", r2Key);

    /* ---------------- PDF ---------------- */
    // const pdfLocalPath = await convertToPdf(outputDocxPath);
    // console.log("STEP 7: PDF generated", pdfLocalPath);

    /* ---------------- UPLOAD PDF ---------------- */
    // const r2Key = `certificates/${certificateNumber}.pdf`;

    // await uploadToR2({
    //   filePath: pdfLocalPath,
    //   key: r2Key,
    // });

    // console.log("STEP 8: PDF uploaded to R2", r2Key);


    /* ---------------- CLEANUP ---------------- */
    // if (fs.existsSync(pdfLocalPath)) fs.unlinkSync(pdfLocalPath);

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
      email,
  emailStatus: "PENDING",
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
            email
          } = row;

          const trainingDate = normalizeDate(row.trainingDate);
          if (!trainingDate) {
            throw new Error("Invalid or missing trainingDate");
          }

          // ---------------- VALIDATION ----------------
          if (!firstName || !lastName || !className || !trainingDate ||!email) {
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

          // const certificateNumber = formatCertificateNumber({
          //   certNumber: baseCertNumber,
          //   firstName,
          //   middleName: middleName || null,
          //   lastName,
          // });

          const pythonPayload = {
            templateKey: template.templateFilePath,
            signatureKey: template.instructorSignaturePath,
            outputKey: "", // Python builds filename itself
            data: {
              first_name: firstName,
              middle_name: middleName || "",
              last_name: lastName,
              class_name: className,
              training_date: trainingDate,
              issue_date: new Date().toISOString(),
              certificate_number: baseCertNumber,
              instructor_name: template.instructorName,
            },
          };

          const docxPdfResult = await generateCertificateDoc(pythonPayload);

          const pdfR2Key = docxPdfResult.key;

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
            pdfFilePath: pdfR2Key,
            email,
  emailStatus: "PENDING",
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

//python service to be added
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

// python service to be added
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

        
          const pythonPayload = {
            templateKey: template.templateFilePath,
            signatureKey: template.instructorSignaturePath,
            outputKey: "", // Python builds filename itself
            data: {
              first_name: firstName,
              middle_name: middleName || "",
              last_name: lastName,
              class_name: className,
              training_date: trainingDate,
              issue_date: new Date().toISOString(),
              certificate_number: baseCertNumber,
              instructor_name: template.instructorName,
            },
          };

          const docxPdfResult = await generateCertificateDoc(pythonPayload);

          const pdfR2Key = docxPdfResult.key;

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
          pdfFilePath: pdfR2Key,
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
    const { notifyStudent = false, adminMessage = "" } = req.body;

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

    // 📧 Optional email notification
    if (notifyStudent && certificate.email) {
      try {
        const studentName = [
          certificate.firstName,
          certificate.middleName,
          certificate.lastName,
        ]
          .filter(Boolean)
          .join(" ");

        await sendCertificateStatusEmail({
          to: certificate.email,
          studentName,
          certificateNumber: certificate.certificateNumber,
          status: newStatus,
          adminMessage,
        });
      } catch (emailErr) {
        console.error(
          "Email notification failed:",
          emailErr.message
        );
        // ❗ Do NOT fail the request because email failed
      }
    }

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


exports.dispatchCertificateEmails = async (req, res) => {
  console.log("📨 [DISPATCH] Request received");

  // 1️⃣ Fetch candidates
  const certificates = await Certificate.find({
    status: "ISSUED",
    emailStatus: { $in: ["PENDING", "FAILED"] },
  }).limit(BATCH_SIZE);

  console.log(
    `📨 [DISPATCH] Found ${certificates.length} certificates`
  );

  if (!certificates.length) {
    return res.json({ message: "No pending certificate emails" });
  }

  // 2️⃣ LOCK THEM (PROCESSING)
  await Certificate.updateMany(
    { _id: { $in: certificates.map(c => c._id) } },
    { emailStatus: "PROCESSING" }
  );

  res.json({
    message: "Email dispatch started",
    count: certificates.length,
  });

  // 3️⃣ Background processing
  process.nextTick(async () => {
    let success = 0;
    let failed = 0;

    for (let i = 0; i < certificates.length; i++) {
      const cert = certificates[i];

      console.log(
        `➡️ [${i + 1}/${certificates.length}] ${cert.email} | ${cert.certificateNumber}`
      );

      try {
        const studentName = [
  cert.firstName,
  cert.middleName,
  cert.lastName,
].filter(Boolean).join(" ");

await sendCertificateEmail({
  to: cert.email,
  studentName,
  courseTitle: cert.className,
  trainingDate: cert.trainingDate.toDateString(),
  certificateNumber: cert.certificateNumber,
  pdfKey: cert.pdfFilePath,
});


        await Certificate.findByIdAndUpdate(cert._id, {
          emailStatus: "SENT",
          emailSentAt: new Date(),
          emailError: null,
        });

        success++;
        console.log(
          `✅ [SENT] ${cert.email} | ${cert.certificateNumber}`
        );
      } catch (err) {
        failed++;
        console.error(
          `❌ [FAILED] ${cert.email} | ${cert.certificateNumber}`,
          err.message
        );

        await Certificate.findByIdAndUpdate(cert._id, {
          emailStatus: "FAILED",
          emailError: err.message,
        });
      }
    }

    console.log(
      `📊 [DISPATCH COMPLETE] Total=${certificates.length}, Sent=${success}, Failed=${failed}`
    );
  });
};

// controllers/certificateEmailController.js
exports.getEmailStats = async (req, res) => {
  const [pending, sent, failed] = await Promise.all([
    Certificate.countDocuments({
      status: "ISSUED",
      emailStatus: "PENDING",
    }),
    Certificate.countDocuments({
      status: "ISSUED",
      emailStatus: "SENT",
    }),
    Certificate.countDocuments({
      status: "ISSUED",
      emailStatus: "FAILED",
    }),
  ]);

  res.json({ pending, sent, failed });
};
