import { ethers } from 'ethers';
import { DeFiPosition, TokenBalance } from '@/types';
import { priceService } from '../prices';

// Extra Finance contract addresses on Base network
const EXTRA_FINANCE_BASE_CONTRACTS = {
  extraToken: '0x2dad3a13ef0c6366220f989157009e501e7938f8',
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

// ERC20 ABI for EXTRA token
const ERC20_ABI = [
  'function balanceOf(address user) external view returns (uint256)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
];

// Extra Finance Pool ABI (common functions)
const EXTRA_POOL_ABI = [
  'function userInfo(address user) external view returns (uint256 amount, uint256 rewardDebt)',
  'function pendingRewards(address user) external view returns (uint256)',
  'function poolInfo() external view returns (address lpToken, uint256 allocPoint, uint256 lastRewardTime, uint256 accRewardPerShare)',
];

// veEXTRA staking contract ABI
const VE_EXTRA_ABI = [
  'function balanceOf(address user) external view returns (uint256)',
  'function locked(address user) external view returns (uint256 amount, uint256 end)',
  'function totalSupply() external view returns (uint256)',
];

export interface ExtraFinanceService {
  getPositions(walletAddress: string): Promise<DeFiPosition[]>;
  getExtraTokenBalance(walletAddress: string): Promise<number>;
  getStakedBalance(walletAddress: string): Promise<number>;
}

export class ExtraFinanceIntegration implements ExtraFinanceService {
  private provider: ethers.Provider;
  private extraTokenContract: ethers.Contract;

  constructor() {
    this.provider = getBaseProvider();
    this.extraTokenContract = new ethers.Contract(
      EXTRA_FINANCE_BASE_CONTRACTS.extraToken,
      ERC20_ABI,
      this.provider
    );
  }

  async getPositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      console.log(`Fetching Extra Finance positions for ${walletAddress} on Base...`);
      
      const positions: DeFiPosition[] = [];

      // Get EXTRA token balance
      const extraBalance = await this.getExtraTokenBalance(walletAddress);
      
      if (extraBalance > 0) {
        const extraPrice = await priceService.getPrice('EXTRA') || priceService.getFallbackPrice('EXTRA');
        const extraValue = extraBalance * extraPrice;

        const tokens: TokenBalance[] = [{
          address: EXTRA_FINANCE_BASE_CONTRACTS.extraToken,
          symbol: 'EXTRA',
          name: 'Extra Finance',
          balance: extraBalance.toString(),
          decimals: 18,
          price: extraPrice,
          value: extraValue,
        }];

        positions.push({
          id: `extra-finance-token-${walletAddress}`,
          protocol: 'extra-finance',
          type: 'token',
          tokens,
          value: extraValue,
          apy: 0,
          claimable: 0,
          metadata: {
            platform: 'Extra Finance',
            network: 'Base',
            description: 'Extra Finance Token Holdings',
            tokenBalance: extraBalance.toString(),
          }
        });
      }

      // Check for staked EXTRA (veEXTRA)
      const stakedBalance = await this.getStakedBalance(walletAddress);
      
      if (stakedBalance > 0) {
        const extraPrice = await priceService.getPrice('EXTRA') || priceService.getFallbackPrice('EXTRA');
        const stakedValue = stakedBalance * extraPrice;

        const stakedTokens: TokenBalance[] = [{
          address: EXTRA_FINANCE_BASE_CONTRACTS.extraToken,
          symbol: 'veEXTRA',
          name: 'Vote Escrowed EXTRA',
          balance: stakedBalance.toString(),
          decimals: 18,
          price: extraPrice,
          value: stakedValue,
        }];

        positions.push({
          id: `extra-finance-staking-${walletAddress}`,
          protocol: 'extra-finance',
          type: 'staking',
          tokens: stakedTokens,
          value: stakedValue,
          apy: 162, // Up to 162% APR mentioned in documentation
          claimable: 0,
          metadata: {
            platform: 'Extra Finance',
            network: 'Base',
            description: 'Staked EXTRA (veEXTRA) Position',
            stakingType: 'vote-escrowed',
            stakedAmount: stakedBalance.toString(),
            maxAPR: 162,
          }
        });
      }

      console.log(`Found ${positions.length} Extra Finance positions for ${walletAddress}`);
      return positions;

    } catch (error) {
      console.error('Error fetching Extra Finance positions:', error);
      return [];
    }
  }

  async getExtraTokenBalance(walletAddress: string): Promise<number> {
    try {
      const balance = await this.extraTokenContract.balanceOf(walletAddress);
      const decimals = await this.extraTokenContract.decimals();
      return parseFloat(ethers.formatUnits(balance, decimals));
    } catch (error) {
      console.warn('Error fetching EXTRA token balance:', error);
      return 0;
    }
  }

  async getStakedBalance(walletAddress: string): Promise<number> {
    try {
      // Note: This would require the actual veEXTRA contract address
      // For now, we'll return 0 since we don't have the staking contract address
      // In a real implementation, you'd need to find the veEXTRA contract on BaseScan
      
      console.log('Checking for staked EXTRA positions...');
      // TODO: Implement actual veEXTRA balance checking when contract address is available
      return 0;
    } catch (error) {
      console.warn('Error fetching staked EXTRA balance:', error);
      return 0;
    }
  }

  async getYieldFarmingPositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      // Note: This would require the actual farming pool contract addresses
      // Extra Finance has multiple yield farming pools with leveraged positions
      // Without specific pool contract addresses, we can't implement this yet
      
      console.log('Checking for Extra Finance yield farming positions...');
      // TODO: Implement yield farming position detection when pool contracts are available
      return [];
    } catch (error) {
      console.warn('Error fetching yield farming positions:', error);
      return [];
    }
  }
}

export function createExtraFinanceService(): ExtraFinanceService {
  return new ExtraFinanceIntegration();
}

// Export constants for use in other modules
export const EXTRA_FINANCE_CONSTANTS = {
  CONTRACTS: EXTRA_FINANCE_BASE_CONTRACTS,
  CHAIN_ID: 8453,
  NETWORK_NAME: 'Base',
  PROTOCOL_NAME: 'Extra Finance',
  TVL_USD: 97_780_000, // $97.78M on Base as of August 2024
};