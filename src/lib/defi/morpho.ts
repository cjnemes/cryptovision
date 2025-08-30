import { ethers } from 'ethers';
import { DeFiPosition, TokenBalance } from '@/types';
import { priceService } from '../prices';
import { safeContractCall } from '../utils/error-handler';

// Morpho constants for Base network (where cbBTC vault exists)
const MORPHO_TOKEN_BASE = '0x58D97B57BB95320F9a05dC918Aef65434969c2B2'; // MORPHO token on Base
const CBBTC_TOKEN_BASE = '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf'; // cbBTC token on Base

// Seamless Protocol tokens on Base
const SEAMLESS_TOKENS = {
  SEAM: '0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85', // SEAM Token (Base)
  ES_SEAM: '0x998e44232BEF4F8B033e5A5175BDC97F2B10d5e5', // EscrowSEAM (esSEAM)
};

// Known Morpho vault addresses on Base network
const MORPHO_VAULTS = {
  base: {
    // Seamless Vaults on Morpho (newly migrated, $70M+ TVL)
    SEAMLESS_USDC_VAULT: '0x616a4E1db48e22028f6bbf20444Cd3b8e3273738', // Seamless USDC Vault
    SEAMLESS_CBBTC_VAULT: '0x5a47C803488FE2BB0A0EAaf346b420e4dF22F3C7', // Seamless cbBTC Vault
    SEAMLESS_WETH_VAULT: '0x27d8c7273fd3fcc6956a0b370ce5fd4a7fc65c18', // Seamless WETH Vault
    
    // Moonwell Morpho vaults (estimated addresses - may need verification)
    MOONWELL_CBBTC_VAULT: '0x543257ef2161176d7c8cd90ba65c2d4caef5a796', // Moonwell Frontier cbBTC vault
    MOONWELL_ETH_VAULT: '0xa0E430870c4604CcfC7B38Ca7845B1FF653D0ff1',   // Moonwell Flagship ETH vault  
    MOONWELL_EURC_VAULT: '0xf24608E0CCb972b0b0f4A6446a0BBf58c701a026',  // Moonwell Flagship EURC vault
  }
};

// Base network RPC
const getBaseProvider = () => {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  return new ethers.JsonRpcProvider(
    alchemyKey ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}` : 'https://mainnet.base.org'
  );
};

// ERC4626 Vault ABI (Morpho vaults follow this standard)
const ERC4626_VAULT_ABI = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function asset() external view returns (address)',
  'function convertToAssets(uint256 shares) external view returns (uint256)',
  'function convertToShares(uint256 assets) external view returns (uint256)',
  'function previewWithdraw(uint256 assets) external view returns (uint256)',
  'function previewRedeem(uint256 shares) external view returns (uint256)',
  'function totalAssets() external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
  'function decimals() external view returns (uint8)',
];

// Basic ERC20 ABI for token interactions
const ERC20_ABI = [
  'function balanceOf(address) external view returns (uint256)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function name() external view returns (string)',
];

// Alternative approach: Look for vault tokens by checking known patterns
const VAULT_SEARCH_PATTERNS = [
  'mw', // Moonwell prefix
  'morpho',
  'cbbtc',
  'frontier'
];

export interface MorphoService {
  getPositions(walletAddress: string): Promise<DeFiPosition[]>;
  getVaultPositions(walletAddress: string): Promise<DeFiPosition[]>;
  getMorphoTokenBalance(walletAddress: string): Promise<TokenBalance | null>;
  getSeamlessTokenBalances(walletAddress: string): Promise<TokenBalance[]>;
}

export class MorphoIntegration implements MorphoService {
  private provider: ethers.Provider;

  constructor() {
    this.provider = getBaseProvider();
  }

  async getPositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      console.log(`Fetching Morpho positions for ${walletAddress} on Base...`);
      
      const positions: DeFiPosition[] = [];

      // Get MORPHO token balance
      const morphoTokenBalance = await this.getMorphoTokenBalance(walletAddress);
      if (morphoTokenBalance) {
        positions.push({
          id: `morpho-token-${walletAddress}`,
          protocol: 'morpho',
          type: 'token',
          tokens: [morphoTokenBalance],
          value: morphoTokenBalance.value,
          apy: 0,
          claimable: 0,
          metadata: {
            description: 'MORPHO Token Holdings',
            isNativeToken: true,
          }
        });
      }

      // Get Seamless (SEAM) token balances
      const seamlessTokens = await this.getSeamlessTokenBalances(walletAddress);
      for (const token of seamlessTokens) {
        positions.push({
          id: `seamless-${token.symbol.toLowerCase()}-${walletAddress}`,
          protocol: 'seamless',
          type: 'token',
          tokens: [token],
          value: token.value,
          apy: 0,
          claimable: 0,
          metadata: {
            description: `${token.symbol} Token Holdings`,
            isNativeToken: true,
            platform: 'Seamless Protocol',
          }
        });
      }

      // Get vault positions
      const vaultPositions = await this.getVaultPositions(walletAddress);
      positions.push(...vaultPositions);

      // Experimental: Try to detect Morpho vault positions by scanning for ERC4626-like tokens
      await this.detectMorphoVaultTokens(walletAddress, positions);

      console.log(`Found ${positions.length} Morpho positions for ${walletAddress}`);
      return positions;

    } catch (error) {
      console.error('Error fetching Morpho positions:', error);
      return [];
    }
  }

  async getMorphoTokenBalance(walletAddress: string): Promise<TokenBalance | null> {
    try {
      const contract = new ethers.Contract(MORPHO_TOKEN_BASE, ERC20_ABI, this.provider);
      
      // First check if the balance is non-zero before fetching metadata using safe contract call
      const balance = await safeContractCall(
        () => contract.balanceOf(walletAddress),
        'morpho',
        'balanceOf',
        MORPHO_TOKEN_BASE
      );
      
      if (balance === null || balance === 0n) {
        return null;
      }

      // If balance exists, then fetch metadata using safe contract calls
      const tokenCalls = await Promise.all([
        safeContractCall(() => contract.symbol(), 'morpho', 'symbol', MORPHO_TOKEN_BASE),
        safeContractCall(() => contract.decimals(), 'morpho', 'decimals', MORPHO_TOKEN_BASE),
        safeContractCall(() => contract.name(), 'morpho', 'name', MORPHO_TOKEN_BASE)
      ]);
      
      const [symbol, decimals, name] = tokenCalls;
      
      // Skip if we couldn't get essential token info
      if (!symbol || !name || decimals === null) {
        console.debug(`Could not fetch MORPHO token metadata at ${MORPHO_TOKEN_BASE}`);
        return null;
      }

      const balanceFormatted = parseFloat(ethers.formatUnits(balance, decimals));
      const price = await priceService.getPrice('MORPHO') || priceService.getFallbackPrice('MORPHO');
      const value = balanceFormatted * price;

      return {
        address: MORPHO_TOKEN_BASE,
        symbol,
        name,
        balance: balanceFormatted.toString(),
        decimals: Number(decimals),
        price,
        value,
      };

    } catch (error) {
      console.warn('Error fetching MORPHO token balance:', error);
      return null;
    }
  }

  async getVaultPositions(walletAddress: string): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    // Try to check known vault addresses
    for (const [vaultName, vaultAddress] of Object.entries(MORPHO_VAULTS.base)) {
      if (vaultAddress.startsWith('0x0000000000000000000000000000000000000')) {
        console.log(`Skipping placeholder vault address: ${vaultName}`);
        continue; // Skip placeholder addresses
      }

      console.log(`Checking Morpho vault: ${vaultName} at ${vaultAddress}`);

      try {
        const position = await this.getVaultPosition(walletAddress, vaultAddress, vaultName);
        if (position) {
          positions.push(position);
        }
      } catch (error) {
        console.warn(`Error fetching vault position for ${vaultName}:`, error);
      }
    }

    return positions;
  }

  async getVaultPosition(walletAddress: string, vaultAddress: string, vaultName: string): Promise<DeFiPosition | null> {
    try {
      const vaultContract = new ethers.Contract(vaultAddress, ERC4626_VAULT_ABI, this.provider);

      const [userShares, assetAddress, vaultSymbol, vaultName] = await Promise.all([
        vaultContract.balanceOf(walletAddress),
        vaultContract.asset(),
        vaultContract.symbol(),
        vaultContract.name(),
      ]);

      if (userShares === 0n) {
        return null;
      }

      // Convert shares to underlying assets
      const underlyingAssets = await vaultContract.convertToAssets(userShares);
      
      // Get asset token info
      const assetContract = new ethers.Contract(assetAddress, ERC20_ABI, this.provider);
      const [assetSymbol, assetDecimals, assetName] = await Promise.all([
        assetContract.symbol(),
        assetContract.decimals(),
        assetContract.name(),
      ]);

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
        id: `morpho-vault-${vaultAddress}`,
        protocol: 'morpho',
        type: 'lending', // Morpho vaults are lending/yield-earning positions
        tokens: [asset],
        value,
        apy: 0, // Would need additional contract calls to calculate current APY
        claimable: 0,
        metadata: {
          vaultAddress,
          vaultName,
          vaultSymbol,
          description: `Morpho ${assetSymbol} Vault`,
          underlyingAsset: assetSymbol,
          shares: ethers.formatUnits(userShares, 18),
        }
      };

    } catch (error) {
      console.warn(`Error fetching Morpho vault position ${vaultAddress}:`, error);
      return null;
    }
  }

  async getSeamlessTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    const tokens: TokenBalance[] = [];

    // Check SEAM and esSEAM token balances
    for (const [tokenName, tokenAddress] of Object.entries(SEAMLESS_TOKENS)) {
      try {
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
        const balance = await contract.balanceOf(walletAddress);
        
        if (balance === 0n) {
          continue; // Skip zero balances
        }

        const [symbol, decimals, name] = await Promise.all([
          contract.symbol(),
          contract.decimals(),
          contract.name(),
        ]);

        const balanceFormatted = parseFloat(ethers.formatUnits(balance, decimals));
        
        // Get price - SEAM is likely to be available, esSEAM might not have market price
        let price = 0;
        if (symbol === 'SEAM') {
          price = await priceService.getPrice('SEAM') || 0; // Try to get SEAM price
        }
        
        const value = balanceFormatted * price;

        tokens.push({
          address: tokenAddress,
          symbol,
          name,
          balance: balanceFormatted.toString(),
          decimals: Number(decimals),
          price,
          value,
        });

        console.log(`Found ${symbol} balance: ${balanceFormatted} (${value > 0 ? `$${value.toFixed(2)}` : 'No price data'})`);
      } catch (error) {
        console.warn(`Error fetching ${tokenName} balance:`, error);
      }
    }

    return tokens;
  }

  // Experimental: Try to detect Morpho vault positions by looking for vault-like tokens
  async detectMorphoVaultTokens(walletAddress: string, positions: DeFiPosition[]): Promise<void> {
    try {
      console.log('Attempting to detect potential Morpho vault positions...');
      
      // This would require more advanced token discovery methods
      // For now, we'll log that this feature is not yet implemented
      console.log('Morpho vault token detection not yet implemented - need actual vault addresses');
      
      // In a full implementation, this could:
      // 1. Scan for ERC20 tokens with vault-like names
      // 2. Check if they implement ERC4626 interface
      // 3. Verify they're connected to Morpho protocol
      // 4. Query their underlying assets and values
      
    } catch (error) {
      console.warn('Error in Morpho vault detection:', error);
    }
  }

  // Mock Morpho positions for development/demonstration
  async getMockPositions(walletAddress: string): Promise<DeFiPosition[]> {
    console.log('Using mock Morpho positions for development');
    
    return [
      {
        id: 'morpho-cbbtc-vault',
        protocol: 'morpho',
        type: 'lending',
        tokens: [{
          address: CBBTC_TOKEN_BASE,
          symbol: 'cbBTC',
          name: 'Coinbase Wrapped BTC',
          balance: '0.025',
          decimals: 8,
          price: 95000, // BTC price
          value: 2375.00,
        }],
        value: 2375.00,
        apy: 3.8, // Estimated BTC lending APY
        claimable: 0,
        metadata: {
          vaultAddress: MORPHO_VAULTS.base.SEAMLESS_CBBTC_VAULT,
          vaultName: 'Seamless cbBTC Vault',
          description: 'Morpho cbBTC Vault (Seamless)',
          underlyingAsset: 'cbBTC',
          shares: '0.025',
          platform: 'Seamless',
        }
      },
      {
        id: 'morpho-token-holdings',
        protocol: 'morpho',
        type: 'token',
        tokens: [{
          address: MORPHO_TOKEN_BASE,
          symbol: 'MORPHO',
          name: 'Morpho Token',
          balance: '45.5',
          decimals: 18,
          price: 2.15, // Estimated MORPHO price
          value: 97.83,
        }],
        value: 97.83,
        apy: 0,
        claimable: 0,
        metadata: {
          description: 'MORPHO Token Holdings',
          isNativeToken: true,
        }
      }
    ];
  }
}

export function createMorphoService(): MorphoService {
  return new MorphoIntegration();
}

// Export constants for use in other modules
export const MORPHO_CONSTANTS = {
  MORPHO_TOKEN: MORPHO_TOKEN_BASE,
  CBBTC_TOKEN: CBBTC_TOKEN_BASE,
  VAULTS: MORPHO_VAULTS.base,
  CHAIN_ID: 8453, // Base chain ID
  NETWORK_NAME: 'Base',
};