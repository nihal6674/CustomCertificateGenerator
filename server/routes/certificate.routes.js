const express = require("express");
const router = express.Router();
const multer = require("multer");

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const controller = require("../controllers/certificate.controller");

// upload Excel files
const upload = multer({ dest: "uploads/excel" });

// Single certificate issuance
router.post(
  "/issue",
  auth,
  role("ADMIN", "STAFF"),
  controller.issueSingleCertificate
);

// 🔥 Bulk certificate issuance
router.post(
  "/issue-bulk",
  auth,
  role("ADMIN", "STAFF"),
  upload.single("file"), // Excel file
  controller.issueBulkCertificates
);

// Bulk status (POLLING)
router.get(
  "/bulk-status/:jobId",
  auth,
  role("ADMIN", "STAFF"),
  controller.getBulkJobStatus
);

// routes/certificate.routes.js

router.post(
  "/reissue-failed/:jobId",
  auth,
  role("ADMIN", "STAFF"),
  controller.reissueFailedCertificates
);

router.get(
  "/bulk-failed/:jobId/export",
  auth,
  role("ADMIN", "STAFF"),
  controller.exportFailedBulkRows
);

// Public verification endpoint (NO auth)
router.get(
  "/verify/:certificateNumber",
  controller.verifyCertificate
);


router.patch(
  "/status/:certificateNumber",
  auth,
  role("ADMIN"),
  controller.toggleCertificateStatus
);

// List & search certificates
router.get(
  "/",
  auth,
  role("ADMIN", "STAFF"),
  controller.getCertificates
);


router.get(
  "/download/:certificateNumber",
  controller.downloadCertificate
);

router.post("/dispatch-emails", auth,
  role("STAFF"), controller.dispatchCertificateEmails);

router.get("/email-stats",auth,
  role("ADMIN","STAFF"), controller.getEmailStats);

module.exports = router;
