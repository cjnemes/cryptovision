'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TokenBalance, DeFiPosition } from '@/types';
import { formatCurrency } from '@/lib/utils';

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

  // Color palette for different assets
  const COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Green  
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1', // Indigo
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-blue-600">{formatCurrency(data.value)}</p>
          <p className="text-sm text-gray-500">{data.percentage}% of portfolio</p>
          {data.type && (
            <p className="text-xs text-gray-400 capitalize">{data.type}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    if (percentage < 5) return null; // Hide labels for small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="500"
      >
        {`${percentage.toFixed(1)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Composition</h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={portfolioData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {portfolioData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-sm text-gray-600">
                  {value} ({formatCurrency(entry.payload.value)})
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Asset Breakdown */}
      <div className="mt-6 space-y-3">
        <h4 className="font-medium text-gray-900">Top Holdings</h4>
        {portfolioData.slice(0, 5).map((item, index) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm font-medium text-gray-900">{item.name}</span>
              {item.type && (
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full capitalize">
                  {item.type}
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {formatCurrency(item.value)}
              </p>
              <p className="text-xs text-gray-500">{item.percentage}%</p>
            </div>
          </div>
        ))}
        {portfolioData.length > 5 && (
          <p className="text-xs text-gray-400 mt-2">
            +{portfolioData.length - 5} more assets
          </p>
        )}
      </div>
    </div>
  );
}

function prepareChartData(tokens: TokenBalance[], defiPositions: DeFiPosition[]) {
  const data: Array<{
    name: string;
    value: number;
    percentage: number;
    type?: string;
  }> = [];

  // Calculate total portfolio value
  const tokenValue = tokens.reduce((sum, token) => sum + (token.value || 0), 0);
  const defiValue = defiPositions.reduce((sum, position) => sum + position.value, 0);
  const totalValue = tokenValue + defiValue;

  if (totalValue === 0) return [];

  // Add token balances
  tokens.forEach(token => {
    if ((token.value || 0) > 0) {
      const percentage = ((token.value || 0) / totalValue) * 100;
      data.push({
        name: token.symbol,
        value: token.value || 0,
        percentage,
        type: 'token'
      });
    }
  });

  // Group DeFi positions by protocol
  const defiByProtocol: Record<string, { value: number; positions: DeFiPosition[] }> = {};
  
  defiPositions.forEach(position => {
    if (!defiByProtocol[position.protocol]) {
      defiByProtocol[position.protocol] = { value: 0, positions: [] };
    }
    defiByProtocol[position.protocol].value += position.value;
    defiByProtocol[position.protocol].positions.push(position);
  });

  // Add DeFi positions
  Object.entries(defiByProtocol).forEach(([protocol, { value }]) => {
    if (value > 0) {
      const percentage = (value / totalValue) * 100;
      const protocolNames: Record<string, string> = {
        'uniswap-v3': 'Uniswap V3',
        'aerodrome': 'Aerodrome',
        'moonwell': 'Moonwell',
        'aave': 'Aave',
        'lido': 'Lido'
      };
      
      data.push({
        name: protocolNames[protocol] || protocol,
        value,
        percentage,
        type: 'defi'
      });
    }
  });

  // Sort by value descending
  return data.sort((a, b) => b.value - a.value);
}

function PortfolioCompositionLoader() {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
      <div className="h-80 bg-gray-200 rounded mb-6"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyPortfolioChart() {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 text-center">
      <div className="text-gray-400 mb-4">
        <span className="text-6xl">📊</span>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Portfolio Data</h3>
      <p className="text-gray-600">
        Connect your wallet and add some assets to see your portfolio composition.
      </p>
    </div>
  );
}