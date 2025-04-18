import React, { useState, useEffect } from 'react';
import { Token } from '../types';

type TransactionStatus = 'preparing' | 'confirming' | 'processing' | 'success' | 'error';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token | null;
  recipient: string;
  amount: string;
  onConfirm: () => Promise<string>;
  paymentType: number;
  paymentToken: Token | null;
  estimatedGas?: string;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  token,
  recipient,
  amount,
  onConfirm,
  paymentType,
  paymentToken,
  estimatedGas
}) => {
  const [status, setStatus] = useState<TransactionStatus>('preparing');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus('preparing');
      setTxHash(null);
      setError(null);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setStatus('confirming');
    
    try {
      setStatus('processing');
      const hash = await onConfirm();
      setTxHash(hash);
      setStatus('success');
    } catch (err: any) {
      console.error('Transaction error:', err);
      setError(err.message || 'Transaction failed');
      setStatus('error');
    }
  };

  if (!isOpen || !token) {
    return null;
  }

  const paymentTypeLabels = [
    { type: 0, label: 'Sponsored (Free)' },
    { type: 1, label: 'Prepay with Token' },
    { type: 2, label: 'Postpay with Token' },
  ];

  const paymentTypeText = paymentTypeLabels.find(pt => pt.type === paymentType)?.label || 'Unknown';

  const formatAddress = (address: string) => {
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  return (
    <div className="modal-overlay">
      <div className="transaction-modal">
        <div className="modal-header">
          <h2>Confirm Transaction</h2>
          {status === 'preparing' && (
            <button className="close-button" onClick={onClose}>×</button>
          )}
        </div>

        <div className="modal-content">
          {status === 'preparing' && (
            <div className="transaction-details">
              <div className="detail-row">
                <span className="detail-label">Token:</span>
                <span className="detail-value">{token.symbol}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount:</span>
                <span className="detail-value">{amount} {token.symbol}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Recipient:</span>
                <span className="detail-value">{formatAddress(recipient)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Gas Payment:</span>
                <span className="detail-value">{paymentTypeText}</span>
              </div>
              {(paymentType === 1 || paymentType === 2) && paymentToken && (
                <div className="detail-row">
                  <span className="detail-label">Pay Gas With:</span>
                  <span className="detail-value">{paymentToken.symbol}</span>
                </div>
              )}
              {estimatedGas && (
                <div className="detail-row">
                  <span className="detail-label">Estimated Gas:</span>
                  <span className="detail-value">{estimatedGas}</span>
                </div>
              )}
              <div className="ai-recommendation">
                <div className="ai-badge">AI OPTIMIZED</div>
                <p>This token was selected by our AI to minimize your costs.</p>
              </div>
            </div>
          )}

          {status === 'confirming' && (
            <div className="transaction-status">
              <div className="loading-spinner"></div>
              <p>Waiting for wallet confirmation...</p>
              <p className="status-description">Please confirm the transaction in your wallet.</p>
            </div>
          )}

          {status === 'processing' && (
            <div className="transaction-status">
              <div className="loading-spinner"></div>
              <p>Processing transaction...</p>
              <p className="status-description">Your transaction is being processed on NERO Chain.</p>
            </div>
          )}

          {status === 'success' && txHash && (
            <div className="transaction-status success">
              <div className="success-icon">✓</div>
              <p>Transaction Successful!</p>
              <p className="status-description">Your transfer has been confirmed on the blockchain.</p>
              <div className="tx-info">
                <span className="tx-label">Transaction Hash:</span>
                <span className="tx-hash">{txHash}</span>
              </div>
              <a 
                href={`https://explorer-testnet.nerochain.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="explorer-link"
              >
                View on Explorer
              </a>
            </div>
          )}

          {status === 'error' && (
            <div className="transaction-status error">
              <div className="error-icon">✗</div>
              <p>Transaction Failed</p>
              <p className="status-description">{error}</p>
              <p className="error-guidance">Please try again or use a different token.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {status === 'preparing' && (
            <button 
              className="confirm-button"
              onClick={handleConfirm}
            >
              Confirm Transaction
            </button>
          )}
          
          {(status === 'success' || status === 'error') && (
            <button 
              className="close-button"
              onClick={onClose}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;