'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DeFiPosition } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/utils';

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

  // Colors for different yield ranges
  const getBarColor = (apy: number) => {
    if (apy >= 20) return '#059669'; // High yield - green
    if (apy >= 10) return '#3B82F6'; // Medium yield - blue  
    if (apy >= 5) return '#F59E0B';  // Low yield - amber
    return '#6B7280'; // Very low yield - gray
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm">
              <span className="text-gray-500">APY:</span>
              <span className="font-semibold text-green-600 ml-2">
                {formatPercent(data.apy)}
              </span>
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Value:</span>
              <span className="font-semibold text-gray-900 ml-2">
                {formatCurrency(data.value)}
              </span>
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Projected Annual:</span>
              <span className="font-semibold text-blue-600 ml-2">
                {formatCurrency(data.projectedYield)}
              </span>
            </p>
            <p className="text-xs text-gray-400 capitalize mt-1">
              {data.type} • {data.protocol}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate totals
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
  const weightedAPY = chartData.reduce((sum, item) => sum + (item.apy * item.value), 0) / totalValue;
  const totalProjectedYield = chartData.reduce((sum, item) => sum + item.projectedYield, 0);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">DeFi Yield Overview</h3>
          <div className="mt-2 flex items-center space-x-6">
            <div>
              <p className="text-sm text-gray-500">Weighted APY</p>
              <p className="text-xl font-bold text-green-600">{formatPercent(weightedAPY)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Projected Annual</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(totalProjectedYield)}</p>
            </div>
          </div>
        </div>
        
        {/* Yield Legend */}
        <div className="text-right space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <span className="text-xs text-gray-600">High Yield (20%+)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Medium Yield (10-20%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Low Yield (5-10%)</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis 
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="apy" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry.apy)} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Performers */}
      <div className="mt-6">
        <h4 className="font-medium text-gray-900 mb-3">Top Yield Opportunities</h4>
        <div className="space-y-2">
          {chartData
            .sort((a, b) => b.apy - a.apy)
            .slice(0, 3)
            .map((position, index) => (
              <div key={position.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-gray-200 rounded-full text-xs font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{position.name}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {position.type} • {position.protocol}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{formatPercent(position.apy)}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(position.value)}</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function prepareYieldData(positions: DeFiPosition[]) {
  return positions
    .filter(position => position.value > 0)
    .map(position => {
      const protocolNames: Record<string, string> = {
        'uniswap-v3': 'Uniswap V3',
        'aerodrome': 'Aerodrome',
        'moonwell': 'Moonwell',
        'aave': 'Aave',
        'lido': 'Lido'
      };

      // Create a display name
      let name = protocolNames[position.protocol] || position.protocol;
      if (position.tokens.length === 2) {
        name = `${position.tokens[0].symbol}/${position.tokens[1].symbol}`;
      } else if (position.tokens.length === 1) {
        name = position.tokens[0].symbol;
      }

      return {
        name,
        apy: position.apy,
        value: position.value,
        projectedYield: (position.value * position.apy) / 100,
        type: position.type,
        protocol: protocolNames[position.protocol] || position.protocol,
      };
    })
    .sort((a, b) => b.apy - a.apy);
}

function DeFiYieldChartLoader() {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 animate-pulse">
      <div className="flex justify-between mb-6">
        <div>
          <div className="h-6 bg-gray-200 rounded w-40 mb-2"></div>
          <div className="flex space-x-6">
            <div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
      <div className="h-64 bg-gray-200 rounded mb-6"></div>
      <div>
        <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyYieldChart() {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 text-center">
      <div className="text-gray-400 mb-4">
        <span className="text-6xl">📊</span>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Yield Data</h3>
      <p className="text-gray-600">
        Your DeFi yield opportunities will be displayed here once you have active positions.
      </p>
    </div>
  );
}