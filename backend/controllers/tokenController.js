const tokenScorer = require('../services/tokenScorer');
const priceService = require('../services/priceService');
const paymasterService = require('../services/paymasterService');

/**
 * Controller for token recommendation endpoints
 */
const tokenController = {
  /**
   * Recommend the best token for gas payment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async recommendToken(req, res) {
    try {
      const { tokens, address } = req.body;
      
      if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid token list is required'
        });
      }
      
      // Filter tokens to only include those supported by the Paymaster
      const supportedTokens = await paymasterService.filterSupportedTokens(tokens);
      
      if (supportedTokens.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No supported tokens found in the provided list',
          supportedCount: 0
        });
      }
      
      // Fetch price data for all tokens
      const priceData = await priceService.getPriceData(supportedTokens);
      
      // Fetch slippage data for all tokens
      const slippageData = await priceService.getSlippageData(supportedTokens);
      
      // Score tokens to find the best one
      const recommendation = tokenScorer.scoreTokens(
        supportedTokens,
        priceData,
        slippageData
      );
      
      // Return token recommendation
      return res.json({
        success: true,
        recommendation: recommendation.recommendedToken,
        allScores: recommendation.allScores,
        supportedCount: supportedTokens.length
      });
    } catch (error) {
      console.error('Error in recommendToken:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },
  
  /**
   * Get all tokens supported by the Paymaster
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSupportedTokens(req, res) {
    try {
      const supportedTokens = await paymasterService.getSupportedTokens();
      
      return res.json({
        success: true,
        tokens: supportedTokens,
        count: supportedTokens.length
      });
    } catch (error) {
      console.error('Error in getSupportedTokens:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },
  
  /**
   * Get supported payment types
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPaymentTypes(req, res) {
    try {
      const paymentTypes = await paymasterService.getSupportedPaymentTypes();
      
      return res.json({
        success: true,
        paymentTypes
      });
    } catch (error) {
      console.error('Error in getPaymentTypes:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },
  
  /**
   * Estimate gas cost for a transaction
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async estimateGasCost(req, res) {
    try {
      const { userOp, tokenAddress } = req.body;
      
      if (!userOp || !tokenAddress) {
        return res.status(400).json({
          success: false,
          error: 'UserOperation and token address are required'
        });
      }
      
      // Check if token is supported
      const isSupported = await paymasterService.isTokenSupported(tokenAddress);
      if (!isSupported) {
        return res.status(400).json({
          success: false,
          error: 'Token is not supported by the Paymaster'
        });
      }
      
      // Estimate gas cost
      const estimate = await paymasterService.estimateGasCost(userOp, tokenAddress);
      
      return res.json({
        success: true,
        estimate
      });
    } catch (error) {
      console.error('Error in estimateGasCost:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
};

module.exports = tokenController;