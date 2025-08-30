import { ethers } from 'ethers';
import { DeFiPosition, TokenBalance } from '@/types';
import { priceService } from '../prices';
import { safeContractCall, isExpectedError } from '../utils/error-handler';

// Mamo protocol constants for Base network
const MAMO_TOKEN_ADDRESS = '0x7300B37DfdfAb110d83290A29DfB31B1740219fE'; // MAMO token on Base

// Mamo contract addresses from GitHub repo
const MAMO_STRATEGY_REGISTRY = '0x46a5624C2ba92c08aBA4B206297052EDf14baa92';
const MAMO_STAKING_REGISTRY = '0xFf3bB81651592bc9c64220093A98ffb10d2b2706';
const MAMO_STAKING_STRATEGY_FACTORY = '0xd034Bf87003A216F9A451A55A2f4f7176AAE23C8';
const MAMO_MULTI_REWARDS = '0x7855B0821401Ab078f6Cf457dEAFae775fF6c7A3';
const MAMO_STAKING_STRATEGY = '0x26ba1566bba5660eecCc6C052e953E945BF28550';
const MAMO_BACKEND = '0x2Ab03887829EA8632D972cf3816b825Fe7FC5e73';
const MAMO_COMPOUNDER = '0x00bC3dCef80329F6670B34eF40Ec5919EFAdbA39';

// Base network RPC with Alchemy support
const getBaseRpc = () => {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  return alchemyKey 
    ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`
    : 'https://mainnet.base.org';
};

// MAMO Token ABI
const MAMO_TOKEN_ABI = [
  'function balanceOf(address) external view returns (uint256)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function name() external view returns (string)',
];

// Mamo Strategy Registry ABI (based on GitHub documentation)
const MAMO_STRATEGY_REGISTRY_ABI = [
  'function getUserStrategies(address user) external view returns (address[])',
  'function isUserStrategy(address user, address strategy) external view returns (bool)',
  'function getStrategyCount(address user) external view returns (uint256)',
];

// Mamo Staking Registry ABI
const MAMO_STAKING_REGISTRY_ABI = [
  'function getRewardTokens() external view returns (address[])',
  'function getRewardTokenCount() external view returns (uint256)',
  'function getRewardToken(uint256 index) external view returns (address)',
  'function getRewardTokenPool(address token) external view returns (address)',
];

// Mamo Strategy Contract ABI (based on contract documentation)
const MAMO_STRATEGY_ABI = [
  'function totalAssets() external view returns (uint256)',
  'function asset() external view returns (address)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function convertToAssets(uint256 shares) external view returns (uint256)',
  'function previewRedeem(uint256 shares) external view returns (uint256)',
];

// MultiRewards contract ABI (for staking positions)
const MULTI_REWARDS_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function earned(address account, address rewardsToken) external view returns (uint256)',
  'function rewardTokens() external view returns (address[])',
  'function totalSupply() external view returns (uint256)',
  'function stakingToken() external view returns (address)',
];

export interface MamoService {
  getPositions(walletAddress: string): Promise<DeFiPosition[]>;
  getMamoTokenBalance(walletAddress: string): Promise<TokenBalance | null>;
  getUserStrategies(walletAddress: string): Promise<string[]>;
}

export class MamoPositionService implements MamoService {
  private provider: ethers.Provider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(getBaseRpc());
  }

  async getPositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      const positions: DeFiPosition[] = [];

      // Get MAMO token balance first
      const mamoTokenBalance = await this.getMamoTokenBalance(walletAddress);
      if (mamoTokenBalance) {
        console.log(`MAMO token balance: ${mamoTokenBalance.balance} MAMO ($${mamoTokenBalance.value.toFixed(2)})`);
        positions.push({
          id: `mamo-token-${walletAddress}`,
          protocol: 'mamo',
          type: 'token',
          tokens: [mamoTokenBalance],
          value: mamoTokenBalance.value,
          apy: 0, // MAMO token itself doesn't earn yield
          claimable: 0,
          metadata: {
            description: 'MAMO Token Holdings',
            isNativeToken: true,
          }
        });
      } else {
        console.log('No MAMO token balance found');
      }

      // Get Mamo strategy positions (ERC20 yield strategies)
      const strategyPositions = await this.getStrategyPositions(walletAddress);
      positions.push(...strategyPositions);

      // Get direct MAMO staking positions
      const stakingPositions = await this.getStakingPositions(walletAddress);
      positions.push(...stakingPositions);

      // Check for known Mamo-managed strategies or contracts
      // TODO: Once we have the actual strategy contract addresses, we'll check those here
      
      // Experimental: Try to detect potential Mamo strategy contracts
      await this.detectPotentialMamoStrategies(walletAddress, positions);
      
      console.log(`Found ${positions.length} Mamo positions for ${walletAddress}:`, 
        positions.map(p => `${p.type}: ${p.tokens.map(t => `${t.balance} ${t.symbol}`).join(', ')} ($${p.value.toFixed(2)})`));
      return positions;

    } catch (error) {
      console.error('Error fetching Mamo positions:', error);
      return [];
    }
  }

  async getMamoTokenBalance(walletAddress: string): Promise<TokenBalance | null> {
    try {
      const contract = new ethers.Contract(MAMO_TOKEN_ADDRESS, MAMO_TOKEN_ABI, this.provider);
      
      const [balance, symbol, decimals, name] = await Promise.all([
        contract.balanceOf(walletAddress),
        contract.symbol(),
        contract.decimals(),
        contract.name(),
      ]);

      if (balance === 0n) {
        return null;
      }

      const balanceFormatted = parseFloat(ethers.formatUnits(balance, decimals));
      const price = await priceService.getPrice('MAMO') || priceService.getFallbackPrice('MAMO');
      const value = balanceFormatted * price;

      return {
        address: MAMO_TOKEN_ADDRESS,
        symbol,
        name,
        balance: balanceFormatted.toString(),
        decimals: Number(decimals),
        price,
        value,
      };

    } catch (error) {
      console.warn('Error fetching MAMO token balance:', error);
      return null;
    }
  }

  async getUserStrategies(walletAddress: string): Promise<string[]> {
    try {
      console.log(`Fetching Mamo strategies for ${walletAddress}...`);
      
      const registryContract = new ethers.Contract(MAMO_STRATEGY_REGISTRY, MAMO_STRATEGY_REGISTRY_ABI, this.provider);
      const strategies = await registryContract.getUserStrategies(walletAddress);
      
      console.log(`Found ${strategies.length} Mamo user strategies:`, strategies);
      return strategies;

    } catch (error) {
      console.warn('Error fetching user strategies:', error);
      return [];
    }
  }

  async getStakingPositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      console.log(`Checking MAMO staking positions for ${walletAddress}...`);
      
      const multiRewards = new ethers.Contract(MAMO_MULTI_REWARDS, MULTI_REWARDS_ABI, this.provider);
      
      // Get user's staked balance
      const stakedBalance = await multiRewards.balanceOf(walletAddress);
      
      if (stakedBalance === 0n) {
        console.log('No MAMO staking balance found');
        return [];
      }

      // Get reward tokens
      const rewardTokens = await multiRewards.rewardTokens();
      console.log(`Found staking rewards tokens:`, rewardTokens);
      
      const stakedAmount = parseFloat(ethers.formatUnits(stakedBalance, 18));
      const mamoPrice = await priceService.getPrice('MAMO') || priceService.getFallbackPrice('MAMO');
      const stakedValue = stakedAmount * mamoPrice;

      // Calculate claimable rewards
      let totalClaimable = 0;
      const claimableRewards: TokenBalance[] = [];
      
      for (const rewardToken of rewardTokens) {
        try {
          const earned = await multiRewards.earned(walletAddress, rewardToken);
          if (earned > 0n) {
            // For simplicity, assume reward tokens have 18 decimals
            const earnedAmount = parseFloat(ethers.formatUnits(earned, 18));
            const rewardPrice = rewardToken === MAMO_TOKEN_ADDRESS ? mamoPrice : 0.05; // Fallback for other rewards
            const rewardValue = earnedAmount * rewardPrice;
            totalClaimable += rewardValue;
            
            claimableRewards.push({
              address: rewardToken,
              symbol: rewardToken === MAMO_TOKEN_ADDRESS ? 'MAMO' : 'REWARD',
              name: rewardToken === MAMO_TOKEN_ADDRESS ? 'Mamo' : 'Reward Token',
              balance: earnedAmount.toString(),
              decimals: 18,
              price: rewardPrice,
              value: rewardValue,
            });
          }
        } catch (error) {
          console.warn(`Error fetching rewards for token ${rewardToken}:`, error);
        }
      }

      const stakingPosition: DeFiPosition = {
        id: `mamo-staking-${walletAddress}`,
        protocol: 'mamo',
        type: 'staking',
        tokens: [{
          address: MAMO_TOKEN_ADDRESS,
          symbol: 'MAMO',
          name: 'Mamo',
          balance: stakedAmount.toString(),
          decimals: 18,
          price: mamoPrice,
          value: stakedValue,
        }],
        value: stakedValue,
        apy: 0, // TODO: Calculate APY based on reward rates
        claimable: totalClaimable,
        metadata: {
          description: 'MAMO Staking Position',
          multiRewardsContract: MAMO_MULTI_REWARDS,
          claimableRewards,
        }
      };

      console.log(`MAMO staking: ${stakedAmount} MAMO staked ($${stakedValue.toFixed(2)}), claimable: $${totalClaimable.toFixed(2)}`);
      return [stakingPosition];

    } catch (error) {
      console.error('Error fetching MAMO staking positions:', error);
      return [];
    }
  }

  async getStrategyPositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      const strategies = await this.getUserStrategies(walletAddress);
      const positions: DeFiPosition[] = [];

      for (const strategyAddress of strategies) {
        try {
          const position = await this.getStrategyPosition(walletAddress, strategyAddress);
          if (position) {
            positions.push(position);
          }
        } catch (error) {
          // Only log if it's not an expected error (contract doesn't exist, etc.)
          if (!isExpectedError(error)) {
            console.warn(`Error fetching strategy position ${strategyAddress}:`, error);
          }
        }
      }

      return positions;

    } catch (error) {
      console.error('Error fetching strategy positions:', error);
      return [];
    }
  }

  async getStrategyPosition(walletAddress: string, strategyAddress: string): Promise<DeFiPosition | null> {
    try {
      const strategyContract = new ethers.Contract(strategyAddress, MAMO_STRATEGY_ABI, this.provider);

      const contractCalls = await Promise.all([
        safeContractCall(() => strategyContract.balanceOf(walletAddress), 'mamo', 'balanceOf', strategyAddress),
        safeContractCall(() => strategyContract.asset(), 'mamo', 'asset', strategyAddress),
      ]);

      const [userShares, assetAddress] = contractCalls;

      if (userShares === null || userShares === 0n || !assetAddress) {
        return null;
      }

      // Convert shares to underlying assets using safe contract call
      const underlyingAssets = await safeContractCall(
        () => strategyContract.convertToAssets(userShares),
        'mamo',
        'convertToAssets',
        strategyAddress
      );

      if (underlyingAssets === null) {
        return null;
      }
      
      // Get asset token info using safe contract calls
      const assetContract = new ethers.Contract(assetAddress, MAMO_TOKEN_ABI, this.provider);
      const assetCalls = await Promise.all([
        safeContractCall(() => assetContract.symbol(), 'mamo', 'symbol', assetAddress),
        safeContractCall(() => assetContract.decimals(), 'mamo', 'decimals', assetAddress),
        safeContractCall(() => assetContract.name(), 'mamo', 'name', assetAddress),
      ]);

      const [assetSymbol, assetDecimals, assetName] = assetCalls;

      // Skip if we couldn't get essential asset info
      if (!assetSymbol || !assetName || assetDecimals === null) {
        console.debug(`Could not fetch asset metadata for ${assetAddress} in strategy ${strategyAddress}`);
        return null;
      }

      const assetAmount = parseFloat(ethers.formatUnits(underlyingAssets, assetDecimals));
      const assetPrice = await priceService.getPrice(assetSymbol) || 0;
      const value = assetAmount * assetPrice;

      // Create asset token
      const asset: TokenBalance = {
        address: assetAddress,
        symbol: assetSymbol,
        name: assetName,
        balance: assetAmount.toString(),
        decimals: Number(assetDecimals),
        price: assetPrice,
        value,
      };

      return {
        id: `mamo-strategy-${strategyAddress}`,
        protocol: 'mamo',
        type: 'yield-farming',
        tokens: [asset],
        value,
        apy: 0, // APY calculation would require additional strategy data
        claimable: 0, // Claimable rewards would require additional contract calls
        metadata: {
          strategyAddress,
          description: `Mamo Auto-Compound Strategy (${assetSymbol})`,
          isStrategy: true,
        }
      };

    } catch (error) {
      // Only log if it's not an expected error (contract doesn't exist, etc.)
      if (!isExpectedError(error)) {
        console.warn(`Error fetching strategy position ${strategyAddress}:`, error);
      }
      return null;
    }
  }

  // Experimental: Try to detect Mamo strategies by looking for contracts that might be Mamo-managed
  async detectPotentialMamoStrategies(walletAddress: string, positions: DeFiPosition[]): Promise<void> {
    try {
      console.log('Attempting to detect potential Mamo strategies...');
      
      // Known patterns that might indicate Mamo integration:
      // 1. Check for contracts that have interacted with known Mamo contracts
      // 2. Look for proxy contracts that might be user-specific strategies
      // 3. Check for contracts that hold cbBTC and might be Mamo-managed
      
      // For now, just log this capability - we'd need the actual contract addresses
      // to implement proper detection
      console.log('Mamo strategy detection not yet implemented - need actual contract addresses');
      
    } catch (error) {
      console.warn('Error in Mamo strategy detection:', error);
    }
  }

  // Mock Mamo positions for development/demonstration
  async getMockPositions(walletAddress: string): Promise<DeFiPosition[]> {
    console.log('Using mock Mamo positions for development');
    
    return [
      {
        id: 'mamo-token-mock',
        protocol: 'mamo',
        type: 'token',
        tokens: [{
          address: MAMO_TOKEN_ADDRESS,
          symbol: 'MAMO',
          name: 'Mamo Token',
          balance: '1250.50',
          decimals: 18,
          price: 0.85, // Estimated price
          value: 1062.93,
        }],
        value: 1062.93,
        apy: 0,
        claimable: 0,
        metadata: {
          description: 'MAMO Token Holdings',
          isNativeToken: true,
        }
      },
      {
        id: 'mamo-usdc-strategy',
        protocol: 'mamo',
        type: 'yield-farming',
        tokens: [{
          address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
          symbol: 'USDC',
          name: 'USD Coin',
          balance: '2500.00',
          decimals: 6,
          price: 1.00,
          value: 2500.00,
        }],
        value: 2500.00,
        apy: 8.5, // Auto-compounding yield
        claimable: 15.75,
        metadata: {
          strategyAddress: '0x0000000000000000000000000000000000000000',
          description: 'Mamo Auto-Compound Strategy (USDC)',
          isStrategy: true,
          platform: 'Moonwell',
        }
      },
      {
        id: 'mamo-cbbtc-strategy',
        protocol: 'mamo',
        type: 'yield-farming',
        tokens: [{
          address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', // cbBTC on Base
          symbol: 'cbBTC',
          name: 'Coinbase Wrapped BTC',
          balance: '0.05',
          decimals: 8,
          price: 95000, // BTC price
          value: 4750.00,
        }],
        value: 4750.00,
        apy: 4.2, // BTC yield strategies typically lower
        claimable: 8.25,
        metadata: {
          strategyAddress: '0x0000000000000000000000000000000000000001',
          description: 'Mamo Auto-Compound Strategy (cbBTC)',
          isStrategy: true,
          platform: 'Moonwell',
        }
      }
    ];
  }
}

export function createMamoService(): MamoService {
  return new MamoPositionService();
}

// Export constants for use in other modules
export const MAMO_CONSTANTS = {
  TOKEN_ADDRESS: MAMO_TOKEN_ADDRESS,
  STRATEGY_REGISTRY: MAMO_STRATEGY_REGISTRY,
  STAKING_REGISTRY: MAMO_STAKING_REGISTRY,
  MULTI_REWARDS: MAMO_MULTI_REWARDS,
  CHAIN_ID: 8453, // Base chain ID
  NETWORK_NAME: 'Base',
};