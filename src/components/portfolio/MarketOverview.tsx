'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { 
  GlobeAltIcon,
  FireIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  ExclamationCircleIcon,
  NewspaperIcon
} from '@heroicons/react/24/outline';

interface MarketData {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  totalCoins: number;
  fearGreedIndex: number;
}

interface TrendingToken {
  symbol: string;
  name: string;
  price: number;
  changePercent24h: number;
  volume24h: number;
  rank: number;
}

interface MarketAlert {
  type: 'price' | 'volume' | 'news';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  timestamp: Date;
}

export function MarketOverview() {
  const [marketData, setMarketData] = useState<MarketData>({
    totalMarketCap: 3450000000000,
    totalVolume24h: 125000000000,
    btcDominance: 56.8,
    ethDominance: 15.2,
    totalCoins: 13847,
    fearGreedIndex: 74
  });

  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([
    {
      symbol: 'AERO',
      name: 'Aerodrome Finance',
      price: 1.13,
      changePercent24h: 15.31,
      volume24h: 45000000,
      rank: 1
    },
    {
      symbol: 'WELL',
      name: 'Moonwell',
      price: 0.068,
      changePercent24h: 12.45,
      volume24h: 2100000,
      rank: 2
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      price: 248.65,
      changePercent24h: 8.42,
      volume24h: 3200000000,
      rank: 3
    },
    {
      symbol: 'AVAX',
      name: 'Avalanche',
      price: 45.32,
      changePercent24h: 6.98,
      volume24h: 850000000,
      rank: 4
    },
    {
      symbol: 'BNB',
      name: 'BNB',
      price: 692.15,
      changePercent24h: 5.23,
      volume24h: 1800000000,
      rank: 5
    }
  ]);

  const [marketAlerts, setMarketAlerts] = useState<MarketAlert[]>([
    {
      type: 'price',
      severity: 'high',
      title: 'AERO Price Surge',
      description: 'AERO has gained 15.31% in the last 24 hours, reaching new weekly highs',
      timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    },
    {
      type: 'volume',
      severity: 'medium',
      title: 'High Trading Volume',
      description: 'Bitcoin trading volume has increased by 45% compared to yesterday',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      type: 'news',
      severity: 'medium',
      title: 'DeFi TVL Milestone',
      description: 'Total DeFi TVL has surpassed $200B for the first time this year',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
    }
  ]);

  const getFearGreedColor = (index: number) => {
    if (index >= 75) return 'text-green-600 bg-green-50 border-green-200';
    if (index >= 55) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (index >= 35) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (index >= 25) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getFearGreedLabel = (index: number) => {
    if (index >= 75) return 'Extreme Greed';
    if (index >= 55) return 'Greed';
    if (index >= 45) return 'Neutral';
    if (index >= 25) return 'Fear';
    return 'Extreme Fear';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case 'price': return ArrowTrendingUpIcon;
      case 'volume': return FireIcon;
      default: return NewspaperIcon;
    }
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(1)}K`;
    return `$${volume}`;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Market Overview Header */}
      <div className="flex items-center space-x-3">
        <GlobeAltIcon className="h-6 w-6 text-gray-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Market Overview</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">Global cryptocurrency market insights</p>
        </div>
      </div>

      {/* Market Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 mb-1">Market Cap</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(marketData.totalMarketCap)}
          </p>
          <p className="text-xs text-green-600">+2.4% 24h</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 mb-1">24h Volume</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(marketData.totalVolume24h)}
          </p>
          <p className="text-xs text-blue-600">+12.8% 24h</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 mb-1">BTC Dominance</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{marketData.btcDominance}%</p>
          <p className="text-xs text-gray-500">ETH: {marketData.ethDominance}%</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Coins</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{marketData.totalCoins.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Tracked assets</p>
        </div>

        <div className={`rounded-xl border p-4 ${getFearGreedColor(marketData.fearGreedIndex)}`}>
          <p className="text-sm font-medium mb-1">Fear & Greed</p>
          <p className="text-lg font-bold">{marketData.fearGreedIndex}</p>
          <p className="text-xs font-medium">{getFearGreedLabel(marketData.fearGreedIndex)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trending Tokens */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <FireIcon className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trending Today</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {trendingTokens.map((token) => (
                <div key={token.symbol} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{token.rank}</span>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">{token.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{token.symbol}</p>
                      <p className="text-sm text-gray-500">{formatVolume(token.volume24h)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(token.price)}</p>
                    <div className={`flex items-center space-x-1 ${token.changePercent24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {token.changePercent24h >= 0 ? (
                        <ArrowTrendingUpIcon className="h-3 w-3" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-3 w-3" />
                      )}
                      <span className="text-sm font-medium">
                        {token.changePercent24h >= 0 ? '+' : ''}{formatPercent(token.changePercent24h / 100)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Market Alerts */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <ExclamationCircleIcon className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Alerts</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {marketAlerts.map((alert, index) => {
                const Icon = getSeverityIcon(alert.type);
                return (
                  <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                    <div className="flex items-start space-x-3">
                      <Icon className="h-5 w-5 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{alert.title}</h4>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <ClockIcon className="h-3 w-3" />
                            <span>{formatTimeAgo(alert.timestamp)}</span>
                          </div>
                        </div>
                        <p className="text-sm opacity-90">{alert.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <button className="w-full mt-4 text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All Alerts
            </button>
          </div>
        </div>
      </div>

      {/* Market Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Market Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">↗️ Bullish</div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Overall market sentiment is positive with strong DeFi performance</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">🚀 DeFi Surge</div>
            <p className="text-sm text-gray-600 dark:text-gray-300">DeFi tokens showing exceptional growth this week</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">⚡ High Volume</div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Trading activity significantly above average levels</p>
          </div>
        </div>
      </div>
    </div>
  );
}