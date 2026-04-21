const express = require('express');
const router  = express.Router();
const {
  getSalesReport,
  getTopSellingMedicines,
  getInventoryReport,
  getPurchaseReport,
  getDashboardStats,
  getRecentActivities,
} = require('../controllers/reportController');

router.get('/dashboard', getDashboardStats);
router.get('/sales', getSalesReport);
router.get('/top-medicines', getTopSellingMedicines);
router.get('/inventory', getInventoryReport);
router.get('/purchases', getPurchaseReport);
router.get('/activities', getRecentActivities);  // real recent activities

module.exports = router;