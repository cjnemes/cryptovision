'use client';

import { useDeFiPositions } from '@/hooks/useDeFiPositions';
import { usePerformanceTracking } from '@/hooks/usePerformanceTracking';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { formatPnL, formatPnLPercent, getPnLColorClass } from '@/lib/analytics/performance-tracker';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, TrendingUpIcon, TrendingDownIcon } from '@heroicons/react/24/outline';

export function PnLDashboard() {
  // Get current positions
  const { positions, isLoading: positionsLoading } = useDeFiPositions();
  
  // Get performance metrics
  const {
    performanceMetrics,
    isLoading: pnlLoading,
    error,
    getTotalPnL,
    getPortfolioValueHistory
  } = usePerformanceTracking(positions, { autoRefresh: true });
  
  const isLoading = positionsLoading || pnlLoading;

  if (isLoading) {
    return <PnLDashboardLoader />;
  }

  if (error || !performanceMetrics) {
    return <PnLDashboardError />;
  }

  const totalPnL = getTotalPnL();
  const isProfit = totalPnL.amount >= 0;
  
  // Get top and worst performers
  const topPerformers = [...performanceMetrics.positions]
    .filter(p => p.unrealizedPnL !== 0)
    .sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent)
    .slice(0, 5);
    
  const worstPerformers = [...performanceMetrics.positions]
    .filter(p => p.unrealizedPnL !== 0)
    .sort((a, b) => a.unrealizedPnLPercent - b.unrealizedPnLPercent)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* P&L Summary */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Portfolio P&L Summary</h3>
          <div className="flex items-center space-x-2">
            {isProfit ? (
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
            ) : (
              <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
            )}
            <span className={`text-sm font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {isProfit ? 'Profitable' : 'Loss'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl">
            <div className="flex items-center justify-center mb-2">
              {isProfit ? (
                <TrendingUpIcon className="w-6 h-6 text-green-500 mr-2" />
              ) : (
                <TrendingDownIcon className="w-6 h-6 text-red-500 mr-2" />
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total P&L</p>
            </div>
            <p className={`text-3xl font-black mb-1 ${getPnLColorClass(totalPnL.amount).text}`}>
              {formatPnL(totalPnL.amount)}
            </p>
            <p className={`text-sm font-semibold ${getPnLColorClass(totalPnL.percent).text}`}>
              {formatPnLPercent(totalPnL.percent)}
            </p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">Current Value</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              {formatCurrency(performanceMetrics.totalValue)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Portfolio Value</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl">
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-2">Entry Value</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              {formatCurrency(performanceMetrics.totalEntryValue)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Cost Basis</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-2">24h Change</p>
            <p className={`text-2xl font-black mb-1 ${getPnLColorClass(performanceMetrics.dailyChange).text}`}>
              {formatPnL(performanceMetrics.dailyChange)}
            </p>
            <p className={`text-xs font-semibold ${getPnLColorClass(performanceMetrics.dailyChangePercent).text}`}>
              {formatPnLPercent(performanceMetrics.dailyChangePercent)}
            </p>
          </div>
        </div>
      </div>

      {/* Position P&L Breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center">
          <TrendingUpIcon className="w-5 h-5 mr-2 text-blue-500" />
          Position Performance
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-600">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Position</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Protocol</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Entry Value</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Current Value</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">P&L</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">P&L %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
              {performanceMetrics.positions.map((position, index) => {
                const positionData = positions.find(p => p.id === position.positionId);
                if (!positionData) return null;
                
                return (
                  <tr key={position.positionId} className={`${index % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-800'} hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors`}>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            {positionData.protocol === 'uniswap-v3' ? '🦄' : 
                             positionData.protocol === 'aave' ? '👻' :
                             positionData.protocol === 'moonwell' ? '🌙' :
                             positionData.protocol === 'aerodrome' ? '🛩️' : '💎'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">
                            {position.type} Position
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {positionData.tokens.map(t => t.symbol).join(' / ')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                        {position.protocol}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {formatCurrency(position.entryValue)}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {formatCurrency(position.currentValue)}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className={`font-semibold text-sm ${getPnLColorClass(position.unrealizedPnL).text}`}>
                        {formatPnL(position.unrealizedPnL)}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end">
                        {position.unrealizedPnL >= 0 ? (
                          <ArrowTrendingUpIcon className={`h-4 w-4 mr-1 ${getPnLColorClass(position.unrealizedPnL).text.replace('text-', 'text-')}`} />
                        ) : (
                          <ArrowTrendingDownIcon className={`h-4 w-4 mr-1 ${getPnLColorClass(position.unrealizedPnL).text.replace('text-', 'text-')}`} />
                        )}
                        <p className={`font-semibold text-sm ${getPnLColorClass(position.unrealizedPnLPercent).text}`}>
                          {formatPnLPercent(position.unrealizedPnLPercent)}
                        </p>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm p-6">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
            <TrendingUpIcon className="w-5 h-5 mr-2 text-emerald-500" />
            Time-based Performance
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-slate-600 dark:text-slate-400 font-medium">24h Change</span>
              <div className="text-right">
                <span className={`font-semibold ${getPnLColorClass(performanceMetrics.dailyChange).text}`}>
                  {formatPnL(performanceMetrics.dailyChange)}
                </span>
                <div className={`text-sm ${getPnLColorClass(performanceMetrics.dailyChangePercent).text}`}>
                  {formatPnLPercent(performanceMetrics.dailyChangePercent)}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-slate-600 dark:text-slate-400 font-medium">7d Change</span>
              <div className="text-right">
                <span className={`font-semibold ${getPnLColorClass(performanceMetrics.weeklyChange).text}`}>
                  {formatPnL(performanceMetrics.weeklyChange)}
                </span>
                <div className={`text-sm ${getPnLColorClass(performanceMetrics.weeklyChangePercent).text}`}>
                  {formatPnLPercent(performanceMetrics.weeklyChangePercent)}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-slate-600 dark:text-slate-400 font-medium">30d Change</span>
              <div className="text-right">
                <span className={`font-semibold ${getPnLColorClass(performanceMetrics.monthlyChange).text}`}>
                  {formatPnL(performanceMetrics.monthlyChange)}
                </span>
                <div className={`text-sm ${getPnLColorClass(performanceMetrics.monthlyChangePercent).text}`}>
                  {formatPnLPercent(performanceMetrics.monthlyChangePercent)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm p-6">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
            <ArrowTrendingUpIcon className="w-5 h-5 mr-2 text-emerald-500" />
            Top Performers
          </h4>
          <div className="space-y-3">
            {topPerformers.slice(0, 5).map((position, index) => {
              const positionData = positions.find(p => p.id === position.positionId);
              if (!positionData) return null;
              
              return (
                <div key={position.positionId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors">
                  <div className="flex items-center">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                      index === 0 ? 'bg-yellow-200 text-yellow-800' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-amber-200 text-amber-800' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-medium text-slate-900 dark:text-white text-sm">
                        {position.protocol}
                      </span>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {positionData.tokens.map(t => t.symbol).join('/')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-sm ${getPnLColorClass(position.unrealizedPnL).text}`}>
                      {formatPnLPercent(position.unrealizedPnLPercent)}
                    </span>
                    <div className={`text-xs ${getPnLColorClass(position.unrealizedPnL).text}`}>
                      {formatPnL(position.unrealizedPnL)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PnLDashboardLoader() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-4 bg-gray-200 rounded w-20 mx-auto mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-24 mx-auto mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="h-6 bg-gray-200 rounded w-40 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PnLDashboardError() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm p-6 text-center">
      <div className="text-gray-400 mb-4">
        <span className="text-6xl">⚠️</span>
      </div>
      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Unable to Load P&L Data</h3>
      <p className="text-slate-600 dark:text-slate-400">
        There was an error loading your profit/loss information. Please try connecting your wallet or adding DeFi positions.
      </p>
    </div>
  );
}