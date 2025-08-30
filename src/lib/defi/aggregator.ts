import { ethers } from 'ethers';
import { DeFiPosition } from '@/types';
import { createUniswapV3MultichainService } from './uniswap-v3-multichain';
import { createAerodromeService } from './aerodrome';
import { createMoonwellService } from './moonwell';
import { createMamoService } from './mamo';
import { createThenaService } from './thena';
import { createGammaswapService } from './gammaswap';
import { createEnhancedGammaswapService } from './gammaswap-enhanced';
import { createMorphoService } from './morpho';
import { manualPositionsService } from '../manual-positions';

export interface DeFiAggregator {
  getAllPositions(walletAddress: string): Promise<DeFiPosition[]>;
  getPositionsByProtocol(walletAddress: string, protocol: string): Promise<DeFiPosition[]>;
  getTotalDeFiValue(walletAddress: string): Promise<number>;
}

export class DeFiPositionAggregator implements DeFiAggregator {
  private provider: ethers.Provider;
  private uniswapV3Service: any;
  private aerodromeService: any;
  private moonwellService: any;
  private mamoService: any;
  private thenaService: any;
  private gammaswapService: any;
  private morphoService: any;

  constructor(rpcUrl?: string) {
    // Use Alchemy RPC with API key if available
    const alchemyKey = process.env.ALCHEMY_API_KEY;
    const defaultRpc = alchemyKey 
      ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`
      : 'https://eth-mainnet.g.alchemy.com/v2/demo';
    
    this.provider = new ethers.JsonRpcProvider(rpcUrl || defaultRpc);
    this.uniswapV3Service = createUniswapV3MultichainService();
    this.aerodromeService = createAerodromeService();
    this.moonwellService = createMoonwellService();
    this.mamoService = createMamoService();
    this.thenaService = createThenaService();
    // Use enhanced GammaSwap service for better staking detection
    this.gammaswapService = createEnhancedGammaswapService();
    this.morphoService = createMorphoService();
  }

  async getAllPositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      const allPositions: DeFiPosition[] = [];

      // Fetch Uniswap V3 positions (multichain with Base priority)
      try {
        const uniswapPositions = await this.uniswapV3Service.getAllPositions(walletAddress);
        allPositions.push(...uniswapPositions);
      } catch (error) {
        console.warn('Failed to fetch Uniswap V3 positions:', error);
      }

      // Fetch Aerodrome positions (Base network)
      try {
        const aerodromePositions = await this.aerodromeService.getPositions(walletAddress);
        allPositions.push(...aerodromePositions);
      } catch (error) {
        console.warn('Failed to fetch Aerodrome positions:', error);
      }

      // Fetch Moonwell positions (Base network)
      try {
        const moonwellPositions = await this.moonwellService.getPositions(walletAddress);
        allPositions.push(...moonwellPositions);
      } catch (error) {
        console.warn('Failed to fetch Moonwell positions:', error);
      }

      // Fetch Mamo positions (Base network)
      try {
        const mamoPositions = await this.mamoService.getPositions(walletAddress);
        allPositions.push(...mamoPositions);
      } catch (error) {
        console.warn('Failed to fetch Mamo positions:', error);
      }

      // Fetch Thena positions (BSC network)
      try {
        const thenaPositions = await this.thenaService.getPositions(walletAddress);
        allPositions.push(...thenaPositions);
      } catch (error) {
        console.warn('Failed to fetch Thena positions:', error);
      }

      // Fetch GammaSwap positions (Ethereum, Base, Arbitrum)
      try {
        const gammaswapPositions = await this.gammaswapService.getPositions(walletAddress);
        allPositions.push(...gammaswapPositions);
      } catch (error) {
        console.warn('Failed to fetch GammaSwap positions:', error);
      }

      // Fetch Morpho positions (Base network)
      try {
        const morphoPositions = await this.morphoService.getPositions(walletAddress);
        allPositions.push(...morphoPositions);
      } catch (error) {
        console.warn('Failed to fetch Morpho positions:', error);
      }

      // Fetch Manual positions
      try {
        const manualPositions = await manualPositionsService.convertToDeFiPositions(walletAddress);
        allPositions.push(...manualPositions);
        if (manualPositions.length > 0) {
          console.log(`Added ${manualPositions.length} manual positions for ${walletAddress}`);
        }
      } catch (error) {
        console.warn('Failed to fetch manual positions:', error);
      }

      return allPositions;
    } catch (error) {
      console.error('Error aggregating DeFi positions:', error);
      return [];
    }
  }

  async getPositionsByProtocol(walletAddress: string, protocol: string): Promise<DeFiPosition[]> {
    switch (protocol) {
      case 'uniswap-v3':
        return await this.uniswapV3Service.getAllPositions(walletAddress);
      case 'aerodrome':
        return await this.aerodromeService.getPositions(walletAddress);
      case 'moonwell':
        return await this.moonwellService.getPositions(walletAddress);
      case 'mamo':
        return await this.mamoService.getPositions(walletAddress);
      case 'thena':
        return await this.thenaService.getPositions(walletAddress);
      case 'gammaswap':
        return await this.gammaswapService.getPositions(walletAddress);
      case 'morpho':
        return await this.morphoService.getPositions(walletAddress);
      case 'aave':
        // return await this.getAavePositions(walletAddress);
        return [];
      case 'compound':
        // return await this.getCompoundPositions(walletAddress);
        return [];
      default:
        return [];
    }
  }

  async getTotalDeFiValue(walletAddress: string): Promise<number> {
    const positions = await this.getAllPositions(walletAddress);
    return positions.reduce((total, position) => total + position.value, 0);
  }

  // Mock data for development/testing - scaled to realistic amounts
  async getMockPositions(walletAddress: string): Promise<DeFiPosition[]> {
    return [
      {
        id: 'uniswap-v3-12345',
        protocol: 'uniswap-v3',
        type: 'liquidity',
        tokens: [
          {
            address: '0xA0b86a33E6441b57c8AE6d9c0d1b9f7d9D8c9b8e',
            symbol: 'USDC',
            name: 'USD Coin',
            balance: '25000000',
            decimals: 6,
            price: 1.00,
            value: 25,
          },
          {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            name: 'Ethereum',
            balance: '15000000000000000',
            decimals: 18,
            price: 4500,
            value: 67.5,
          }
        ],
        apy: 18.5,
        value: 92.5,
        claimable: 2.15,
        metadata: {
          tokenId: '12345',
          pool: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8',
          token0: {
            address: '0xA0b86a33E6441b57c8AE6d9c0d1b9f7d9D8c9b8e',
            symbol: 'USDC',
            name: 'USD Coin',
            balance: '25000000',
            decimals: 6,
            price: 1.00,
            value: 25,
          },
          token1: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            name: 'Ethereum',
            balance: '15000000000000000',
            decimals: 18,
            price: 4500,
            value: 67.5,
          },
          fee: 3000,
          tickLower: -276320,
          tickUpper: -276300,
          liquidity: '1234567890123456789',
          uncollectedFees: {
            token0: '5000000',
            token1: '2500000000000000',
          },
          inRange: true,
        }
      },
      {
        id: 'aave-eth-lending',
        protocol: 'aave',
        type: 'lending',
        tokens: [
          {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            name: 'Ethereum',
            balance: '45000000000000000',
            decimals: 18,
            price: 4500,
            value: 202.5,
          }
        ],
        apy: 4.2,
        value: 202.5,
        claimable: 1.85,
      },
      {
        id: 'lido-staking',
        protocol: 'lido',
        type: 'staking',
        tokens: [
          {
            address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
            symbol: 'stETH',
            name: 'Liquid staked Ether 2.0',
            balance: '25000000000000000',
            decimals: 18,
            price: 4480,
            value: 112,
          }
        ],
        apy: 3.8,
        value: 112,
        claimable: 0,
      },
      {
        id: 'aerodrome-eth-usdc',
        protocol: 'aerodrome',
        type: 'liquidity',
        tokens: [
          {
            address: '0x4200000000000000000000000000000000000006',
            symbol: 'WETH',
            name: 'Wrapped Ethereum',
            balance: '30000000000000000',
            decimals: 18,
            price: 4500,
            value: 135,
          },
          {
            address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            symbol: 'USDC',
            name: 'USD Coin',
            balance: '135000000',
            decimals: 6,
            price: 1,
            value: 135,
          }
        ],
        apy: 28.5,
        value: 270,
        claimable: 3.25,
        metadata: {
          pairAddress: '0x6cDcb1C4A4D1C3C6d054b27AC5B77e89eAFb971d',
          token0: {
            address: '0x4200000000000000000000000000000000000006',
            symbol: 'WETH',
            name: 'Wrapped Ethereum',
            balance: '30000000000000000',
            decimals: 18,
            price: 4500,
            value: 135,
          },
          token1: {
            address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            symbol: 'USDC',
            name: 'USD Coin',
            balance: '135000000',
            decimals: 6,
            price: 1,
            value: 135,
          },
          isStable: false,
          gauge: {
            address: '0x7d7F1765aCbaF847b9A1f7137FE8Ed4931FbfEbA',
            rewards: [{
              address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
              symbol: 'AERO',
              name: 'Aerodrome',
              balance: '90500000000000000000',
              decimals: 18,
              price: 0.5,
              value: 45.25,
            }],
            emissions: 28.5,
          },
          lpTokenBalance: '100000000000000000000',
          totalSupply: '10000000000000000000000',
        }
      },
      {
        id: 'moonwell-usdc-supply',
        protocol: 'moonwell',
        type: 'lending',
        tokens: [
          {
            address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            symbol: 'USDC',
            name: 'USD Coin',
            balance: '150000000',
            decimals: 6,
            price: 1,
            value: 150,
          }
        ],
        apy: 12.5,
        value: 150,
        claimable: 1.25,
        metadata: {
          market: '0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22',
          asset: {
            address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            symbol: 'USDC',
            name: 'USD Coin',
            balance: '150000000',
            decimals: 6,
            price: 1,
            value: 150,
          },
          supplied: '150000000',
          supplyAPY: 12.5,
          collateralFactor: 0.90,
          isCollateral: true,
          rewardsEarned: [{
            address: '0xFF8adeC2221f9f4D8dfbAFa6B9a297d17603493D',
            symbol: 'WELL',
            name: 'Moonwell',
            balance: '175000000000000000000',
            decimals: 18,
            price: 0.05,
            value: 8.75,
          }],
        }
      },
      // Mamo positions
      {
        id: 'mamo-token-holdings',
        protocol: 'mamo',
        type: 'token',
        tokens: [{
          address: '0x7300B37DfdfAb110d83290A29DfB31B1740219fE',
          symbol: 'MAMO',
          name: 'Mamo Token',
          balance: '1250.50',
          decimals: 18,
          price: 0.85,
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
          address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          symbol: 'USDC',
          name: 'USD Coin',
          balance: '2500.00',
          decimals: 6,
          price: 1.00,
          value: 2500.00,
        }],
        value: 2500.00,
        apy: 8.5,
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
          address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
          symbol: 'cbBTC',
          name: 'Coinbase Wrapped BTC',
          balance: '0.05',
          decimals: 8,
          price: 95000,
          value: 4750.00,
        }],
        value: 4750.00,
        apy: 4.2,
        claimable: 8.25,
        metadata: {
          strategyAddress: '0x0000000000000000000000000000000000000001',
          description: 'Mamo Auto-Compound Strategy (cbBTC)',
          isStrategy: true,
          platform: 'Moonwell',
        }
      },
      // Thena positions
      {
        id: 'thena-vethe-12345',
        protocol: 'thena',
        type: 'staking',
        tokens: [{
          address: '0xf4c8e32eadec4bfe97e0f595add0f4450a863a11',
          symbol: 'veTHE #12345',
          name: 'Vote-Escrowed THE NFT #12345',
          balance: '1500.25',
          decimals: 18,
          price: 0.12,
          value: 180.03,
        }],
        value: 180.03,
        apy: 0,
        claimable: 0,
        metadata: {
          tokenId: '12345',
          lockedAmount: '1500250000000000000000',
          votingPower: '750000000000000000000',
          lockEndTime: Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60),
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

// Export singleton instance
export const defiAggregator = new DeFiPositionAggregator();