import { ethers } from 'ethers';
import { DeFiPosition, MoonwellPosition, TokenBalance } from '@/types';

// Moonwell contract addresses on Base
const MOONWELL_COMPTROLLER = '0xfBb21d0380beE3312B33c4353c8936a0F13EF26C';

// Base network RPC with Alchemy support
const getBaseRpc = () => {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  return alchemyKey 
    ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`
    : 'https://mainnet.base.org';
};

// Moonwell mToken ABI (simplified)
const MTOKEN_ABI = [
  'function balanceOf(address) external view returns (uint256)',
  'function borrowBalanceStored(address) external view returns (uint256)',
  'function supplyRatePerTimestamp() external view returns (uint256)',
  'function borrowRatePerTimestamp() external view returns (uint256)',
  'function exchangeRateStored() external view returns (uint256)',
  'function underlying() external view returns (address)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
];

// Moonwell Comptroller ABI
const COMPTROLLER_ABI = [
  'function getAllMarkets() external view returns (address[] memory)',
  'function getAccountLiquidity(address) external view returns (uint256, uint256, uint256)',
  'function markets(address) external view returns (bool isListed, uint256 collateralFactorMantissa, bool isComped)',
];

// Well token (rewards) ABI
const WELL_TOKEN_ABI = [
  'function balanceOf(address) external view returns (uint256)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
];

interface MoonwellService {
  getPositions(walletAddress: string): Promise<DeFiPosition[]>;
}

export class MoonwellIntegration implements MoonwellService {
  private provider: ethers.Provider;
  private comptroller: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(getBaseRpc());
    this.comptroller = new ethers.Contract(MOONWELL_COMPTROLLER, COMPTROLLER_ABI, this.provider);
  }

  async getPositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      const positions: DeFiPosition[] = [];

      // Get all Moonwell markets (mTokens)
      const markets = await this.getMoonwellMarkets();

      for (const market of markets) {
        try {
          const position = await this.getMarketPosition(walletAddress, market);
          if (position && (position.value > 0.01 || (position.metadata as MoonwellPosition)?.borrowed)) {
            positions.push(position);
          }
        } catch (error) {
          console.warn(`Failed to fetch Moonwell position for ${market.symbol}:`, error);
        }
      }

      return positions;
    } catch (error) {
      console.error('Error fetching Moonwell positions:', error);
      return [];
    }
  }

  private async getMarketPosition(
    walletAddress: string, 
    market: any
  ): Promise<DeFiPosition | null> {
    try {
      const mToken = new ethers.Contract(market.address, MTOKEN_ABI, this.provider);
      
      // Get user's mToken balance and borrow balance
      const [
        mTokenBalance,
        borrowBalance,
        exchangeRate,
        supplyRate,
        borrowRate
      ] = await Promise.all([
        mToken.balanceOf(walletAddress),
        mToken.borrowBalanceStored(walletAddress),
        mToken.exchangeRateStored(),
        mToken.supplyRatePerTimestamp(),
        mToken.borrowRatePerTimestamp(),
      ]);

      // Calculate underlying token amounts
      const suppliedUnderlying = (Number(mTokenBalance) * Number(exchangeRate)) / 1e18;
      const borrowedUnderlying = Number(borrowBalance) / Math.pow(10, market.decimals);

      if (suppliedUnderlying === 0 && borrowedUnderlying === 0) {
        return null;
      }

      // Calculate APYs (simplified conversion from per-timestamp rates)
      const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
      const supplyAPY = (Number(supplyRate) * SECONDS_PER_YEAR) / 1e18 * 100;
      const borrowAPY = (Number(borrowRate) * SECONDS_PER_YEAR) / 1e18 * 100;

      // Create asset token balance
      const asset: TokenBalance = {
        address: market.underlying,
        symbol: market.underlyingSymbol,
        name: market.underlyingName,
        balance: suppliedUnderlying.toString(),
        decimals: market.decimals,
        price: market.price || 1,
        value: suppliedUnderlying * (market.price || 1),
      };

      // Calculate net position value
      const suppliedValue = suppliedUnderlying * (market.price || 1);
      const borrowedValue = borrowedUnderlying * (market.price || 1);
      const netValue = suppliedValue - borrowedValue;

      const moonwellPosition: MoonwellPosition = {
        market: market.address,
        asset,
        supplied: suppliedUnderlying > 0 ? suppliedUnderlying.toString() : undefined,
        borrowed: borrowedUnderlying > 0 ? borrowedUnderlying.toString() : undefined,
        supplyAPY,
        borrowAPY: borrowedUnderlying > 0 ? borrowAPY : undefined,
        collateralFactor: market.collateralFactor || 0.75,
        isCollateral: suppliedUnderlying > 0,
        rewardsEarned: await this.getRewardsEarned(walletAddress),
      };

      // Calculate net APY based on position
      let netAPY = 0;
      if (suppliedUnderlying > 0 && borrowedUnderlying === 0) {
        netAPY = supplyAPY; // Pure supply position
      } else if (suppliedUnderlying > 0 && borrowedUnderlying > 0) {
        // Leveraged position
        const supplyWeight = suppliedValue / (suppliedValue + borrowedValue);
        const borrowWeight = borrowedValue / (suppliedValue + borrowedValue);
        netAPY = (supplyAPY * supplyWeight) - (borrowAPY * borrowWeight);
      } else if (borrowedUnderlying > 0) {
        netAPY = -borrowAPY; // Pure borrow position (negative APY)
      }

      const claimableRewards = moonwellPosition.rewardsEarned?.reduce(
        (sum, reward) => sum + reward.value, 0
      ) || 0;

      return {
        id: `moonwell-${market.address}`,
        protocol: 'moonwell',
        type: 'lending',
        tokens: [asset],
        apy: netAPY,
        value: Math.max(netValue, 0), // Don't show negative values for borrowed positions
        claimable: claimableRewards,
        metadata: moonwellPosition,
      };
    } catch (error) {
      console.error('Error getting Moonwell position details:', error);
      return null;
    }
  }

  private async getMoonwellMarkets() {
    // Mock Moonwell markets on Base
    // In production, fetch from comptroller.getAllMarkets()
    return [
      {
        address: '0x628ff693426583D9a7FB391E54366292F509D457', // mETH
        symbol: 'mETH',
        underlying: '0x4200000000000000000000000000000000000006', // WETH
        underlyingSymbol: 'ETH',
        underlyingName: 'Ethereum',
        decimals: 18,
        price: 4500,
        collateralFactor: 0.825,
      },
      {
        address: '0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22', // mUSDC
        symbol: 'mUSDC',
        underlying: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
        underlyingSymbol: 'USDC',
        underlyingName: 'USD Coin',
        decimals: 6,
        price: 1,
        collateralFactor: 0.90,
      },
      {
        address: '0x3bf93770f2d4a794c3d9EBEfBAeBAE2a8f09A5E5', // mUSDbC
        symbol: 'mUSDbC',
        underlying: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', // USDbC
        underlyingSymbol: 'USDbC',
        underlyingName: 'USD Base Coin',
        decimals: 6,
        price: 1,
        collateralFactor: 0.85,
      },
    ];
  }

  private async getRewardsEarned(walletAddress: string): Promise<TokenBalance[] | undefined> {
    try {
      // Mock WELL token rewards
      const wellToken = {
        address: '0xFF8adeC2221f9f4D8dfbAFa6B9a297d17603493D', // WELL token on Base
        symbol: 'WELL',
        name: 'Moonwell',
        balance: '1500000000000000000', // 1.5 WELL
        decimals: 18,
        price: 0.05, // Mock price
        value: 1.5 * 0.05,
      };

      return [wellToken];
    } catch (error) {
      console.warn('Failed to fetch Moonwell rewards:', error);
      return undefined;
    }
  }
}

// Factory function
export function createMoonwellService(): MoonwellIntegration {
  return new MoonwellIntegration();
}