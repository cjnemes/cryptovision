import { NextRequest, NextResponse } from 'next/server'
import { Alchemy, Network } from 'alchemy-sdk'

// Initialize Alchemy
const settings = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
}

const alchemy = new Alchemy(settings)

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params
    
    // Validate address format
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address' },
        { status: 400 }
      )
    }

    // Get native ETH balance
    const ethBalance = await alchemy.core.getBalance(address, 'latest')
    
    // Get ERC-20 token balances
    const tokenBalances = await alchemy.core.getTokenBalances(address)
    
    // Filter out zero balances and get token metadata
    const nonZeroBalances = tokenBalances.tokenBalances.filter(
      (token) => token.tokenBalance !== '0x0' && parseInt(token.tokenBalance || '0', 16) > 0
    )

    const balancesWithMetadata = await Promise.all(
      nonZeroBalances.slice(0, 20).map(async (token) => {
        try {
          const metadata = await alchemy.core.getTokenMetadata(token.contractAddress)
          return {
            address: token.contractAddress,
            balance: token.tokenBalance,
            symbol: metadata.symbol || 'UNKNOWN',
            name: metadata.name || 'Unknown Token',
            decimals: metadata.decimals || 18,
            logo: metadata.logo
          }
        } catch (error) {
          console.error(`Error fetching metadata for ${token.contractAddress}:`, error)
          return null
        }
      })
    )

    // Add ETH balance to the results
    const results = [
      {
        address: '0x0000000000000000000000000000000000000000',
        balance: ethBalance.toString(),
        symbol: 'ETH',
        name: 'Ethereum',
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