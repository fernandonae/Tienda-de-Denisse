const express = require('express');
const router = express.Router();

const {
  createSale,
  getSales,
  cancelSale,
  getDailyReport,
  getSalesByPartner,
  updateSale
} = require('../controllers/sales.controller');

router.get('/', getSales);
router.post('/', createSale);
router.get('/daily-report', getDailyReport);
router.get('/partner/:partner', getSalesByPartner);
router.patch('/:id/cancel', cancelSale);
router.patch('/:id', updateSale);

module.exports = router;
