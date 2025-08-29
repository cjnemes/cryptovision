import { NextRequest, NextResponse } from 'next/server'

// Direct HTTP approach to avoid browser/server compatibility issues
const getAlchemyUrl = (chainId: number) => {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey || apiKey === 'demo' || apiKey === 'your_alchemy_api_key_here') {
    return null;
  }
  
  // Map chain IDs to Alchemy endpoints
  const chainEndpoints: Record<number, string> = {
    1: `https://eth-mainnet.g.alchemy.com/v2/${apiKey.trim()}`, // Ethereum
    8453: `https://base-mainnet.g.alchemy.com/v2/${apiKey.trim()}`, // Base
    137: `https://polygon-mainnet.g.alchemy.com/v2/${apiKey.trim()}`, // Polygon
    10: `https://opt-mainnet.g.alchemy.com/v2/${apiKey.trim()}`, // Optimism
    42161: `https://arb-mainnet.g.alchemy.com/v2/${apiKey.trim()}` // Arbitrum
  };
  
  return chainEndpoints[chainId] || null;
}

// Helper function to make RPC calls
async function alchemyRPC(method: string, params: any[] = [], chainId: number = 1) {
  const url = getAlchemyUrl(chainId);
  if (!url) return null;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params
    })
  });

  if (!response.ok) {
    throw new Error(`Alchemy RPC error: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`Alchemy RPC error: ${data.error.message}`);
  }

  return data.result;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params
    const { searchParams } = new URL(request.url)
    const chainId = parseInt(searchParams.get('chainId') || '1')
    
    // Validate address format
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address' },
        { status: 400 }
      )
    }

    const alchemyUrl = getAlchemyUrl(chainId);
    if (!alchemyUrl) {
      return NextResponse.json(
        { 
          error: 'Alchemy API key not configured', 
          message: 'Set ALCHEMY_API_KEY environment variable for real blockchain data' 
        },
        { status: 503 }
      );
    }

    // Get native token balance (ETH on mainnet, ETH on Base, etc.)
    const nativeBalance = await alchemyRPC('eth_getBalance', [address, 'latest'], chainId);
    
    // Get ERC-20 token balances using Alchemy's method
    const tokenBalancesResult = await alchemyRPC('alchemy_getTokenBalances', [address], chainId);
    
    // Filter out zero balances
    const nonZeroBalances = (tokenBalancesResult?.tokenBalances || []).filter(
      (token: any) => token.tokenBalance !== '0x0' && parseInt(token.tokenBalance || '0', 16) > 0
    );

    const balancesWithMetadata = await Promise.all(
      nonZeroBalances.slice(0, 20).map(async (token: any) => {
        try {
          // Get token metadata using RPC call
          const metadata = await alchemyRPC('alchemy_getTokenMetadata', [token.contractAddress], chainId);
          return {
            address: token.contractAddress,
            balance: token.tokenBalance,
            symbol: metadata?.symbol || 'UNKNOWN',
            name: metadata?.name || 'Unknown Token',
            decimals: metadata?.decimals || 18,
            logo: metadata?.logo || null
          }
        } catch (error) {
          console.error(`Error fetching metadata for ${token.contractAddress}:`, error)
          return null
        }
      })
    )

    // Get native token info based on chain
    const nativeTokenInfo = {
      1: { symbol: 'ETH', name: 'Ethereum' },
      8453: { symbol: 'ETH', name: 'Ethereum (Base)' },
      137: { symbol: 'MATIC', name: 'Polygon' },
      10: { symbol: 'ETH', name: 'Ethereum (Optimism)' },
      42161: { symbol: 'ETH', name: 'Ethereum (Arbitrum)' }
    }[chainId] || { symbol: 'ETH', name: 'Ethereum' };
    
    // Add native token balance to the results
    const results = [
      {
        address: '0x0000000000000000000000000000000000000000',
        balance: nativeBalance || '0x0',
        symbol: nativeTokenInfo.symbol,
        name: nativeTokenInfo.name,
        decimals: 18,
        logo: null
      },
      ...balancesWithMetadata.filter(Boolean)
    ]

    return NextResponse.json({
      address,
      balances: results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching balances:', error)
    return NextResponse.json(
      { error: 'Failed to fetch token balances' },
      { status: 500 }
    )
  }
}