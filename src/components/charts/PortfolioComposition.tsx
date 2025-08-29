'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TokenBalance, DeFiPosition } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ChartPieIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface PortfolioCompositionProps {
  tokens: TokenBalance[];
  defiPositions: DeFiPosition[];
  isLoading: boolean;
}

export function PortfolioComposition({ tokens, defiPositions, isLoading }: PortfolioCompositionProps) {
  if (isLoading) {
    return <PortfolioCompositionLoader />;
  }

  // Combine token balances and DeFi positions
  const portfolioData = prepareChartData(tokens, defiPositions);
  
  if (portfolioData.length === 0) {
    return <EmptyPortfolioChart />;
  }

  // Enhanced color palette with gradients
  const COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1', // Indigo
    '#14B8A6', // Teal
    '#F43F5E', // Rose
  ];

  const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl p-4 border-0 rounded-xl shadow-2xl">
          <div className="flex items-center space-x-3 mb-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: data.fill }}
            ></div>
            <p className="font-bold text-slate-900 dark:text-white">{data.name}</p>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mb-1">
            {formatCurrency(data.value)}
          </p>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {data.percentage}% of portfolio
          </p>
          {data.type && (
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize mt-1">
              {data.type}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="grid grid-cols-1 gap-2 mt-6">
        {payload?.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {entry.value}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {formatCurrency(entry.payload.value)}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {entry.payload.percentage}%
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-8">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-30"></div>
            <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <ChartPieIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Portfolio Composition</h2>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Asset allocation breakdown</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Value</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalValue)}
          </div>
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {portfolioData.length} assets
          </div>
        </div>
      </div>

      {/* Professional Chart Container */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-blue-900/10 dark:to-purple-900/10 rounded-2xl"></div>
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-2xl border border-slate-200/50 dark:border-slate-600/50">
          
          {/* Pie Chart */}
          <div className="flex items-center justify-center">
            <div className="w-80 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={120}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#ffffff"
                  >
                    {portfolioData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend & Details */}
          <div className="flex flex-col justify-center">
            <div className="space-y-3">
              {portfolioData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/50 dark:border-slate-600/50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </span>
                      {item.type && (
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
                          {item.type}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.value)}
                    </div>
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {item.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Diversification</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-slate-600 dark:text-slate-300">Assets</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">{portfolioData.length}</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-600 dark:text-slate-300">Largest Position</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {Math.max(...portfolioData.map(d => d.percentage))}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioCompositionLoader() {
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="w-80 h-80 bg-slate-200 dark:bg-slate-700 rounded-full animate-shimmer mx-auto"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl animate-shimmer"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyPortfolioChart() {
  return (
    <div className="p-8 text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center mx-auto mb-6">
        <ChartPieIcon className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Portfolio Data</h3>
      <p className="text-slate-600 dark:text-slate-400">Your portfolio composition will appear here once you have assets.</p>
    </div>
  );
}

function prepareChartData(tokens: TokenBalance[], defiPositions: DeFiPosition[]) {
  const data: Array<{
    name: string;
    value: number;
    percentage: number;
    type: string;
  }> = [];

  // Add token balances
  tokens.forEach(token => {
    if (token.value > 0) {
      data.push({
        name: token.symbol,
        value: token.value,
        percentage: 0, // Will be calculated below
        type: 'token'
      });
    }
  });

  // Add DeFi positions
  defiPositions.forEach(position => {
    if (position.value > 0) {
      data.push({
        name: `${position.protocol} ${position.type}`,
        value: position.value,
        percentage: 0, // Will be calculated below
        type: 'defi'
      });
    }
  });

  // Calculate total value and percentages
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  
  // Update percentages
  data.forEach(item => {
    item.percentage = Math.round((item.value / totalValue) * 100 * 10) / 10;
  });

  // Sort by value descending
  data.sort((a, b) => b.value - a.value);

  return data;
}