const express = require('express');
const router = express.Router();

const {
  createSale,
  getSales,
  getDailyReport,
  getSalesByPartner
} = require('../controllers/sales.controller');

router.get('/', getSales);
router.post('/', createSale);
router.get('/daily-report', getDailyReport);
router.get('/partner/:partner', getSalesByPartner);

module.exports = router;
