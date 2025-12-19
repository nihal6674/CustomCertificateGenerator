const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

const controller = require('../controllers/template.controller');

router.post(
  '/',
  auth,
  role('ADMIN'),
  upload.fields([
    { name: 'template', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]),
  controller.createTemplate
);

router.get('/', auth, role('ADMIN'), controller.getTemplates);

router.patch(
  '/:id',
  auth,
  role('ADMIN'),
  upload.fields([
    { name: 'template', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]),
  controller.updateTemplate
);

router.patch('/:id/deactivate', auth, role('ADMIN'), controller.deactivateTemplate);

module.exports = router;
