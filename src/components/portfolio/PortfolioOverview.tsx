'use client';

import { useState } from 'react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ChartPieIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface PortfolioOverviewProps {
  tokenBalances: any[];
  defiPositions: any[];
  totalValue: number;
}

export function PortfolioOverview({ tokenBalances, defiPositions, totalValue }: PortfolioOverviewProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  // Generate mock portfolio performance data
  const generatePerformanceData = (timeframe: string) => {
    const days = timeframe === '1d' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const data = [];
    const startValue = totalValue * 0.85; // Simulate 15% gain over period
    
    for (let i = 0; i <= days; i++) {
      const randomVariation = (Math.random() - 0.5) * 0.02; // ±1% daily variation
      const trendGrowth = (i / days) * 0.15; // 15% growth over period
      const value = startValue * (1 + trendGrowth + randomVariation);
      
      data.push({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        value: Math.round(value * 100) / 100,
        change: i > 0 ? value - data[i-1]?.value || 0 : 0
      });
    }
    return data;
  };

  const performanceData = generatePerformanceData(selectedTimeframe);
  const currentChange = performanceData[performanceData.length - 1]?.value - performanceData[0]?.value || 0;
  const currentChangePercent = (currentChange / performanceData[0]?.value) * 100 || 0;

  // Asset allocation data
  const getAllocationData = () => {
    const allocation = [];
    let otherValue = 0;
    
    // Top 5 token holdings
    const sortedTokens = [...tokenBalances]
      .filter(token => token.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    sortedTokens.forEach(token => {
      allocation.push({
        name: token.symbol,
        value: token.value,
        percentage: (token.value / totalValue) * 100
      });
    });

    // Aggregate remaining tokens
    const remainingTokensValue = tokenBalances
      .filter(token => !sortedTokens.includes(token) && token.value > 0)
      .reduce((sum, token) => sum + token.value, 0);

    if (remainingTokensValue > 0) {
      allocation.push({
        name: 'Others',
        value: remainingTokensValue,
        percentage: (remainingTokensValue / totalValue) * 100
      });
    }

    return allocation;
  };

  // Chain distribution data
  const getChainDistribution = () => {
    const chainData = [
      { chain: 'Ethereum', value: totalValue * 0.15, color: '#627EEA' },
      { chain: 'Base', value: totalValue * 0.85, color: '#0052FF' }
    ];
    return chainData;
  };

  // Performance metrics
  const performanceMetrics = [
    {
      title: '24h Change',
      value: formatCurrency(currentChange * 0.1), // Mock 24h change
      percentage: formatPercent((currentChangePercent * 0.1) / 100),
      isPositive: currentChangePercent > 0,
      icon: currentChangePercent > 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon
    },
    {
      title: '7d Change',
      value: formatCurrency(currentChange * 0.7),
      percentage: formatPercent((currentChangePercent * 0.7) / 100),
      isPositive: currentChangePercent > 0,
      icon: currentChangePercent > 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon
    },
    {
      title: '30d Change',
      value: formatCurrency(currentChange),
      percentage: formatPercent(currentChangePercent / 100),
      isPositive: currentChangePercent > 0,
      icon: currentChangePercent > 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon
    }
  ];

  const allocationData = getAllocationData();
  const chainData = getChainDistribution();

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'];

  return (
    <div className="space-y-6">
      {/* Performance Overview Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Performance</h2>
          <p className="text-gray-600 dark:text-gray-300">Track your investment performance across all holdings</p>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {['1d', '7d', '30d', '90d'].map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                selectedTimeframe === timeframe
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {performanceMetrics.map((metric, index) => (
          <div key={index} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{metric.title}</p>
                <p className={`text-2xl font-bold ${metric.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.isPositive ? '+' : ''}{metric.value}
                </p>
                <p className={`text-sm ${metric.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.isPositive ? '+' : ''}{metric.percentage}
                </p>
              </div>
              <metric.icon className={`h-8 w-8 ${metric.isPositive ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Performance Chart', icon: ChartBarIcon },
            { id: 'allocation', name: 'Asset Allocation', icon: ChartPieIcon },
            { id: 'chains', name: 'Chain Distribution', icon: CurrencyDollarIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className={`mr-2 h-5 w-5 ${
                activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content based on active tab */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        {activeTab === 'overview' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Portfolio Value Over Time</h3>
              <div className="text-right">
                <p className="text-sm text-gray-500">Current Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalValue)}</p>
              </div>
            </div>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(17, 24, 39, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                    formatter={(value: any) => [formatCurrency(value), 'Portfolio Value']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#colorGradient)"
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'allocation' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Asset Allocation</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-4">
                {allocationData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(item.value)}</p>
                      <p className="text-sm text-gray-500">{item.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chains' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Chain Distribution</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={chainData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="chain" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-4">
                {chainData.map((chain, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: chain.color }}
                      />
                      <span className="font-medium text-gray-900 dark:text-white">{chain.chain}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(chain.value)}</p>
                      <p className="text-sm text-gray-500">{((chain.value / totalValue) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}