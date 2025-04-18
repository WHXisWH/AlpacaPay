import React, { useEffect, useState } from 'react';
import useWallet from '../hooks/useWallet';

interface WalletConnectProps {
  onWalletConnected?: (account: string) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onWalletConnected }) => {
  const { 
    account, 
    isConnecting, 
    connectionError, 
    connectWallet, 
    disconnectWallet,
    chainId,
    switchToNeroChain,
    aaWalletAddress
  } = useWallet();

  const [isCorrectChain, setIsCorrectChain] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // NERO Chain testnet ID
  const NERO_CHAIN_ID = 5578499; // 0x555503 in decimal

  // Check if connected to NERO Chain
  useEffect(() => {
    if (chainId) {
      setIsCorrectChain(chainId === NERO_CHAIN_ID);
    }
  }, [chainId]);

  // Call the onWalletConnected callback when account is set
  useEffect(() => {
    if (account && onWalletConnected) {
      onWalletConnected(account);
    }
  }, [account, onWalletConnected]);

  // Handle wallet connection
  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Handle wallet disconnection
  const handleDisconnect = () => {
    disconnectWallet();
    setIsExpanded(false);
  };

  // Handle switching to NERO Chain
  const handleSwitchChain = async () => {
    try {
      await switchToNeroChain();
    } catch (error) {
      console.error('Error switching chain:', error);
    }
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : '';
  };

  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // If wallet is connecting, show loading state
  if (isConnecting) {
    return (
      <div className="wallet-connect loading">
        <div className="connect-button loading">
          <div className="loading-spinner"></div>
          <span>Connecting...</span>
        </div>
      </div>
    );
  }

  // If there's a connection error, show error state
  if (connectionError) {
    return (
      <div className="wallet-connect error">
        <div className="connect-button error" onClick={handleConnect}>
          <span>Connection Error. Retry?</span>
        </div>
        <div className="connection-error">
          <p>{connectionError}</p>
        </div>
      </div>
    );
  }

  // If wallet is connected but on wrong chain
  if (account && !isCorrectChain) {
    return (
      <div className="wallet-connect wrong-chain">
        <div className="connect-info">
          <span className="wallet-address">{formatAddress(account)}</span>
          <div className="chain-badge wrong">Wrong Network</div>
        </div>
        <button className="switch-chain-button" onClick={handleSwitchChain}>
          Switch to NERO Chain
        </button>
      </div>
    );
  }

  // If wallet is connected and on correct chain
  if (account) {
    return (
      <div className={`wallet-connect connected ${isExpanded ? 'expanded' : ''}`}>
        <div className="connect-info" onClick={toggleExpanded}>
          <span className="wallet-address">{formatAddress(account)}</span>
          <div className="chain-badge correct">NERO Chain</div>
          <span className="expand-icon">{isExpanded ? '▲' : '▼'}</span>
        </div>
        
        {isExpanded && (
          <div className="wallet-details">
            <div className="wallet-detail">
              <span className="detail-label">EOA:</span>
              <span className="detail-value">{formatAddress(account)}</span>
            </div>
            {aaWalletAddress && (
              <div className="wallet-detail">
                <span className="detail-label">AA Wallet:</span>
                <span className="detail-value">{formatAddress(aaWalletAddress)}</span>
              </div>
            )}
            <button 
              className="disconnect-button"
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  // If wallet is not connected, show connect button
  return (
    <div className="wallet-connect">
      <button 
        className="connect-button"
        onClick={handleConnect}
      >
        Connect Wallet
      </button>
    </div>
  );
};

export default WalletConnect;