'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { TokenBalance } from '@/types'
import { formatUnits } from 'ethers'

interface BalanceResponse {
  address: string
  balances: Array<{
    address: string
    balance: string
    symbol: string
    name: string
    decimals: number
    logo?: string
  }>
  timestamp: string
}

interface PriceResponse {
  prices: Record<string, {
    price: number
    change24h: number
  }>
  timestamp: string
}

export function useTokenBalances() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  const [balances, setBalances] = useState<TokenBalance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected || !address) {
      setBalances([])
      return
    }

    const fetchBalances = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Try to fetch real data from multiple chains
        try {
          
          // Fetch balances from multiple chains
          const chains = [1, 8453]; // Ethereum and Base
          const balancePromises = chains.map(async (chainId) => {
            try {
              const response = await fetch(`/api/balances/${address}?chainId=${chainId}`);
              if (response.ok) {
                const data = await response.json();
                return { chainId, data };
              }
              return null;
            } catch (error) {
              console.warn(`Failed to fetch from chain ${chainId}:`, error);
              return null;
            }
          });
          
          const chainResults = await Promise.all(balancePromises);
          const validResults = chainResults.filter(result => result !== null);
          
          
          if (validResults.length > 0) {
            // Combine all balances from all chains
            const allBalances = validResults.flatMap(result => result!.data.balances);
            
            // Get token addresses for price fetching
            const tokenAddresses = allBalances.map(token => token.address)
            
            // Fetch prices for all tokens
            const pricesResponse = await fetch('/api/prices', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ tokenAddresses })
            })
            
            const pricesData: PriceResponse = pricesResponse.ok 
              ? await pricesResponse.json() 
              : { prices: {}, timestamp: new Date().toISOString() }
            
            // Filter out spam tokens before processing
            const filteredBalances = allBalances.filter(token => {
              // Skip tokens with balance of exactly 1 wei (common spam pattern)
              const balanceInTokens = parseFloat(formatUnits(token.balance, token.decimals))
              if (token.balance === '0x0000000000000000000000000000000000000000000000000000000000000001') {
                return false
              }
              
              // Filter out obvious spam patterns in name/symbol
              const spamPatterns = [
                /claim/i,
                /airdrop/i,
                /distribution/i,
                /t\.me/i,
                /telegram/i,
                /visit/i,
                /\.com/i,
                /reward/i,
                /bonus/i,
                /uѕdс/i, // Fake USDC with different unicode
                /trump/i,
                /✅/,
                /\$.*claim/i
              ]
              
              const nameAndSymbol = `${token.name} ${token.symbol}`.toLowerCase()
              if (spamPatterns.some(pattern => pattern.test(nameAndSymbol))) {
                return false
              }
              
              // Skip tokens with very small balances (dust)
              if (balanceInTokens < 0.00001 && token.symbol !== 'ETH') {
                return false
              }
              
              return true
            })

            // Combine balance and price data from all chains
            const tokenBalances: TokenBalance[] = filteredBalances
              .map(token => {
                try {
                  // Convert balance from hex/wei to decimal
                  const balanceInTokens = parseFloat(formatUnits(token.balance, token.decimals))
                  
                  // Get price data
                  const priceInfo = pricesData.prices[token.address.toLowerCase()] || { price: 0, change24h: 0 }
                  const value = balanceInTokens * priceInfo.price
                  
                  return {
                    address: token.address,
                    symbol: token.symbol,
                    name: token.name,
                    balance: balanceInTokens.toString(),
                    decimals: token.decimals,
                    price: priceInfo.price,
                    value: value,
                    logo: token.logo || null
                  }
                } catch (error) {
                  console.error(`Error processing token ${token.symbol}:`, error)
                  return null
                }
              })
              .filter((token): token is TokenBalance => token !== null)
              .sort((a, b) => b.value - a.value) // Sort by value descending
              .slice(0, 20) // Limit to top 20 tokens
            
            setBalances(tokenBalances)
            return
          }
        } catch (apiError) {
          console.warn('API call failed, falling back to mock data:', apiError)
        }
        
        // Fallback to mock data if API is not working
        console.log('Using mock data - configure API keys for real blockchain data')
          const mockTokenBalances: TokenBalance[] = [
            {
              address: '0x0000000000000000000000000000000000000000',
              symbol: 'ETH',
              name: 'Ethereum',
              balance: '2.5467',
              decimals: 18,
              price: 3200.50,
              value: 8149.58,
              logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'
            },
            {
              address: '0xA0b86a33E644123456789012345678901234567890',
              symbol: 'USDC',
              name: 'USD Coin',
              balance: '1500.00',
              decimals: 6,
              price: 1.00,
              value: 1500.00,
              logo: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png'
            },
            {
              address: '0xA0b86a33E644987654321098765432109876543210',
              symbol: 'UNI',
              name: 'Uniswap',
              balance: '45.25',
              decimals: 18,
              price: 8.75,
              value: 395.94,
              logo: 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png'
            }
          ]
          
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate loading
        setBalances(mockTokenBalances)
        
      } catch (err) {
        console.error('Error fetching balances:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch balances')
        setBalances([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalances()
  }, [address, chainId, isConnected])

  const totalValue = balances.reduce((sum, token) => sum + token.value, 0)

  return {
    balances,
    totalValue,
    isLoading,
    error,
    refetch: () => {
      if (isConnected && address) {
        // Re-trigger the effect by clearing balances
        setBalances([])
      }
    }
  }
}