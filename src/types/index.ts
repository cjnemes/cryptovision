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
  id: string;
  protocol: 'uniswap-v3' | 'aave' | 'compound' | 'lido' | 'curve' | 'aerodrome' | 'moonwell' | 'gammaswap' | 'mamo' | 'thena' | 'morpho' | 'manual';
  type: 'lending' | 'liquidity' | 'staking' | 'farming' | 'yield-farming' | 'token' | 'liquidity-pool';
  tokens: TokenBalance[];
  apy: number;
  value: number;
  claimable?: number;
  metadata?: UniswapV3Position | AavePosition | StakingPosition | AerodromePosition | MoonwellPosition | ManualPosition | Record<string, any>;
}

export interface UniswapV3Position {
  tokenId: string;
  pool: string;
  token0: TokenBalance;
  token1: TokenBalance;
  fee: number;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  uncollectedFees: {
    token0: string;
    token1: string;
  };
  inRange: boolean;
}

export interface AavePosition {
  market: string;
  supplied: TokenBalance[];
  borrowed: TokenBalance[];
  healthFactor: number;
  netAPY: number;
}

export interface StakingPosition {
  validator?: string;
  stakedAmount: string;
  rewards: string;
  unstakingPeriod?: number;
}

export interface AerodromePosition {
  pairAddress: string;
  token0: TokenBalance;
  token1: TokenBalance;
  isStable: boolean;
  gauge?: {
    address: string;
    rewards: TokenBalance[];
    emissions: number;
  };
  lpTokenBalance: string;
  totalSupply: string;
}

export interface MoonwellPosition {
  market: string;
  asset: TokenBalance;
  supplied?: string;
  borrowed?: string;
  supplyAPY: number;
  borrowAPY?: number;
  collateralFactor: number;
  isCollateral: boolean;
  rewardsEarned?: TokenBalance[];
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

// Manual positions system types
export interface ManualPosition {
  id: string;
  walletAddress: string;
  protocol: string;
  type: 'lending' | 'liquidity' | 'staking' | 'farming' | 'yield-farming' | 'token' | 'liquidity-pool';
  description: string;
  tokens: {
    address: string;
    symbol: string;
    name: string;
    amount: string;
    decimals: number;
  }[];
  apy?: number;
  claimableAmount?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}