const axios = require('axios');
const { ethers } = require('ethers');

// Load environment variables
const {
  NERO_RPC_URL,
  PAYMASTER_URL,
  PAYMASTER_API_KEY,
  ENTRYPOINT_ADDRESS
} = process.env;

/**
 * Service for interacting with NERO Chain's Paymaster
 */
class PaymasterService {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(NERO_RPC_URL);
    this.paymasterProvider = new ethers.providers.JsonRpcProvider(PAYMASTER_URL);
    this.entryPoint = ENTRYPOINT_ADDRESS || "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
    this.apiKey = PAYMASTER_API_KEY;
    
    // Cache for supported tokens
    this.supportedTokens = null;
    this.supportedTokensTimestamp = 0;
    this.cacheTTL = 10 * 60 * 1000; // 10 minutes
  }

  /**
   * Get tokens supported by the Paymaster
   * @returns {Array} - Array of supported token objects
   */
  async getSupportedTokens() {
    // Return cached data if available and not expired
    if (
      this.supportedTokens &&
      (Date.now() - this.supportedTokensTimestamp <= this.cacheTTL)
    ) {
      return this.supportedTokens;
    }
    
    // Create a minimal UserOp for the request
    const minimalUserOp = {
      sender: ethers.constants.AddressZero,
      nonce: "0x0",
      initCode: "0x",
      callData: "0x",
      callGasLimit: "0x0",
      verificationGasLimit: "0x0",
      preVerificationGas: "0x0",
      maxFeePerGas: "0x0",
      maxPriorityFeePerGas: "0x0",
      paymasterAndData: "0x",
      signature: "0x"
    };
    
    try {
      // Call the pm_supported_tokens RPC method
      const tokensResponse = await this.paymasterProvider.send(
        "pm_supported_tokens",
        [minimalUserOp, this.apiKey, this.entryPoint]
      );
      
      // Parse the response
      let tokens = [];
      
      if (tokensResponse.tokens) {
        // Standard format
        tokens = tokensResponse.tokens;
      } else if (Array.isArray(tokensResponse)) {
        // Alternative format
        tokens = tokensResponse;
      } else if (typeof tokensResponse === 'object') {
        // Try to find tokens in the response object
        const possibleTokensArray = Object.values(tokensResponse).find(
          val => Array.isArray(val)
        );
        if (possibleTokensArray && Array.isArray(possibleTokensArray)) {
          tokens = possibleTokensArray;
        }
      }
      
      // Normalize tokens data
      const normalizedTokens = tokens.map(token => ({
        address: token.token || token.address,
        symbol: token.symbol,
        decimals: token.decimals,
        type: token.type || token.paymentType
      }));
      
      // Update cache
      this.supportedTokens = normalizedTokens;
      this.supportedTokensTimestamp = Date.now();
      
      return normalizedTokens;
    } catch (error) {
      console.error('Error fetching supported tokens:', error);
      
      // Return cached data if available, otherwise empty array
      return this.supportedTokens || [];
    }
  }

  /**
   * Get supported payment types
   * @returns {Array} - Array of payment type objects
   */
  async getSupportedPaymentTypes() {
    // Payment types:
    // - Type 0: Free gas (developer sponsors)
    // - Type 1: Prepay with ERC20 tokens
    // - Type 2: Postpay with ERC20 tokens
    
    return [
      { id: 0, name: 'Sponsored', description: 'Free gas (developer pays)' },
      { id: 1, name: 'Prepay', description: 'Pay with ERC20 tokens (upfront)' },
      { id: 2, name: 'Postpay', description: 'Pay with ERC20 tokens (after execution)' }
    ];
  }

  /**
   * Check if a token is supported by the Paymaster
   * @param {string} tokenAddress - The token address to check
   * @returns {boolean} - True if the token is supported
   */
  async isTokenSupported(tokenAddress) {
    const supportedTokens = await this.getSupportedTokens();
    const normalizedAddress = tokenAddress.toLowerCase();
    
    return supportedTokens.some(
      token => token.address.toLowerCase() === normalizedAddress
    );
  }

  /**
   * Filter user tokens to only include Paymaster-supported tokens
   * @param {Array} userTokens - Array of user token objects
   * @returns {Array} - Array of supported user token objects
   */
  async filterSupportedTokens(userTokens) {
    const supportedTokens = await this.getSupportedTokens();
    const supportedAddresses = supportedTokens.map(
      token => token.address.toLowerCase()
    );
    
    return userTokens.filter(token => 
      supportedAddresses.includes(token.address.toLowerCase())
    );
  }

  /**
   * Get Paymaster data for a UserOperation
   * @param {Object} userOp - UserOperation object
   * @param {number} type - Payment type (0, 1, or 2)
   * @param {string} tokenAddress - ERC20 token address (for type 1 or 2)
   * @returns {Object} - Paymaster data
   */
  async getPaymasterData(userOp, type, tokenAddress = null) {
    // Validate payment type
    if (![0, 1, 2].includes(type)) {
      throw new Error(`Invalid payment type: ${type}`);
    }
    
    // For type 1 or 2, token address is required
    if ((type === 1 || type === 2) && !tokenAddress) {
      throw new Error(`Token address is required for payment type ${type}`);
    }
    
    // Prepare the parameters
    const params = [userOp, this.apiKey, this.entryPoint];
    
    // Add token information for type 1 or 2
    if (type === 1 || type === 2) {
      params.push({
        token: tokenAddress,
        type
      });
    }
    
    try {
      // Call the paymaster_approvalData RPC method
      const response = await this.paymasterProvider.send(
        "pm_sponsorUserOperation",
        params
      );
      
      return response;
    } catch (error) {
      console.error('Error getting paymaster data:', error);
      throw error;
    }
  }

  /**
   * Estimate gas cost for a transaction in tokens
   * @param {Object} userOp - UserOperation object
   * @param {string} tokenAddress - ERC20 token address
   * @returns {Object} - Gas cost estimate in tokens
   */
  async estimateGasCost(userOp, tokenAddress) {
    try {
      // Call the gas estimation RPC method
      const response = await this.paymasterProvider.send(
        "pm_estimate",
        [userOp, this.apiKey, this.entryPoint, {
          token: tokenAddress
        }]
      );
      
      return {
        tokenAmount: response.tokenAmount || "0",
        tokenSymbol: response.tokenSymbol || "",
        usdAmount: response.usdAmount || "0",
        gasPrice: response.gasPrice || "0"
      };
    } catch (error) {
      console.error('Error estimating gas cost:', error);
      throw error;
    }
  }
}

module.exports = new PaymasterService();