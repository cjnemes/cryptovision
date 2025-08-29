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

      // Calculate underlying token amounts using proper BigInt precision
      // For Moonwell: balanceOfUnderlying = (mTokenBalance * exchangeRate) / 1e18
      // The result is in underlying token units (e.g., wei for ETH, or base units for USDC)
      const suppliedUnderlyingRaw = (mTokenBalance * exchangeRate) / BigInt(10 ** 18);
      const suppliedUnderlying = parseFloat(ethers.formatUnits(suppliedUnderlyingRaw, market.decimals));
      
      // Debug logging for problematic calculations
      if (suppliedUnderlying > 100000) { // More than $100k seems suspicious for most positions
        console.warn(`Large Moonwell position detected:`, {
          market: market.address,
          symbol: market.underlyingSymbol,
          mTokenBalance: mTokenBalance.toString(),
          exchangeRate: exchangeRate.toString(),
          suppliedUnderlyingRaw: suppliedUnderlyingRaw.toString(),
          suppliedUnderlying,
          decimals: market.decimals,
          // Let's also check if we're using the right exchange rate format
          exchangeRateFormatted: ethers.formatUnits(exchangeRate, 18),
        });
      }
      
      // Add debugging and cap unrealistic values
      if (suppliedUnderlying > 1000000) { // More than $1M seems suspicious - likely a precision error
        console.warn(`Capping large Moonwell position - likely precision error:`, {
          market: market.address,
          symbol: market.underlyingSymbol,
          mTokenBalance: mTokenBalance.toString(),
          exchangeRate: exchangeRate.toString(),
          suppliedUnderlyingRaw: suppliedUnderlyingRaw.toString(),
          suppliedUnderlying,
          decimals: market.decimals
        });
        
        // For now, skip positions with unrealistic values until we fix precision
        // This prevents massive portfolio values from calculation errors
        return null;
      }
      
      const borrowedUnderlying = parseFloat(ethers.formatUnits(borrowBalance, market.decimals));

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
    try {
      // Fetch all markets from the Moonwell comptroller
      const allMarkets = await this.comptroller.getAllMarkets();
      console.log('Found Moonwell markets:', allMarkets.length);
      
      const markets = [];
      
      for (const marketAddress of allMarkets) {
        try {
          const mToken = new ethers.Contract(marketAddress, MTOKEN_ABI, this.provider);
          
          // Get market details
          const [underlying, symbol, decimals] = await Promise.all([
            mToken.underlying().catch(() => ethers.ZeroAddress), // Native ETH has no underlying
            mToken.symbol(),
            mToken.decimals().catch(() => 18)
          ]);
          
          // Get underlying token details if it exists
          let underlyingSymbol = 'ETH';
          let underlyingName = 'Ethereum';
          let underlyingDecimals = 18;
          let price = 4500; // Default ETH price
          
          if (underlying !== ethers.ZeroAddress) {
            try {
              const underlyingToken = new ethers.Contract(underlying, [
                'function symbol() view returns (string)',
                'function name() view returns (string)',
                'function decimals() view returns (uint8)'
              ], this.provider);
              
              const [uSymbol, uName, uDecimals] = await Promise.all([
                underlyingToken.symbol(),
                underlyingToken.name(), 
                underlyingToken.decimals()
              ]);
              
              underlyingSymbol = uSymbol;
              underlyingName = uName;
              underlyingDecimals = uDecimals;
              
              // Set mock prices for common tokens
              const priceMap: Record<string, number> = {
                'USDC': 1,
                'USDbC': 1,
                'cbETH': 4800, // cbETH typically trades at premium to ETH
                'WETH': 4500,
                'DAI': 1,
                'WBTC': 67000
              };
              price = priceMap[uSymbol] || 1;
              
            } catch (error) {
              console.warn(`Failed to get underlying token details for ${marketAddress}:`, error);
            }
          }
          
          markets.push({
            address: marketAddress,
            symbol,
            underlying,
            underlyingSymbol,
            underlyingName,
            decimals: underlyingDecimals,
            price,
            collateralFactor: 0.8 // Default, could fetch from comptroller
          });
          
        } catch (error) {
          console.warn(`Failed to get market details for ${marketAddress}:`, error);
        }
      }
      
      console.log('Processed markets:', markets.map(m => `${m.symbol} (${m.underlyingSymbol})`));
      return markets;
      
    } catch (error) {
      console.error('Failed to fetch Moonwell markets from comptroller:', error);
      
      // Fallback to known markets if comptroller call fails
      return [
        {
          address: '0x628ff693426583D9a7FB391E54366292F509D457', // mETH
          symbol: 'mETH',
          underlying: '0x4200000000000000000000000000000000000006',
          underlyingSymbol: 'ETH',
          underlyingName: 'Ethereum',
          decimals: 18,
          price: 4500,
          collateralFactor: 0.825,
        }
      ];
    }
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