'use client'

import { TokenBalance } from '@/types'
import { formatCurrency, formatTokenAmount, formatPercent } from '@/lib/utils'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

interface EnhancedTokenListProps {
  balances: TokenBalance[]
  isLoading: boolean
  error?: string | null
}

export function EnhancedTokenList({ balances, isLoading, error }: EnhancedTokenListProps) {
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-xl">⚠️</span>
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (balances.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-xl">💰</span>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">No tokens found</p>
      </div>
    )
  }

  // Calculate total portfolio value for allocation percentages
  const totalValue = balances.reduce((sum, token) => sum + token.value, 0)

  return (
    <div className="space-y-1">
      {balances.map((token) => {
        const allocation = totalValue > 0 ? (token.value / totalValue) * 100 : 0
        // Mock 24h change - in production this would come from price API
        const change24h = Math.random() * 20 - 10 // Random between -10% and +10%
        const isPositive = change24h >= 0
        
        return (
          <div key={token.address} className="group flex items-center justify-between py-3 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              {token.logo ? (
                <img
                  src={token.logo}
                  alt={token.symbol}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = `https://via.placeholder.com/32/3B82F6/white?text=${token.symbol.slice(0, 2)}`
                  }}
                />
              ) : (
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-xs">
                    {token.symbol.slice(0, 2)}
                  </span>
                </div>
              )}
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {token.symbol}
                  </div>
                  <div className="text-xs text-gray-400">
                    {allocation.toFixed(1)}%
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {formatTokenAmount(token.balance, token.decimals)} {token.symbol}
                </div>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {formatCurrency(token.value)}
              </div>
              <div className="flex items-center justify-end space-x-1">
                <div className="text-xs text-gray-500">
                  {formatCurrency(token.price)}
                </div>
                {Math.abs(change24h) > 0.01 && (
                  <div className={`flex items-center space-x-1 ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isPositive ? (
                      <ArrowUpIcon className="w-3 h-3" />
                    ) : (
                      <ArrowDownIcon className="w-3 h-3" />
                    )}
                    <span className="text-xs font-medium">
                      {formatPercent(Math.abs(change24h))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}