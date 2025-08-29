import { ethers } from 'ethers';
import { DeFiPosition, AerodromePosition, TokenBalance } from '@/types';

// Aerodrome contract addresses on Base
const AERODROME_ROUTER = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43';
const AERODROME_VOTER = '0x16613524e02ad97eDfeF371bC883F2F5d6C480A5';
const AERODROME_FACTORY = '0x420DD381b31aEf6683db6B902084cB0FFECe40Da';

// Base network RPC
const BASE_RPC = 'https://mainnet.base.org';

// Aerodrome Router ABI (simplified)
const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, tuple(address from, address to, bool stable)[] memory routes) external view returns (uint[] memory amounts)',
  'function pairFor(address tokenA, address tokenB, bool stable) external view returns (address pair)',
];

// Aerodrome Pair ABI
const PAIR_ABI = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function stable() external view returns (bool)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address) external view returns (uint256)',
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
];

// Aerodrome Gauge ABI
const GAUGE_ABI = [
  'function balanceOf(address) external view returns (uint256)',
  'function earned(address) external view returns (uint256)',
  'function rewardToken() external view returns (address)',
];

interface AerodromeService {
  getPositions(walletAddress: string): Promise<DeFiPosition[]>;
}

export class AerodromeIntegration implements AerodromeService {
  private provider: ethers.Provider;
  private router: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(BASE_RPC);
    this.router = new ethers.Contract(AERODROME_ROUTER, ROUTER_ABI, this.provider);
  }

  async getPositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      const positions: DeFiPosition[] = [];

      // Get LP token balances (simplified approach)
      // In production, we'd scan for all LP tokens or use Aerodrome's subgraph
      const commonPairs = await this.getCommonPairs();

      for (const pairInfo of commonPairs) {
        try {
          const position = await this.getPositionDetails(walletAddress, pairInfo);
          if (position && position.value > 0.01) {
            positions.push(position);
          }
        } catch (error) {
          console.warn(`Failed to fetch Aerodrome position for ${pairInfo.symbol}:`, error);
        }
      }

      return positions;
    } catch (error) {
      console.error('Error fetching Aerodrome positions:', error);
      return [];
    }
  }

  private async getPositionDetails(
    walletAddress: string, 
    pairInfo: any
  ): Promise<DeFiPosition | null> {
    try {
      const pair = new ethers.Contract(pairInfo.address, PAIR_ABI, this.provider);
      
      // Get LP token balance
      const lpBalance = await pair.balanceOf(walletAddress);
      if (lpBalance === 0n) return null;

      // Get pair details
      const [token0Address, token1Address, isStable, totalSupply, reserves] = await Promise.all([
        pair.token0(),
        pair.token1(),
        pair.stable(),
        pair.totalSupply(),
        pair.getReserves(),
      ]);

      // Calculate user's share of the pool
      const userShare = Number(lpBalance) / Number(totalSupply);
      const token0Amount = (Number(reserves.reserve0) * userShare).toString();
      const token1Amount = (Number(reserves.reserve1) * userShare).toString();

      // Create token balances (mock token data for development)
      const token0: TokenBalance = {
        address: token0Address,
        symbol: pairInfo.token0Symbol || 'TOKEN0',
        name: `Token 0 (${pairInfo.token0Symbol})`,
        balance: token0Amount,
        decimals: 18,
        price: pairInfo.token0Price || 1,
        value: (Number(token0Amount) / 1e18) * (pairInfo.token0Price || 1),
      };

      const token1: TokenBalance = {
        address: token1Address,
        symbol: pairInfo.token1Symbol || 'TOKEN1',
        name: `Token 1 (${pairInfo.token1Symbol})`,
        balance: token1Amount,
        decimals: 18,
        price: pairInfo.token1Price || 1,
        value: (Number(token1Amount) / 1e18) * (pairInfo.token1Price || 1),
      };

      // Check for gauge staking
      let gaugePosition;
      if (pairInfo.gauge) {
        const gauge = new ethers.Contract(pairInfo.gauge, GAUGE_ABI, this.provider);
        const stakedBalance = await gauge.balanceOf(walletAddress);
        const earnedRewards = await gauge.earned(walletAddress);
        
        if (stakedBalance > 0n) {
          gaugePosition = {
            address: pairInfo.gauge,
            rewards: [{
              address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631', // AERO token
              symbol: 'AERO',
              name: 'Aerodrome',
              balance: earnedRewards.toString(),
              decimals: 18,
              price: 0.5, // Mock price
              value: (Number(earnedRewards) / 1e18) * 0.5,
            }],
            emissions: 25.5, // Mock APY
          };
        }
      }

      const aerodromePosition: AerodromePosition = {
        pairAddress: pairInfo.address,
        token0,
        token1,
        isStable,
        gauge: gaugePosition,
        lpTokenBalance: lpBalance.toString(),
        totalSupply: totalSupply.toString(),
      };

      const totalValue = token0.value + token1.value;
      const claimableRewards = gaugePosition?.rewards.reduce((sum, reward) => sum + reward.value, 0) || 0;

      return {
        id: `aerodrome-${pairInfo.address}`,
        protocol: 'aerodrome',
        type: 'liquidity',
        tokens: [token0, token1],
        apy: gaugePosition?.emissions || 15.0, // Base LP APY or gauge APY
        value: totalValue,
        claimable: claimableRewards,
        metadata: aerodromePosition,
      };
    } catch (error) {
      console.error('Error getting Aerodrome position details:', error);
      return null;
    }
  }

  private async getCommonPairs() {
    // Mock common Aerodrome pairs on Base
    return [
      {
        address: '0x6cDcb1C4A4D1C3C6d054b27AC5B77e89eAFb971d', // Mock ETH/USDC
        symbol: 'ETH/USDC',
        token0Symbol: 'WETH',
        token1Symbol: 'USDC',
        token0Price: 4500,
        token1Price: 1,
        gauge: '0x7d7F1765aCbaF847b9A1f7137FE8Ed4931FbfEbA', // Mock gauge
      },
      {
        address: '0x9BA7d5C0F8B09E2f59b5ca3d5C8e5B4B3E5A5c5c', // Mock USDC/USDbC stable pair
        symbol: 'USDC/USDbC',
        token0Symbol: 'USDC',
        token1Symbol: 'USDbC',
        token0Price: 1,
        token1Price: 1,
        isStable: true,
        gauge: '0x8BA7d5C0F8B09E2f59b5ca3d5C8e5B4B3E5A5c5c',
      },
    ];
  }
}

// Factory function
export function createAerodromeService(): AerodromeIntegration {
  return new AerodromeIntegration();
}