import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import WalletConnect from '../components/WalletConnect';
import TransactionModal from '../components/TransactionModal';
import useWallet from '../hooks/useWallet';
import useUserOp from '../hooks/useUserOp';
import { api } from '../services/api';
import { Token } from '../types';

// Demo recipient address (in production, this would be dynamic)
const DEMO_RECIPIENT = '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199';

const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, recommendation } = location.state || {};
  
  const { signer, account, connectWallet } = useWallet();
  const { executeTransfer, isLoading: transferLoading, error: transferError, txHash } = useUserOp();
  
  const [amount, setAmount] = useState<string>('');
  const [paymentType, setPaymentType] = useState<number>(0); // Default to sponsored (type 0)
  const [paymentToken, setPaymentToken] = useState<Token | null>(token);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [gasEstimate, setGasEstimate] = useState<string>('');
  const [paymentTypes, setPaymentTypes] = useState<any[]>([]);
  
  // Redirect to home if no token is selected
  useEffect(() => {
    if (!token) {
      navigate('/');
    }
  }, [token, navigate]);
  
  // Connect wallet if not connected
  useEffect(() => {
    if (!account) {
      connectWallet();
    }
  }, [account, connectWallet]);
  
  // Fetch payment types on component mount
  useEffect(() => {
    const fetchPaymentTypes = async () => {
      try {
        const response = await api.getPaymentTypes();
        if (response.success && response.paymentTypes) {
          setPaymentTypes(response.paymentTypes);
        }
      } catch (err) {
        console.error('Error fetching payment types:', err);
      }
    };
    
    fetchPaymentTypes();
  }, []);
  
  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };
  
  // Handle payment type change
  const handlePaymentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPaymentType(parseInt(e.target.value));
  };
  
  // Handle payment token change
  const handlePaymentTokenChange = (token: Token) => {
    setPaymentToken(token);
  };
  
  // Handle transaction submission
  const handleSubmitTransaction = () => {
    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    // Validate signer
    if (!signer) {
      alert('Wallet not connected');
      return;
    }
    
    // Validate token
    if (!token) {
      alert('No token selected');
      return;
    }
    
    // For payment types 1 and 2, validate payment token
    if ((paymentType === 1 || paymentType === 2) && !paymentToken) {
      alert('Please select a token for gas payment');
      return;
    }
    
    // Open transaction modal
    setIsModalOpen(true);
  };
  
  // Execute the transaction
  const executeTransaction = async () => {
    if (!signer || !token) {
      throw new Error('Missing signer or token');
    }
    
    try {
      // Execute the transfer
      const hash = await executeTransfer({
        signer,
        tokenAddress: token.address,
        recipientAddress: DEMO_RECIPIENT,
        amount,
        decimals: token.decimals,
        paymentType,
        paymentToken: paymentToken?.address
      });
      
      return hash;
    } catch (err) {
      console.error('Error executing transfer:', err);
      throw err;
    }
  };
  
  // Close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    
    // If transaction was successful, navigate back to home
    if (txHash) {
      navigate('/');
    }
  };
  
  // Return to home
  const handleGoBack = () => {
    navigate('/');
  };
  
  return (
    <div className="payment-page">
      <header className="app-header">
        <h1>Complete Your Transaction</h1>
        <WalletConnect />
      </header>
      
      <main className="app-content">
        <div className="payment-container">
          <div className="back-navigation">
            <button onClick={handleGoBack} className="back-button">
              ← Back to Tokens
            </button>
          </div>
          
          <div className="payment-card">
            <h2>Send Tokens</h2>
            
            <div className="token-info">
              <div className="token-icon">
                <div className="token-icon-placeholder">{token?.symbol?.charAt(0)}</div>
              </div>
              <div className="token-details">
                <span className="token-symbol">{token?.symbol}</span>
                <span className="token-balance">Balance: {token?.balance} {token?.symbol}</span>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="recipient">Recipient</label>
              <input 
                type="text" 
                id="recipient" 
                value={DEMO_RECIPIENT}
                disabled
                className="input-field"
              />
              <span className="input-note">Demo recipient address</span>
            </div>
            
            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <div className="amount-input-container">
                <input 
                  type="number" 
                  id="amount" 
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.0"
                  className="input-field"
                  min="0"
                  step="0.01"
                  max={token?.balance}
                />
                <span className="input-suffix">{token?.symbol}</span>
              </div>
              <span className="input-note">
                Max: {token?.balance} {token?.symbol}
              </span>
            </div>
            
            <div className="form-group">
              <label htmlFor="paymentType">Gas Payment Method</label>
              <select 
                id="paymentType" 
                value={paymentType}
                onChange={handlePaymentTypeChange}
                className="select-field"
              >
                {paymentTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name} - {type.description}</option>
                ))}
              </select>
            </div>
            
            {(paymentType === 1 || paymentType === 2) && (
              <div className="form-group">
                <label>Pay Gas With</label>
                <div className="payment-token-selector">
                  <div 
                    className={`payment-token ${paymentToken?.address === token?.address ? 'selected' : ''}`}
                    onClick={() => handlePaymentTokenChange(token)}
                  >
                    <div className="token-icon">
                      <div className="token-icon-placeholder">{token?.symbol?.charAt(0)}</div>
                    </div>
                    <span className="token-symbol">{token?.symbol}</span>
                  </div>
                  
                  {recommendation?.recommendedToken && recommendation.recommendedToken.address !== token?.address && (
                    <div 
                      className={`payment-token ${paymentToken?.address === recommendation.recommendedToken.address ? 'selected' : ''}`}
                      onClick={() => handlePaymentTokenChange(recommendation.recommendedToken)}
                    >
                      <div className="token-icon">
                        <div className="token-icon-placeholder">{recommendation.recommendedToken.symbol.charAt(0)}</div>
                      </div>
                      <span className="token-symbol">{recommendation.recommendedToken.symbol}</span>
                      <div className="ai-badge">AI PICK</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {paymentType === 0 && (
              <div className="sponsored-notice">
                <p>The transaction fee will be sponsored by the developer.</p>
              </div>
            )}
            
            <div className="form-actions">
              <button 
                className="submit-button"
                onClick={handleSubmitTransaction}
                disabled={!amount || parseFloat(amount) <= 0 || transferLoading}
              >
                {transferLoading ? 'Processing...' : 'Send Tokens'}
              </button>
            </div>
          </div>
          
          <div className="payment-info-card">
            <h3>About Account Abstraction</h3>
            <p>
              NERO Chain's Account Abstraction lets you pay gas fees with any token,
              not just the native currency. Our AI analyzes your wallet to find the
              most cost-effective option.
            </p>
            
            <h4>Payment Types</h4>
            <ul>
              <li><strong>Sponsored:</strong> Free gas, paid by the developer</li>
              <li><strong>Prepay:</strong> Pay with ERC20 tokens upfront</li>
              <li><strong>Postpay:</strong> Pay with ERC20 tokens after execution</li>
            </ul>
          </div>
        </div>
      </main>
      
      <TransactionModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        token={token}
        recipient={DEMO_RECIPIENT}
        amount={amount}
        onConfirm={executeTransaction}
        paymentType={paymentType}
        paymentToken={paymentToken}
        estimatedGas={gasEstimate}
      />
      
      <footer className="app-footer">
        <p>Powered by NERO Chain & Account Abstraction</p>
      </footer>
    </div>
  );
};

export default PaymentPage;