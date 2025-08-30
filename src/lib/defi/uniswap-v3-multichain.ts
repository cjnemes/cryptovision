import { ethers } from 'ethers';
import { DeFiPosition, UniswapV3Position, TokenBalance } from '@/types';
import { priceService } from '../prices';

// Multi-chain Uniswap V3 contract addresses
const UNISWAP_V3_CONTRACTS = {
  ethereum: {
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    nftManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    quoterV2: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
    chainId: 1,
    name: 'Ethereum',
  },
  base: {
    factory: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
    nftManager: '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1',
    quoterV2: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
    chainId: 8453,
    name: 'Base',
  },
  arbitrum: {
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    nftManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    quoterV2: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
    chainId: 42161,
    name: 'Arbitrum',
  },
  optimism: {
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    nftManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    quoterV2: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
    chainId: 10,
    name: 'Optimism',
  },
};

// RPC providers for different networks
const getProviders = () => {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  return {
    ethereum: new ethers.JsonRpcProvider(
      alchemyKey 
        ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`
        : 'https://eth.public-rpc.com'
    ),
    base: new ethers.JsonRpcProvider(
      alchemyKey
        ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`
        : 'https://mainnet.base.org'
    ),
    arbitrum: new ethers.JsonRpcProvider(
      alchemyKey
        ? `https://arb-mainnet.g.alchemy.com/v2/${alchemyKey}`
        : 'https://arb1.arbitrum.io/rpc'
    ),
    optimism: new ethers.JsonRpcProvider(
      alchemyKey
        ? `https://opt-mainnet.g.alchemy.com/v2/${alchemyKey}`
        : 'https://mainnet.optimism.io'
    ),
  };
};

// Uniswap V3 NFT Manager ABI
const NFT_MANAGER_ABI = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
  'function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
  'function collect(tuple(uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max)) external returns (uint256 amount0, uint256 amount1)',
];

// Pool ABI for current tick and price
const POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)',
  'function liquidity() external view returns (uint128)',
];

// Factory ABI for getting pool addresses
const FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
];

// Basic ERC20 ABI for token info
const ERC20_ABI = [
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
  'function decimals() external view returns (uint8)',
];

export interface UniswapV3MultichainService {
  getAllPositions(walletAddress: string): Promise<DeFiPosition[]>;
  getPositionsForNetwork(walletAddress: string, network: keyof typeof UNISWAP_V3_CONTRACTS): Promise<DeFiPosition[]>;
}

export class UniswapV3MultichainIntegration implements UniswapV3MultichainService {
  private providers: ReturnType<typeof getProviders>;

  constructor() {
    this.providers = getProviders();
  }

  async getAllPositions(walletAddress: string): Promise<DeFiPosition[]> {
    console.log(`Fetching Uniswap V3 positions across all networks for ${walletAddress}`);
    
    const allPositions: DeFiPosition[] = [];
    const networks = Object.keys(UNISWAP_V3_CONTRACTS) as (keyof typeof UNISWAP_V3_CONTRACTS)[];
    
    // Base network first (highest priority)
    const baseNetwork: (keyof typeof UNISWAP_V3_CONTRACTS)[] = ['base'];
    const otherNetworks = networks.filter(n => n !== 'base');
    const orderedNetworks = [...baseNetwork, ...otherNetworks];

    for (const network of orderedNetworks) {
      try {
        console.log(`Checking Uniswap V3 positions on ${UNISWAP_V3_CONTRACTS[network].name}...`);
        const positions = await this.getPositionsForNetwork(walletAddress, network);
        allPositions.push(...positions);
        
        if (positions.length > 0) {
          console.log(`Found ${positions.length} Uniswap V3 positions on ${UNISWAP_V3_CONTRACTS[network].name}`);
        }
      } catch (error) {
        console.warn(`Failed to fetch Uniswap V3 positions on ${UNISWAP_V3_CONTRACTS[network].name}:`, error);
      }
    }

    console.log(`Total Uniswap V3 positions found: ${allPositions.length}`);
    return allPositions;
  }

  async getPositionsForNetwork(walletAddress: string, network: keyof typeof UNISWAP_V3_CONTRACTS): Promise<DeFiPosition[]> {
    const contracts = UNISWAP_V3_CONTRACTS[network];
    const provider = this.providers[network];
    
    if (!provider) {
      throw new Error(`No provider configured for network: ${network}`);
    }

    const positions: DeFiPosition[] = [];
    
    try {
      const nftManager = new ethers.Contract(contracts.nftManager, NFT_MANAGER_ABI, provider);
      
      // Get number of NFTs owned by the wallet
      const balance = await nftManager.balanceOf(walletAddress);
      const nftCount = Number(balance);

      if (nftCount === 0) {
        return positions;
      }

      console.log(`Found ${nftCount} Uniswap V3 NFTs on ${contracts.name}`);

      for (let i = 0; i < nftCount; i++) {
        try {
          // Get token ID for each NFT
          const tokenId = await nftManager.tokenOfOwnerByIndex(walletAddress, i);
          
          // Get position details
          const position = await this.getPositionDetails(tokenId, network);
          
          if (position) {
            positions.push(position);
          }
        } catch (error) {
          console.warn(`Error processing Uniswap V3 NFT ${i} on ${contracts.name}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error fetching Uniswap V3 positions on ${contracts.name}:`, error);
    }

    return positions;
  }

  private async getPositionDetails(tokenId: bigint, network: keyof typeof UNISWAP_V3_CONTRACTS): Promise<DeFiPosition | null> {
    const contracts = UNISWAP_V3_CONTRACTS[network];
    const provider = this.providers[network];
    const nftManager = new ethers.Contract(contracts.nftManager, NFT_MANAGER_ABI, provider);

    try {
      // Get position details from NFT
      const positionData = await nftManager.positions(tokenId);
      const [nonce, operator, token0Address, token1Address, fee, tickLower, tickUpper, liquidity, , , tokensOwed0, tokensOwed1] = positionData;

      // Skip positions with zero liquidity
      if (liquidity === 0n && tokensOwed0 === 0n && tokensOwed1 === 0n) {
        return null;
      }

      // Get pool address
      const factory = new ethers.Contract(contracts.factory, FACTORY_ABI, provider);
      const poolAddress = await factory.getPool(token0Address, token1Address, fee);
      
      if (poolAddress === ethers.ZeroAddress) {
        console.warn(`Pool not found for tokens ${token0Address}/${token1Address} with fee ${fee}`);
        return null;
      }

      // Get pool details
      const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);
      const slot0 = await pool.slot0();
      const currentTick = slot0[1];

      // Get token information
      const token0Contract = new ethers.Contract(token0Address, ERC20_ABI, provider);
      const token1Contract = new ethers.Contract(token1Address, ERC20_ABI, provider);

      const [token0Symbol, token0Name, token0Decimals, token1Symbol, token1Name, token1Decimals] = await Promise.all([
        token0Contract.symbol(),
        token0Contract.name(),
        token0Contract.decimals(),
        token1Contract.symbol(),
        token1Contract.name(),
        token1Contract.decimals(),
      ]);

      // Calculate position value (simplified calculation)
      const { token0Amount, token1Amount, inRange } = this.calculatePositionAmounts(
        liquidity,
        tickLower,
        tickUpper,
        currentTick,
        Number(token0Decimals),
        Number(token1Decimals)
      );

      // Get token prices
      const token0Price = await priceService.getPrice(token0Symbol) || 0;
      const token1Price = await priceService.getPrice(token1Symbol) || 0;

      // Calculate uncollected fees
      const uncollectedFee0 = parseFloat(ethers.formatUnits(tokensOwed0, token0Decimals));
      const uncollectedFee1 = parseFloat(ethers.formatUnits(tokensOwed1, token1Decimals));

      // Create token balances
      const token0Balance: TokenBalance = {
        address: token0Address,
        symbol: token0Symbol,
        name: token0Name,
        balance: token0Amount.toString(),
        decimals: Number(token0Decimals),
        price: token0Price,
        value: token0Amount * token0Price,
      };

      const token1Balance: TokenBalance = {
        address: token1Address,
        symbol: token1Symbol,
        name: token1Name,
        balance: token1Amount.toString(),
        decimals: Number(token1Decimals),
        price: token1Price,
        value: token1Amount * token1Price,
      };

      const totalValue = token0Balance.value + token1Balance.value;
      const claimableValue = (uncollectedFee0 * token0Price) + (uncollectedFee1 * token1Price);

      // Create UniswapV3Position metadata
      const uniswapMetadata: UniswapV3Position = {
        tokenId: tokenId.toString(),
        pool: poolAddress,
        token0: token0Balance,
        token1: token1Balance,
        fee: Number(fee),
        tickLower: Number(tickLower),
        tickUpper: Number(tickUpper),
        liquidity: liquidity.toString(),
        uncollectedFees: {
          token0: tokensOwed0.toString(),
          token1: tokensOwed1.toString(),
        },
        inRange,
      };

      const position: DeFiPosition = {
        id: `uniswap-v3-${network}-${tokenId}`,
        protocol: 'uniswap-v3',
        type: 'liquidity',
        tokens: [token0Balance, token1Balance],
        apy: 0, // Would need historical data to calculate
        value: totalValue,
        claimable: claimableValue,
        metadata: {
          ...uniswapMetadata,
          network: contracts.name,
          chainId: contracts.chainId,
        },
      };

      return position;

    } catch (error) {
      console.error(`Error getting position details for token ${tokenId} on ${contracts.name}:`, error);
      return null;
    }
  }

  private calculatePositionAmounts(
    liquidity: bigint,
    tickLower: bigint,
    tickUpper: bigint,
    currentTick: bigint,
    token0Decimals: number,
    token1Decimals: number
  ): { token0Amount: number; token1Amount: number; inRange: boolean } {
    // Simplified calculation - in production, you'd want more precise math
    const inRange = currentTick >= tickLower && currentTick <= tickUpper;
    
    if (liquidity === 0n) {
      return { token0Amount: 0, token1Amount: 0, inRange };
    }

    // Very simplified estimation - this would need proper Uniswap V3 math
    // For accurate calculations, you'd use the Uniswap V3 SDK or implement the precise formulas
    const liquidityFloat = parseFloat(ethers.formatUnits(liquidity, 18));
    
    // Rough estimation based on liquidity
    const token0Amount = liquidityFloat * 0.0001; // Simplified
    const token1Amount = liquidityFloat * 0.0001; // Simplified

    return {
      token0Amount,
      token1Amount,
      inRange,
    };
  }
}

export function createUniswapV3MultichainService(): UniswapV3MultichainService {
  return new UniswapV3MultichainIntegration();
}