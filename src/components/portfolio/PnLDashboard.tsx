'use client';

import { usePnLData } from '@/hooks/usePnLData';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

export function PnLDashboard() {
  const { data: pnlData, isLoading, error } = usePnLData();

  if (isLoading) {
    return <PnLDashboardLoader />;
  }

  if (error || !pnlData) {
    return <PnLDashboardError />;
  }

  const isProfit = pnlData.totalPnL >= 0;

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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Total P&L</p>
            <p className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {isProfit ? '+' : ''}{formatCurrency(pnlData.totalPnL)}
            </p>
            <p className={`text-sm ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              ({isProfit ? '+' : ''}{formatPercent(pnlData.totalPnLPercent)})
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Current Value</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(pnlData.currentValue)}
            </p>
            <p className="text-sm text-gray-500">Portfolio Value</p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Total Invested</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(pnlData.totalInvested)}
            </p>
            <p className="text-sm text-gray-500">Cost Basis</p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Realized P&L</p>
            <p className={`text-2xl font-bold ${pnlData.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {pnlData.realizedPnL >= 0 ? '+' : ''}{formatCurrency(pnlData.realizedPnL)}
            </p>
            <p className="text-sm text-gray-500">From Trades</p>
          </div>
        </div>
      </div>

      {/* P&L Breakdown */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Position Breakdown</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Asset</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Balance</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Avg Price</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Current Price</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Invested</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Current Value</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">P&L</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">P&L %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pnlData.breakdown.map((position, index) => {
                const positionIsProfit = position.pnl >= 0;
                
                return (
                  <tr key={position.address} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <span className="text-xs font-medium text-gray-600">
                            {position.symbol.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{position.symbol}</p>
                          <p className="text-xs text-gray-500">
                            {position.address.slice(0, 6)}...{position.address.slice(-4)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="font-medium text-gray-900">
                        {position.balance.toLocaleString(undefined, { 
                          maximumFractionDigits: 4 
                        })}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="text-gray-900">
                        {formatCurrency(position.avgBuyPrice)}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="text-gray-900">
                        {formatCurrency(position.currentPrice)}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="text-gray-900">
                        {formatCurrency(position.invested)}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(position.currentValue)}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className={`font-medium ${positionIsProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {positionIsProfit ? '+' : ''}{formatCurrency(position.pnl)}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end">
                        {positionIsProfit ? (
                          <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 mr-1" />
                        ) : (
                          <ArrowTrendingDownIcon className="h-4 w-4 text-red-600 mr-1" />
                        )}
                        <p className={`font-medium ${positionIsProfit ? 'text-green-600' : 'text-red-600'}`}>
                          {positionIsProfit ? '+' : ''}{formatPercent(position.pnlPercent)}
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

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Unrealized P&L</span>
              <span className={`font-medium ${pnlData.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {pnlData.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(pnlData.unrealizedPnL)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Realized P&L</span>
              <span className={`font-medium ${pnlData.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {pnlData.realizedPnL >= 0 ? '+' : ''}{formatCurrency(pnlData.realizedPnL)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-medium text-gray-900">Total Return</span>
              <span className={`font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(pnlData.totalPnLPercent)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h4>
          <div className="space-y-3">
            {pnlData.breakdown
              .filter(p => p.pnl !== 0)
              .sort((a, b) => b.pnlPercent - a.pnlPercent)
              .slice(0, 3)
              .map((position, index) => (
                <div key={position.address} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{position.symbol}</span>
                  </div>
                  <span className={`font-semibold ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {position.pnl >= 0 ? '+' : ''}{formatPercent(position.pnlPercent)}
                  </span>
                </div>
              ))}
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
    <div className="bg-white rounded-xl border shadow-sm p-6 text-center">
      <div className="text-gray-400 mb-4">
        <span className="text-6xl">⚠️</span>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load P&L Data</h3>
      <p className="text-gray-600">
        There was an error loading your profit/loss information. Please try again later.
      </p>
    </div>
  );
}