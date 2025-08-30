import { ethers } from 'ethers';
import { DeFiPosition, TokenBalance } from '@/types';
import { priceService } from '../prices';

// GammaSwap constants for multiple networks
const GAMMASWAP_CONTRACTS = {
  ethereum: {
    GammaPoolFactory: '0xFD513630F697A9C1731F196185fb9ebA6eAAc20B',
    PositionManager: '0xf6152b6699C085f1063bAa27A08d5F074AB84aa6',
  },
  base: {
    GammaPoolFactory: '0xfd513630f697a9c1731f196185fb9eba6eaac20b',
    StakingRouter: '0x496b80AdA6758c0a7cF9801b9ded7AeA815f74a6',
    EsGS: '0x25B0415AEbe7C82fa1Fb316B6DE9435B7f406F55',
    BonusTracker: '0x95bd606c041663f7Eb731288e91Cd3Ba64EC36Bf',
    gETH: '0xdF58eCBF08B539CC1D5E4D7286B5AFf6ec680A88', // GammaSwap gETH yield token
    GammaVaultFactory: '0xf55192DCd29bD26a9D65456b8324Ab68f21aACE4',
    GS: '0x55ff62567f09906A85183b866dF84bf599a4bf70', // GS token on Base - let's check if this exists
    // Alternative potential staking addresses to check
    StakedGSTracker: '0x0000000000000000000000000000000000000000', // To be found
    FeeGSTracker: '0x0000000000000000000000000000000000000000', // To be found
  },
  arbitrum: {
    GammaPoolFactory: '0xfd513630f697a9c1731f196185fb9eba6eaac20b',
    StakingRouter: '0x9b91328f04ed1183548bD6bDad24Da40311E077C',
    EsGS: '0x92c5A56F1233F951f7381E085Ad6a00BC01b67Ea',
    GS: '0xb08d8becab1bf76a9ce3d2d5fa946f65ec1d3e83',
    BonusTracker: '0x911de9BaCe0a8057957e9371eEfA11C741791F9D',
  }
};

// RPC providers for different networks
const getProviders = () => {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  return {
    ethereum: new ethers.JsonRpcProvider(
      alchemyKey ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}` : 'https://eth-mainnet.g.alchemy.com/v2/demo'
    ),
    base: new ethers.JsonRpcProvider(
      alchemyKey ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}` : 'https://mainnet.base.org'
    ),
    arbitrum: new ethers.JsonRpcProvider(
      alchemyKey ? `https://arb-mainnet.g.alchemy.com/v2/${alchemyKey}` : 'https://arb1.arbitrum.io/rpc'
    )
  };
};

// Basic ERC20 ABI for token interactions
const ERC20_ABI = [
  'function balanceOf(address) external view returns (uint256)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function name() external view returns (string)',
  'function totalSupply() external view returns (uint256)',
];

// GammaSwap Staking Router ABI - correct methods based on actual contracts
const STAKING_ROUTER_ABI = [
  'function getAverageStakedAmount(address _gsPool, address _esToken, address _account) external view returns (uint256)',
  'function stake(address _account, address _depositToken, uint256 _amount) external',
  'function unstake(address _account, address _depositToken, uint256 _amount) external',
];

// GammaSwap RewardTracker ABI - primary contract for checking staked balances
const REWARD_TRACKER_ABI = [
  'function balanceOf(address _account) external view returns (uint256)',
  'function stakedAmounts(address _account) external view returns (uint256)',
  'function depositBalances(address _account, address _token) external view returns (uint256)',
  'function claimable(address _account) external view returns (uint256)',
  'function cumulativeRewards(address _account) external view returns (uint256)',
  'function averageStakedAmounts(address _account) external view returns (uint256)',
  'function totalDepositSupply(address _token) external view returns (uint256)',
  'function distributor() external view returns (address)',
  'function rewardToken() external view returns (address)',
  'function tokensPerInterval() external view returns (uint256)',
];

// Pool Factory ABI for discovering pools
const POOL_FACTORY_ABI = [
  'function getPool(address token0, address token1) external view returns (address)',
  'function allPools(uint256) external view returns (address)',
  'function allPoolsLength() external view returns (uint256)',
  'function isPool(address) external view returns (bool)',
];

export interface GammaswapService {
  getPositions(walletAddress: string): Promise<DeFiPosition[]>;
  getStakedPositions(walletAddress: string): Promise<DeFiPosition[]>;
  getTokenBalances(walletAddress: string): Promise<DeFiPosition[]>;
}

export class GammaswapIntegration implements GammaswapService {
  private providers: Record<string, ethers.Provider>;

  constructor() {
    this.providers = getProviders();
  }

  async getPositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      console.log(`Fetching GammaSwap positions for ${walletAddress}...`);
      
      const positions: DeFiPosition[] = [];

      // Get staked positions across all networks
      const stakedPositions = await this.getStakedPositions(walletAddress);
      positions.push(...stakedPositions);

      // Get token balances (GS, esGS)
      const tokenBalances = await this.getTokenBalances(walletAddress);
      positions.push(...tokenBalances);

      // Debug: Scan for the user's staked GS tokens
      await this.scanForStakedGS(walletAddress);

      console.log(`Found ${positions.length} GammaSwap positions for ${walletAddress}`);
      return positions;

    } catch (error) {
      console.error('Error fetching GammaSwap positions:', error);
      return [];
    }
  }

  async getStakedPositions(walletAddress: string): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    // Check staking on Base and Arbitrum (where staking contracts exist)
    for (const [network, contracts] of Object.entries(GAMMASWAP_CONTRACTS)) {
      if (!contracts.StakingRouter) continue;

      try {
        console.log(`Checking GammaSwap staking on ${network}...`);
        
        const provider = this.providers[network as keyof typeof this.providers];
        
        // Check EsGS token as RewardTracker (primary way to check staked positions)
        if (contracts.EsGS) {
          const rewardTracker = new ethers.Contract(contracts.EsGS, REWARD_TRACKER_ABI, provider);
          
          try {
            // Use stakedAmounts method from RewardTracker
            const stakedBalance = await rewardTracker.stakedAmounts(walletAddress);
            
            if (stakedBalance > 0n) {
              const stakedAmount = parseFloat(ethers.formatUnits(stakedBalance, 18));
              
              // Get GS token price
              const gsPrice = await priceService.getPrice('GS') || priceService.getFallbackPrice('GS');
              const stakedValue = stakedAmount * gsPrice;

              // Get claimable rewards
              let claimableRewards = 0;
              try {
                const claimableAmount = await rewardTracker.claimable(walletAddress);
                claimableRewards = parseFloat(ethers.formatUnits(claimableAmount, 18)) * gsPrice;
              } catch {
                console.log(`Could not fetch claimable rewards on ${network}`);
              }

              const position: DeFiPosition = {
                id: `gammaswap-staking-${network}`,
                protocol: 'gammaswap',
                type: 'staking',
                tokens: [{
                  address: contracts.GS || contracts.EsGS,
                  symbol: 'GS',
                  name: 'GammaSwap',
                  balance: stakedAmount.toString(),
                  decimals: 18,
                  price: gsPrice,
                  value: stakedValue,
                }],
                apy: 0, // Would need additional contract calls to calculate APY
                value: stakedValue,
                claimable: claimableRewards,
                metadata: {
                  network,
                  stakingRouter: contracts.StakingRouter,
                  rewardTracker: contracts.EsGS,
                  description: `GammaSwap Staking (${network.charAt(0).toUpperCase() + network.slice(1)})`,
                }
              };

              positions.push(position);
              console.log(`GammaSwap ${network} staking: ${stakedAmount} GS staked ($${stakedValue.toFixed(2)}), claimable: $${claimableRewards.toFixed(2)}`);
            } else {
              console.log(`No staking balance on ${network}`);
            }
          } catch (error) {
            console.log(`Could not fetch staked balance on ${network}:`, error.message);
          }
        }

        // Also check BonusTracker if available - this might have the actual staked GS positions
        if (contracts.BonusTracker) {
          try {
            const bonusTracker = new ethers.Contract(contracts.BonusTracker, REWARD_TRACKER_ABI, provider);
            
            // Try multiple methods to detect staking
            let bonusBalance = 0n;
            try {
              bonusBalance = await bonusTracker.stakedAmounts(walletAddress);
              console.log(`BonusTracker stakedAmounts on ${network}: ${ethers.formatUnits(bonusBalance, 18)}`);
            } catch (error) {
              console.log(`Could not check stakedAmounts on BonusTracker ${network}: ${error.message}`);
            }
            
            try {
              const depositBalance = await bonusTracker.balanceOf(walletAddress);
              console.log(`BonusTracker balanceOf on ${network}: ${ethers.formatUnits(depositBalance, 18)}`);
              if (depositBalance > bonusBalance) {
                bonusBalance = depositBalance;
              }
            } catch (error) {
              console.log(`Could not check balanceOf on BonusTracker ${network}: ${error.message}`);
            }
            
            if (bonusBalance > 0n) {
              const stakedAmount = parseFloat(ethers.formatUnits(bonusBalance, 18));
              const gsPrice = await priceService.getPrice('GS') || priceService.getFallbackPrice('GS');
              const stakedValue = stakedAmount * gsPrice;

              // Get claimable rewards
              let claimableRewards = 0;
              try {
                const claimableAmount = await bonusTracker.claimable(walletAddress);
                claimableRewards = parseFloat(ethers.formatUnits(claimableAmount, 18)) * gsPrice;
              } catch {
                console.log(`Could not fetch claimable rewards from BonusTracker on ${network}`);
              }

              const position: DeFiPosition = {
                id: `gammaswap-bonus-staking-${network}`,
                protocol: 'gammaswap',
                type: 'staking',
                tokens: [{
                  address: contracts.GS || contracts.BonusTracker,
                  symbol: 'GS',
                  name: 'GammaSwap',
                  balance: stakedAmount.toString(),
                  decimals: 18,
                  price: gsPrice,
                  value: stakedValue,
                }],
                apy: 0,
                value: stakedValue,
                claimable: claimableRewards,
                metadata: {
                  network,
                  bonusTracker: contracts.BonusTracker,
                  description: `GammaSwap Bonus Staking (${network.charAt(0).toUpperCase() + network.slice(1)})`,
                  isBonusStaking: true,
                }
              };

              positions.push(position);
              console.log(`GammaSwap BonusTracker ${network} staking: ${stakedAmount} GS staked ($${stakedValue.toFixed(2)}), claimable: $${claimableRewards.toFixed(2)}`);
            } else {
              console.log(`No BonusTracker staking balance on ${network}`);
            }
          } catch (error) {
            console.log(`Could not check BonusTracker on ${network}:`, error.message);
          }
        }

      } catch (error) {
        console.warn(`Error fetching GammaSwap staking on ${network}:`, error);
      }
    }

    return positions;
  }

  async getTokenBalances(walletAddress: string): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    // Check GS and esGS token balances across networks
    for (const [network, contracts] of Object.entries(GAMMASWAP_CONTRACTS)) {
      const provider = this.providers[network as keyof typeof this.providers];

      // Check GS token balance (mainly on Arbitrum)
      if (contracts.GS) {
        try {
          const gsContract = new ethers.Contract(contracts.GS, ERC20_ABI, provider);
          const [balance, symbol, decimals, name] = await Promise.all([
            gsContract.balanceOf(walletAddress),
            gsContract.symbol(),
            gsContract.decimals(),
            gsContract.name(),
          ]);

          if (balance > 0n) {
            const balanceFormatted = parseFloat(ethers.formatUnits(balance, decimals));
            const price = await priceService.getPrice('GS') || priceService.getFallbackPrice('GS');
            const value = balanceFormatted * price;

            positions.push({
              id: `gammaswap-gs-${network}`,
              protocol: 'gammaswap',
              type: 'token',
              tokens: [{
                address: contracts.GS,
                symbol,
                name,
                balance: balanceFormatted.toString(),
                decimals: Number(decimals),
                price,
                value,
              }],
              value,
              apy: 0,
              claimable: 0,
              metadata: {
                network,
                description: `${name} Holdings (${network.charAt(0).toUpperCase() + network.slice(1)})`,
                isNativeToken: true,
              }
            });

            console.log(`GS balance on ${network}: ${balanceFormatted} GS ($${value.toFixed(2)})`);
          }
        } catch (error) {
          console.warn(`Error fetching GS balance on ${network}:`, error);
        }
      }

      // Check esGS token balance (this is likely where staked positions show up)
      if (contracts.EsGS) {
        try {
          const esGsContract = new ethers.Contract(contracts.EsGS, ERC20_ABI, provider);
          const [balance, symbol, decimals, name] = await Promise.all([
            esGsContract.balanceOf(walletAddress),
            esGsContract.symbol(),
            esGsContract.decimals(),
            esGsContract.name(),
          ]);

          console.log(`esGS balance check on ${network}: ${ethers.formatUnits(balance, decimals)} ${symbol}`);

          if (balance > 0n) {
            const balanceFormatted = parseFloat(ethers.formatUnits(balance, decimals));
            // esGS typically valued same as GS
            const price = await priceService.getPrice('GS') || priceService.getFallbackPrice('GS');
            const value = balanceFormatted * price;

            positions.push({
              id: `gammaswap-esgs-${network}`,
              protocol: 'gammaswap',
              type: 'staking', // Change to staking since esGS represents staked positions
              tokens: [{
                address: contracts.EsGS,
                symbol,
                name,
                balance: balanceFormatted.toString(),
                decimals: Number(decimals),
                price,
                value,
              }],
              value,
              apy: 0,
              claimable: 0,
              metadata: {
                network,
                description: `${name} Staked Position (${network.charAt(0).toUpperCase() + network.slice(1)})`,
                isEscrowed: true,
                isStaked: true,
              }
            });

            console.log(`esGS staking position on ${network}: ${balanceFormatted} esGS ($${value.toFixed(2)})`);
          }
        } catch (error) {
          console.warn(`Error fetching esGS balance on ${network}:`, error);
        }
      }

      // Check GS token balance on Base network specifically
      if (network === 'base' && contracts.GS) {
        try {
          const gsContract = new ethers.Contract(contracts.GS, ERC20_ABI, provider);
          const [balance, symbol, decimals, name] = await Promise.all([
            gsContract.balanceOf(walletAddress),
            gsContract.symbol(),
            gsContract.decimals(),
            gsContract.name(),
          ]);

          console.log(`GS balance check on ${network} (direct): ${ethers.formatUnits(balance, decimals)} ${symbol}`);

          if (balance > 0n) {
            const balanceFormatted = parseFloat(ethers.formatUnits(balance, decimals));
            const price = await priceService.getPrice('GS') || priceService.getFallbackPrice('GS');
            const value = balanceFormatted * price;

            positions.push({
              id: `gammaswap-gs-base-direct`,
              protocol: 'gammaswap',
              type: 'token',
              tokens: [{
                address: contracts.GS,
                symbol,
                name,
                balance: balanceFormatted.toString(),
                decimals: Number(decimals),
                price,
                value,
              }],
              value,
              apy: 0,
              claimable: 0,
              metadata: {
                network,
                description: `${name} Holdings (${network.charAt(0).toUpperCase() + network.slice(1)}) - Direct`,
                isNativeToken: true,
              }
            });

            console.log(`Direct GS balance on ${network}: ${balanceFormatted} GS ($${value.toFixed(2)})`);
          }
        } catch (error) {
          console.warn(`Error fetching direct GS balance on ${network}:`, error);
        }
      }

      // Check gETH yield token balance (Base network only)
      if (network === 'base' && contracts.gETH) {
        try {
          const gEthContract = new ethers.Contract(contracts.gETH, ERC20_ABI, provider);
          const [balance, symbol, decimals, name] = await Promise.all([
            gEthContract.balanceOf(walletAddress),
            gEthContract.symbol(),
            gEthContract.decimals(),
            gEthContract.name(),
          ]);

          console.log(`gETH balance check on ${network}: ${ethers.formatUnits(balance, decimals)} ${symbol}`);

          if (balance > 0n) {
            const balanceFormatted = parseFloat(ethers.formatUnits(balance, decimals));
            // gETH should be priced similar to ETH since it's ETH-based yield
            const ethPrice = await priceService.getPrice('ETH') || 4500;
            const value = balanceFormatted * ethPrice;

            positions.push({
              id: `gammaswap-geth-${network}`,
              protocol: 'gammaswap',
              type: 'yield-farming',
              tokens: [{
                address: contracts.gETH,
                symbol,
                name,
                balance: balanceFormatted.toString(),
                decimals: Number(decimals),
                price: ethPrice,
                value,
              }],
              value,
              apy: 0, // Would need additional contract calls to get current APY
              claimable: 0,
              metadata: {
                network,
                description: `${name} Yield Position (${network.charAt(0).toUpperCase() + network.slice(1)})`,
                isYieldToken: true,
                underlyingAsset: 'ETH',
              }
            });

            console.log(`gETH yield position on ${network}: ${balanceFormatted} gETH ($${value.toFixed(2)})`);
          }
        } catch (error) {
          console.warn(`Error fetching gETH balance on ${network}:`, error);
        }
      }
    }

    return positions;
  }

  // Debug function to scan for the user's 72,267.71 staked GS tokens on Base
  async scanForStakedGS(walletAddress: string): Promise<void> {
    const baseProvider = this.providers.base;
    const targetAmount = 72267.71; // User's reported staked amount
    
    console.log(`🔍 Scanning for staked GS tokens (target: ${targetAmount} GS tokens)...`);
    
    // List of potential staking contract addresses to check
    const potentialStakingContracts = [
      '0x496b80AdA6758c0a7cF9801b9ded7AeA815f74a6', // StakingRouter (current)
      '0x25B0415AEbe7C82fa1Fb316B6DE9435B7f406F55', // EsGS (current)
      '0x95bd606c041663f7Eb731288e91Cd3Ba64EC36Bf', // BonusTracker (current) 
      '0x55ff62567f09906A85183b866dF84bf599a4bf70', // GS token (to check if held directly)
      '0xdF58eCBF08B539CC1D5E4D7286B5AFf6ec680A88', // gETH vault
      '0xf55192DCd29bD26a9D65456b8324Ab68f21aACE4', // GammaVaultFactory
    ];
    
    for (const contractAddress of potentialStakingContracts) {
      try {
        // Try as ERC20 first
        const contract = new ethers.Contract(contractAddress, ERC20_ABI, baseProvider);
        const balance = await contract.balanceOf(walletAddress);
        
        if (balance > 0n) {
          const balanceFormatted = parseFloat(ethers.formatUnits(balance, 18));
          console.log(`📍 Found balance at ${contractAddress}: ${balanceFormatted} tokens`);
          
          // Check if this matches our target amount (within 1% tolerance)
          if (Math.abs(balanceFormatted - targetAmount) < (targetAmount * 0.01)) {
            console.log(`🎯 FOUND TARGET! Contract ${contractAddress} has ${balanceFormatted} tokens (matches target ${targetAmount})`);
          }
        }
      } catch (error) {
        // Try with RewardTracker ABI
        try {
          const rewardTracker = new ethers.Contract(contractAddress, REWARD_TRACKER_ABI, baseProvider);
          const stakedAmount = await rewardTracker.stakedAmounts(walletAddress);
          
          if (stakedAmount > 0n) {
            const stakedFormatted = parseFloat(ethers.formatUnits(stakedAmount, 18));
            console.log(`📍 Found staked amount at ${contractAddress}: ${stakedFormatted} tokens`);
            
            if (Math.abs(stakedFormatted - targetAmount) < (targetAmount * 0.01)) {
              console.log(`🎯 FOUND TARGET STAKING! Contract ${contractAddress} has ${stakedFormatted} staked tokens (matches target ${targetAmount})`);
            }
          }
        } catch (innerError) {
          // Silent - many contracts won't support these methods
        }
      }
    }
  }

  // Mock positions for development/testing
  async getMockPositions(walletAddress: string): Promise<DeFiPosition[]> {
    console.log('Using mock GammaSwap positions for development');
    
    return [
      {
        id: 'gammaswap-staking-arbitrum',
        protocol: 'gammaswap',
        type: 'staking',
        tokens: [{
          address: GAMMASWAP_CONTRACTS.arbitrum.GS,
          symbol: 'GS',
          name: 'GammaSwap',
          balance: '1000.50',
          decimals: 18,
          price: 0.06, // Based on recent market data
          value: 60.03,
        }],
        value: 60.03,
        apy: 15.5,
        claimable: 2.45,
        metadata: {
          network: 'arbitrum',
          stakingRouter: GAMMASWAP_CONTRACTS.arbitrum.StakingRouter,
          description: 'GammaSwap Staking (Arbitrum)',
        }
      },
      {
        id: 'gammaswap-esgs-base',
        protocol: 'gammaswap',
        type: 'token',
        tokens: [{
          address: GAMMASWAP_CONTRACTS.base.EsGS,
          symbol: 'esGS',
          name: 'Escrowed GammaSwap',
          balance: '500.25',
          decimals: 18,
          price: 0.06,
          value: 30.02,
        }],
        value: 30.02,
        apy: 0,
        claimable: 0,
        metadata: {
          network: 'base',
          description: 'Escrowed GammaSwap Holdings (Base)',
          isEscrowed: true,
        }
      }
    ];
  }
}

export function createGammaswapService(): GammaswapService {
  return new GammaswapIntegration();
}

// Export constants for use in other modules
export const GAMMASWAP_CONSTANTS = {
  CONTRACTS: GAMMASWAP_CONTRACTS,
  SUPPORTED_NETWORKS: ['ethereum', 'base', 'arbitrum'],
  NATIVE_TOKENS: {
    GS: 'gammaswap',
    esGS: 'escrowed-gammaswap',
  }
};