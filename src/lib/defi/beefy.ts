import { ethers } from 'ethers';
import { DeFiPosition, TokenBalance } from '@/types';
import { RPC_URLS } from '@/lib/rpc';
import { priceService } from '@/lib/prices';
import { safeContractCall, withErrorHandling } from '@/lib/utils/error-handler';

// Beefy Finance API endpoints
const BEEFY_API_BASE = 'https://api.beefy.finance';

// Beefy Vault ABI - focusing on essential functions
const BEEFY_VAULT_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function getPricePerFullShare() external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
  'function want() external view returns (address)', // The underlying token
];

// ERC20 ABI for token info
const ERC20_ABI = [
  'function balanceOf(address user) external view returns (uint256)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
];

interface BeefyVault {
  id: string;
  name: string;
  token: string;
  tokenAddress: string;
  earnedToken: string;
  earnedTokenAddress: string;
  earnContractAddress: string;
  oracle: string;
  oracleId: string;
  status: string;
  platformId: string;
  assets: string[];
  risks: string[];
  chain: string;
  addLiquidityUrl?: string;
  removeLiquidityUrl?: string;
  strategy?: string;
  points?: any;
}

interface BeefyAPY {
  [vaultId: string]: number;
}

export interface BeefyService {
  getPositions(walletAddress: string): Promise<DeFiPosition[]>;
}

export class BeefyIntegration implements BeefyService {
  private provider: ethers.JsonRpcProvider;
  private baseVaults: BeefyVault[] = [];
  private apyData: BeefyAPY = {};

  constructor() {
    this.provider = new ethers.JsonRpcProvider(RPC_URLS.base);
  }

  async getPositions(walletAddress: string): Promise<DeFiPosition[]> {
    console.log(`Fetching Beefy Finance positions for ${walletAddress} on Base...`);
    
    try {
      // Load vault and APY data if not already cached
      if (this.baseVaults.length === 0) {
        await this.loadBeefyData();
      }

      const positions: DeFiPosition[] = [];
      
      // Check each Base vault for user positions
      for (const vault of this.baseVaults) {
        if (vault.status === 'eol') {
          continue; // Skip retired vaults
        }
        
        try {
          const position = await this.getVaultPosition(walletAddress, vault);
          if (position) {
            positions.push(position);
          }
        } catch (error) {
          console.warn(`Failed to check vault ${vault.id}:`, error);
        }
      }

      console.log(`Found ${positions.length} Beefy Finance positions for ${walletAddress}`);
      return positions;
    } catch (error) {
      console.error('Error fetching Beefy Finance positions:', error);
      return [];
    }
  }

  private async loadBeefyData(): Promise<void> {
    return withErrorHandling(
      async () => {
        console.log('Loading Beefy Finance vault data...');
        
        // Fetch vaults and APY data in parallel with timeout
        const fetchPromises = [
          fetch(`${BEEFY_API_BASE}/vaults`),
          fetch(`${BEEFY_API_BASE}/apy`)
        ];

        const [vaultsResponse, apyResponse] = await Promise.all(fetchPromises);

        if (!vaultsResponse.ok) {
          throw new Error(`Beefy vaults API returned ${vaultsResponse.status}: ${vaultsResponse.statusText}`);
        }
        if (!apyResponse.ok) {
          throw new Error(`Beefy APY API returned ${apyResponse.status}: ${apyResponse.statusText}`);
        }

        const allVaults: BeefyVault[] = await vaultsResponse.json();
        this.apyData = await apyResponse.json();

        // Filter for Base network vaults
        this.baseVaults = allVaults.filter(vault => vault.chain === 'base');
        
        console.log(`Loaded ${this.baseVaults.length} Beefy vaults on Base network`);
      },
      {
        maxRetries: 2,
        retryDelay: 1000,
        logContext: 'Beefy API data loading',
        fallbackValue: undefined
      }
    );
  }

  private async getVaultPosition(walletAddress: string, vault: BeefyVault): Promise<DeFiPosition | null> {
    const vaultContract = new ethers.Contract(vault.earnedTokenAddress, BEEFY_VAULT_ABI, this.provider);
    
    // Check if user has any vault tokens with safe contract call
    const balance = await safeContractCall(
      () => vaultContract.balanceOf(walletAddress),
      'beefy',
      'balanceOf',
      vault.earnedTokenAddress
    );
    
    if (balance === null || balance === 0n) {
      return null; // No position in this vault or call failed
    }

    // Get vault metadata with safe contract calls
    const vaultCalls = await Promise.all([
      safeContractCall(() => vaultContract.getPricePerFullShare(), 'beefy', 'getPricePerFullShare', vault.earnedTokenAddress),
      safeContractCall(() => vaultContract.decimals(), 'beefy', 'decimals', vault.earnedTokenAddress),
      safeContractCall(() => vaultContract.totalSupply(), 'beefy', 'totalSupply', vault.earnedTokenAddress),
      safeContractCall(() => vaultContract.symbol(), 'beefy', 'symbol', vault.earnedTokenAddress),
      safeContractCall(() => vaultContract.name(), 'beefy', 'name', vault.earnedTokenAddress)
    ]);

    const [pricePerFullShare, decimals, totalSupply, symbol, name] = vaultCalls;
    
    // Skip if we couldn't get essential vault info
    if (pricePerFullShare === null || decimals === null || !symbol || !name) {
      console.debug(`Could not fetch vault metadata for ${vault.id}`);
      return null;
    }

    // Convert balance to human readable
    const shareBalance = Number(ethers.formatUnits(balance, decimals));
    
    // Calculate underlying token value
    const sharePrice = Number(ethers.formatUnits(pricePerFullShare, decimals));
    const underlyingBalance = shareBalance * sharePrice;

    // Get current APY for this vault
    const apy = (this.apyData[vault.id] || 0) * 100; // Convert to percentage

    // Create tokens array - vault tokens represent underlying assets
    const tokens: TokenBalance[] = await this.createTokensForVault(vault, underlyingBalance, shareBalance);
    
    const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);

    return {
      id: `beefy-${vault.id}-${walletAddress}`,
      protocol: 'beefy',
      type: 'yield-farming',
      tokens,
      apy,
      value: totalValue,
      claimable: 0, // Beefy auto-compounds, so no separate claimable rewards
      metadata: {
        vaultId: vault.id,
        vaultName: vault.name,
        platformId: vault.platformId,
        strategy: vault.strategy || `${vault.platformId} Yield Optimization`,
        earnedTokenAddress: vault.earnedTokenAddress,
        underlyingAssets: vault.assets,
        risks: vault.risks,
        shareBalance,
        sharePrice,
        underlyingBalance,
        isBeefyVault: true,
        autoCompounding: true,
      }
    };
  }

  private async createTokensForVault(
    vault: BeefyVault, 
    underlyingBalance: number,
    shareBalance: number
  ): Promise<TokenBalance[]> {
    try {
      // For single-asset vaults, use the token directly
      if (vault.assets.length === 1) {
        const assetSymbol = vault.assets[0];
        const price = await priceService.getPrice(assetSymbol) || 0;
        
        return [{
          address: vault.tokenAddress || '0x0000000000000000000000000000000000000000',
          symbol: assetSymbol,
          name: `Beefy ${vault.name}`,
          balance: underlyingBalance.toString(),
          decimals: 18,
          price,
          value: underlyingBalance * price,
        }];
      }

      // For multi-asset vaults (LP tokens), create a combined representation
      const tokens: TokenBalance[] = [];
      let totalValue = 0;

      for (const asset of vault.assets) {
        const price = await priceService.getPrice(asset) || 0;
        // Distribute the underlying balance across assets (simplified approach)
        const assetBalance = underlyingBalance / vault.assets.length;
        const assetValue = assetBalance * price;
        
        tokens.push({
          address: vault.tokenAddress || '0x0000000000000000000000000000000000000000',
          symbol: asset,
          name: `${asset} (via Beefy ${vault.platformId})`,
          balance: assetBalance.toString(),
          decimals: 18,
          price,
          value: assetValue,
        });
        
        totalValue += assetValue;
      }

      // If we couldn't get prices, use a fallback approach
      if (totalValue === 0 && vault.oracleId) {
        // Try to get LP token price from Beefy's oracle
        const fallbackPrice = await this.getBeefyTokenPrice(vault.oracleId);
        if (fallbackPrice > 0) {
          return [{
            address: vault.tokenAddress || vault.earnedTokenAddress,
            symbol: vault.token,
            name: vault.name,
            balance: underlyingBalance.toString(),
            decimals: 18,
            price: fallbackPrice,
            value: underlyingBalance * fallbackPrice,
          }];
        }
      }

      return tokens;
    } catch (error) {
      console.warn(`Error creating tokens for vault ${vault.id}:`, error);
      
      // Fallback: create a single token entry
      return [{
        address: vault.earnedTokenAddress,
        symbol: vault.earnedToken,
        name: vault.name,
        balance: shareBalance.toString(),
        decimals: 18,
        price: 0,
        value: 0,
      }];
    }
  }

  private async getBeefyTokenPrice(oracleId: string): Promise<number> {
    return withErrorHandling(
      async () => {
        const response = await fetch(`${BEEFY_API_BASE}/prices?ids=${oracleId}`);
        if (!response.ok) {
          throw new Error(`Beefy price API returned ${response.status}`);
        }
        
        const prices = await response.json();
        return prices[oracleId] || 0;
      },
      {
        maxRetries: 2,
        retryDelay: 500,
        silent: true,
        fallbackValue: 0,
        logContext: `Beefy price fetch for ${oracleId}`
      }
    );
  }

  // Get all Base vaults with APY info for analysis
  async getBaseVaultsInfo(): Promise<Array<{ vault: BeefyVault; apy: number }>> {
    if (this.baseVaults.length === 0) {
      await this.loadBeefyData();
    }

    return this.baseVaults
      .filter(vault => vault.status !== 'eol')
      .map(vault => ({
        vault,
        apy: (this.apyData[vault.id] || 0) * 100
      }))
      .sort((a, b) => b.apy - a.apy); // Sort by APY descending
  }

  // Get top yield opportunities
  async getTopYieldOpportunities(limit: number = 10): Promise<Array<{ 
    vaultId: string; 
    name: string; 
    apy: number; 
    platform: string; 
    assets: string[];
    risks: string[];
  }>> {
    const vaultInfo = await this.getBaseVaultsInfo();
    
    return vaultInfo
      .slice(0, limit)
      .map(({ vault, apy }) => ({
        vaultId: vault.id,
        name: vault.name,
        apy,
        platform: vault.platformId,
        assets: vault.assets,
        risks: vault.risks,
      }));
  }
}

// Export singleton instance
export const beefyIntegration = new BeefyIntegration();

// Factory function for consistency with other integrations
export function createBeefyService() {
  return beefyIntegration;
}