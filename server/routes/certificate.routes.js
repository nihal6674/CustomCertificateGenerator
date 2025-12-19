const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const controller = require('../controllers/certificate.controller');

// Single certificate issuance
router.post(
  '/issue',
  auth,
  role('ADMIN', 'STAFF'),
  controller.issueSingleCertificate
);

module.exports = router;
