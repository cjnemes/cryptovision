import { ethers } from 'ethers';
import { DeFiPosition, TokenBalance } from '@/types';
import { RPC_URLS } from '@/lib/rpc';
import { priceService } from '@/lib/prices';
import { safeContractCall, withErrorHandling } from '@/lib/utils/error-handler';

// Compound III V3 Base network deployment addresses
const COMPOUND_V3_MARKETS = {
  base: {
    // Main Comet instances on Base
    cUSDbCv3: {
      address: '0x9c4ec768c28520b50860ea7a15bd7213a9ff58bf',
      baseAsset: 'USDbC',
      baseAssetAddress: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', // USDbC on Base
      baseAssetDecimals: 6,
    },
    cWETHv3: {
      address: '0x46e6b214b524310239732d51387075e0e70970bf',
      baseAsset: 'WETH',
      baseAssetAddress: '0x4200000000000000000000000000000000000006', // WETH on Base
      baseAssetDecimals: 18,
    },
  },
};

// Compound III ABI for querying positions
const COMPOUND_V3_ABI = [
  // Core balance functions
  'function balanceOf(address account) external view returns (uint256)',
  'function borrowBalanceOf(address account) external view returns (uint256)',
  'function collateralBalanceOf(address account, address asset) external view returns (uint128)',
  
  // Market info functions
  'function baseToken() external view returns (address)',
  'function baseTokenPriceFeed() external view returns (address)',
  'function getSupplyRate(uint256 utilization) external view returns (uint64)',
  'function getBorrowRate(uint256 utilization) external view returns (uint64)',
  'function getUtilization() external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function totalBorrow() external view returns (uint256)',
  
  // Asset info
  'function numAssets() external view returns (uint8)',
  'function getAssetInfo(uint8 i) external view returns (tuple(uint8 offset, address asset, address priceFeed, uint128 scale, uint128 borrowCollateralFactor, uint128 liquidateCollateralFactor, uint128 liquidationFactor, uint128 supplyCap))',
  'function getAssetInfoByAddress(address asset) external view returns (tuple(uint8 offset, address asset, address priceFeed, uint128 scale, uint128 borrowCollateralFactor, uint128 liquidateCollateralFactor, uint128 liquidationFactor, uint128 supplyCap))',
  
  // Account info
  'function isLiquidatable(address account) external view returns (bool)',
  'function userBasic(address account) external view returns (tuple(int104 principal, uint64 baseTrackingIndex, uint64 baseTrackingAccrued, uint16 assetsIn, uint8 _reserved))',
  
  // Configuration
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
];

// ERC20 ABI for collateral token info
const ERC20_ABI = [
  'function balanceOf(address user) external view returns (uint256)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
  'function decimals() external view returns (uint8)',
];

export interface CompoundV3Service {
  getPositions(walletAddress: string): Promise<DeFiPosition[]>;
}

export class CompoundV3Integration implements CompoundV3Service {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(RPC_URLS.base);
  }

  async getPositions(walletAddress: string): Promise<DeFiPosition[]> {
    console.log(`Fetching Compound V3 positions for ${walletAddress} on Base...`);
    
    try {
      const positions: DeFiPosition[] = [];
      
      // Check positions in both markets
      for (const [marketName, marketInfo] of Object.entries(COMPOUND_V3_MARKETS.base)) {
        const marketPositions = await this.getMarketPositions(walletAddress, marketName, marketInfo);
        positions.push(...marketPositions);
      }

      console.log(`Found ${positions.length} Compound V3 positions for ${walletAddress}`);
      return positions;
    } catch (error) {
      console.error('Error fetching Compound V3 positions:', error);
      return [];
    }
  }

  private async getMarketPositions(
    walletAddress: string, 
    marketName: string, 
    marketInfo: typeof COMPOUND_V3_MARKETS.base.cUSDbCv3
  ): Promise<DeFiPosition[]> {
    try {
      const contract = new ethers.Contract(marketInfo.address, COMPOUND_V3_ABI, this.provider);
      
      // Get basic account info with safe contract calls
      const contractCalls = await Promise.all([
        safeContractCall(() => contract.balanceOf(walletAddress), 'compound-v3', 'balanceOf', marketInfo.address),
        safeContractCall(() => contract.borrowBalanceOf(walletAddress), 'compound-v3', 'borrowBalanceOf', marketInfo.address),
        safeContractCall(() => contract.userBasic(walletAddress), 'compound-v3', 'userBasic', marketInfo.address),
        safeContractCall(() => contract.getUtilization(), 'compound-v3', 'getUtilization', marketInfo.address),
        safeContractCall(() => contract.numAssets(), 'compound-v3', 'numAssets', marketInfo.address)
      ]);

      const [supplyBalance, borrowBalance, userBasic, utilization, numAssets] = contractCalls;
      
      // Only proceed if we got essential data
      if (supplyBalance === null && borrowBalance === null) {
        console.debug(`No Compound V3 data available for ${marketName}`);
        return [];
      }

      // Get supply and borrow rates safely
      let supplyRate = 0n, borrowRate = 0n;
      if (utilization !== null) {
        const rateCallsResult = await Promise.all([
          safeContractCall(() => contract.getSupplyRate(utilization), 'compound-v3', 'getSupplyRate', marketInfo.address),
          safeContractCall(() => contract.getBorrowRate(utilization), 'compound-v3', 'getBorrowRate', marketInfo.address)
        ]);
        supplyRate = rateCallsResult[0] || 0n;
        borrowRate = rateCallsResult[1] || 0n;
      }

      const positions: DeFiPosition[] = [];
      
      // Check for supply positions (positive balance)
      if (supplyBalance !== null && supplyBalance > 0n) {
        const supplyPosition = await this.createSupplyPosition(
          walletAddress,
          marketName,
          marketInfo,
          supplyBalance,
          supplyRate
        );
        if (supplyPosition) {
          positions.push(supplyPosition);
        }
      }

      // Check for borrow positions (positive borrow balance)
      if (borrowBalance !== null && borrowBalance > 0n) {
        const borrowPosition = await this.createBorrowPosition(
          walletAddress,
          marketName,
          marketInfo,
          borrowBalance,
          borrowRate
        );
        if (borrowPosition) {
          positions.push(borrowPosition);
        }
      }

      // Check for collateral positions if we have asset count
      if (numAssets !== null && numAssets > 0) {
        const collateralPositions = await this.getCollateralPositions(
          walletAddress,
          marketName,
          marketInfo,
          contract,
          Number(numAssets)
        );
        positions.push(...collateralPositions);
      }

      return positions;
    } catch (error) {
      console.error(`Error fetching ${marketName} positions:`, error);
      return [];
    }
  }

  private async createSupplyPosition(
    walletAddress: string,
    marketName: string,
    marketInfo: typeof COMPOUND_V3_MARKETS.base.cUSDbCv3,
    balance: bigint,
    supplyRate: bigint
  ): Promise<DeFiPosition | null> {
    try {
      // Convert balance from wei/units to human readable
      const balanceFormatted = Number(ethers.formatUnits(balance, marketInfo.baseAssetDecimals));
      
      // Get current price
      const price = await priceService.getPrice(marketInfo.baseAsset) || 0;
      const value = balanceFormatted * price;
      
      // Convert supply rate (scaled by 1e18) to APY percentage
      const supplyAPY = this.convertRateToAPY(supplyRate);

      const tokens: TokenBalance[] = [{
        address: marketInfo.baseAssetAddress,
        symbol: marketInfo.baseAsset,
        name: marketInfo.baseAsset === 'USDbC' ? 'USD Base Coin' : 'Wrapped Ether',
        balance: balanceFormatted.toString(),
        decimals: marketInfo.baseAssetDecimals,
        price,
        value,
      }];

      return {
        id: `compound-v3-${marketName}-supply-${walletAddress}`,
        protocol: 'compound-v3',
        type: 'lending',
        tokens,
        apy: supplyAPY,
        value,
        claimable: 0, // Compound V3 interest accrues automatically
        metadata: {
          market: marketName,
          baseAsset: marketInfo.baseAsset,
          contractAddress: marketInfo.address,
          positionType: 'supply',
          isCompoundV3: true,
        }
      };
    } catch (error) {
      console.error(`Error creating supply position for ${marketName}:`, error);
      return null;
    }
  }

  private async createBorrowPosition(
    walletAddress: string,
    marketName: string,
    marketInfo: typeof COMPOUND_V3_MARKETS.base.cUSDbCv3,
    borrowBalance: bigint,
    borrowRate: bigint
  ): Promise<DeFiPosition | null> {
    try {
      // Convert balance from wei/units to human readable
      const balanceFormatted = Number(ethers.formatUnits(borrowBalance, marketInfo.baseAssetDecimals));
      
      // Get current price
      const price = await priceService.getPrice(marketInfo.baseAsset) || 0;
      const value = balanceFormatted * price;
      
      // Convert borrow rate to APY percentage (negative since it's debt)
      const borrowAPY = -this.convertRateToAPY(borrowRate);

      const tokens: TokenBalance[] = [{
        address: marketInfo.baseAssetAddress,
        symbol: marketInfo.baseAsset,
        name: marketInfo.baseAsset === 'USDbC' ? 'USD Base Coin' : 'Wrapped Ether',
        balance: `-${balanceFormatted}`, // Negative for debt
        decimals: marketInfo.baseAssetDecimals,
        price,
        value: -value, // Negative value for debt
      }];

      return {
        id: `compound-v3-${marketName}-borrow-${walletAddress}`,
        protocol: 'compound-v3',
        type: 'borrowing',
        tokens,
        apy: borrowAPY,
        value: -value, // Debt is negative value
        claimable: 0,
        metadata: {
          market: marketName,
          baseAsset: marketInfo.baseAsset,
          contractAddress: marketInfo.address,
          positionType: 'borrow',
          isCompoundV3: true,
          isDebt: true,
        }
      };
    } catch (error) {
      console.error(`Error creating borrow position for ${marketName}:`, error);
      return null;
    }
  }

  private async getCollateralPositions(
    walletAddress: string,
    marketName: string,
    marketInfo: typeof COMPOUND_V3_MARKETS.base.cUSDbCv3,
    contract: ethers.Contract,
    numAssets: number
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    // Get all asset info for this market with safe contract calls
    for (let i = 0; i < numAssets; i++) {
      const assetInfo = await safeContractCall(
        () => contract.getAssetInfo(i),
        'compound-v3',
        'getAssetInfo',
        marketInfo.address
      );
      
      if (assetInfo !== null) {
        const collateralBalance = await safeContractCall(
          () => contract.collateralBalanceOf(walletAddress, assetInfo.asset),
          'compound-v3',
          'collateralBalanceOf',
          marketInfo.address
        );
        
        if (collateralBalance !== null && collateralBalance > 0n) {
          const collateralPosition = await this.createCollateralPosition(
            walletAddress,
            marketName,
            marketInfo,
            assetInfo,
            collateralBalance
          );
          if (collateralPosition) {
            positions.push(collateralPosition);
          }
        }
      } else {
        console.debug(`Could not fetch asset info for asset ${i} in ${marketName}`);
      }
    }

    return positions;
  }

  private async createCollateralPosition(
    walletAddress: string,
    marketName: string,
    marketInfo: typeof COMPOUND_V3_MARKETS.base.cUSDbCv3,
    assetInfo: any,
    balance: bigint
  ): Promise<DeFiPosition | null> {
    // Get token contract to fetch metadata with safe contract calls
    const tokenContract = new ethers.Contract(assetInfo.asset, ERC20_ABI, this.provider);
    const tokenCalls = await Promise.all([
      safeContractCall(() => tokenContract.symbol(), 'compound-v3', 'symbol', assetInfo.asset),
      safeContractCall(() => tokenContract.name(), 'compound-v3', 'name', assetInfo.asset),
      safeContractCall(() => tokenContract.decimals(), 'compound-v3', 'decimals', assetInfo.asset)
    ]);

    const [symbol, name, decimals] = tokenCalls;
    
    // Skip if we couldn't get essential token info
    if (!symbol || !name || decimals === null) {
      console.debug(`Could not fetch token metadata for ${assetInfo.asset}`);
      return null;
    }

    // Convert balance
    const balanceFormatted = Number(ethers.formatUnits(balance, decimals));
    
    // Get current price
    const price = await priceService.getPrice(symbol) || 0;
    const value = balanceFormatted * price;

    const tokens: TokenBalance[] = [{
      address: assetInfo.asset,
      symbol,
      name,
      balance: balanceFormatted.toString(),
      decimals,
      price,
      value,
    }];

    return {
      id: `compound-v3-${marketName}-collateral-${assetInfo.asset}-${walletAddress}`,
      protocol: 'compound-v3',
      type: 'lending', // Collateral is still a lending position
      tokens,
      apy: 0, // Collateral typically doesn't earn yield in Compound V3
      value,
      claimable: 0,
      metadata: {
        market: marketName,
        baseAsset: marketInfo.baseAsset,
        contractAddress: marketInfo.address,
        collateralAsset: assetInfo.asset,
        positionType: 'collateral',
        isCompoundV3: true,
        borrowCollateralFactor: Number(assetInfo.borrowCollateralFactor) / 1e18,
        liquidateCollateralFactor: Number(assetInfo.liquidateCollateralFactor) / 1e18,
      }
    };
  }

  private convertRateToAPY(rate: bigint): number {
    // Compound V3 rates are per second, scaled by 1e18
    // Convert to APY: (1 + ratePerSecond)^(365*24*3600) - 1
    const ratePerSecond = Number(rate) / 1e18;
    const secondsPerYear = 365 * 24 * 60 * 60;
    const apy = Math.pow(1 + ratePerSecond, secondsPerYear) - 1;
    return apy * 100; // Convert to percentage
  }

  async getMarketInfo(marketAddress: string) {
    try {
      const contract = new ethers.Contract(marketAddress, COMPOUND_V3_ABI, this.provider);
      
      const [
        baseToken,
        totalSupply,
        totalBorrow,
        utilization,
        supplyRate,
        borrowRate,
        numAssets
      ] = await Promise.all([
        contract.baseToken(),
        contract.totalSupply(),
        contract.totalBorrow(),
        contract.getUtilization(),
        contract.getSupplyRate(await contract.getUtilization()),
        contract.getBorrowRate(await contract.getUtilization()),
        contract.numAssets()
      ]);

      return {
        baseToken,
        totalSupply: ethers.formatUnits(totalSupply, 6), // Most base tokens are 6 decimals
        totalBorrow: ethers.formatUnits(totalBorrow, 6),
        utilization: Number(utilization) / 1e18,
        supplyAPY: this.convertRateToAPY(supplyRate),
        borrowAPY: this.convertRateToAPY(borrowRate),
        numAssets: Number(numAssets),
      };
    } catch (error) {
      console.error(`Error fetching market info for ${marketAddress}:`, error);
      return null;
    }
  }
}

// Export singleton instance
export const compoundV3Integration = new CompoundV3Integration();