import { ethers } from 'ethers';
import { DeFiPosition } from '@/types';
import { createUniswapV3Service } from './uniswapV3';
import { createAerodromeService } from './aerodrome';
import { createMoonwellService } from './moonwell';

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

  constructor(rpcUrl?: string) {
    // Use Alchemy RPC with API key if available
    const alchemyKey = process.env.ALCHEMY_API_KEY;
    const defaultRpc = alchemyKey 
      ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`
      : 'https://eth-mainnet.g.alchemy.com/v2/demo';
    
    this.provider = new ethers.JsonRpcProvider(rpcUrl || defaultRpc);
    this.uniswapV3Service = createUniswapV3Service(this.provider);
    this.aerodromeService = createAerodromeService();
    this.moonwellService = createMoonwellService();
  }

  async getAllPositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      const allPositions: DeFiPosition[] = [];

      // Fetch Uniswap V3 positions
      try {
        const uniswapPositions = await this.uniswapV3Service.getPositions(walletAddress);
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

      return allPositions;
    } catch (error) {
      console.error('Error aggregating DeFi positions:', error);
      return [];
    }
  }

  async getPositionsByProtocol(walletAddress: string, protocol: string): Promise<DeFiPosition[]> {
    switch (protocol) {
      case 'uniswap-v3':
        return await this.uniswapV3Service.getPositions(walletAddress);
      case 'aerodrome':
        return await this.aerodromeService.getPositions(walletAddress);
      case 'moonwell':
        return await this.moonwellService.getPositions(walletAddress);
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

  // Mock data for development/testing
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
            balance: '1000000000',
            decimals: 6,
            price: 1.00,
            value: 1000,
          },
          {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            name: 'Ethereum',
            balance: '500000000000000000',
            decimals: 18,
            price: 4500,
            value: 2250,
          }
        ],
        apy: 18.5,
        value: 3250,
        claimable: 12.50,
        metadata: {
          tokenId: '12345',
          pool: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8',
          token0: {
            address: '0xA0b86a33E6441b57c8AE6d9c0d1b9f7d9D8c9b8e',
            symbol: 'USDC',
            name: 'USD Coin',
            balance: '1000000000',
            decimals: 6,
            price: 1.00,
            value: 1000,
          },
          token1: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            name: 'Ethereum',
            balance: '500000000000000000',
            decimals: 18,
            price: 4500,
            value: 2250,
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
            balance: '2000000000000000000',
            decimals: 18,
            price: 4500,
            value: 9000,
          }
        ],
        apy: 4.2,
        value: 9000,
        claimable: 5.25,
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
            balance: '5000000000000000000',
            decimals: 18,
            price: 4480,
            value: 22400,
          }
        ],
        apy: 3.8,
        value: 22400,
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
            balance: '1500000000000000000',
            decimals: 18,
            price: 4500,
            value: 6750,
          },
          {
            address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            symbol: 'USDC',
            name: 'USD Coin',
            balance: '6750000000',
            decimals: 6,
            price: 1,
            value: 6750,
          }
        ],
        apy: 28.5,
        value: 13500,
        claimable: 45.25,
        metadata: {
          pairAddress: '0x6cDcb1C4A4D1C3C6d054b27AC5B77e89eAFb971d',
          token0: {
            address: '0x4200000000000000000000000000000000000006',
            symbol: 'WETH',
            name: 'Wrapped Ethereum',
            balance: '1500000000000000000',
            decimals: 18,
            price: 4500,
            value: 6750,
          },
          token1: {
            address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            symbol: 'USDC',
            name: 'USD Coin',
            balance: '6750000000',
            decimals: 6,
            price: 1,
            value: 6750,
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
            balance: '8500000000',
            decimals: 6,
            price: 1,
            value: 8500,
          }
        ],
        apy: 12.5,
        value: 8500,
        claimable: 8.75,
        metadata: {
          market: '0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22',
          asset: {
            address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            symbol: 'USDC',
            name: 'USD Coin',
            balance: '8500000000',
            decimals: 6,
            price: 1,
            value: 8500,
          },
          supplied: '8500000000',
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
      }
    ];
  }
}

// Export singleton instance
export const defiAggregator = new DeFiPositionAggregator();