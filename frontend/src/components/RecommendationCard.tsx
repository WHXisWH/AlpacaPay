import React from 'react';
import { Token } from '../types';

interface RecommendationCardProps {
  token: Token;
  onSelectToken: (token: Token) => void;
  isLoading?: boolean;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  token,
  onSelectToken,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="recommendation-card loading">
        <h3>Finding Best Token...</h3>
        <div className="loading-animation">
          <div className="loading-spinner"></div>
        </div>
        <p>Our AI is analyzing your tokens to find the optimal payment option...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="recommendation-card empty">
        <h3>No Recommendation Available</h3>
        <p>
          We couldn't find any suitable tokens for payment in your wallet. 
          Please ensure you have tokens that are supported by the Paymaster.
        </p>
      </div>
    );
  }

  return (
    <div className="recommendation-card">
      <div className="recommendation-header">
        <h3>AI Recommended Token</h3>
        <div className="ai-badge">
          <span>AI OPTIMIZED</span>
        </div>
      </div>

      <div className="token-details">
        <div className="token-icon">
          {/* Placeholder for token icon */}
          <div className="token-icon-placeholder">{token.symbol.charAt(0)}</div>
        </div>
        
        <div className="token-info">
          <div className="token-name-row">
            <span className="token-symbol">{token.symbol}</span>
            <span className="token-name">{token.name}</span>
          </div>
          
          <div className="token-balance-row">
            <span className="token-balance">
              {parseFloat(token.balance).toFixed(4)} {token.symbol}
            </span>
            {token.usdBalance !== undefined && (
              <span className="token-usd-balance">
                ≈ ${token.usdBalance.toFixed(2)}
              </span>
            )}
          </div>
          
          {token.score !== undefined && (
            <div className="score-container">
              <div className="score-bar">
                <div 
                  className="score-fill" 
                  style={{ width: `${token.score * 100}%` }}
                ></div>
              </div>
              <span className="score-value">{(token.score * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>
      </div>

      {token.reasons && token.reasons.length > 0 && (
        <div className="recommendation-reasons">
          <h4>Why This Token?</h4>
          <ul>
            {token.reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="recommendation-metrics">
        <div className="metric">
          <span className="metric-label">Volatility</span>
          <div className="metric-bar">
            <div 
              className="metric-fill" 
              style={{ width: `${(token.volatilityScore || 0) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="metric">
          <span className="metric-label">Slippage</span>
          <div className="metric-bar">
            <div 
              className="metric-fill" 
              style={{ width: `${(token.slippageScore || 0) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="metric">
          <span className="metric-label">Balance</span>
          <div className="metric-bar">
            <div 
              className="metric-fill" 
              style={{ width: `${Math.min((parseFloat(token.balance) / 100) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <button 
        className="use-token-button"
        onClick={() => onSelectToken(token)}
      >
        Use This Token
      </button>
    </div>
  );
};

export default RecommendationCard;