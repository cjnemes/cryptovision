// Price service to fetch real-time token prices
interface TokenPrice {
  symbol: string;
  price: number;
  change24h?: number;
  lastUpdated: number;
}

interface PriceCache {
  [symbol: string]: TokenPrice;
}

class PriceService {
  private cache: PriceCache = {};
  private cacheTimeout = 60 * 1000; // 1 minute cache

  // Use our internal price API
  private async fetchFromAPI(symbols: string[]): Promise<PriceCache> {
    try {
      // Use absolute URL for server-side requests
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3001'
          : 'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/api/prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbols: symbols
        }),
      });

      if (!response.ok) {
        throw new Error(`Price API error: ${response.status}`);
      }

      const data = await response.json();
      const prices: PriceCache = {};
      const now = Date.now();

      // Map results
      for (const symbol of symbols) {
        if (data.prices && data.prices[symbol]) {
          prices[symbol] = {
            symbol,
            price: data.prices[symbol].price,
            change24h: data.prices[symbol].change24h,
            lastUpdated: now,
          };
        }
      }

      return prices;
    } catch (error) {
      console.error('Failed to fetch prices from API:', error);
      return {};
    }
  }

  private getCoinGeckoId(symbol: string): string | null {
    const mapping: Record<string, string> = {
      'AERO': 'aerodrome-finance',
      'ETH': 'ethereum',
      'WETH': 'weth',
      'USDC': 'usd-coin',
      'USDbC': 'usd-base-coin',
      'DAI': 'dai',
      'USDT': 'tether',
      'BTC': 'bitcoin',
      'WBTC': 'wrapped-bitcoin',
      'cbETH': 'coinbase-wrapped-staked-eth',
      'stETH': 'staked-ether',
      'rETH': 'rocket-pool-eth',
      'WELL': 'moonwell',
      'MAMO': 'mamo',
      'THE': 'thena',
      'GS': 'gammaswap',
      'MORPHO': 'morpho',
    };
    
    return mapping[symbol.toUpperCase()] || null;
  }

  // Get price for a single token
  async getPrice(symbol: string): Promise<number> {
    const prices = await this.getPrices([symbol]);
    return prices[symbol]?.price || 0;
  }

  // Get prices for multiple tokens
  async getPrices(symbols: string[]): Promise<PriceCache> {
    const now = Date.now();
    const symbolsToFetch: string[] = [];
    const result: PriceCache = {};

    // Check cache first
    for (const symbol of symbols) {
      const cached = this.cache[symbol];
      if (cached && (now - cached.lastUpdated) < this.cacheTimeout) {
        result[symbol] = cached;
      } else {
        symbolsToFetch.push(symbol);
      }
    }

    // Fetch missing prices
    if (symbolsToFetch.length > 0) {
      const freshPrices = await this.fetchFromAPI(symbolsToFetch);
      
      // Update cache
      Object.assign(this.cache, freshPrices);
      Object.assign(result, freshPrices);
    }

    return result;
  }

  // Fallback prices if API fails
  getFallbackPrice(symbol: string): number {
    const fallbackPrices: Record<string, number> = {
      'AERO': 1.13,
      'ETH': 4500,
      'WETH': 4500,
      'USDC': 1.0,
      'USDbC': 1.0,
      'DAI': 1.0,
      'USDT': 1.0,
      'BTC': 67000,
      'WBTC': 67000,
      'cbETH': 4800,
      'stETH': 4480,
      'rETH': 4600,
      'WELL': 0.05,
      'MAMO': 0.1206, // Updated from CoinGecko API
      'THE': 0.3466, // Updated from CoinGecko API (Thena Finance)
      'GS': 0.06, // GammaSwap token fallback price
      'MORPHO': 2.15, // Morpho token fallback price
    };
    
    return fallbackPrices[symbol.toUpperCase()] || 1.0;
  }

  // Clear cache (useful for testing or manual refresh)
  clearCache(): void {
    this.cache = {};
  }
}

// Export singleton instance
export const priceService = new PriceService();

// Utility functions
export async function getTokenPrice(symbol: string): Promise<number> {
  try {
    const price = await priceService.getPrice(symbol);
    return price > 0 ? price : priceService.getFallbackPrice(symbol);
  } catch (error) {
    console.warn(`Failed to get price for ${symbol}, using fallback:`, error);
    return priceService.getFallbackPrice(symbol);
  }
}

export async function getTokenPrices(symbols: string[]): Promise<Record<string, number>> {
  try {
    const prices = await priceService.getPrices(symbols);
    const result: Record<string, number> = {};
    
    for (const symbol of symbols) {
      result[symbol] = prices[symbol]?.price || priceService.getFallbackPrice(symbol);
    }
    
    return result;
  } catch (error) {
    console.warn('Failed to get token prices, using fallbacks:', error);
    const result: Record<string, number> = {};
    for (const symbol of symbols) {
      result[symbol] = priceService.getFallbackPrice(symbol);
    }
    return result;
  }
}