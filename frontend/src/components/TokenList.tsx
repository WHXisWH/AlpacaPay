import React from 'react';
import { Token } from '../types';

interface TokenListProps {
  tokens: Token[];
  isLoading: boolean;
  onSelect: (token: Token) => void;
  selectedToken?: Token | null;
}

const TokenList: React.FC<TokenListProps> = ({
  tokens,
  isLoading,
  onSelect,
  selectedToken
}) => {
  if (isLoading) {
    return (
      <div className="token-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading tokens...</p>
      </div>
    );
  }

  if (!tokens || tokens.length === 0) {
    return (
      <div className="token-list-empty">
        <p>No tokens found in your wallet.</p>
      </div>
    );
  }

  return (
    <div className="token-list">
      <h3>Available Tokens</h3>
      <div className="token-list-container">
        {tokens.map((token) => (
          <div
            key={token.address}
            className={`token-item ${token.recommended ? 'recommended' : ''} ${selectedToken?.address === token.address ? 'selected' : ''}`}
            onClick={() => onSelect(token)}
          >
            <div className="token-icon">
              {/* Placeholder for token icon */}
              <div className="token-icon-placeholder">{token.symbol.charAt(0)}</div>
            </div>
            <div className="token-details">
              <div className="token-name-row">
                <span className="token-symbol">{token.symbol}</span>
                <span className="token-name">{token.name}</span>
                {token.recommended && (
                  <span className="recommended-badge">AI RECOMMENDED</span>
                )}
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
                <div className="token-score-row">
                  <div className="score-bar">
                    <div 
                      className="score-fill" 
                      style={{ width: `${token.score * 100}%` }}
                    ></div>
                  </div>
                  <span className="score-label">
                    Score: {(token.score * 100).toFixed(0)}%
                  </span>
                </div>
              )}
              {token.reasons && token.reasons.length > 0 && (
                <div className="token-reasons">
                  <ul>
                    {token.reasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TokenList;