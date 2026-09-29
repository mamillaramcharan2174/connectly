const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/overview', adminController.getAdminOverview);
router.get('/users', adminController.listUsers);
router.post('/users/:id/suspension', adminController.toggleUserSuspension);
router.get('/reports', adminController.getReportsQueue);
router.post('/reports/:id/resolve', adminController.resolveReport);

module.exports = router;
