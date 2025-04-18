import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import useUserOp from './useUserOp';

// ERC20 ABI for token interactions
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function transfer(address to, uint amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)'
];

/**
 * Hook for wallet connection and token management
 */
export const useWallet = () => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  
  // Use the UserOp hook
  const { aaWalletAddress, initClient } = useUserOp();
  
  /**
   * Connect to MetaMask wallet
   */
  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to use this app.');
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Get the first account
      const account = accounts[0];
      setAccount(account);
      
      // Create ethers provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);
      
      const signer = provider.getSigner();
      setSigner(signer);
      
      // Get the chain ID
      const network = await provider.getNetwork();
      setChainId(network.chainId);
      
      // Initialize the AA client and get the AA wallet address
      if (signer) {
        await initClient(signer);
      }
      
      setIsConnecting(false);
      
      return { account, provider, signer };
    } catch (err: any) {
      console.error('Error connecting to wallet:', err);
      setConnectionError(err.message || 'Error connecting to wallet');
      setIsConnecting(false);
      throw err;
    }
  }, [initClient]);
  
  /**
   * Disconnect wallet
   */
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
  }, []);
  
  /**
   * Get tokens in the wallet
   * @param tokenAddresses - Array of token addresses to check
   * @returns - Array of token objects with balance and metadata
   */
  const getTokens = useCallback(async (tokenAddresses: string[]) => {
    if (!provider || !account) {
      throw new Error('Wallet not connected');
    }
    
    // Which address to check balances for - EOA or AA wallet
    const targetAddress = aaWalletAddress || account;
    
    try {
      const tokenPromises = tokenAddresses.map(async (address) => {
        // Create token contract instance
        const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);
        
        // Get token details
        const [balance, decimals, symbol, name] = await Promise.all([
          tokenContract.balanceOf(targetAddress),
          tokenContract.decimals(),
          tokenContract.symbol(),
          tokenContract.name()
        ]);
        
        // Format balance
        const formattedBalance = ethers.utils.formatUnits(balance, decimals);
        
        return {
          address,
          symbol,
          name,
          decimals,
          balance: formattedBalance,
          rawBalance: balance.toString()
        };
      });
      
      // Get all token data
      const tokens = await Promise.all(tokenPromises);
      
      // Filter out tokens with zero balance
      return tokens.filter(token => parseFloat(token.balance) > 0);
    } catch (err: any) {
      console.error('Error getting tokens:', err);
      throw err;
    }
  }, [provider, account, aaWalletAddress]);
  
  /**
   * Switch to NERO Chain
   */
  const switchToNeroChain = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }
    
    try {
      // NERO Chain details
      const neroChainId = '0x555503'; // NERO Testnet Chain ID (hex)
      
      // Try to switch to NERO Chain
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: neroChainId }]
      });
      
      // Update chainId after switching
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      setChainId(network.chainId);
    } catch (err: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (err.code === 4902) {
        await addNeroChain();
      } else {
        console.error('Error switching to NERO Chain:', err);
        throw err;
      }
    }
  }, []);
  
  /**
   * Add NERO Chain to MetaMask
   */
  const addNeroChain = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }
    
    try {
      // NERO Chain details
      const neroChainParams = {
        chainId: '0x555503', // NERO Testnet Chain ID (hex)
        chainName: 'NERO Chain Testnet',
        nativeCurrency: {
          name: 'NERO',
          symbol: 'NERO',
          decimals: 18
        },
        rpcUrls: ['https://rpc-testnet.nerochain.io'],
        blockExplorerUrls: ['https://explorer-testnet.nerochain.io']
      };
      
      // Add NERO Chain to MetaMask
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [neroChainParams]
      });
      
      // Update chainId after adding
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      setChainId(network.chainId);
    } catch (err: any) {
      console.error('Error adding NERO Chain:', err);
      throw err;
    }
  }, []);
  
  // Set up event listeners for account and chain changes
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User has disconnected all accounts
        disconnectWallet();
      } else if (accounts[0] !== account) {
        // User has switched accounts
        setAccount(accounts[0]);
      }
    };
    
    const handleChainChanged = (chainIdHex: string) => {
      // Convert hex chainId to decimal
      const chainIdDecimal = parseInt(chainIdHex, 16);
      setChainId(chainIdDecimal);
      
      // Reload the page as recommended by MetaMask
      window.location.reload();
    };
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
    
    // Clean up event listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account, disconnectWallet]);
  
  return {
    provider,
    signer,
    account,
    isConnecting,
    connectionError,
    chainId,
    aaWalletAddress,
    connectWallet,
    disconnectWallet,
    getTokens,
    switchToNeroChain,
    addNeroChain
  };
};

export default useWallet;