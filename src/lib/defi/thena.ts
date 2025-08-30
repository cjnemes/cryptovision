import { ethers } from 'ethers';
import { DeFiPosition, TokenBalance } from '@/types';
import { priceService } from '../prices';

// Thena Finance constants for BSC network
const THENA_VOTING_ESCROW = '0xfBBF371C9B0B994EebFcC977CEf603F7f31c070D'; // veTHE contract
const THE_TOKEN_ADDRESS = '0xf4c8e32eadec4bfe97e0f595add0f4450a863a11'; // THE token

// BSC network RPC with Alchemy support
const getBscRpc = () => {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  return alchemyKey 
    ? `https://bnb-mainnet.g.alchemy.com/v2/${alchemyKey}`
    : 'https://bsc-dataseed.binance.org/';
};

// VotingEscrow ABI (based on GitHub contract analysis)
const VOTING_ESCROW_ABI = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function balanceOfNFT(uint256 tokenId) external view returns (uint256)',
  'function locked__end(uint256 tokenId) external view returns (uint256)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function getVotes(address account) external view returns (uint256)',
  'function locked(uint256 tokenId) external view returns (tuple(int128 amount, uint256 end))',
];

// THE Token ABI
const THE_TOKEN_ABI = [
  'function balanceOf(address) external view returns (uint256)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function name() external view returns (string)',
];

export interface ThenaService {
  getPositions(walletAddress: string): Promise<DeFiPosition[]>;
  getVeThePositions(walletAddress: string): Promise<DeFiPosition[]>;
}

export class ThenaIntegration implements ThenaService {
  private provider: ethers.Provider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(getBscRpc());
  }

  async getPositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      console.log(`Fetching Thena positions for ${walletAddress} on BSC...`);
      
      const positions: DeFiPosition[] = [];

      // Get veTHE positions
      const veThePositions = await this.getVeThePositions(walletAddress);
      positions.push(...veThePositions);

      console.log(`Found ${positions.length} Thena positions for ${walletAddress}`);
      return positions;

    } catch (error) {
      console.error('Error fetching Thena positions:', error);
      return [];
    }
  }

  async getVeThePositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      console.log(`Checking veTHE positions for ${walletAddress}...`);
      
      const votingEscrow = new ethers.Contract(THENA_VOTING_ESCROW, VOTING_ESCROW_ABI, this.provider);
      
      // Get number of NFTs owned by the user
      const nftBalance = await votingEscrow.balanceOf(walletAddress);
      
      if (nftBalance === 0n) {
        console.log('No veTHE positions found');
        return [];
      }

      const positions: DeFiPosition[] = [];

      // Iterate through all NFTs owned by the user
      for (let i = 0; i < Number(nftBalance); i++) {
        try {
          // Get the token ID
          const tokenId = await votingEscrow.tokenOfOwnerByIndex(walletAddress, i);
          
          // Get the voting power (balance) of this NFT
          const votingPower = await votingEscrow.balanceOfNFT(tokenId);
          
          // Get lock end time
          const lockEnd = await votingEscrow.locked__end(tokenId);
          
          // Get locked token info
          const lockedInfo = await votingEscrow.locked(tokenId);
          const lockedAmount = lockedInfo[0]; // int128 amount
          const lockEndTime = lockedInfo[1]; // uint256 end
          
          if (votingPower === 0n && lockedAmount === 0n) {
            continue; // Skip empty positions
          }

          // Convert amounts
          const votingPowerFormatted = parseFloat(ethers.formatUnits(votingPower, 18));
          const lockedAmountFormatted = parseFloat(ethers.formatUnits(lockedAmount > 0 ? lockedAmount : -lockedAmount, 18));
          
          // Calculate lock expiry
          const now = Math.floor(Date.now() / 1000);
          const lockEndTimestamp = Number(lockEndTime);
          const isLocked = lockEndTimestamp > now;
          const daysUntilUnlock = isLocked ? Math.ceil((lockEndTimestamp - now) / (24 * 60 * 60)) : 0;
          
          // Get THE token price
          const thePrice = await priceService.getPrice('THE') || priceService.getFallbackPrice('THE');
          const value = lockedAmountFormatted * thePrice;

          const position: DeFiPosition = {
            id: `thena-vethe-${tokenId}`,
            protocol: 'thena',
            type: 'staking',
            tokens: [{
              address: THE_TOKEN_ADDRESS,
              symbol: `veTHE #${tokenId}`,
              name: `Vote-Escrowed THE NFT #${tokenId}`,
              balance: lockedAmountFormatted.toString(),
              decimals: 18,
              price: thePrice,
              value,
            }],
            apy: 0, // veTHE doesn't directly earn APY, but gets voting rewards
            value,
            claimable: 0, // Would need to check gauge rewards separately
            metadata: {
              tokenId: tokenId.toString(),
              lockedAmount: lockedAmount.toString(),
              votingPower: votingPower.toString(),
              lockEndTime: lockEndTimestamp,
              daysUntilUnlock,
              isLocked,
              displayName: `veTHE NFT #${tokenId}`,
              displayDescription: `${lockedAmountFormatted.toFixed(2)} THE • ${votingPowerFormatted.toFixed(2)} Voting Power • ${isLocked ? `Locked ${daysUntilUnlock} days` : 'Unlocked'}`,
              nftId: tokenId.toString(),
            }
          };

          positions.push(position);
          console.log(`veTHE NFT #${tokenId}: ${lockedAmountFormatted} THE locked, voting power: ${votingPowerFormatted}, value: $${value.toFixed(2)}`);

        } catch (error) {
          console.warn(`Error fetching veTHE NFT at index ${i}:`, error);
        }
      }

      return positions;

    } catch (error) {
      console.error('Error fetching veTHE positions:', error);
      return [];
    }
  }

  // Mock Thena positions for development
  async getMockPositions(walletAddress: string): Promise<DeFiPosition[]> {
    console.log('Using mock Thena positions for development');
    
    return [
      {
        id: 'thena-vethe-12345',
        protocol: 'thena',
        type: 'staking',
        tokens: [{
          address: THE_TOKEN_ADDRESS,
          symbol: 'veTHE #12345',
          name: 'Vote-Escrowed THE NFT #12345',
          balance: '1500.25',
          decimals: 18,
          price: 0.12, // Estimated THE price
          value: 180.03,
        }],
        value: 180.03,
        apy: 0,
        claimable: 0,
        metadata: {
          tokenId: '12345',
          lockedAmount: '1500250000000000000000',
          votingPower: '750000000000000000000',
          lockEndTime: Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60), // 180 days from now
          daysUntilUnlock: 180,
          isLocked: true,
          displayName: 'veTHE NFT #12345',
          displayDescription: '1,500.25 THE • 750.00 Voting Power • Locked 180 days',
          nftId: '12345',
        }
      }
    ];
  }
}

export function createThenaService(): ThenaService {
  return new ThenaIntegration();
}

// Export constants for use in other modules
export const THENA_CONSTANTS = {
  VOTING_ESCROW: THENA_VOTING_ESCROW,
  THE_TOKEN: THE_TOKEN_ADDRESS,
  CHAIN_ID: 56, // BSC chain ID
  NETWORK_NAME: 'BSC',
};