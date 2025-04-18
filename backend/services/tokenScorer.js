/**
 * AI Token Scorer Service
 * 
 * This service implements the algorithm that determines the optimal
 * token for gas payment based on multiple factors:
 * - Token balance (40% weight)
 * - Price volatility (30% weight)
 * - Slippage (30% weight)
 */

class TokenScorer {
    /**
     * Score tokens based on multiple factors
     * @param {Array} tokens - Array of token objects with address, symbol, balance
     * @param {Object} priceData - Object with price and volatility information
     * @param {Object} slippageData - Object with slippage estimates
     * @returns {Object} - Recommended token with scores
     */
    scoreTokens(tokens, priceData, slippageData) {
      // Weights for different factors
      const weights = {
        balance: 0.4,
        volatility: 0.3,
        slippage: 0.3
      };
  
      // Ensure we have tokens to score
      if (!tokens || tokens.length === 0) {
        return null;
      }
  
      // Calculate scores for each token
      const scoredTokens = tokens.map(token => {
        const address = token.address.toLowerCase();
        
        // Get data for scoring (with fallbacks)
        const balance = parseFloat(token.balance) || 0;
        const price = priceData[address]?.price || 0;
        const usdBalance = balance * price;
        
        // For volatility, lower is better (more stable)
        const volatility = priceData[address]?.volatility24h || 100;
        // Normalize: 0% volatility = 1.0 score, 100% volatility = 0.0 score
        const volatilityScore = 1 - (volatility / 100);
        
        // For slippage, lower is better
        const slippage = slippageData[address]?.slippage || 10;
        // Normalize: 0% slippage = 1.0 score, 10% slippage = 0.0 score
        const slippageScore = 1 - (slippage / 10);
        
        // Skip tokens with zero balance
        if (usdBalance <= 0) {
          return {
            ...token,
            score: 0,
            reasons: ["Zero balance"]
          };
        }
        
        // Skip tokens with no price data
        if (price <= 0) {
          return {
            ...token,
            score: 0,
            reasons: ["No price data available"]
          };
        }
        
        // Calculate weighted score
        const score = (
          (weights.balance * this._normalizeBalance(usdBalance)) +
          (weights.volatility * volatilityScore) +
          (weights.slippage * slippageScore)
        );
        
        // Generate human-readable reasons for the score
        const reasons = this._generateReasons(
          usdBalance, 
          volatility, 
          slippage
        );
        
        return {
          ...token,
          usdBalance,
          volatilityScore,
          slippageScore,
          score,
          reasons
        };
      });
      
      // Sort by score (descending)
      const sortedTokens = scoredTokens.sort((a, b) => b.score - a.score);
      
      // Return the top-scoring token
      return {
        recommendedToken: sortedTokens[0],
        allScores: sortedTokens
      };
    }
    
    /**
     * Normalize USD balance to a 0-1 score
     * - Uses logarithmic scale to handle wide range of balances
     * - Balances under $5 score lower, over $100 score higher
     * @param {number} usdBalance - Token balance in USD
     * @returns {number} - Normalized score between 0-1
     */
    _normalizeBalance(usdBalance) {
      // Minimum balance threshold
      const minBalance = 5;
      
      if (usdBalance < minBalance) {
        // Low balances score proportionally lower
        return 0.3 * (usdBalance / minBalance);
      }
      
      // Log scale to handle wide range of balances
      // ln(100) ≈ 4.6, so we divide by 5 to get a score near 1.0 at $100 balance
      const logScore = Math.min(1, Math.log(usdBalance) / 5);
      return logScore;
    }
    
    /**
     * Generate human-readable reasons for the token score
     * @param {number} usdBalance - Token balance in USD
     * @param {number} volatility - 24h volatility percentage
     * @param {number} slippage - Estimated slippage percentage
     * @returns {Array} - Array of reason strings
     */
    _generateReasons(usdBalance, volatility, slippage) {
      const reasons = [];
      
      // Balance reasons
      if (usdBalance >= 100) {
        reasons.push(`High balance ($${usdBalance.toFixed(2)}) provides flexibility`);
      } else if (usdBalance >= 20) {
        reasons.push(`Moderate balance ($${usdBalance.toFixed(2)}) is sufficient`);
      } else {
        reasons.push(`Low balance ($${usdBalance.toFixed(2)}) may limit options`);
      }
      
      // Volatility reasons
      if (volatility < 1) {
        reasons.push(`Very stable price (${volatility.toFixed(2)}% 24h change)`);
      } else if (volatility < 5) {
        reasons.push(`Stable price (${volatility.toFixed(2)}% 24h change)`);
      } else if (volatility > 20) {
        reasons.push(`High price volatility (${volatility.toFixed(2)}% 24h change)`);
      }
      
      // Slippage reasons
      if (slippage < 0.5) {
        reasons.push(`Minimal slippage (${slippage.toFixed(2)}%)`);
      } else if (slippage > 3) {
        reasons.push(`High slippage (${slippage.toFixed(2)}%)`);
      }
      
      return reasons;
    }
  }
  
  module.exports = new TokenScorer();