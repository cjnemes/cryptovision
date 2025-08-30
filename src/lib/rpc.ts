import { ethers } from 'ethers';

// RPC URLs for different networks
export const RPC_URLS: Record<string, string> = {
  ethereum: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://cloudflare-eth.com',
  polygon: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com',
  base: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
  optimism: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
  arbitrum: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
  // Fallback Alchemy URLs if API key is available
  alchemyBase: process.env.ALCHEMY_API_KEY ? 
    `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` : 
    'https://mainnet.base.org',
};

// Chain IDs
export const CHAIN_IDS = {
  ethereum: 1,
  polygon: 137,
  base: 8453,
  optimism: 10,
  arbitrum: 42161,
} as const;

// Get provider for a specific chain
export function getProvider(chainName: keyof typeof RPC_URLS): ethers.JsonRpcProvider {
  const rpcUrl = RPC_URLS[chainName];
  if (!rpcUrl) {
    throw new Error(`No RPC URL configured for chain: ${chainName}`);
  }
  return new ethers.JsonRpcProvider(rpcUrl);
}

// Get Base network provider (most commonly used)
export function getBaseProvider(): ethers.JsonRpcProvider {
  return getProvider('alchemyBase');
}

// Rate limiting configuration
export const RATE_LIMITS = {
  free: 5, // requests per second for free RPCs
  alchemy: 25, // requests per second for Alchemy
  default: 10, // default fallback
} as const;