import { ethers } from 'ethers';
import { DeFiPosition, TokenBalance } from '@/types';
import { priceService } from '../prices';

// Aave V3 contract addresses on Base network
const AAVE_V3_BASE_CONTRACTS = {
  poolAddressProvider: '0xe20fCBdBfFC4Dd138cE8b2E6FBb6CB49777ad64D',
  dataProvider: '0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac',
  chainId: 8453,
  name: 'Base',
};

// Base network RPC
const getBaseProvider = () => {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  return new ethers.JsonRpcProvider(
    alchemyKey ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}` : 'https://mainnet.base.org'
  );
};

// Pool Address Provider ABI
const POOL_ADDRESS_PROVIDER_ABI = [
  'function getPool() external view returns (address)',
  'function getPriceOracle() external view returns (address)',
  'function getACLManager() external view returns (address)',
];

// Aave V3 Pool ABI (core lending functions)
const POOL_ABI = [
  'function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
  'function getReservesList() external view returns (address[])',
  'function getReserveData(address asset) external view returns (uint256 configuration, uint128 liquidityIndex, uint128 currentLiquidityRate, uint128 variableBorrowIndex, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt)',
];

// Pool Data Provider ABI
const DATA_PROVIDER_ABI = [
  'function getAllReservesTokens() external view returns (tuple(string symbol, address tokenAddress)[])',
  'function getReserveConfigurationData(address asset) external view returns (uint256 decimals, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus, uint256 reserveFactor, bool usageAsCollateralEnabled, bool borrowingEnabled, bool stableBorrowRateEnabled, bool isActive, bool isFrozen)',
  'function getReserveData(address asset) external view returns (uint256 availableLiquidity, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp)',
  'function getUserReserveData(address asset, address user) external view returns (uint256 currentATokenBalance, uint256 currentStableDebt, uint256 currentVariableDebt, uint256 principalStableDebt, uint256 scaledVariableDebt, uint256 stableBorrowRate, uint256 liquidityRate, uint40 stableRateLastUpdated, bool usageAsCollateralEnabled)',
];

// aToken ABI
const ATOKEN_ABI = [
  'function balanceOf(address user) external view returns (uint256)',
  'function scaledBalanceOf(address user) external view returns (uint256)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function UNDERLYING_ASSET_ADDRESS() external view returns (address)',
];

// ERC20 ABI for underlying assets
const ERC20_ABI = [
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
  'function decimals() external view returns (uint8)',
];

export interface AaveV3Service {
  getPositions(walletAddress: string): Promise<DeFiPosition[]>;
  getUserAccountData(walletAddress: string): Promise<any>;
  getAllReservesTokens(): Promise<Array<{symbol: string, tokenAddress: string}>>;
}

export class AaveV3Integration implements AaveV3Service {
  private provider: ethers.Provider;
  private poolAddressProvider: ethers.Contract;
  private dataProvider: ethers.Contract;
  private pool: ethers.Contract | null = null;

  constructor() {
    this.provider = getBaseProvider();
    this.poolAddressProvider = new ethers.Contract(
      AAVE_V3_BASE_CONTRACTS.poolAddressProvider,
      POOL_ADDRESS_PROVIDER_ABI,
      this.provider
    );
    this.dataProvider = new ethers.Contract(
      AAVE_V3_BASE_CONTRACTS.dataProvider,
      DATA_PROVIDER_ABI,
      this.provider
    );
  }

  async getPool(): Promise<ethers.Contract> {
    if (!this.pool) {
      const poolAddress = await this.poolAddressProvider.getPool();
      this.pool = new ethers.Contract(poolAddress, POOL_ABI, this.provider);
    }
    return this.pool;
  }

  async getPositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      console.log(`Fetching Aave V3 positions for ${walletAddress} on Base...`);
      
      const positions: DeFiPosition[] = [];

      // Get user account data first to check if user has any positions
      const accountData = await this.getUserAccountData(walletAddress);
      
      if (accountData.totalCollateralBase === 0n && accountData.totalDebtBase === 0n) {
        console.log('No Aave V3 positions found - user has no collateral or debt');
        return positions;
      }

      console.log(`User has Aave V3 positions: collateral=${ethers.formatEther(accountData.totalCollateralBase)} ETH, debt=${ethers.formatEther(accountData.totalDebtBase)} ETH`);

      // Get all reserves and check user positions
      const reserveTokens = await this.getAllReservesTokens();
      
      for (const reserveToken of reserveTokens) {
        const reserveAddress = reserveToken.tokenAddress;
        try {
          const userPosition = await this.getUserPositionForReserve(walletAddress, reserveAddress);
          if (userPosition) {
            positions.push(userPosition);
          }
        } catch (error) {
          console.warn(`Error fetching position for reserve ${reserveAddress}:`, error);
        }
      }

      console.log(`Found ${positions.length} Aave V3 positions for ${walletAddress}`);
      return positions;

    } catch (error) {
      console.error('Error fetching Aave V3 positions:', error);
      return [];
    }
  }

  async getUserPositionForReserve(walletAddress: string, reserveAddress: string): Promise<DeFiPosition | null> {
    try {
      const userReserveData = await this.dataProvider.getUserReserveData(reserveAddress, walletAddress);
      
      const {
        currentATokenBalance,
        currentStableDebt,
        currentVariableDebt,
        liquidityRate,
        usageAsCollateralEnabled
      } = userReserveData;

      // Skip if user has no position in this reserve
      if (currentATokenBalance === 0n && currentStableDebt === 0n && currentVariableDebt === 0n) {
        return null;
      }

      // Get reserve configuration data
      const reserveConfig = await this.dataProvider.getReserveConfigurationData(reserveAddress);
      const decimals = Number(reserveConfig.decimals);

      // Get underlying asset info
      const assetContract = new ethers.Contract(reserveAddress, ERC20_ABI, this.provider);
      const [assetSymbol, assetName] = await Promise.all([
        assetContract.symbol(),
        assetContract.name(),
      ]);

      // Calculate supplied amount
      const suppliedAmount = parseFloat(ethers.formatUnits(currentATokenBalance, decimals));
      
      // Calculate borrowed amounts
      const stableDebtAmount = parseFloat(ethers.formatUnits(currentStableDebt, decimals));
      const variableDebtAmount = parseFloat(ethers.formatUnits(currentVariableDebt, decimals));
      const totalBorrowedAmount = stableDebtAmount + variableDebtAmount;

      // Get asset price
      const assetPrice = await priceService.getPrice(assetSymbol) || priceService.getFallbackPrice(assetSymbol);
      
      // Calculate values
      const suppliedValue = suppliedAmount * assetPrice;
      const borrowedValue = totalBorrowedAmount * assetPrice;
      const netValue = suppliedValue - borrowedValue;

      // Create tokens array
      const tokens: TokenBalance[] = [];

      // Add supplied position
      if (suppliedAmount > 0) {
        tokens.push({
          address: reserveAddress,
          symbol: assetSymbol,
          name: assetName,
          balance: suppliedAmount.toString(),
          decimals,
          price: assetPrice,
          value: suppliedValue,
        });
      }

      // Add borrowed position (negative balance)
      if (totalBorrowedAmount > 0) {
        tokens.push({
          address: reserveAddress,
          symbol: assetSymbol,
          name: `Borrowed ${assetName}`,
          balance: (-totalBorrowedAmount).toString(),
          decimals,
          price: assetPrice,
          value: -borrowedValue,
        });
      }

      // Calculate APY (convert from ray format)
      const supplyAPY = parseFloat(ethers.formatUnits(liquidityRate, 25)); // Ray has 27 decimals, we want percentage

      return {
        id: `aave-v3-${reserveAddress}-${walletAddress}`,
        protocol: 'aave-v3',
        type: totalBorrowedAmount > 0 ? 'lending-borrowing' : 'lending',
        tokens,
        value: netValue,
        apy: supplyAPY,
        claimable: 0, // Aave V3 doesn't have claimable rewards by default
        metadata: {
          reserveAddress,
          assetSymbol,
          suppliedAmount: suppliedAmount.toString(),
          borrowedAmount: totalBorrowedAmount.toString(),
          stableDebtAmount: stableDebtAmount.toString(),
          variableDebtAmount: variableDebtAmount.toString(),
          usageAsCollateralEnabled,
          supplyAPY,
          platform: 'Aave V3',
          network: 'Base',
          description: `Aave V3 ${assetSymbol} ${totalBorrowedAmount > 0 ? 'Supply/Borrow' : 'Supply'} Position`,
        }
      };

    } catch (error) {
      console.warn(`Error processing reserve ${reserveAddress}:`, error);
      return null;
    }
  }

  async getUserAccountData(walletAddress: string): Promise<any> {
    const pool = await this.getPool();
    const accountData = await pool.getUserAccountData(walletAddress);
    
    return {
      totalCollateralBase: accountData[0],
      totalDebtBase: accountData[1], 
      availableBorrowsBase: accountData[2],
      currentLiquidationThreshold: accountData[3],
      ltv: accountData[4],
      healthFactor: accountData[5],
    };
  }

  async getAllReservesTokens(): Promise<Array<{symbol: string, tokenAddress: string}>> {
    return await this.dataProvider.getAllReservesTokens();
  }
}

export function createAaveV3Service(): AaveV3Service {
  return new AaveV3Integration();
}

// Export constants for use in other modules
export const AAVE_V3_CONSTANTS = {
  CONTRACTS: AAVE_V3_BASE_CONTRACTS,
  CHAIN_ID: 8453,
  NETWORK_NAME: 'Base',
};