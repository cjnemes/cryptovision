'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ArrowTrendingUpIcon, 
  BanknotesIcon,
  TrophyIcon,
  FireIcon,
  PresentationChartBarIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline'

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-600 to-slate-600 rounded-2xl blur opacity-20 animate-pulse"></div>
            <Card className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl animate-shimmer"></div>
                <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded-full animate-shimmer"></div>
              </div>
              <div className="w-32 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg mb-3 animate-shimmer"></div>
              <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer"></div>
            </Card>
          </div>
        ))}
      </div>
    )
  }

  const changeColor = totalChange24h >= 0 ? 'text-emerald-500' : 'text-red-500'
  const changePrefix = totalChange24h >= 0 ? '+' : ''

  const defiAllocation = totalValue > 0 ? (defiValue / totalValue) * 100 : 0
  const spotValue = totalValue - defiValue

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-in-up">
      {/* Total Portfolio Value - Premium Card */}
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <Card className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl border-0 shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:-translate-y-1 h-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-30"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrophyIcon className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30">
                  TOTAL VALUE
                </div>
                <div className="text-xs text-slate-500 mt-1">Multi-chain</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                {formatCurrency(totalValue)}
              </div>
              
              {totalChange24h !== 0 && (
                <div className={`flex items-center space-x-2 ${changeColor}`}>
                  <div className={`p-1 rounded-full ${totalChange24h >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    {totalChange24h >= 0 ? (
                      <ArrowUpIcon className="h-3 w-3" />
                    ) : (
                      <ArrowDownIcon className="h-3 w-3" />
                    )}
                  </div>
                  <span className="text-sm font-bold">
                    {changePrefix}{formatCurrency(Math.abs(totalChange24h))}
                  </span>
                  <span className="text-xs text-slate-500">24h</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Live tracking enabled</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Spot Holdings - Elegant Card */}
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-400 to-slate-600 rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
        <Card className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-1 h-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
                <CircleStackIcon className="h-7 w-7 text-slate-600 dark:text-slate-300" />
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700">
                SPOT ASSETS
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(spotValue)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {totalValue > 0 ? `${(100 - defiAllocation).toFixed(1)}%` : '0%'} of portfolio
                </span>
                <div className="w-12 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-slate-400 to-slate-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${100 - defiAllocation}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* DeFi Positions - Vibrant Card */}
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <Card className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl border-0 shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:-translate-y-1 h-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-30"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <PresentationChartBarIcon className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="text-xs font-bold text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30">
                DEFI POSITIONS
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(defiValue)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  {defiValue > 0 ? `${defiAllocation.toFixed(1)}% allocated` : 'No positions'}
                </span>
                <div className="w-12 h-2 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${defiAllocation}%` }}
                  ></div>
                </div>
              </div>
              {defiValue > 0 && (
                <div className="flex items-center space-x-2 text-xs">
                  <FireIcon className="h-3 w-3 text-orange-500" />
                  <span className="text-slate-600 dark:text-slate-400">Active earning</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Average Yield - Success Card */}
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <Card className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl border-0 shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:-translate-y-1 h-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl blur opacity-30"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <ArrowTrendingUpIcon className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="text-xs font-bold text-transparent bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30">
                YIELD APY
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatPercent(averageYield)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {averageYield > 0 ? 'Weighted avg' : 'No active yield'}
                </span>
                {averageYield > 0 && (
                  <div className="flex items-center space-x-1 text-xs text-emerald-600">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span>Live</span>
                  </div>
                )}
              </div>
              {averageYield > 0 && (
                <div className="text-xs text-slate-500">
                  Generating ~{formatCurrency((defiValue * averageYield) / 365)} daily
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}