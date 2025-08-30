import { ethers } from 'ethers';
import { DeFiPosition, TokenBalance } from '@/types';
import { priceService } from '../prices';
import { safeContractCall, withErrorHandling } from '../utils/error-handler';

// GammaSwap constants for multiple networks - updated with complete contract addresses
const GAMMASWAP_CONTRACTS = {
  ethereum: {
    GammaPoolFactory: '0xFD513630F697A9C1731F196185fb9ebA6eAAc20B',
    PositionManager: '0xf6152b6699C085f1063bAa27A08d5F074AB84aa6',
  },
  base: {
    // Main GammaSwap contracts
    GammaPoolFactory: '0xfd513630f697a9c1731f196185fb9eba6eaac20b',
    GS: '0xc4d44c155f95fd4e94600d191a4a01bb571df7df', // GammaSwap token on Base
    
    // Staking contracts - primary detection points
    StakingRouter: '0x496b80AdA6758c0a7cF9801b9ded7AeA815f74a6',
    EsGS: '0x25B0415AEbe7C82fa1Fb316B6DE9435B7f406F55', // Escrowed GS / RewardTracker
    BonusTracker: '0x95bd606c041663f7Eb731288e91Cd3Ba64EC36Bf', // Bonus rewards tracker
    
    // Proxy staking contract (potential location of staked tokens)
    StakingProxy: '0x0638ea54a2a25b9bbb7a77492187f0f36a51845c', // Proxy for staked tokens
    
    // Additional contracts for comprehensive detection
    DeltaSwapFactory: '0x9A9A171c69cC811dc6B59bB2f9990E34a22Fc971',
    DeltaSwapRouter: '0x1b7655aa64b7BD54077dE56B64a0f92BCba05b85',
    LPViewer: '0xcb85e1222f715a81b8edaeb73b28182fa37cffa8',
    Liquidator: '0x764dfb496a8b2847a9136346a20888cfd62d55ba',
    PositionManagerQueries: '0xf6152b6699c085f1063baa27a08d5f074ab84aa6',
    PositionManager: '0x7135ba051fcba0d3bde77add0601d8b69c91ece1',
    PriceDataQueries: '0x3b72616376652cc82f17dd7a9b58f71cdb3b98b0',
    PoolViewer: '0x5fbe219e88f6c6f214ce6f5b1fcaa0294f31ae1b',
    CPMMMath: '0xcf2b6bc8c0e0a1292db7f0ae89410670796350c8',
    PoolZapper: '0xce0599057232d3ea1e39de9d4cac063e10790ae1',
    
    // Yield tokens
    gETH: '0xdF58eCBF08B539CC1D5E4D7286B5AFf6ec680A88', // GammaSwap gETH yield token
    GammaVaultFactory: '0xf55192DCd29bD26a9D65456b8324Ab68f21aACE4',
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
  'function stakedAmounts(address _account) external view returns (uint256)',
  'function depositBalances(address _account, address _token) external view returns (uint256)',
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
  // Additional methods for comprehensive staking detection
  'function totalSupply() external view returns (uint256)',
  'function getPoolTokens(address _account) external view returns (uint256)',
  'function getUserInfo(address _user) external view returns (uint256, uint256)',
  // Proxy and alternative staking method signatures
  'function stakedBalance(address _account) external view returns (uint256)',
  'function staked(address _account) external view returns (uint256)',
  'function pendingRewards(address _account) external view returns (uint256)',
  'function userInfo(address _account) external view returns (uint256, uint256, uint256)',
];

// Extended ABI for LP and additional staking patterns
const LP_STAKING_ABI = [
  'function userInfo(uint256 _pid, address _user) external view returns (uint256, uint256)',
  'function poolInfo(uint256 _pid) external view returns (address, uint256, uint256, uint256)',
  'function poolLength() external view returns (uint256)',
  'function pendingTokens(uint256 _pid, address _user) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
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
  debugDetection(walletAddress: string): Promise<void>;
}

export class EnhancedGammaswapIntegration implements GammaswapService {
  private providers: Record<string, ethers.Provider>;

  constructor() {
    this.providers = getProviders();
  }

  async getPositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      console.log(`Fetching GammaSwap positions for ${walletAddress}...`);
      
      const positions: DeFiPosition[] = [];

      // Get staked positions across all networks with enhanced detection
      const stakedPositions = await this.getStakedPositions(walletAddress);
      positions.push(...stakedPositions);

      // Get token balances (GS, esGS)
      const tokenBalances = await this.getTokenBalances(walletAddress);
      positions.push(...tokenBalances);

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
        
        // Method 1: Check StakingRouter directly
        if (contracts.StakingRouter) {
          try {
            const stakingRouter = new ethers.Contract(contracts.StakingRouter, STAKING_ROUTER_ABI, provider);
            
            // Try different methods to detect staking in StakingRouter with safe contract calls
            const routerMethods = [
              { name: 'stakedAmounts', fn: () => safeContractCall(() => stakingRouter.stakedAmounts(walletAddress), 'gammaswap', 'stakedAmounts', contracts.StakingRouter) },
              { name: 'depositBalances-GS', fn: () => contracts.GS ? safeContractCall(() => stakingRouter.depositBalances(walletAddress, contracts.GS), 'gammaswap', 'depositBalances', contracts.StakingRouter) : Promise.resolve(null) },
              { name: 'depositBalances-EsGS', fn: () => contracts.EsGS ? safeContractCall(() => stakingRouter.depositBalances(walletAddress, contracts.EsGS), 'gammaswap', 'depositBalances', contracts.StakingRouter) : Promise.resolve(null) },
            ];
            
            for (const method of routerMethods) {
              const balance = await method.fn();
              if (balance !== null) {
                console.log(`StakingRouter ${method.name} on ${network}: ${ethers.formatUnits(balance, 18)}`);
                
                if (balance > 0n) {
                  const stakedAmount = parseFloat(ethers.formatUnits(balance, 18));
                  const gsPrice = await priceService.getPrice('GS') || priceService.getFallbackPrice('GS');
                  const stakedValue = stakedAmount * gsPrice;
                  
                  const position: DeFiPosition = {
                    id: `gammaswap-router-${method.name}-${network}`,
                    protocol: 'gammaswap',
                    type: 'staking',
                    tokens: [{
                      address: contracts.GS || contracts.StakingRouter,
                      symbol: 'GS',
                      name: 'GammaSwap',
                      balance: stakedAmount.toString(),
                      decimals: 18,
                      price: gsPrice,
                      value: stakedValue,
                    }],
                    apy: 0,
                    value: stakedValue,
                    claimable: 0,
                    metadata: {
                      network,
                      stakingRouter: contracts.StakingRouter,
                      detectionMethod: `router-${method.name}`,
                      description: `GammaSwap Staking Router via ${method.name} (${network.charAt(0).toUpperCase() + network.slice(1)})`,
                    }
                  };
                  positions.push(position);
                  console.log(`Found staking via StakingRouter ${method.name} on ${network}: ${stakedAmount} GS ($${stakedValue.toFixed(2)})`);
                } else {
                  console.debug(`StakingRouter ${method.name} on ${network}: 0 or failed`);
                }
              }
            }
          } catch (error) {
            console.log(`StakingRouter check failed on ${network}: ${error.message}`);
          }
        }
        
        // Method 2: Check EsGS token as RewardTracker (primary way to check staked positions)
        if (contracts.EsGS) {
          const rewardTracker = new ethers.Contract(contracts.EsGS, REWARD_TRACKER_ABI, provider);
          
          try {
            // Try multiple methods to detect staking with safe contract calls
            const methods = [
              { name: 'stakedAmounts', fn: () => safeContractCall(() => rewardTracker.stakedAmounts(walletAddress), 'gammaswap', 'stakedAmounts', contracts.EsGS) },
              { name: 'balanceOf', fn: () => safeContractCall(() => rewardTracker.balanceOf(walletAddress), 'gammaswap', 'balanceOf', contracts.EsGS) },
              { name: 'averageStakedAmounts', fn: () => safeContractCall(() => rewardTracker.averageStakedAmounts(walletAddress), 'gammaswap', 'averageStakedAmounts', contracts.EsGS) },
            ];
            
            for (const method of methods) {
              const stakedBalance = await method.fn();
              if (stakedBalance !== null) {
                console.log(`EsGS ${method.name} on ${network}: ${ethers.formatUnits(stakedBalance, 18)}`);
                
                if (stakedBalance > 0n) {
                  const stakedAmount = parseFloat(ethers.formatUnits(stakedBalance, 18));
                  const gsPrice = await priceService.getPrice('GS') || priceService.getFallbackPrice('GS');
                  const stakedValue = stakedAmount * gsPrice;

                  // Get claimable rewards with safe contract call
                  let claimableRewards = 0;
                  const claimableAmount = await safeContractCall(
                    () => rewardTracker.claimable(walletAddress),
                    'gammaswap',
                    'claimable',
                    contracts.EsGS
                  );
                  if (claimableAmount !== null) {
                    claimableRewards = parseFloat(ethers.formatUnits(claimableAmount, 18)) * gsPrice;
                  }

                  const position: DeFiPosition = {
                    id: `gammaswap-esgs-${method.name}-${network}`,
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
                    apy: 0,
                    value: stakedValue,
                    claimable: claimableRewards,
                    metadata: {
                      network,
                      rewardTracker: contracts.EsGS,
                      detectionMethod: `esgs-${method.name}`,
                      description: `GammaSwap EsGS Staking via ${method.name} (${network.charAt(0).toUpperCase() + network.slice(1)})`,
                    }
                  };

                  positions.push(position);
                  console.log(`GammaSwap EsGS ${network} via ${method.name}: ${stakedAmount} GS staked ($${stakedValue.toFixed(2)}), claimable: $${claimableRewards.toFixed(2)})`);
                  break; // Only add one position per EsGS contract
                } else {
                  console.debug(`EsGS ${method.name} on ${network}: 0 or failed`);
                }
              }
            }
          } catch (error) {
            console.log(`Could not fetch EsGS staking on ${network}:`, error.message);
          }
        }

        // Method 3: Check BonusTracker with comprehensive detection methods
        if (contracts.BonusTracker) {
          try {
            const bonusTracker = new ethers.Contract(contracts.BonusTracker, REWARD_TRACKER_ABI, provider);
            
            // Try all available methods to detect bonus staking with safe contract calls
            const bonusMethods = [
              { name: 'stakedAmounts', fn: () => safeContractCall(() => bonusTracker.stakedAmounts(walletAddress), 'gammaswap', 'stakedAmounts', contracts.BonusTracker) },
              { name: 'balanceOf', fn: () => safeContractCall(() => bonusTracker.balanceOf(walletAddress), 'gammaswap', 'balanceOf', contracts.BonusTracker) },
              { name: 'averageStakedAmounts', fn: () => safeContractCall(() => bonusTracker.averageStakedAmounts(walletAddress), 'gammaswap', 'averageStakedAmounts', contracts.BonusTracker) },
            ];
            
            let maxBonusBalance = 0n;
            let successfulMethod = '';
            
            for (const method of bonusMethods) {
              const balance = await method.fn();
              if (balance !== null) {
                console.log(`BonusTracker ${method.name} on ${network}: ${ethers.formatUnits(balance, 18)}`);
                if (balance > maxBonusBalance) {
                  maxBonusBalance = balance;
                  successfulMethod = method.name;
                }
              } else {
                console.debug(`BonusTracker ${method.name} on ${network}: failed`);
              }
            }
            
            if (maxBonusBalance > 0n) {
              const stakedAmount = parseFloat(ethers.formatUnits(maxBonusBalance, 18));
              const gsPrice = await priceService.getPrice('GS') || priceService.getFallbackPrice('GS');
              const stakedValue = stakedAmount * gsPrice;

              // Get claimable rewards with safe contract call
              let claimableRewards = 0;
              const claimableAmount = await safeContractCall(
                () => bonusTracker.claimable(walletAddress),
                'gammaswap',
                'claimable',
                contracts.BonusTracker
              );
              if (claimableAmount !== null) {
                claimableRewards = parseFloat(ethers.formatUnits(claimableAmount, 18)) * gsPrice;
              }

              const position: DeFiPosition = {
                id: `gammaswap-bonus-${successfulMethod}-${network}`,
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
                  detectionMethod: `bonus-${successfulMethod}`,
                  description: `GammaSwap Bonus Staking via ${successfulMethod} (${network.charAt(0).toUpperCase() + network.slice(1)})`,
                  isBonusStaking: true,
                }
              };

              positions.push(position);
              console.log(`GammaSwap BonusTracker ${network} via ${successfulMethod}: ${stakedAmount} GS staked ($${stakedValue.toFixed(2)}), claimable: $${claimableRewards.toFixed(2)})`);
            } else {
              console.log(`No BonusTracker staking balance found on ${network}`);
            }
          } catch (error) {
            console.log(`Could not check BonusTracker on ${network}:`, error.message);
          }
        }
        
        // Method 4: Check Proxy Staking Contract (often used for actual staked token storage)
        if (contracts.StakingProxy) {
          try {
            console.log(`Checking StakingProxy on ${network}: ${contracts.StakingProxy}`);
            const proxyContract = new ethers.Contract(contracts.StakingProxy, REWARD_TRACKER_ABI, provider);
            
            // Try comprehensive proxy staking detection methods
            const proxyMethods = [
              { name: 'balanceOf', fn: () => proxyContract.balanceOf(walletAddress) },
              { name: 'stakedAmounts', fn: () => proxyContract.stakedAmounts(walletAddress) },
              { name: 'stakedBalance', fn: () => proxyContract.stakedBalance(walletAddress) },
              { name: 'staked', fn: () => proxyContract.staked(walletAddress) },
            ];
            
            for (const method of proxyMethods) {
              try {
                const result = await method.fn();
                const stakedAmount = parseFloat(ethers.formatUnits(result, 18));
                console.log(`StakingProxy ${method.name} on ${network}: ${stakedAmount}`);
                
                if (result > 0n) {
                  const gsPrice = await priceService.getPrice('GS') || priceService.getFallbackPrice('GS');
                  const stakedValue = stakedAmount * gsPrice;

                  // Check for claimable rewards in proxy
                  let claimableRewards = 0;
                  try {
                    const claimable = await proxyContract.claimable(walletAddress);
                    claimableRewards = parseFloat(ethers.formatUnits(claimable, 18)) * gsPrice;
                  } catch {
                    // Try alternative reward methods
                    try {
                      const pendingRewards = await proxyContract.pendingRewards(walletAddress);
                      claimableRewards = parseFloat(ethers.formatUnits(pendingRewards, 18)) * gsPrice;
                    } catch {
                      console.log(`Could not fetch proxy rewards on ${network}`);
                    }
                  }

                  const position: DeFiPosition = {
                    id: `gammaswap-proxy-${method.name}-${network}`,
                    protocol: 'gammaswap',
                    type: 'staking',
                    tokens: [{
                      address: contracts.GS || contracts.StakingProxy,
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
                      stakingProxy: contracts.StakingProxy,
                      detectionMethod: `proxy-${method.name}`,
                      description: `GammaSwap Proxy Staking via ${method.name} (${network.charAt(0).toUpperCase() + network.slice(1)})`,
                    }
                  };

                  positions.push(position);
                  console.log(`🎯 FOUND STAKING IN PROXY! GammaSwap StakingProxy ${network} via ${method.name}: ${stakedAmount} GS staked ($${stakedValue.toFixed(2)}), claimable: $${claimableRewards.toFixed(2)})`);
                  break; // Found staking, no need to try other methods
                }
              } catch (error) {
                console.log(`StakingProxy ${method.name} failed on ${network}: ${error.message}`);
              }
            }
          } catch (error) {
            console.log(`Could not check StakingProxy on ${network}:`, error.message);
          }
        }
        
        // Method 5: Check LP staking pools that might contain GS tokens
        if (contracts.LPViewer || contracts.PoolViewer) {
          try {
            const lpViewer = contracts.LPViewer ? new ethers.Contract(contracts.LPViewer, LP_STAKING_ABI, provider) : null;
            const poolViewer = contracts.PoolViewer ? new ethers.Contract(contracts.PoolViewer, LP_STAKING_ABI, provider) : null;
            
            // Check for LP token balances in various viewers
            const viewers = [
              { name: 'LPViewer', contract: lpViewer, address: contracts.LPViewer },
              { name: 'PoolViewer', contract: poolViewer, address: contracts.PoolViewer },
            ].filter(v => v.contract);
            
            for (const viewer of viewers) {
              try {
                const lpBalance = await viewer.contract!.balanceOf(walletAddress);
                console.log(`${viewer.name} LP balance on ${network}: ${ethers.formatUnits(lpBalance, 18)}`);
                
                if (lpBalance > 0n) {
                  const lpAmount = parseFloat(ethers.formatUnits(lpBalance, 18));
                  // Estimate value - LP tokens containing GS might be worth something
                  const estimatedValue = lpAmount * 0.1; // Conservative estimate
                  
                  const position: DeFiPosition = {
                    id: `gammaswap-lp-${viewer.name.toLowerCase()}-${network}`,
                    protocol: 'gammaswap',
                    type: 'liquidity-pool',
                    tokens: [{
                      address: viewer.address!,
                      symbol: 'GS-LP',
                      name: `GammaSwap LP (${viewer.name})`,
                      balance: lpAmount.toString(),
                      decimals: 18,
                      price: 0.1,
                      value: estimatedValue,
                    }],
                    value: estimatedValue,
                    apy: 0,
                    claimable: 0,
                    metadata: {
                      network,
                      viewer: viewer.address,
                      detectionMethod: `lp-${viewer.name.toLowerCase()}`,
                      description: `GammaSwap LP Position via ${viewer.name} (${network.charAt(0).toUpperCase() + network.slice(1)})`,
                      isLP: true,
                    }
                  };
                  
                  positions.push(position);
                  console.log(`Found LP position via ${viewer.name} on ${network}: ${lpAmount} LP tokens ($${estimatedValue.toFixed(2)})`);
                }
              } catch (error) {
                console.log(`${viewer.name} check failed on ${network}: ${error.message}`);
              }
            }
          } catch (error) {
            console.log(`Could not check LP positions on ${network}:`, error.message);
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

      // Check GS token balance with enhanced logging and safe contract calls
      if (contracts.GS) {
        const gsContract = new ethers.Contract(contracts.GS, ERC20_ABI, provider);
        const contractCalls = await Promise.all([
          safeContractCall(() => gsContract.balanceOf(walletAddress), 'gammaswap', 'balanceOf', contracts.GS),
          safeContractCall(() => gsContract.symbol(), 'gammaswap', 'symbol', contracts.GS),
          safeContractCall(() => gsContract.decimals(), 'gammaswap', 'decimals', contracts.GS),
          safeContractCall(() => gsContract.name(), 'gammaswap', 'name', contracts.GS),
          safeContractCall(() => gsContract.totalSupply(), 'gammaswap', 'totalSupply', contracts.GS),
        ]);

        const [balance, symbol, decimals, name, totalSupply] = contractCalls;
        
        if (balance !== null && symbol && decimals !== null && name && totalSupply !== null) {

          console.log(`GS token info on ${network}: ${name} (${symbol}), total supply: ${ethers.formatUnits(totalSupply, decimals)}`);
          console.log(`User GS balance on ${network}: ${ethers.formatUnits(balance, decimals)} ${symbol}`);

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
        } else {
          console.debug(`Failed to fetch GS token info on ${network}`);
        }
      }

      // Check esGS token balance with enhanced detection (this is likely where staked positions show up)
      if (contracts.EsGS) {
        try {
          const esGsContract = new ethers.Contract(contracts.EsGS, ERC20_ABI, provider);
          const [balance, symbol, decimals, name, totalSupply] = await Promise.all([
            esGsContract.balanceOf(walletAddress),
            esGsContract.symbol(),
            esGsContract.decimals(),
            esGsContract.name(),
            esGsContract.totalSupply(),
          ]);

          console.log(`esGS token info on ${network}: ${name} (${symbol}), total supply: ${ethers.formatUnits(totalSupply, decimals)}`);
          console.log(`User esGS balance on ${network}: ${ethers.formatUnits(balance, decimals)} ${symbol}`);

          if (balance > 0n) {
            const balanceFormatted = parseFloat(ethers.formatUnits(balance, decimals));
            // esGS typically valued same as GS
            const price = await priceService.getPrice('GS') || priceService.getFallbackPrice('GS');
            const value = balanceFormatted * price;

            positions.push({
              id: `gammaswap-esgs-balance-${network}`,
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
                description: `${name} Balance as Staked Position (${network.charAt(0).toUpperCase() + network.slice(1)})`,
                detectionMethod: 'esgs-balance',
                isEscrowed: true,
                isStaked: true,
              }
            });

            console.log(`esGS balance as staking position on ${network}: ${balanceFormatted} esGS ($${value.toFixed(2)})`);
          }
        } catch (error) {
          console.warn(`Error fetching esGS balance on ${network}:`, error);
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
    
    // Manual positions will be handled by the aggregator's manual positions system

    return positions;
  }


  // Comprehensive debugging function
  async debugDetection(walletAddress: string): Promise<void> {
    console.log('=== Enhanced GammaSwap Debug Detection Starting ===');
    console.log(`Wallet: ${walletAddress}`);
    
    const baseContracts = GAMMASWAP_CONTRACTS.base;
    console.log('Base contracts to check:', baseContracts);
    
    const provider = this.providers.base;
    
    // Check all contract interactions
    for (const [contractName, contractAddress] of Object.entries(baseContracts)) {
      if (!contractAddress) continue;
      
      console.log(`\n--- Checking ${contractName}: ${contractAddress} ---`);
      
      try {
        // Basic ERC20 checks
        const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);
        
        try {
          const balance = await contract.balanceOf(walletAddress);
          console.log(`  balanceOf: ${ethers.formatUnits(balance, 18)}`);
        } catch (e: any) {
          console.log(`  balanceOf failed: ${e.message}`);
        }
        
        // Staking-specific checks for known staking contracts
        if (['StakingRouter', 'EsGS', 'BonusTracker'].includes(contractName)) {
          const stakingContract = new ethers.Contract(contractAddress, REWARD_TRACKER_ABI, provider);
          
          const methods = ['stakedAmounts', 'averageStakedAmounts', 'depositBalances'];
          for (const method of methods) {
            try {
              let result;
              if (method === 'depositBalances') {
                // Need token address parameter
                if (baseContracts.GS) {
                  result = await stakingContract[method](walletAddress, baseContracts.GS);
                  console.log(`  ${method}(GS): ${ethers.formatUnits(result, 18)}`);
                }
                if (baseContracts.EsGS) {
                  result = await stakingContract[method](walletAddress, baseContracts.EsGS);
                  console.log(`  ${method}(EsGS): ${ethers.formatUnits(result, 18)}`);
                }
              } else {
                result = await stakingContract[method](walletAddress);
                console.log(`  ${method}: ${ethers.formatUnits(result, 18)}`);
              }
            } catch (e: any) {
              console.log(`  ${method} failed: ${e.message}`);
            }
          }
        }
      } catch (error: any) {
        console.log(`  Contract check failed: ${error.message}`);
      }
    }
    
    console.log('\n=== Additional Contract Checks ===');
    
    // Check if there are any other contracts that might hold the tokens
    const additionalContracts = [
      '0x9A9A171c69cC811dc6B59bB2f9990E34a22Fc971', // DeltaSwapFactory
      '0x1b7655aa64b7BD54077dE56B64a0f92BCba05b85', // DeltaSwapRouter
      '0x7135ba051fcba0d3bde77add0601d8b69c91ece1', // PositionManager
    ];
    
    for (const contractAddress of additionalContracts) {
      console.log(`\n--- Additional Check: ${contractAddress} ---`);
      try {
        const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);
        const balance = await contract.balanceOf(walletAddress);
        console.log(`  balanceOf: ${ethers.formatUnits(balance, 18)}`);
        
        // Also check if this contract holds GS tokens for the user
        if (baseContracts.GS) {
          try {
            const gsContract = new ethers.Contract(baseContracts.GS, ERC20_ABI, provider);
            const gsBalance = await gsContract.balanceOf(contractAddress);
            console.log(`  GS tokens held by contract: ${ethers.formatUnits(gsBalance, 18)}`);
          } catch (e: any) {
            console.log(`  Could not check GS balance in contract: ${e.message}`);
          }
        }
      } catch (error: any) {
        console.log(`  Additional contract check failed: ${error.message}`);
      }
    }
    
    console.log('=== Enhanced GammaSwap Debug Detection Complete ===');
  }
}

export function createEnhancedGammaswapService(): GammaswapService {
  return new EnhancedGammaswapIntegration();
}

// Enhanced debugging function to trace all contract calls
export const debugGammaswapDetection = async (walletAddress: string) => {
  const service = new EnhancedGammaswapIntegration();
  await service.debugDetection(walletAddress);
};

// Export constants for use in other modules
export const GAMMASWAP_CONSTANTS = {
  CONTRACTS: GAMMASWAP_CONTRACTS,
  SUPPORTED_NETWORKS: ['ethereum', 'base', 'arbitrum'],
  NATIVE_TOKENS: {
    GS: 'gammaswap',
    esGS: 'escrowed-gammaswap',
  },
  // Additional contracts that might contain staking positions
  ADDITIONAL_CHECK_CONTRACTS: {
    base: [
      '0xc4d44c155f95fd4e94600d191a4a01bb571df7df', // GS token
      '0x496b80AdA6758c0a7cF9801b9ded7AeA815f74a6', // StakingRouter  
      '0x25B0415AEbe7C82fa1Fb316B6DE9435B7f406F55', // EsGS
      '0x95bd606c041663f7Eb731288e91Cd3Ba64EC36Bf', // BonusTracker
      '0xcb85e1222f715a81b8edaeb73b28182fa37cffa8', // LPViewer
      '0x5fbe219e88f6c6f214ce6f5b1fcaa0294f31ae1b', // PoolViewer
    ]
  }
};