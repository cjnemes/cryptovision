import { ethers } from 'ethers';
import { DeFiPosition, AerodromePosition, TokenBalance } from '@/types';
import { getTokenPrice } from '@/lib/prices';

// Aerodrome contract addresses on Base
const AERODROME_ROUTER = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43';
const AERODROME_VOTER = '0x16613524e02ad97eDfeF371bC883F2F5d6C480A5';
const AERODROME_FACTORY = '0x420DD381b31aEf6683db6B902084cB0FFECe40Da';

// Base network RPC with Alchemy support
const getBaseRpc = () => {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  return alchemyKey 
    ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`
    : 'https://mainnet.base.org';
};

// Aerodrome Router ABI (simplified)
const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, tuple(address from, address to, bool stable)[] memory routes) external view returns (uint[] memory amounts)',
  'function pairFor(address tokenA, address tokenB, bool stable) external view returns (address pair)',
];

// Aerodrome Pair ABI
const PAIR_ABI = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function stable() external view returns (bool)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address) external view returns (uint256)',
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
];

// Aerodrome Gauge ABI
const GAUGE_ABI = [
  'function balanceOf(address) external view returns (uint256)',
  'function earned(address) external view returns (uint256)',
  'function rewardToken() external view returns (address)',
];

interface AerodromeService {
  getPositions(walletAddress: string): Promise<DeFiPosition[]>;
}

export class AerodromeIntegration implements AerodromeService {
  private provider: ethers.Provider;
  private router: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(getBaseRpc());
    this.router = new ethers.Contract(AERODROME_ROUTER, ROUTER_ABI, this.provider);
  }

  async getPositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      const positions: DeFiPosition[] = [];

      // Get LP token balances (simplified approach)
      // In production, we'd scan for all LP tokens or use Aerodrome's subgraph
      const commonPairs = await this.getCommonPairs();

      for (const pairInfo of commonPairs) {
        try {
          const position = await this.getPositionDetails(walletAddress, pairInfo);
          if (position && position.value > 0.01) {
            positions.push(position);
          }
        } catch (error) {
          console.warn(`Failed to fetch Aerodrome position for ${pairInfo.symbol}:`, error);
        }
      }

      // Get veAERO locked positions
      try {
        const veAeroPositions = await this.getVeAeroPositions(walletAddress);
        positions.push(...veAeroPositions);
      } catch (error) {
        console.warn('Failed to fetch veAERO positions:', error);
      }

      return positions;
    } catch (error) {
      console.error('Error fetching Aerodrome positions:', error);
      return [];
    }
  }

  private async getPositionDetails(
    walletAddress: string, 
    pairInfo: any
  ): Promise<DeFiPosition | null> {
    try {
      const pair = new ethers.Contract(pairInfo.address, PAIR_ABI, this.provider);
      
      // Get LP token balance
      const lpBalance = await pair.balanceOf(walletAddress);
      if (lpBalance === 0n) return null;

      // Get pair details
      const [token0Address, token1Address, isStable, totalSupply, reserves] = await Promise.all([
        pair.token0(),
        pair.token1(),
        pair.stable(),
        pair.totalSupply(),
        pair.getReserves(),
      ]);

      // Calculate user's share using proper BigInt precision
      const token0AmountWei = (lpBalance * BigInt(reserves.reserve0)) / totalSupply;
      const token1AmountWei = (lpBalance * BigInt(reserves.reserve1)) / totalSupply;
      const token0Amount = parseFloat(ethers.formatEther(token0AmountWei));
      const token1Amount = parseFloat(ethers.formatEther(token1AmountWei));

      // Create token balances (mock token data for development)
      const token0: TokenBalance = {
        address: token0Address,
        symbol: pairInfo.token0Symbol || 'TOKEN0',
        name: `Token 0 (${pairInfo.token0Symbol})`,
        balance: token0Amount.toString(),
        decimals: 18,
        price: pairInfo.token0Price || 1,
        value: token0Amount * (pairInfo.token0Price || 1),
      };

      const token1: TokenBalance = {
        address: token1Address,
        symbol: pairInfo.token1Symbol || 'TOKEN1',
        name: `Token 1 (${pairInfo.token1Symbol})`,
        balance: token1Amount.toString(),
        decimals: 18,
        price: pairInfo.token1Price || 1,
        value: token1Amount * (pairInfo.token1Price || 1),
      };

      // Check for gauge staking
      let gaugePosition;
      if (pairInfo.gauge) {
        const gauge = new ethers.Contract(pairInfo.gauge, GAUGE_ABI, this.provider);
        const stakedBalance = await gauge.balanceOf(walletAddress);
        const earnedRewards = await gauge.earned(walletAddress);
        
        if (stakedBalance > 0n) {
          gaugePosition = {
            address: pairInfo.gauge,
            rewards: [{
              address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631', // AERO token
              symbol: 'AERO',
              name: 'Aerodrome',
              balance: earnedRewards.toString(),
              decimals: 18,
              price: 0.5, // Mock price
              value: (Number(earnedRewards) / 1e18) * 0.5,
            }],
            emissions: 25.5, // Mock APY
          };
        }
      }

      const aerodromePosition: AerodromePosition = {
        pairAddress: pairInfo.address,
        token0,
        token1,
        isStable,
        gauge: gaugePosition,
        lpTokenBalance: lpBalance.toString(),
        totalSupply: totalSupply.toString(),
      };

      const totalValue = token0.value + token1.value;
      const claimableRewards = gaugePosition?.rewards.reduce((sum, reward) => sum + reward.value, 0) || 0;

      return {
        id: `aerodrome-${pairInfo.address}`,
        protocol: 'aerodrome',
        type: 'liquidity',
        tokens: [token0, token1],
        apy: gaugePosition?.emissions || 15.0, // Base LP APY or gauge APY
        value: totalValue,
        claimable: claimableRewards,
        metadata: aerodromePosition,
      };
    } catch (error) {
      console.error('Error getting Aerodrome position details:', error);
      return null;
    }
  }

  private async getCommonPairs() {
    // Skip common pairs for now since we don't have user positions
    // In a real implementation, we'd query the user's LP token balances
    // or use Aerodrome's subgraph to find user positions
    return [];
  }
  
  async getVeAeroPositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      const positions: DeFiPosition[] = [];
      
      // VotingEscrow (veAERO) contract with correct interface
      const veAeroContract = new ethers.Contract(
        '0xeBf418Fe2512e7E6bd9b87a8F0f294aCDC67e6B4',
        [
          'function balanceOf(address owner) external view returns (uint256)',
          'function ownerToNFTokenIdList(address _owner, uint256 _index) external view returns (uint256)',
          'function balanceOfNFT(uint256 _tokenId) external view returns (uint256)',
          'function locked(uint256 _tokenId) external view returns (tuple(int128 amount, uint256 end))',
          'function ownerOf(uint256 tokenId) external view returns (address)',
        ],
        this.provider
      );

      // Get the number of tokens owned by the user
      const userBalance = await veAeroContract.balanceOf(walletAddress);
      console.log(`User owns ${userBalance.toString()} veAERO NFTs`);
      
      if (userBalance > 0n) {
        for (let i = 0; i < Number(userBalance); i++) {
          try {
            // Get the token ID at this index using the correct enumeration function
            const tokenId = await veAeroContract.ownerToNFTokenIdList(walletAddress, i);
            console.log(`Processing veAERO token ID: ${tokenId.toString()}`);
            
            // Get lock information
            const lockInfo = await veAeroContract.locked(tokenId);
            const lockedAmount = lockInfo.amount;
            const unlockTime = lockInfo.end;
            
            // Get voting power (balanceOfNFT)
            const votingPower = await veAeroContract.balanceOfNFT(tokenId);
            
            console.log(`Token ${tokenId}: locked=${lockedAmount.toString()}, unlockTime=${unlockTime.toString()}, votingPower=${votingPower.toString()}`);
            
            if (lockedAmount > 0n) {
              // Convert locked amount to readable format (AERO has 18 decimals)
              const lockedAero = parseFloat(ethers.formatEther(lockedAmount.toString()));
              const aeroPrice = await getTokenPrice('AERO'); // Get real-time AERO price
              
              // Calculate time until unlock
              const now = Math.floor(Date.now() / 1000);
              const timeUntilUnlock = Number(unlockTime) - now;
              const daysUntilUnlock = Math.max(0, Math.ceil(timeUntilUnlock / 86400));
              
              const aeroToken: TokenBalance = {
                address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
                symbol: `veAERO #${tokenId}`,
                name: `Vote-Escrowed AERO NFT #${tokenId}`,
                balance: lockedAero.toString(),
                decimals: 18,
                price: aeroPrice,
                value: lockedAero * aeroPrice,
              };

              // Determine lock status
              const lockStatus = unlockTime === 0n ? 'Permanent' : (timeUntilUnlock > 0 ? 'Locked' : 'Unlocked');
              const votingPowerFormatted = parseFloat(ethers.formatEther(votingPower)).toFixed(0);

              positions.push({
                id: `aerodrome-veaero-${tokenId}`,
                protocol: 'aerodrome',
                type: 'staking',
                tokens: [aeroToken],
                apy: 0, // veAERO doesn't earn APY directly, earns voting rewards
                value: lockedAero * aeroPrice,
                claimable: 0,
                metadata: {
                  tokenId: tokenId.toString(),
                  lockedAmount: lockedAmount.toString(),
                  unlockTime: Number(unlockTime),
                  daysUntilUnlock,
                  isLocked: timeUntilUnlock > 0,
                  votingPower: votingPower.toString(),
                  displayName: `veAERO NFT #${tokenId}`,
                  displayDescription: `${lockedAero.toLocaleString('en-US', { maximumFractionDigits: 0 })} AERO • ${votingPowerFormatted} Voting Power • ${lockStatus}`,
                  nftId: tokenId.toString(),
                }
              });

              const unlockDate = new Date(Number(unlockTime) * 1000).toDateString();
              console.log(`Added veAERO position: ${lockedAero} AERO locked until ${unlockDate}, voting power: ${ethers.formatEther(votingPower)}, value: $${(lockedAero * aeroPrice).toFixed(2)}`);
            }
          } catch (error) {
            console.warn(`Failed to get veAERO position for index ${i}:`, error.message);
          }
        }
      }

      return positions;
    } catch (error) {
      console.error('Error fetching veAERO positions:', error);
      return [];
    }
  }
}

// Factory function
export function createAerodromeService(): AerodromeIntegration {
  return new AerodromeIntegration();
}