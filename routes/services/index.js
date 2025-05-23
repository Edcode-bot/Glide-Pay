const express = require('express');
const router = express.Router();

// Import service routes
const shoppingRoutes = require('./shopping');
const billPaymentRoutes = require('./billPayment');
const housingRoutes = require('./housing');
const financialRoutes = require('./financial');

// Mount routes
router.use('/shopping', shoppingRoutes);
router.use('/bills', billPaymentRoutes);
router.use('/housing', housingRoutes);
router.use('/financial', financialRoutes);

module.exports = router; 