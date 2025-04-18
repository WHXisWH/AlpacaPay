import { ethers } from 'ethers';

/**
 * User operation parameters
 */
export interface UserOpParams {
  signer: ethers.Signer;
  tokenAddress: string;
  recipientAddress: string;
  amount: number | string;
  decimals: number;
  paymentType?: number;
  paymentToken?: string;
}

/**
 * Paymaster parameters
 */
export interface PaymasterParams {
  type: number;
  token?: string;
}

/**
 * Token details
 */
export interface Token {
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
  volatilityScore?: number;
  slippageScore?: number;
}

/**
 * Token recommendation
 */
export interface Recommendation {
  recommendedToken: Token;
  allScores: Token[];
  supportedCount: number;
}

/**
 * Supported token from Paymaster
 */
export interface SupportedToken {
  address: string;
  symbol: string;
  decimals: number;
  type: number;
}

/**
 * Payment type
 */
export interface PaymentType {
  id: number;
  name: string;
  description: string;
}

/**
 * Gas cost estimation
 */
export interface GasCostEstimate {
  tokenAmount: string;
  tokenSymbol: string;
  usdAmount: string;
  gasPrice: string;
}

/**
 * Window with Ethereum provider
 */
declare global {
  interface Window {
    ethereum: any;
  }
}