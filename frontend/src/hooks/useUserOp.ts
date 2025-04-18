import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { Client, Presets } from 'userop';

// Import types
import { UserOpParams, PaymasterParams } from '../types';

// Constants from environment variables
const NERO_RPC_URL = process.env.REACT_APP_NERO_RPC_URL || 'https://rpc-testnet.nerochain.io';
const BUNDLER_URL = process.env.REACT_APP_BUNDLER_URL || 'https://bundler-testnet.nerochain.io';
const PAYMASTER_URL = process.env.REACT_APP_PAYMASTER_URL || 'https://paymaster-testnet.nerochain.io';
const PAYMASTER_API_KEY = process.env.REACT_APP_PAYMASTER_API_KEY || '';
const ENTRYPOINT_ADDRESS = process.env.REACT_APP_ENTRYPOINT_ADDRESS || '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';
const ACCOUNT_FACTORY_ADDRESS = process.env.REACT_APP_ACCOUNT_FACTORY_ADDRESS || '0x9406Cc6185a346906296840746125a0E44976454';

/**
 * Hook for managing UserOperations with NERO Chain's Account Abstraction
 */
export const useUserOp = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aaWalletAddress, setAaWalletAddress] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  /**
   * Initialize the Client and SimpleAccount builder
   * @param signer - The EOA signer that will own the AA wallet
   * @returns - The client and builder for creating UserOperations
   */
  const initClient = useCallback(async (signer: ethers.Signer) => {
    try {
      // Initialize the AA Client
      const client = await Client.init(NERO_RPC_URL, {
        overrideBundlerRpc: BUNDLER_URL,
        entryPoint: ENTRYPOINT_ADDRESS,
      });
      
      // Initialize the SimpleAccount builder
      const builder = await Presets.Builder.SimpleAccount.init(
        signer,
        NERO_RPC_URL,
        {
          overrideBundlerRpc: BUNDLER_URL,
          entryPoint: ENTRYPOINT_ADDRESS,
          factory: ACCOUNT_FACTORY_ADDRESS,
        }
      );
      
      // Get the AA wallet address
      const aaAddress = await builder.getSender();
      setAaWalletAddress(aaAddress);
      
      return { client, builder };
    } catch (err: any) {
      console.error('Error initializing AA client:', err);
      setError(err.message || 'Error initializing AA client');
      throw err;
    }
  }, []);
  
  /**
   * Check if the AA wallet is already deployed
   * @param address - The AA wallet address to check
   * @returns - Boolean indicating if the wallet is deployed
   */
  const isWalletDeployed = useCallback(async (address: string) => {
    const provider = new ethers.providers.JsonRpcProvider(NERO_RPC_URL);
    const code = await provider.getCode(address);
    return code !== '0x';
  }, []);
  
  /**
   * Execute a token transfer using UserOperation
   * @param params - Parameters for the transfer
   * @returns - Transaction hash
   */
  const executeTransfer = useCallback(async ({
    signer,
    tokenAddress,
    recipientAddress,
    amount,
    decimals,
    paymentType,
    paymentToken
  }: UserOpParams) => {
    setIsLoading(true);
    setError(null);
    setTxHash(null);
    
    try {
      // Initialize client and builder
      const { client, builder } = await initClient(signer);
      
      // Create token contract instance
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function transfer(address to, uint256 amount) returns (bool)'],
        signer
      );
      
      // Prepare the call data for transfer
      const callData = tokenContract.interface.encodeFunctionData(
        'transfer',
        [recipientAddress, ethers.utils.parseUnits(amount.toString(), decimals)]
      );
      
      // Add the transaction to the builder
      builder.execute(tokenAddress, 0, callData);
      
      // Configure paymaster if needed
      if (paymentType !== undefined && paymentType >= 0) {
        const paymasterOptions: any = {
          type: paymentType,
          apikey: PAYMASTER_API_KEY,
          rpc: PAYMASTER_URL
        };
        
        // For type 1 or 2, add token address
        if ((paymentType === 1 || paymentType === 2) && paymentToken) {
          paymasterOptions.token = paymentToken;
        }
        
        builder.setPaymasterOptions(paymasterOptions);
      }
      
      // Send the UserOperation
      const result = await client.sendUserOperation(builder);
      
      // Get the transaction hash
      const userOpHash = result.userOpHash;
      console.log("UserOperation hash:", userOpHash);
      
      // Wait for the transaction to be mined
      const receipt = await result.wait();
      console.log("Transaction hash:", receipt.transactionHash);
      
      setTxHash(receipt.transactionHash);
      setIsLoading(false);
      
      return receipt.transactionHash;
    } catch (err: any) {
      console.error("Error sending UserOperation:", err);
      setError(err.message || 'Error sending UserOperation');
      setIsLoading(false);
      throw err;
    }
  }, [initClient]);
  
  /**
   * Execute multiple transactions in a batch
   * @param params - Parameters for the batch
   * @returns - Transaction hash
   */
  const executeBatch = useCallback(async ({
    signer,
    calls,
    paymentType,
    paymentToken
  }: {
    signer: ethers.Signer;
    calls: Array<{to: string; value: number; data: string}>;
    paymentType?: number;
    paymentToken?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    setTxHash(null);
    
    try {
      // Initialize client and builder
      const { client, builder } = await initClient(signer);
      
      // Extract call targets and data
      const callTo = calls.map(call => call.to);
      const callData = calls.map(call => call.data);
      const callValue = calls.map(call => call.value || 0);
      
      // Add batch execution to the builder
      if (callValue.some(value => value > 0)) {
        // If any call has a value, use executeBatch with value
        builder.executeBatch(callTo, callData, callValue);
      } else {
        // Otherwise use the simpler executeBatch
        builder.executeBatch(callTo, callData);
      }
      
      // Configure paymaster if needed
      if (paymentType !== undefined && paymentType >= 0) {
        const paymasterOptions: any = {
          type: paymentType,
          apikey: PAYMASTER_API_KEY,
          rpc: PAYMASTER_URL
        };
        
        // For type 1 or 2, add token address
        if ((paymentType === 1 || paymentType === 2) && paymentToken) {
          paymasterOptions.token = paymentToken;
        }
        
        builder.setPaymasterOptions(paymasterOptions);
      }
      
      // Send the UserOperation
      const result = await client.sendUserOperation(builder);
      
      // Get the transaction hash
      const userOpHash = result.userOpHash;
      console.log("UserOperation hash:", userOpHash);
      
      // Wait for the transaction to be mined
      const receipt = await result.wait();
      console.log("Transaction hash:", receipt.transactionHash);
      
      setTxHash(receipt.transactionHash);
      setIsLoading(false);
      
      return receipt.transactionHash;
    } catch (err: any) {
      console.error("Error sending batch UserOperation:", err);
      setError(err.message || 'Error sending batch UserOperation');
      setIsLoading(false);
      throw err;
    }
  }, [initClient]);
  
  /**
   * Get paymaster data for a UserOperation
   * @param builder - The SimpleAccount builder
   * @param param1 - Paymaster parameters
   * @returns - Updated builder with paymaster data
   */
  const getPaymasterData = useCallback(async (
    builder: any,
    { type, token }: PaymasterParams
  ) => {
    try {
      const paymasterOptions: any = {
        type,
        apikey: PAYMASTER_API_KEY,
        rpc: PAYMASTER_URL
      };
      
      // For type 1 or 2, add token address
      if ((type === 1 || type === 2) && token) {
        paymasterOptions.token = token;
      }
      
      builder.setPaymasterOptions(paymasterOptions);
      
      return builder;
    } catch (err: any) {
      console.error("Error getting paymaster data:", err);
      throw err;
    }
  }, []);
  
  return {
    isLoading,
    error,
    txHash,
    aaWalletAddress,
    initClient,
    isWalletDeployed,
    executeTransfer,
    executeBatch,
    getPaymasterData
  };
};

export default useUserOp;