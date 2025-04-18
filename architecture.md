# AI-Powered Payment Execution dApp Architecture

This document outlines the system architecture of the AI-Powered Payment Execution dApp built on NERO Chain. The application leverages NERO Chain's Account Abstraction and Paymaster features to enable users to pay gas fees with ERC20 tokens, with AI assistance to select the optimal token.

## System Overview

The architecture follows a client-server model with clear separation of concerns:

1. **Backend (Node.js)**: Implements AI logic, price data fetching, and Paymaster integration
2. **Frontend (React)**: Provides user interface and wallet integration
3. **Blockchain (NERO Chain)**: Enables account abstraction and transaction execution

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            User Browser                                 │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        React Frontend                           │   │
│  │                                                                 │   │
│  │  ┌───────────────┐   ┌───────────────┐   ┌───────────────────┐  │   │
│  │  │  Wallet Hook  │   │  Tokens Hook  │   │  UserOp Hook      │  │   │
│  │  └───────────────┘   └───────────────┘   └───────────────────┘  │   │
│  │          │                   │                    │             │   │
│  │          ▼                   ▼                    ▼             │   │
│  │  ┌───────────────┐   ┌───────────────┐   ┌───────────────────┐  │   │
│  │  │ WalletConnect │   │   TokenList   │   │  Transaction      │  │   │
│  │  │ Component     │   │   Component   │   │  Modal Component  │  │   │
│  │  └───────────────┘   └───────────────┘   └───────────────────┘  │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                  │                                      │
└──────────────────────────────────│──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Node.js Backend                                 │
│                                                                         │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────┐   │
│  │ Token Scorer    │   │  Price Service  │   │  Paymaster Service  │   │
│  │ (AI Logic)      │   │                 │   │                     │   │
│  └─────────────────┘   └─────────────────┘   └─────────────────────┘   │
│           │                     │                      │               │
│           └─────────────────────┼──────────────────────┘               │
│                                 │                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         API Controller                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              Blockchain                                 │
│                                                                         │
│  ┌─────────────────────┐   ┌────────────────────┐  ┌────────────────┐  │
│  │    NERO Chain       │   │  EntryPoint        │  │  Account       │  │
│  │    (EVM Compatible) │◄──│  (0x5FF13...2789)  │◄─│  Factory       │  │
│  └─────────────────────┘   └────────────────────┘  └────────────────┘  │
│            ▲                          ▲                    ▲           │
│            │                          │                    │           │
│            │               ┌──────────┴─────────┐          │           │
│            │               │                    │          │           │
│  ┌─────────┴───────────┐  ┌┴───────────────┐  ┌─┴──────────────────┐  │
│  │  External Price     │  │ Paymaster      │  │ Smart Contract     │  │
│  │  Oracles            │  │ Contract       │  │ Wallet             │  │
│  └─────────────────────┘  └────────────────┘  └────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Details

### Frontend Components

#### React Hooks

1. **useWallet Hook**
   - Manages wallet connection (MetaMask/other providers)
   - Handles account state and chain switching
   - Provides functions to fetch token balances
   - Interfaces with the Account Abstraction wallet

2. **useTokens Hook**
   - Manages token data and state
   - Interfaces with backend for token recommendations
   - Provides filtering and sorting functionality
   - Tracks recommended tokens and their scores

3. **useUserOp Hook**
   - Builds UserOperations for NERO Chain
   - Integrates with the Paymaster for gas abstraction
   - Provides transaction execution functions
   - Manages transaction status and receipts

#### UI Components

1. **WalletConnect Component**
   - Displays wallet connection UI
   - Shows wallet status and chain information
   - Provides disconnect functionality
   - Shows AA wallet address when available

2. **TokenList Component**
   - Displays user's token balances
   - Highlights AI-recommended tokens
   - Shows token scores and recommendation reasons
   - Enables token selection for transactions

3. **RecommendationCard Component**
   - Displays detailed information about the recommended token
   - Shows AI analysis with scoring breakdown
   - Highlights volatility, slippage, and balance metrics
   - Provides one-click selection of recommended token

4. **TransactionModal Component**
   - Shows transaction confirmation details
   - Displays gas payment information
   - Shows transaction status and progress
   - Provides links to block explorer after completion

### Backend Components

#### Services

1. **Token Scorer Service**
   - Implements AI scoring algorithm
   - Weights multiple factors for token selection:
     - Balance (40% weight)
     - Volatility (30% weight)
     - Slippage (30% weight)
   - Normalizes scores across different metrics
   - Generates human-readable recommendation reasons

2. **Price Service**
   - Fetches token prices from external APIs
   - Calculates token volatility metrics
   - Estimates slippage for tokens
   - Implements caching for performance

3. **Paymaster Service**
   - Interfaces with NERO Chain's Paymaster
   - Gets supported tokens for gas payment
   - Handles different payment types (0, 1, 2)
   - Estimates gas costs in chosen tokens

#### API Controllers

1. **Token Controller**
   - Handles `/recommend-token` endpoint
   - Processes `/supported-tokens` requests
   - Serves `/payment-types` information
   - Provides `/estimate-gas` calculations

#### Middleware

1. **Error Handling**
   - Catches and formats API errors
   - Provides consistent error responses
   - Logs errors for monitoring

2. **Caching**
   - Implements basic caching mechanisms
   - Reduces load on external services
   - Improves response times

### NERO Chain Integration

#### Account Abstraction (AA)

The application uses NERO Chain's AA implementation which follows the ERC-4337 standard:

1. **EntryPoint Contract**
   - Central contract for processing UserOperations
   - Deployed at `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`
   - Handles verification and execution of operations

2. **Account Factory**
   - Creates smart contract wallets for users
   - Follows counterfactual deployment pattern
   - Generates deterministic addresses

3. **Smart Contract Wallet**
   - Executes the actual transactions
   - Supports multiple signature schemes
   - Can implement additional security features

#### Paymaster System

The application leverages all three payment types supported by NERO Chain's Paymaster:

1. **Type 0: Sponsored (Free) Transactions**
   - Developer covers gas costs completely
   - Used for new user onboarding
   - Funded through developer deposits

2. **Type 1: Prepay with ERC20**
   - User pays gas using supported tokens
   - Collects payment before transaction execution
   - Refunds excess after execution

3. **Type 2: Postpay with ERC20**
   - User pays gas using supported tokens
   - Collects exact payment after execution
   - No need for upfront estimates or refunds

## Data Flow

### Token Recommendation Flow

1. User connects wallet
2. Frontend fetches token balances using `useWallet` hook
3. Frontend calls backend `/recommend-token` endpoint
4. Backend fetches price and slippage data for tokens
5. Backend runs token scoring algorithm
6. Backend returns recommended token with scores
7. Frontend displays recommendation in UI

### Transaction Execution Flow

1. User selects token and enters transaction details
2. Frontend constructs UserOperation using `useUserOp` hook
3. Frontend configures Paymaster options based on selected payment type
4. Frontend sends UserOperation to NERO Chain bundler
5. Bundler submits operation to EntryPoint contract
6. EntryPoint verifies and executes operation
7. Transaction is processed on-chain
8. Frontend displays transaction receipt and status

## Security Considerations

1. **Private Key Protection**
   - All private keys remain in the user's wallet
   - No sensitive data is stored on backend
   - Application uses only signed messages

2. **Gas Estimation**
   - Accurate gas estimation to prevent failed transactions
   - Fallback mechanisms for unpredictable gas scenarios
   - Proper error handling for out-of-gas situations

3. **Paymaster Security**
   - Rate limiting to prevent abuse
   - Quota management for sponsored transactions
   - Token allowance verification for ERC20 payments

4. **API Security**
   - Input validation on all endpoints
   - Rate limiting to prevent abuse
   - No storing of sensitive user data

## Future Architecture Extensions

The architecture is designed to be modular and extensible, allowing for future enhancements:

1. **Machine Learning Integration**
   - Add more sophisticated ML models for token recommendation
   - Integrate historical transaction data analysis
   - Implement user preference learning

2. **DEX Integration**
   - Add direct swap functionality for tokens
   - Implement cross-chain bridges
   - Provide routing optimization across DEXes

3. **Social Features**
   - Add address book functionality
   - Implement social recovery options
   - Enable transaction sharing

## Deployment Architecture

The application can be deployed using the following architecture:

1. **Frontend**
   - Static hosting on CDN
   - Client-side rendering for performance
   - Progressive Web App (PWA) capabilities

2. **Backend**
   - Containerized Node.js application
   - Horizontal scaling for API endpoints
   - Redis caching layer for performance

3. **Monitoring**
   - Logging infrastructure for debugging
   - Performance monitoring for optimization
   - Error tracking for reliability