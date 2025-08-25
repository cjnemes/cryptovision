'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { TokenBalance } from '@/types'

// Mock data for development - replace with real API calls
const mockTokenBalances: TokenBalance[] = [
  {
    address: '0xA0b86a33E6441b57c8AE6d9c0d1b9f7d9D8c9b8e',
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
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // TODO: Replace with real API calls
        // const response = await fetch(`/api/balances/${address}?chainId=${chainId}`)
        // const data = await response.json()
        
        setBalances(mockTokenBalances)
      } catch (err) {
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
        // Re-trigger the effect
        setBalances([])
      }
    }
  }
}