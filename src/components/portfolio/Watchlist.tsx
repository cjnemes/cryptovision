'use client';

import { useState } from 'react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { 
  StarIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  XMarkIcon,
  EyeIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface WatchlistToken {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  isWatched: boolean;
}

export function Watchlist() {
  const [watchedTokens, setWatchedTokens] = useState<WatchlistToken[]>([
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 98450.32,
      change24h: 1250.84,
      changePercent24h: 1.29,
      volume24h: 12450000000,
      marketCap: 1950000000000,
      isWatched: true
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: 4302.15,
      change24h: -125.42,
      changePercent24h: -2.83,
      volume24h: 8750000000,
      marketCap: 518000000000,
      isWatched: true
    },
    {
      symbol: 'AERO',
      name: 'Aerodrome Finance',
      price: 1.13,
      change24h: 0.15,
      changePercent24h: 15.31,
      volume24h: 45000000,
      marketCap: 450000000,
      isWatched: true
    },
    {
      symbol: 'WELL',
      name: 'Moonwell',
      price: 0.068,
      change24h: 0.002,
      changePercent24h: 3.03,
      volume24h: 2100000,
      marketCap: 85000000,
      isWatched: true
    }
  ]);

  const [availableTokens, setAvailableTokens] = useState<WatchlistToken[]>([
    {
      symbol: 'SOL',
      name: 'Solana',
      price: 248.65,
      change24h: 8.42,
      changePercent24h: 3.51,
      volume24h: 3200000000,
      marketCap: 118000000000,
      isWatched: false
    },
    {
      symbol: 'ADA',
      name: 'Cardano',
      price: 1.25,
      change24h: -0.05,
      changePercent24h: -3.85,
      volume24h: 1200000000,
      marketCap: 44000000000,
      isWatched: false
    },
    {
      symbol: 'AVAX',
      name: 'Avalanche',
      price: 45.32,
      change24h: 2.15,
      changePercent24h: 4.98,
      volume24h: 850000000,
      marketCap: 18500000000,
      isWatched: false
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);

  const toggleWatchlist = (symbol: string) => {
    const tokenInWatched = watchedTokens.find(t => t.symbol === symbol);
    const tokenInAvailable = availableTokens.find(t => t.symbol === symbol);

    if (tokenInWatched) {
      // Remove from watchlist
      setWatchedTokens(prev => prev.filter(t => t.symbol !== symbol));
      setAvailableTokens(prev => [...prev, { ...tokenInWatched, isWatched: false }]);
    } else if (tokenInAvailable) {
      // Add to watchlist
      setAvailableTokens(prev => prev.filter(t => t.symbol !== symbol));
      setWatchedTokens(prev => [...prev, { ...tokenInAvailable, isWatched: true }]);
    }
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(1)}K`;
    return `$${volume}`;
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(1)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(1)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(1)}M`;
    return `$${marketCap}`;
  };

  return (
    <div className="space-y-6">
      {/* Watchlist Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <EyeIcon className="h-6 w-6 text-gray-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Watchlist</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Track tokens you're interested in</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add Token</span>
        </button>
      </div>

      {/* Watchlist Grid */}
      {watchedTokens.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchedTokens.map((token) => (
            <div key={token.symbol} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{token.symbol.slice(0, 2)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{token.symbol}</h3>
                    <p className="text-sm text-gray-500">{token.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleWatchlist(token.symbol)}
                  className="text-yellow-500 hover:text-yellow-600"
                >
                  <StarIconSolid className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(token.price)}
                  </span>
                  <div className={`flex items-center space-x-1 ${
                    token.changePercent24h >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {token.changePercent24h >= 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4" />
                    )}
                    <span className="font-medium">
                      {token.changePercent24h >= 0 ? '+' : ''}{formatPercent(token.changePercent24h / 100)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">24h Volume</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatVolume(token.volume24h)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Market Cap</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatMarketCap(token.marketCap)}
                    </p>
                  </div>
                </div>

                <button className="w-full mt-3 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
                  <BellIcon className="h-4 w-4" />
                  <span>Set Price Alert</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <EyeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tokens in watchlist</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Add tokens to track their performance</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Token
          </button>
        </div>
      )}

      {/* Add Token Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add to Watchlist</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {availableTokens.map((token) => (
                <div key={token.symbol} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">{token.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{token.symbol}</p>
                      <p className="text-sm text-gray-500">{token.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(token.price)}</p>
                      <p className={`text-sm ${token.changePercent24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {token.changePercent24h >= 0 ? '+' : ''}{formatPercent(token.changePercent24h / 100)}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleWatchlist(token.symbol)}
                      className="text-gray-400 hover:text-yellow-500"
                    >
                      <StarIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}