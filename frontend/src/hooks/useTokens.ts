import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import useWallet from './useWallet';

// Common token addresses (for demo/testing)
const COMMON_TOKENS = [
  // Stablecoins
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  '0x853d955acef822db058eb8505911ed77f175b99e', // FRAX
  
  // Major crypto
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
  
  // DeFi tokens
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
  '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', // AAVE
  
  // Add other tokens as needed
];

export type Token = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  rawBalance: string;
  usdBalance?: number;
  score?: number;
  recommended?: boolean;
  reasons?: string[];
};

export type Recommendation = {
  recommendedToken: Token;
  allScores: Token[];
  supportedCount: number;
};

/**
 * Hook for token management and recommendation
 */
export const useTokens = () => {
  const { account, aaWalletAddress, getTokens: fetchWalletTokens } = useWallet();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [supportedTokens, setSupportedTokens] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  
  /**
   * Fetch tokens from the wallet
   */
  const getTokens = useCallback(async () => {
    if (!account && !aaWalletAddress) {
      setError('Wallet not connected');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get tokens from wallet
      const walletTokens = await fetchWalletTokens(COMMON_TOKENS);
      setTokens(walletTokens);
      
      // Get supported tokens list
      await getSupportedTokens();
      
      setIsLoading(false);
      return walletTokens;
    } catch (err: any) {
      console.error('Error fetching tokens:', err);
      setError(err.message || 'Error fetching tokens');
      setIsLoading(false);
    }
  }, [account, aaWalletAddress, fetchWalletTokens]);
  
  /**
   * Get tokens supported by the Paymaster
   */
  const getSupportedTokens = useCallback(async () => {
    try {
      const response = await api.getSupportedTokens();
      
      if (response.success && response.tokens) {
        // Extract supported token addresses
        const addresses = response.tokens.map((token: any) => 
          token.address.toLowerCase()
        );
        
        setSupportedTokens(addresses);
        return addresses;
      }
      
      return [];
    } catch (err: any) {
      console.error('Error fetching supported tokens:', err);
      return [];
    }
  }, []);
  
  /**
   * Get token recommendation from the API
   */
  const getRecommendation = useCallback(async () => {
    if (tokens.length === 0) {
      setError('No tokens found');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.recommendToken(tokens);
      
      if (response.success && response.recommendation) {
        setRecommendation(response);
        
        // Mark the recommended token in the tokens list
        const updatedTokens = tokens.map(token => {
          if (token.address.toLowerCase() === response.recommendation.address.toLowerCase()) {
            return {
              ...token,
              ...response.recommendation,
              recommended: true
            };
          }
          
          // Find matching token in allScores to get score info
          const scoreInfo = response.allScores.find(
            (t: Token) => t.address.toLowerCase() === token.address.toLowerCase()
          );
          
          if (scoreInfo) {
            return {
              ...token,
              ...scoreInfo,
              recommended: false
            };
          }
          
          return token;
        });
        
        setTokens(updatedTokens);
        setIsLoading(false);
        return response;
      }
      
      setIsLoading(false);
      return null;
    } catch (err: any) {
      console.error('Error getting token recommendation:', err);
      setError(err.message || 'Error getting token recommendation');
      setIsLoading(false);
      return null;
    }
  }, [tokens]);
  
  /**
   * Check if a token is supported by the Paymaster
   * @param tokenAddress - Token address to check
   * @returns - Boolean indicating if the token is supported
   */
  const isTokenSupported = useCallback((tokenAddress: string) => {
    if (!tokenAddress || supportedTokens.length === 0) {
      return false;
    }
    
    return supportedTokens.includes(tokenAddress.toLowerCase());
  }, [supportedTokens]);
  
  /**
   * Filter tokens to only show supported ones
   * @returns - Array of supported tokens
   */
  const getSupportedTokensOnly = useCallback(() => {
    return tokens.filter(token => 
      isTokenSupported(token.address)
    );
  }, [tokens, isTokenSupported]);
  
  // Load tokens when wallet is connected
  useEffect(() => {
    if (account || aaWalletAddress) {
      getTokens();
    }
  }, [account, aaWalletAddress, getTokens]);
  
  return {
    tokens,
    isLoading,
    error,
    supportedTokens,
    recommendation,
    getTokens,
    getSupportedTokens,
    getRecommendation,
    isTokenSupported,
    getSupportedTokensOnly
  };
};

export default useTokens;