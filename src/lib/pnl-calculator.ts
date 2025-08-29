import { prisma } from './db';
import { PriceTracker } from './price-tracker';
import { ethers } from 'ethers';

export interface PnLData {
  totalPnL: number;
  totalPnLPercent: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalInvested: number;
  currentValue: number;
  breakdown: PnLBreakdown[];
}

export interface PnLBreakdown {
  symbol: string;
  address: string;
  balance: number;
  avgBuyPrice: number;
  currentPrice: number;
  invested: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  realizedPnL: number;
  unrealizedPnL: number;
}

export interface Transaction {
  hash: string;
  timestamp: Date;
  type: string;
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: string;
  amountOut?: string;
  valueUsd?: number;
  gasCostUsd?: number;
}

export class PnLCalculator {
  private priceTracker: PriceTracker;

  constructor() {
    this.priceTracker = new PriceTracker();
  }

  async calculatePnL(walletAddress: string): Promise<PnLData> {
    try {
      // Get or create wallet record
      const wallet = await this.ensureWallet(walletAddress);
      
      // Get all transactions for this wallet
      const transactions = await prisma.transaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { timestamp: 'asc' }
      });

      // Calculate token balances and average prices
      const tokenPositions = await this.calculateTokenPositions(transactions);
      
      // Get current prices for all tokens
      const tokenAddresses = Object.keys(tokenPositions);
      const currentPrices = await this.priceTracker.fetchCurrentPrices(tokenAddresses);
      
      // Store current prices
      await this.priceTracker.storePrices(currentPrices, 'pnl-calculation');

      // Calculate P&L for each token
      const breakdown: PnLBreakdown[] = [];
      let totalInvested = 0;
      let totalCurrentValue = 0;
      let totalRealizedPnL = 0;

      for (const [address, position] of Object.entries(tokenPositions)) {
        const currentPrice = currentPrices.find(p => p.address === address)?.priceUsd || 0;
        const currentValue = position.balance * currentPrice;
        const invested = position.totalInvested;
        const unrealizedPnL = currentValue - invested + position.realizedPnL;
        
        breakdown.push({
          symbol: position.symbol,
          address,
          balance: position.balance,
          avgBuyPrice: position.balance > 0 ? invested / position.balance : 0,
          currentPrice,
          invested,
          currentValue,
          pnl: unrealizedPnL,
          pnlPercent: invested > 0 ? (unrealizedPnL / invested) * 100 : 0,
          realizedPnL: position.realizedPnL,
          unrealizedPnL: currentValue - invested
        });

        totalInvested += invested;
        totalCurrentValue += currentValue;
        totalRealizedPnL += position.realizedPnL;
      }

      const totalPnL = totalCurrentValue - totalInvested + totalRealizedPnL;
      const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
      const unrealizedPnL = totalCurrentValue - totalInvested;

      return {
        totalPnL,
        totalPnLPercent,
        realizedPnL: totalRealizedPnL,
        unrealizedPnL,
        totalInvested,
        currentValue: totalCurrentValue,
        breakdown: breakdown.filter(b => Math.abs(b.pnl) > 0.01 || b.balance > 0) // Filter out dust
      };
    } catch (error) {
      console.error('Error calculating P&L:', error);
      
      // Return mock data for development
      return this.generateMockPnLData();
    }
  }

  private async calculateTokenPositions(transactions: Transaction[]): Promise<Record<string, TokenPosition>> {
    const positions: Record<string, TokenPosition> = {};

    for (const tx of transactions) {
      // Process token inflows (buys, receives)
      if (tx.tokenIn && tx.amountIn) {
        const amount = parseFloat(ethers.formatUnits(tx.amountIn, 18));
        const valueUsd = tx.valueUsd || 0;
        
        if (!positions[tx.tokenIn]) {
          positions[tx.tokenIn] = {
            symbol: this.getTokenSymbol(tx.tokenIn),
            balance: 0,
            totalInvested: 0,
            realizedPnL: 0
          };
        }

        positions[tx.tokenIn].balance += amount;
        positions[tx.tokenIn].totalInvested += valueUsd;
      }

      // Process token outflows (sells, sends)
      if (tx.tokenOut && tx.amountOut) {
        const amount = parseFloat(ethers.formatUnits(tx.amountOut, 18));
        const valueUsd = tx.valueUsd || 0;

        if (!positions[tx.tokenOut]) {
          positions[tx.tokenOut] = {
            symbol: this.getTokenSymbol(tx.tokenOut),
            balance: 0,
            totalInvested: 0,
            realizedPnL: 0
          };
        }

        const prevBalance = positions[tx.tokenOut].balance;
        const avgCostBasis = prevBalance > 0 ? positions[tx.tokenOut].totalInvested / prevBalance : 0;
        
        positions[tx.tokenOut].balance -= amount;
        positions[tx.tokenOut].totalInvested -= amount * avgCostBasis;
        positions[tx.tokenOut].realizedPnL += valueUsd - (amount * avgCostBasis);
      }
    }

    return positions;
  }

  private async ensureWallet(address: string) {
    let wallet = await prisma.wallet.findUnique({
      where: { address: address.toLowerCase() }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          address: address.toLowerCase(),
          name: `Wallet ${address.slice(0, 6)}...${address.slice(-4)}`
        }
      });
    }

    return wallet;
  }

  private getTokenSymbol(address: string): string {
    const tokenSymbols: Record<string, string> = {
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'WETH',
      '0xA0b86a33E6441e845CfA8e17CC0b5e8bBaEf3F0e': 'ETH',
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': 'USDC',
      '0x4200000000000000000000000000000000000006': 'WETH',
      '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb': 'DAI',
      '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22': 'cbETH',
      '0x940181a94A35A4569E4529A3CDfB74e38FD98631': 'AERO',
    };

    return tokenSymbols[address] || `TOKEN_${address.slice(-4)}`;
  }

  private generateMockPnLData(): PnLData {
    const breakdown: PnLBreakdown[] = [
      {
        symbol: 'ETH',
        address: '0xA0b86a33E6441e845CfA8e17CC0b5e8bBaEf3F0e',
        balance: 12.5,
        avgBuyPrice: 2850,
        currentPrice: 3250,
        invested: 35625,
        currentValue: 40625,
        pnl: 5000,
        pnlPercent: 14.04,
        realizedPnL: 1200,
        unrealizedPnL: 3800
      },
      {
        symbol: 'USDC',
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        balance: 15000,
        avgBuyPrice: 1.00,
        currentPrice: 0.999,
        invested: 15000,
        currentValue: 14985,
        pnl: -15,
        pnlPercent: -0.10,
        realizedPnL: 0,
        unrealizedPnL: -15
      },
      {
        symbol: 'AERO',
        address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
        balance: 5000,
        avgBuyPrice: 0.95,
        currentPrice: 1.25,
        invested: 4750,
        currentValue: 6250,
        pnl: 1500,
        pnlPercent: 31.58,
        realizedPnL: 250,
        unrealizedPnL: 1250
      }
    ];

    const totalInvested = breakdown.reduce((sum, b) => sum + b.invested, 0);
    const totalCurrentValue = breakdown.reduce((sum, b) => sum + b.currentValue, 0);
    const totalRealizedPnL = breakdown.reduce((sum, b) => sum + b.realizedPnL, 0);
    const totalPnL = breakdown.reduce((sum, b) => sum + b.pnl, 0);

    return {
      totalPnL,
      totalPnLPercent: (totalPnL / totalInvested) * 100,
      realizedPnL: totalRealizedPnL,
      unrealizedPnL: totalCurrentValue - totalInvested,
      totalInvested,
      currentValue: totalCurrentValue,
      breakdown
    };
  }
}

interface TokenPosition {
  symbol: string;
  balance: number;
  totalInvested: number;
  realizedPnL: number;
}