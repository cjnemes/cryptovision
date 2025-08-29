import { ethers } from 'ethers';
import { DeFiPosition, UniswapV3Position, TokenBalance } from '@/types';

// Uniswap V3 contract addresses
const UNISWAP_V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
const UNISWAP_V3_NFT_MANAGER = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';

// Uniswap V3 NFT Manager ABI (simplified)
const NFT_MANAGER_ABI = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
  'function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
];

// Pool ABI for current tick and price
const POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)',
];

interface UniswapV3Service {
  getPositions(walletAddress: string, provider: ethers.Provider): Promise<DeFiPosition[]>;
}

export class UniswapV3Integration implements UniswapV3Service {
  private provider: ethers.Provider;
  private nftManager: ethers.Contract;

  constructor(provider: ethers.Provider) {
    this.provider = provider;
    this.nftManager = new ethers.Contract(UNISWAP_V3_NFT_MANAGER, NFT_MANAGER_ABI, provider);
  }

  async getPositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      const positions: DeFiPosition[] = [];
      
      // Get number of NFTs owned by the wallet
      const balance = await this.nftManager.balanceOf(walletAddress);
      const nftCount = Number(balance);

      for (let i = 0; i < nftCount; i++) {
        try {
          // Get token ID for each NFT
          const tokenId = await this.nftManager.tokenOfOwnerByIndex(walletAddress, i);
          
          // Get position details
          const position = await this.getPositionDetails(tokenId);
          if (position && position.value > 0.01) { // Filter out dust positions
            positions.push(position);
          }
        } catch (error) {
          console.warn(`Failed to fetch position ${i}:`, error);
          continue;
        }
      }

      return positions;
    } catch (error) {
      console.error('Error fetching Uniswap V3 positions:', error);
      return [];
    }
  }

  private async getPositionDetails(tokenId: bigint): Promise<DeFiPosition | null> {
    try {
      // Get position data from NFT manager
      const positionData = await this.nftManager.positions(tokenId);
      
      if (positionData.liquidity === 0n) {
        return null; // Empty position
      }

      // Get pool address and details
      const poolAddress = await this.computePoolAddress(
        positionData.token0,
        positionData.token1,
        positionData.fee
      );

      const pool = new ethers.Contract(poolAddress, POOL_ABI, this.provider);
      const slot0 = await pool.slot0();

      // Calculate position value (simplified)
      const token0Balance = await this.calculateTokenAmount(
        positionData.liquidity,
        positionData.tickLower,
        positionData.tickUpper,
        slot0.tick,
        true
      );

      const token1Balance = await this.calculateTokenAmount(
        positionData.liquidity,
        positionData.tickLower,
        positionData.tickUpper,
        slot0.tick,
        false
      );

      // Create mock token balances (in production, fetch real token metadata)
      const token0: TokenBalance = {
        address: positionData.token0,
        symbol: 'TOKEN0', // Would fetch from contract or API
        name: 'Token 0',
        balance: token0Balance.toString(),
        decimals: 18,
        price: 1, // Would fetch real price
        value: Number(ethers.formatEther(token0Balance)),
      };

      const token1: TokenBalance = {
        address: positionData.token1,
        symbol: 'TOKEN1', // Would fetch from contract or API
        name: 'Token 1',
        balance: token1Balance.toString(),
        decimals: 18,
        price: 1, // Would fetch real price
        value: Number(ethers.formatEther(token1Balance)),
      };

      // Check if position is in range
      const inRange = slot0.tick >= positionData.tickLower && slot0.tick < positionData.tickUpper;

      const uniswapPosition: UniswapV3Position = {
        tokenId: tokenId.toString(),
        pool: poolAddress,
        token0,
        token1,
        fee: Number(positionData.fee),
        tickLower: Number(positionData.tickLower),
        tickUpper: Number(positionData.tickUpper),
        liquidity: positionData.liquidity.toString(),
        uncollectedFees: {
          token0: positionData.tokensOwed0.toString(),
          token1: positionData.tokensOwed1.toString(),
        },
        inRange,
      };

      const totalValue = token0.value + token1.value;

      return {
        id: `uniswap-v3-${tokenId}`,
        protocol: 'uniswap-v3',
        type: 'liquidity',
        tokens: [token0, token1],
        apy: inRange ? 15.5 : 0, // Mock APY, would calculate based on fees
        value: totalValue,
        claimable: Number(ethers.formatEther(positionData.tokensOwed0 + positionData.tokensOwed1)),
        metadata: uniswapPosition,
      };
    } catch (error) {
      console.error('Error getting position details:', error);
      return null;
    }
  }

  private async computePoolAddress(token0: string, token1: string, fee: number): string {
    // Simplified pool address computation
    // In production, use the actual Uniswap V3 factory contract
    const factory = new ethers.Contract(
      UNISWAP_V3_FACTORY,
      ['function getPool(address, address, uint24) external view returns (address)'],
      this.provider
    );
    
    return await factory.getPool(token0, token1, fee);
  }

  private async calculateTokenAmount(
    liquidity: bigint,
    tickLower: number,
    tickUpper: number,
    currentTick: number,
    isToken0: boolean
  ): Promise<bigint> {
    // Simplified liquidity calculation
    // In production, use the actual Uniswap V3 math library
    const liquidityAmount = liquidity / BigInt(1000); // Simplified
    return isToken0 ? liquidityAmount : liquidityAmount / BigInt(2);
  }
}

// Export a factory function to create the service
export function createUniswapV3Service(provider: ethers.Provider): UniswapV3Integration {
  return new UniswapV3Integration(provider);
}