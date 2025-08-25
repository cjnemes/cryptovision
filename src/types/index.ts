// Core types for CryptoVision

export interface WalletData {
  address: string;
  balance: string;
  tokens: TokenBalance[];
  defiPositions: DeFiPosition[];
}

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  price: number;
  value: number;
  logo?: string;
}

export interface DeFiPosition {
  protocol: string;
  type: 'lending' | 'liquidity' | 'staking' | 'farming';
  token: TokenBalance;
  apy: number;
  value: number;
  claimable?: number;
}

export interface PortfolioData {
  totalValue: number;
  totalChange24h: number;
  totalChangePercent24h: number;
  wallets: WalletData[];
  topHoldings: TokenBalance[];
  defiSummary: {
    totalValue: number;
    totalYield: number;
    protocols: string[];
  };
}

export interface PriceData {
  [tokenAddress: string]: {
    price: number;
    change24h: number;
    changePercent24h: number;
  };
}

export interface TransactionData {
  hash: string;
  from: string;
  to: string;
  value: string;
  token?: TokenBalance;
  timestamp: number;
  type: 'send' | 'receive' | 'swap' | 'deposit' | 'withdraw';
}