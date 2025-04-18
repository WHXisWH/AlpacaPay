const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');

/**
 * @route   POST /api/recommend-token
 * @desc    Get AI recommendation for the best token to use for gas payment
 * @access  Public
 */
router.post('/recommend-token', tokenController.recommendToken);

/**
 * @route   GET /api/supported-tokens
 * @desc    Get all tokens supported by the Paymaster
 * @access  Public
 */
router.get('/supported-tokens', tokenController.getSupportedTokens);

/**
 * @route   GET /api/payment-types
 * @desc    Get supported payment types
 * @access  Public
 */
router.get('/payment-types', tokenController.getPaymentTypes);

/**
 * @route   POST /api/estimate-gas
 * @desc    Estimate gas cost for a transaction
 * @access  Public
 */
router.post('/estimate-gas', tokenController.estimateGasCost);

module.exports = router;