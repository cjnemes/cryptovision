import { NextRequest, NextResponse } from 'next/server'

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'

// Token symbol/address to CoinGecko ID mapping
const TOKEN_ID_MAP: Record<string, string> = {
  // Contract addresses
  '0x0000000000000000000000000000000000000000': 'ethereum', // ETH
  '0xa0b86a33e6441b57c8ae6d9c0d1b9f7d9d8c9b8e': 'ethereum', // ETH (placeholder)
  '0xA0b86a33E6441b57c8AE6d9c0d1b9f7d9D8c9b8e': 'ethereum', // ETH
  '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'tether', // USDT
  '0xA0b86a33E644123456789012345678901234567890': 'usd-coin', // USDC
  '0xA0b86a33E644987654321098765432109876543210': 'uniswap', // UNI
  '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': 'uniswap', // UNI
  '0x6B175474E89094C44Da98b954EedeAC495271d0F': 'dai', // DAI
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 'wrapped-bitcoin', // WBTC
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'weth', // WETH
  '0x940181a94A35A4569E4529A3CDfB74e38FD98631': 'aerodrome-finance', // AERO
  
  // Symbols  
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
  'SEAM': 'seamless-protocol',
  'EXTRA': 'extra-finance',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tokenAddresses, symbols } = body
    
    // Support both legacy tokenAddresses and new symbols format
    const tokens = tokenAddresses || symbols || []
    
    if (!Array.isArray(tokens)) {
      return NextResponse.json(
        { error: 'tokenAddresses or symbols must be an array' },
        { status: 400 }
      )
    }

    // Map contract addresses/symbols to CoinGecko IDs
    const coinGeckoIds = tokens
      .map(token => TOKEN_ID_MAP[token.toLowerCase()] || TOKEN_ID_MAP[token.toUpperCase()] || null)
      .filter(Boolean)

    if (coinGeckoIds.length === 0) {
      return NextResponse.json({
        prices: {},
        timestamp: new Date().toISOString()
      })
    }

    // Fetch prices from CoinGecko
    const url = `${COINGECKO_API_URL}/simple/price?ids=${coinGeckoIds.join(',')}&vs_currencies=usd&include_24hr_change=true`
    
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'User-Agent': 'CryptoVision/1.0'
    }
    
    // Add API key if available
    if (process.env.COINGECKO_API_KEY && process.env.COINGECKO_API_KEY !== '') {
      headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY
    }

    const response = await fetch(url, { 
      headers,
      // Add timeout and error handling
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })
    
    if (!response.ok) {
      console.warn(`CoinGecko API error: ${response.status} ${response.statusText}`)
      // Return empty prices on API error rather than throwing
      return NextResponse.json({
        prices: {},
        timestamp: new Date().toISOString(),
        warning: `Price API temporarily unavailable (${response.status})`
      })
    }

    const priceData = await response.json()

    // Map prices back to tokens (addresses or symbols)
    const prices: Record<string, { price: number; change24h: number }> = {}
    
    tokens.forEach(token => {
      const coinGeckoId = TOKEN_ID_MAP[token.toLowerCase()] || TOKEN_ID_MAP[token.toUpperCase()]
      if (coinGeckoId && priceData[coinGeckoId]) {
        prices[token] = {
          price: priceData[coinGeckoId].usd || 0,
          change24h: priceData[coinGeckoId].usd_24h_change || 0
        }
      }
    })

    return NextResponse.json({
      prices,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch token prices' },
      { status: 500 }
    )
  }
}