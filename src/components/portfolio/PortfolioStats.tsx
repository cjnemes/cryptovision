'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface PortfolioStatsProps {
  totalValue: number
  totalChange24h?: number
  defiValue?: number
  averageYield?: number
  isLoading: boolean
}

export function PortfolioStats({ 
  totalValue, 
  totalChange24h = 0, 
  defiValue = 0, 
  averageYield = 0,
  isLoading 
}: PortfolioStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const changeColor = totalChange24h >= 0 ? 'text-green-500' : 'text-red-500'
  const changePrefix = totalChange24h >= 0 ? '+' : ''

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Portfolio Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalValue)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span className={changeColor}>
              {changePrefix}{formatCurrency(totalChange24h)} ({formatPercent(totalChange24h / Math.max(totalValue, 1) * 100)})
            </span>{' '}
            today
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
            DeFi Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(defiValue)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {defiValue > 0 ? 'Across multiple protocols' : 'No active positions'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Average Yield
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatPercent(averageYield)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {averageYield > 0 ? 'Weighted average APY' : 'No yield positions'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}