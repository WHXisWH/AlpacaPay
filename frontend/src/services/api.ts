import axios from 'axios';
import { Token } from '../hooks/useTokens';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * API service for interacting with the backend
 */
export const api = {
  /**
   * Get token recommendation
   * @param tokens - Array of token objects
   * @returns - Recommendation response
   */
  async recommendToken(tokens: Token[]) {
    try {
      const response = await apiClient.post('/recommend-token', { tokens });
      return response.data;
    } catch (error: any) {
      console.error('Error recommending token:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Get supported tokens
   * @returns - Supported tokens response
   */
  async getSupportedTokens() {
    try {
      const response = await apiClient.get('/supported-tokens');
      return response.data;
    } catch (error: any) {
      console.error('Error getting supported tokens:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Get supported payment types
   * @returns - Payment types response
   */
  async getPaymentTypes() {
    try {
      const response = await apiClient.get('/payment-types');
      return response.data;
    } catch (error: any) {
      console.error('Error getting payment types:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Estimate gas cost
   * @param userOp - UserOperation object
   * @param tokenAddress - Token address for gas payment
   * @returns - Gas cost estimation
   */
  async estimateGasCost(userOp: any, tokenAddress: string) {
    try {
      const response = await apiClient.post('/estimate-gas', {
        userOp,
        tokenAddress
      });
      return response.data;
    } catch (error: any) {
      console.error('Error estimating gas cost:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Check server health
   * @returns - Health check response
   */
  async checkHealth() {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error: any) {
      console.error('Error checking health:', error);
      throw error.response?.data || error;
    }
  }
};

export default api;