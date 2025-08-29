import { prisma } from './db';

interface PriceData {
  address: string;
  symbol: string;
  priceUsd: number;
  timestamp: Date;
}

interface CoinGeckoPrice {
  id: string;
  symbol: string;
  current_price: number;
  last_updated: string;
}

interface CoinMarketCapPrice {
  symbol: string;
  quote: {
    USD: {
      price: number;
      last_updated: string;
    };
  };
}

export class PriceTracker {
  private coinGeckoApiKey = process.env.COINGECKO_API_KEY;
  private coinMarketCapApiKey = process.env.COINMARKETCAP_API_KEY;

  // Token address to CoinGecko ID mapping for common tokens
  private tokenMappings: Record<string, string> = {
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'ethereum', // WETH
    '0xA0b86a33E6441e845CfA8e17CC0b5e8bBaEf3F0e': 'ethereum', // ETH (Base)
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': 'usd-coin', // USDC (Base)
    '0x4200000000000000000000000000000000000006': 'ethereum', // WETH (Base)
    '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb': 'dai', // DAI (Base)
    '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22': 'compound-basic-attention-token', // cbETH (Base)
    '0x940181a94A35A4569E4529A3CDfB74e38FD98631': 'aerodrome-finance', // AERO
  };

  async fetchCurrentPrices(addresses: string[]): Promise<PriceData[]> {
    const prices: PriceData[] = [];
    
    // Try CoinGecko first
    if (this.coinGeckoApiKey) {
      const geckoIds = addresses
        .map(addr => this.tokenMappings[addr])
        .filter(Boolean);
      
      if (geckoIds.length > 0) {
        const geckoPrices = await this.fetchCoinGeckoPrices(geckoIds);
        prices.push(...geckoPrices);
      }
    }
    
    // Fallback to CoinMarketCap for missing prices
    if (this.coinMarketCapApiKey && prices.length < addresses.length) {
      const missingAddresses = addresses.filter(addr => 
        !prices.find(p => p.address === addr)
      );
      const cmcPrices = await this.fetchCoinMarketCapPrices(missingAddresses);
      prices.push(...cmcPrices);
    }

    // If still missing prices, use mock data for development
    if (prices.length < addresses.length) {
      const mockPrices = this.generateMockPrices(addresses.filter(addr => 
        !prices.find(p => p.address === addr)
      ));
      prices.push(...mockPrices);
    }

    return prices;
  }

  private async fetchCoinGeckoPrices(geckoIds: string[]): Promise<PriceData[]> {
    if (!this.coinGeckoApiKey) return [];

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${geckoIds.join(',')}&x_cg_demo_api_key=${this.coinGeckoApiKey}`
      );
      
      if (!response.ok) {
        console.warn('CoinGecko API request failed:', response.statusText);
        return [];
      }

      const data: CoinGeckoPrice[] = await response.json();
      
      return data.map(coin => ({
        address: this.getAddressByGeckoId(coin.id) || '',
        symbol: coin.symbol.toUpperCase(),
        priceUsd: coin.current_price,
        timestamp: new Date(coin.last_updated)
      })).filter(p => p.address);
    } catch (error) {
      console.error('Error fetching CoinGecko prices:', error);
      return [];
    }
  }

  private async fetchCoinMarketCapPrices(addresses: string[]): Promise<PriceData[]> {
    if (!this.coinMarketCapApiKey || addresses.length === 0) return [];

    try {
      const symbols = addresses.map(addr => this.getSymbolByAddress(addr)).filter(Boolean);
      if (symbols.length === 0) return [];

      const response = await fetch(
        `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbols.join(',')}`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': this.coinMarketCapApiKey
          }
        }
      );

      if (!response.ok) {
        console.warn('CoinMarketCap API request failed:', response.statusText);
        return [];
      }

      const result = await response.json();
      const data = result.data;

      return Object.values(data).map((coin: any) => ({
        address: this.getAddressBySymbol(coin.symbol) || '',
        symbol: coin.symbol,
        priceUsd: coin.quote.USD.price,
        timestamp: new Date(coin.quote.USD.last_updated)
      })).filter(p => p.address);
    } catch (error) {
      console.error('Error fetching CoinMarketCap prices:', error);
      return [];
    }
  }

  private generateMockPrices(addresses: string[]): PriceData[] {
    const mockData: Record<string, { symbol: string; basePrice: number }> = {
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': { symbol: 'WETH', basePrice: 3250 },
      '0xA0b86a33E6441e845CfA8e17CC0b5e8bBaEf3F0e': { symbol: 'ETH', basePrice: 3250 },
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': { symbol: 'USDC', basePrice: 1 },
      '0x4200000000000000000000000000000000000006': { symbol: 'WETH', basePrice: 3250 },
      '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb': { symbol: 'DAI', basePrice: 1 },
      '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22': { symbol: 'cbETH', basePrice: 3100 },
      '0x940181a94A35A4569E4529A3CDfB74e38FD98631': { symbol: 'AERO', basePrice: 1.25 },
    };

    return addresses.map(address => {
      const mock = mockData[address];
      if (!mock) {
        return {
          address,
          symbol: 'UNKNOWN',
          priceUsd: 1,
          timestamp: new Date()
        };
      }

      // Add some realistic price volatility
      const volatility = (Math.random() - 0.5) * 0.1; // ±5% random variation
      const currentPrice = mock.basePrice * (1 + volatility);

      return {
        address,
        symbol: mock.symbol,
        priceUsd: Number(currentPrice.toFixed(6)),
        timestamp: new Date()
      };
    });
  }

  async storePrices(prices: PriceData[], source: string = 'api'): Promise<void> {
    try {
      await prisma.tokenPrice.createMany({
        data: prices.map(price => ({
          address: price.address,
          symbol: price.symbol,
          priceUsd: price.priceUsd,
          timestamp: price.timestamp,
          source
        })),
        skipDuplicates: true
      });
    } catch (error) {
      console.error('Error storing prices:', error);
    }
  }

  async getHistoricalPrice(address: string, timestamp: Date): Promise<number | null> {
    try {
      const price = await prisma.tokenPrice.findFirst({
        where: {
          address,
          timestamp: {
            lte: timestamp
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      return price?.priceUsd || null;
    } catch (error) {
      console.error('Error fetching historical price:', error);
      return null;
    }
  }

  async getLatestPrice(address: string): Promise<number | null> {
    try {
      const price = await prisma.tokenPrice.findFirst({
        where: { address },
        orderBy: { timestamp: 'desc' }
      });

      return price?.priceUsd || null;
    } catch (error) {
      console.error('Error fetching latest price:', error);
      return null;
    }
  }

  private getAddressByGeckoId(geckoId: string): string | null {
    const entry = Object.entries(this.tokenMappings).find(([_, id]) => id === geckoId);
    return entry ? entry[0] : null;
  }

  private getSymbolByAddress(address: string): string | null {
    const mockData: Record<string, string> = {
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'ETH',
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': 'USDC',
      '0x940181a94A35A4569E4529A3CDfB74e38FD98631': 'AERO',
    };
    return mockData[address] || null;
  }

  private getAddressBySymbol(symbol: string): string | null {
    const symbolToAddress: Record<string, string> = {
      'ETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      'AERO': '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
    };
    return symbolToAddress[symbol] || null;
  }
}