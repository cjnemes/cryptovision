'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DeFiPosition } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { FireIcon, ArrowTrendingUpIcon, BanknotesIcon } from '@heroicons/react/24/outline';

interface DeFiYieldChartProps {
  positions: DeFiPosition[];
  isLoading: boolean;
}

export function DeFiYieldChart({ positions, isLoading }: DeFiYieldChartProps) {
  if (isLoading) {
    return <DeFiYieldChartLoader />;
  }

  const chartData = prepareYieldData(positions);

  if (chartData.length === 0) {
    return <EmptyYieldChart />;
  }

  // Enhanced colors for different yield ranges
  const getBarColor = (apy: number) => {
    if (apy >= 20) return '#10B981'; // High yield - emerald
    if (apy >= 10) return '#3B82F6'; // Medium yield - blue
    if (apy >= 5) return '#F59E0B';  // Low yield - amber
    return '#6B7280'; // Very low yield - gray
  };

  const getBgColor = (apy: number) => {
    if (apy >= 20) return 'from-emerald-500/10 to-green-500/10';
    if (apy >= 10) return 'from-blue-500/10 to-indigo-500/10';
    if (apy >= 5) return 'from-amber-500/10 to-orange-500/10';
    return 'from-slate-500/10 to-gray-500/10';
  };

  const averageAPY = chartData.reduce((sum, item) => sum + item.apy, 0) / chartData.length;
  const totalYieldValue = chartData.reduce((sum, item) => sum + item.value, 0);
  const estimatedDailyYield = chartData.reduce((sum, item) => sum + (item.value * item.apy / 100 / 365), 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl p-4 border-0 rounded-xl shadow-2xl">
          <p className="font-bold text-slate-900 dark:text-white mb-3">{data.name}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">APY:</span>
              <span className="font-black text-emerald-600 text-lg">
                {formatPercent(data.apy)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Value:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(data.value)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Daily Yield:</span>
              <span className="font-bold text-green-600">
                {formatCurrency(data.dailyYield)}
              </span>
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize mt-2">
              {data.protocol} • {data.type}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-8">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur opacity-30"></div>
            <div className="relative w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <FireIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">DeFi Yield Analysis</h2>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Active yield-generating positions</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Average APY</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatPercent(averageAPY)}
          </div>
          <div className="text-sm font-medium text-green-600">
            ~{formatCurrency(estimatedDailyYield)} daily
          </div>
        </div>
      </div>

      {/* Professional Chart Container */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 to-red-50/30 dark:from-orange-900/10 dark:to-red-900/10 rounded-2xl"></div>
        <div className="relative p-6 bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-2xl border border-slate-200/50 dark:border-slate-600/50">
          <div className="h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  stroke="#64748b"
                  fontSize={12}
                  fontWeight="500"
                />
                <YAxis 
                  tickFormatter={(value) => `${value}%`}
                  stroke="#64748b"
                  fontSize={12}
                  fontWeight="500"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="apy" radius={[8, 8, 0, 0]} strokeWidth={2} stroke="#ffffff">
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getBarColor(entry.apy)}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Yield Categories Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200/50 dark:border-emerald-700/50">
              <div className="w-4 h-4 bg-emerald-500 rounded"></div>
              <div>
                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">High Yield</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-500">≥20% APY</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <div>
                <div className="text-sm font-bold text-blue-700 dark:text-blue-400">Medium Yield</div>
                <div className="text-xs text-blue-600 dark:text-blue-500">10-20% APY</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200/50 dark:border-amber-700/50">
              <div className="w-4 h-4 bg-amber-500 rounded"></div>
              <div>
                <div className="text-sm font-bold text-amber-700 dark:text-amber-400">Stable Yield</div>
                <div className="text-xs text-amber-600 dark:text-amber-500">5-10% APY</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-600/50">
              <div className="w-4 h-4 bg-slate-500 rounded"></div>
              <div>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-400">Low Yield</div>
                <div className="text-xs text-slate-600 dark:text-slate-500">&lt;5% APY</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Yield Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/50 dark:border-green-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <ArrowTrendingUpIcon className="w-8 h-8 text-green-600" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Total Yield Value</h3>
          </div>
          <div className="text-2xl font-black text-green-600 mb-2">
            {formatCurrency(totalYieldValue)}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Across {chartData.length} positions
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <FireIcon className="w-8 h-8 text-orange-600" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Best Performer</h3>
          </div>
          <div className="text-2xl font-black text-orange-600 mb-2">
            {formatPercent(Math.max(...chartData.map(d => d.apy)))}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Highest APY position
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <BanknotesIcon className="w-8 h-8 text-purple-600" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Est. Monthly Yield</h3>
          </div>
          <div className="text-2xl font-black text-purple-600 mb-2">
            {formatCurrency(estimatedDailyYield * 30)}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Based on current APY
          </div>
        </div>
      </div>
    </div>
  );
}

function DeFiYieldChartLoader() {
  return (
    <div className="p-8 animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-xl animate-shimmer"></div>
          <div>
            <div className="w-48 h-6 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2 animate-shimmer"></div>
            <div className="w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer"></div>
          </div>
        </div>
        <div className="text-right">
          <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2 animate-shimmer"></div>
          <div className="w-32 h-6 bg-slate-200 dark:bg-slate-700 rounded-lg animate-shimmer"></div>
        </div>
      </div>
      <div className="h-80 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-shimmer mb-6"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg animate-shimmer"></div>
        ))}
      </div>
    </div>
  );
}

function EmptyYieldChart() {
  return (
    <div className="p-8 text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-6">
        <FireIcon className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Yield Positions</h3>
      <p className="text-slate-600 dark:text-slate-400">Start earning yield by supplying assets to DeFi protocols.</p>
    </div>
  );
}

function prepareYieldData(positions: DeFiPosition[]) {
  // Only include positions with yield
  const yieldPositions = positions.filter(pos => pos.apy > 0);
  
  if (yieldPositions.length === 0) {
    return [];
  }

  return yieldPositions.map(position => ({
    name: `${position.protocol} ${position.type}`.length > 15 
      ? `${position.protocol} ${position.type}`.substring(0, 15) + '...'
      : `${position.protocol} ${position.type}`,
    fullName: `${position.protocol} ${position.type}`,
    apy: position.apy,
    value: position.value,
    dailyYield: (position.value * position.apy / 100) / 365,
    protocol: position.protocol,
    type: position.type
  })).sort((a, b) => b.apy - a.apy); // Sort by APY descending
}