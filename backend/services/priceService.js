const axios = require('axios');
const { COINGECKO_API_KEY } = process.env;

/**
 * Service for fetching token price data from external APIs
 */
class PriceService {
  constructor() {
    this.priceCache = new Map();
    this.volatilityCache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes cache TTL
  }

  /**
   * Get price data for multiple tokens
   * @param {Array} tokens - Array of token objects with address and symbol
   * @returns {Object} - Object with token price data
   */
  async getPriceData(tokens) {
    if (!tokens || tokens.length === 0) {
      return {};
    }

    // Extract addresses and clean them
    const addresses = tokens.map(token => token.address.toLowerCase());
    
    try {
      // Fetch fresh price data
      const priceData = await this._fetchPriceData(addresses);
      
      // Fetch volatility data
      const volatilityData = await this._fetchVolatilityData(addresses);
      
      // Combine price and volatility data
      const result = {};
      addresses.forEach(address => {
        result[address] = {
          price: priceData[address] || 0,
          volatility24h: volatilityData[address] || 0
        };
      });
      
      return result;
    } catch (error) {
      console.error('Error fetching price data:', error);
      
      // Return cached data if available, otherwise empty object
      const result = {};
      addresses.forEach(address => {
        const cachedPrice = this.priceCache.get(address);
        const cachedVolatility = this.volatilityCache.get(address);
        
        if (cachedPrice || cachedVolatility) {
          result[address] = {
            price: cachedPrice || 0,
            volatility24h: cachedVolatility || 0
          };
        }
      });
      
      return result;
    }
  }

  /**
   * Fetch current token prices
   * @param {Array} addresses - Array of token addresses
   * @returns {Object} - Object with token prices
   */
  async _fetchPriceData(addresses) {
    // In a real implementation, we would use CoinGecko, 1inch, or a similar API
    // For now, we'll return mock data for demonstration
    
    // Check which addresses need fresh data
    const addressesToFetch = addresses.filter(address => {
      const cached = this.priceCache.get(address);
      const cacheTime = this.priceCache.get(`${address}_time`);
      
      // Fetch if no cache or cache expired
      return !cached || !cacheTime || (Date.now() - cacheTime > this.cacheTTL);
    });
    
    if (addressesToFetch.length === 0) {
      // Return all cached data
      const result = {};
      addresses.forEach(address => {
        result[address] = this.priceCache.get(address) || 0;
      });
      return result;
    }
    
    // In production, fetch from API:
    // const apiUrl = `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${addressesToFetch.join(',')}&vs_currencies=usd&x_cg_api_key=${COINGECKO_API_KEY}`;
    // const response = await axios.get(apiUrl);
    // const data = response.data;
    
    // For demonstration, return mock data
    const mockPrices = {
      // Common tokens with realistic prices
      '0x6b175474e89094c44da98b954eedeac495271d0f': 1.0, // DAI
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 1.0, // USDC
      '0xdac17f958d2ee523a2206206994597c13d831ec7': 1.0, // USDT
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 40000, // WBTC
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 2800, // WETH
      '0x853d955acef822db058eb8505911ed77f175b99e': 0.99, // FRAX
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': 8.50, // UNI
      '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': 85.20 // AAVE
    };
    
    // Generate random prices for addresses not in our mock data
    const result = {};
    addresses.forEach(address => {
      // Use cached price if available and not expired
      const cachedPrice = this.priceCache.get(address);
      const cacheTime = this.priceCache.get(`${address}_time`);
      
      if (cachedPrice && cacheTime && (Date.now() - cacheTime <= this.cacheTTL)) {
        result[address] = cachedPrice;
      } else {
        // Use mock price or generate random one
        const price = mockPrices[address] || (Math.random() * 10 + 0.1); // Random price $0.1-$10
        
        // Update cache
        this.priceCache.set(address, price);
        this.priceCache.set(`${address}_time`, Date.now());
        
        result[address] = price;
      }
    });
    
    return result;
  }

  /**
   * Fetch 24h volatility data for tokens
   * @param {Array} addresses - Array of token addresses
   * @returns {Object} - Object with token volatility percentages
   */
  async _fetchVolatilityData(addresses) {
    // In a real implementation, we would calculate volatility from 24h price data
    // For now, we'll return mock data for demonstration
    
    // Check which addresses need fresh data
    const addressesToFetch = addresses.filter(address => {
      const cached = this.volatilityCache.get(address);
      const cacheTime = this.volatilityCache.get(`${address}_vol_time`);
      
      // Fetch if no cache or cache expired
      return !cached || !cacheTime || (Date.now() - cacheTime > this.cacheTTL);
    });
    
    if (addressesToFetch.length === 0) {
      // Return all cached data
      const result = {};
      addresses.forEach(address => {
        result[address] = this.volatilityCache.get(address) || 0;
      });
      return result;
    }
    
    // Mock volatility data (lower = more stable)
    const mockVolatility = {
      // Stablecoins have very low volatility
      '0x6b175474e89094c44da98b954eedeac495271d0f': 0.2, // DAI
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 0.1, // USDC
      '0xdac17f958d2ee523a2206206994597c13d831ec7': 0.15, // USDT
      '0x853d955acef822db058eb8505911ed77f175b99e': 0.3, // FRAX
      
      // Major crypto assets have moderate volatility
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 3.5, // WBTC
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 4.2, // WETH
      
      // DeFi tokens have higher volatility
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': 8.7, // UNI
      '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': 9.3 // AAVE
    };
    
    // Generate result with cache and mock data
    const result = {};
    addresses.forEach(address => {
      // Use cached volatility if available and not expired
      const cachedVolatility = this.volatilityCache.get(address);
      const cacheTime = this.volatilityCache.get(`${address}_vol_time`);
      
      if (cachedVolatility !== undefined && cacheTime && (Date.now() - cacheTime <= this.cacheTTL)) {
        result[address] = cachedVolatility;
      } else {
        // Use mock data or generate random volatility (1-15%)
        const volatility = mockVolatility[address] !== undefined
          ? mockVolatility[address]
          : (Math.random() * 14 + 1);
        
        // Update cache
        this.volatilityCache.set(address, volatility);
        this.volatilityCache.set(`${address}_vol_time`, Date.now());
        
        result[address] = volatility;
      }
    });
    
    return result;
  }

  /**
   * Get slippage estimates for tokens
   * @param {Array} tokens - Array of token objects
   * @returns {Object} - Object with token slippage estimates
   */
  async getSlippageData(tokens) {
    if (!tokens || tokens.length === 0) {
      return {};
    }

    // Extract addresses
    const addresses = tokens.map(token => token.address.toLowerCase());
    
    // Mock slippage data (lower = better liquidity)
    const mockSlippage = {
      // High liquidity tokens have minimal slippage
      '0x6b175474e89094c44da98b954eedeac495271d0f': 0.1, // DAI
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 0.05, // USDC
      '0xdac17f958d2ee523a2206206994597c13d831ec7': 0.08, // USDT
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 0.3, // WBTC
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 0.2, // WETH
      
      // Less liquid tokens have higher slippage
      '0x853d955acef822db058eb8505911ed77f175b99e': 0.5, // FRAX
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': 1.2, // UNI
      '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': 1.8 // AAVE
    };
    
    // Generate result with mock data
    const result = {};
    addresses.forEach(address => {
      // Use mock data or generate random slippage (0.5-5%)
      const slippage = mockSlippage[address] !== undefined
        ? mockSlippage[address]
        : (Math.random() * 4.5 + 0.5);
      
      result[address] = {
        slippage,
        estimatedFee: slippage * 0.5 // Simple fee estimation
      };
    });
    
    return result;
  }
}

module.exports = new PriceService();