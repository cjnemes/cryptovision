'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface PortfolioPerformanceProps {
  data: Array<{
    timestamp: string;
    totalValue: number;
    change: number;
    changePercent: number;
  }>;
  isLoading: boolean;
  timeframe: '24h' | '7d' | '30d' | '90d' | '1y';
}

export function PortfolioPerformance({ data, isLoading, timeframe }: PortfolioPerformanceProps) {
  if (isLoading) {
    return <PortfolioPerformanceLoader />;
  }

  // Use mock data if no real data available
  const chartData = data.length > 0 ? data : generateMockData(timeframe);
  
  if (chartData.length === 0) {
    return <EmptyPerformanceChart />;
  }

  const latestValue = chartData[chartData.length - 1];
  const firstValue = chartData[0];
  const totalChange = latestValue.totalValue - firstValue.totalValue;
  const totalChangePercent = ((latestValue.totalValue - firstValue.totalValue) / firstValue.totalValue) * 100;
  
  const isPositive = totalChange >= 0;
  const chartColor = isPositive ? '#10B981' : '#EF4444';
  const bgColor = isPositive ? '#10B981' : '#EF4444';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">
            {new Date(data.timestamp).toLocaleDateString()}
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(data.totalValue)}
          </p>
          <p className={`text-sm ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.change >= 0 ? '+' : ''}{formatCurrency(data.change)} ({formatPercent(data.changePercent)})
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Portfolio Performance</h3>
          <div className="flex items-center space-x-4 mt-2">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(latestValue.totalValue)}
              </p>
              <p className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{formatCurrency(totalChange)} ({formatPercent(totalChangePercent)})
              </p>
            </div>
          </div>
        </div>
        
        {/* Timeframe Selector (placeholder for now) */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {['24h', '7d', '30d', '90d', '1y'].map((period) => (
            <button
              key={period}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                timeframe === period 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={bgColor} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={bgColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="timestamp"
              tickFormatter={(value) => {
                const date = new Date(value);
                if (timeframe === '24h') {
                  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else if (timeframe === '7d') {
                  return date.toLocaleDateString([], { weekday: 'short' });
                } else {
                  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                }
              }}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis 
              tickFormatter={(value) => {
                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
                return `$${value.toFixed(0)}`;
              }}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="totalValue"
              stroke={chartColor}
              strokeWidth={2}
              fill="url(#colorGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">High</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(Math.max(...chartData.map(d => d.totalValue)))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Low</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(Math.min(...chartData.map(d => d.totalValue)))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Avg</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(chartData.reduce((sum, d) => sum + d.totalValue, 0) / chartData.length)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Volatility</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatPercent(calculateVolatility(chartData))}
          </p>
        </div>
      </div>
    </div>
  );
}

function generateMockData(timeframe: string) {
  const now = new Date();
  const data = [];
  let intervals = 24;
  let intervalMs = 60 * 60 * 1000; // 1 hour

  switch (timeframe) {
    case '24h':
      intervals = 24;
      intervalMs = 60 * 60 * 1000; // 1 hour
      break;
    case '7d':
      intervals = 7;
      intervalMs = 24 * 60 * 60 * 1000; // 1 day
      break;
    case '30d':
      intervals = 30;
      intervalMs = 24 * 60 * 60 * 1000; // 1 day
      break;
    case '90d':
      intervals = 30;
      intervalMs = 3 * 24 * 60 * 60 * 1000; // 3 days
      break;
    case '1y':
      intervals = 52;
      intervalMs = 7 * 24 * 60 * 60 * 1000; // 1 week
      break;
  }

  let baseValue = 58650; // Starting portfolio value
  
  for (let i = 0; i < intervals; i++) {
    const timestamp = new Date(now.getTime() - (intervals - i - 1) * intervalMs).toISOString();
    
    // Simulate some volatility
    const change = (Math.random() - 0.5) * 0.05; // ±2.5% random change
    baseValue *= (1 + change);
    
    const changeFromPrevious = i > 0 ? baseValue - data[i - 1].totalValue : 0;
    const changePercent = i > 0 ? (changeFromPrevious / data[i - 1].totalValue) * 100 : 0;
    
    data.push({
      timestamp,
      totalValue: Math.round(baseValue),
      change: Math.round(changeFromPrevious),
      changePercent: Number(changePercent.toFixed(2))
    });
  }

  return data;
}

function calculateVolatility(data: Array<{ totalValue: number }>) {
  if (data.length < 2) return 0;
  
  const returns = data.slice(1).map((d, i) => 
    (d.totalValue - data[i].totalValue) / data[i].totalValue
  );
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  
  return Math.sqrt(variance) * Math.sqrt(365) * 100; // Annualized volatility
}

function PortfolioPerformanceLoader() {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 animate-pulse">
      <div className="flex justify-between mb-6">
        <div>
          <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-40"></div>
      </div>
      <div className="h-64 bg-gray-200 rounded mb-6"></div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center">
            <div className="h-3 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyPerformanceChart() {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 text-center">
      <div className="text-gray-400 mb-4">
        <span className="text-6xl">📈</span>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data</h3>
      <p className="text-gray-600">
        Historical performance data will appear here once you start tracking your portfolio.
      </p>
    </div>
  );
}