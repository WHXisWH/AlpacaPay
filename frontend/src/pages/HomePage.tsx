// frontend/src/pages/HomePage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WalletConnect from '../components/WalletConnect';
import TokenList from '../components/TokenList';
import RecommendationCard from '../components/RecommendationCard';
import useTokens, { Token } from '../hooks/useTokens';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    tokens, 
    isLoading, 
    error, 
    getTokens, 
    getRecommendation,
    recommendation
  } = useTokens();
  
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState<boolean>(false);

  // Handle wallet connection
  const handleWalletConnected = (account: string) => {
    setWalletConnected(true);
  };

  // Handle getting tokens after wallet connection
  useEffect(() => {
    if (walletConnected) {
      getTokens();
    }
  }, [walletConnected, getTokens]);

  // Get token recommendation when tokens are loaded
  const fetchRecommendation = async () => {
    if (tokens.length > 0) {
      setRecommendationLoading(true);
      try {
        await getRecommendation();
      } catch (err) {
        console.error('Error getting recommendation:', err);
      } finally {
        setRecommendationLoading(false);
      }
    }
  };

  // Handle token selection
  const handleSelectToken = (token: Token) => {
    setSelectedToken(token);
  };

  // Handle proceeding to payment
  const handleProceedToPayment = () => {
    if (selectedToken) {
      // Navigate to payment page with selected token
      navigate('/payment', { 
        state: { 
          token: selectedToken,
          recommendation 
        } 
      });
    }
  };

  return (
    <div className="home-page">
      <header className="app-header">
        <h1>AI-Powered Payment Execution</h1>
        <WalletConnect onWalletConnected={handleWalletConnected} />
      </header>

      <main className="app-content">
        {!walletConnected ? (
          <div className="connect-prompt">
            <h2>Execute Transactions with Smart Token Selection</h2>
            <p>
              Connect your wallet to make blockchain payments with any token you own.
              Our system handles the transaction execution while our AI selects the most 
              cost-effective token for gas payments.
            </p>
            <div className="features">
              <div className="feature">
                <div className="feature-icon">💸</div>
                <h3>Execute Payments</h3>
                <p>Send tokens and execute transactions with any ERC20 token</p>
              </div>
              <div className="feature">
                <div className="feature-icon">🤖</div>
                <h3>AI Optimization</h3>
                <p>AI selects the best token to minimize your transaction costs</p>
              </div>
              <div className="feature">
                <div className="feature-icon">🔄</div>
                <h3>Seamless UX</h3>
                <p>One-click execution without managing gas tokens</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading your tokens...</p>
              </div>
            ) : (
              <>
                {error ? (
                  <div className="error-message">
                    <p>{error}</p>
                    <button onClick={getTokens}>Retry</button>
                  </div>
                ) : (
                  <div className="tokens-container">
                    <div className="left-panel">
                      {tokens.length > 0 && !recommendation && (
                        <div className="recommendation-actions">
                          <button 
                            className="get-recommendation-button"
                            onClick={fetchRecommendation}
                            disabled={recommendationLoading}
                          >
                            {recommendationLoading 
                              ? 'Analyzing...' 
                              : 'Get AI Recommendation'}
                          </button>
                        </div>
                      )}
                      <TokenList 
                        tokens={tokens} 
                        isLoading={isLoading}
                        onSelect={handleSelectToken}
                        selectedToken={selectedToken}
                      />
                    </div>
                    
                    <div className="right-panel">
                      {recommendation?.recommendedToken ? (
                        <RecommendationCard 
                          token={recommendation.recommendedToken} 
                          onSelectToken={handleSelectToken}
                        />
                      ) : (
                        <RecommendationCard 
                          token={null as any} 
                          onSelectToken={handleSelectToken}
                          isLoading={recommendationLoading}
                        />
                      )}
                      
                      {selectedToken && (
                        <div className="action-container">
                          <button 
                            className="proceed-button"
                            onClick={handleProceedToPayment}
                          >
                            Proceed with {selectedToken.symbol}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by NERO Chain & Account Abstraction</p>
      </footer>
    </div>
  );
};

export default HomePage;