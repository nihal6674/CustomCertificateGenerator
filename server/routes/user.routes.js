const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const controller = require('../controllers/user.controller');

router.get('/', auth, role('ADMIN'), controller.getUsers);
router.post('/', auth, role('ADMIN'), controller.createUser);
router.patch('/:id/status', auth, role('ADMIN'), controller.toggleUserStatus);
router.patch('/:id/role', auth, role('ADMIN'), controller.changeRole);

module.exports = router;
