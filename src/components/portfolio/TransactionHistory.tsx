'use client';

import { useState } from 'react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  ArrowsRightLeftIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline';

interface Transaction {
  id: string;
  hash: string;
  timestamp: Date;
  type: 'SWAP' | 'TRANSFER' | 'ADD_LIQUIDITY' | 'REMOVE_LIQUIDITY' | 'STAKE' | 'UNSTAKE' | 'CLAIM_REWARDS';
  protocol?: string;
  tokenIn?: {
    symbol: string;
    amount: number;
    value: number;
  };
  tokenOut?: {
    symbol: string;
    amount: number;
    value: number;
  };
  gasCost: number;
  status: 'success' | 'failed' | 'pending';
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading: boolean;
  compact?: boolean;
}

export function TransactionHistory({ transactions = [], isLoading, compact = false }: TransactionHistoryProps) {
  const [sortBy, setSortBy] = useState<'timestamp' | 'value' | 'type'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  if (isLoading) {
    return <TransactionHistoryLoader />;
  }

  // Use mock data if no transactions provided
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      hash: '0x1234...abcd',
      timestamp: new Date('2024-08-29T10:30:00Z'),
      type: 'SWAP',
      protocol: 'uniswap-v3',
      tokenIn: { symbol: 'USDC', amount: 1000, value: 1000 },
      tokenOut: { symbol: 'ETH', amount: 0.3077, value: 1000 },
      gasCost: 25.50,
      status: 'success'
    },
    {
      id: '2',
      hash: '0x5678...efgh',
      timestamp: new Date('2024-08-28T15:45:00Z'),
      type: 'ADD_LIQUIDITY',
      protocol: 'aerodrome',
      tokenIn: { symbol: 'ETH', amount: 2.5, value: 8125 },
      tokenOut: { symbol: 'USDC', amount: 8125, value: 8125 },
      gasCost: 35.20,
      status: 'success'
    },
    {
      id: '3',
      hash: '0x9abc...ijkl',
      timestamp: new Date('2024-08-27T09:15:00Z'),
      type: 'STAKE',
      protocol: 'lido',
      tokenIn: { symbol: 'ETH', amount: 5.0, value: 16250 },
      gasCost: 18.75,
      status: 'success'
    },
    {
      id: '4',
      hash: '0xdef0...mnop',
      timestamp: new Date('2024-08-26T20:30:00Z'),
      type: 'TRANSFER',
      tokenOut: { symbol: 'USDC', amount: 500, value: 500 },
      gasCost: 12.30,
      status: 'success'
    },
    {
      id: '5',
      hash: '0x1111...2222',
      timestamp: new Date('2024-08-25T14:20:00Z'),
      type: 'CLAIM_REWARDS',
      protocol: 'moonwell',
      tokenIn: { symbol: 'WELL', amount: 150, value: 75 },
      gasCost: 8.50,
      status: 'success'
    }
  ];

  const displayTransactions = transactions.length > 0 ? transactions : mockTransactions;

  const filteredTransactions = displayTransactions.filter(tx => 
    filterType === 'all' || tx.type === filterType
  );

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'timestamp':
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        break;
      case 'value':
        const aValue = (a.tokenIn?.value || 0) + (a.tokenOut?.value || 0);
        const bValue = (b.tokenIn?.value || 0) + (b.tokenOut?.value || 0);
        comparison = aValue - bValue;
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'SWAP':
        return <ArrowsRightLeftIcon className="h-4 w-4" />;
      case 'ADD_LIQUIDITY':
        return <PlusIcon className="h-4 w-4" />;
      case 'REMOVE_LIQUIDITY':
        return <MinusIcon className="h-4 w-4" />;
      case 'TRANSFER':
        return <ArrowUpRightIcon className="h-4 w-4" />;
      case 'STAKE':
      case 'UNSTAKE':
      case 'CLAIM_REWARDS':
        return <ArrowDownRightIcon className="h-4 w-4" />;
      default:
        return <div className="h-4 w-4 bg-gray-300 rounded-full" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SWAP':
        return 'text-blue-600 bg-blue-50';
      case 'ADD_LIQUIDITY':
        return 'text-green-600 bg-green-50';
      case 'REMOVE_LIQUIDITY':
        return 'text-red-600 bg-red-50';
      case 'TRANSFER':
        return 'text-purple-600 bg-purple-50';
      case 'STAKE':
      case 'UNSTAKE':
        return 'text-indigo-600 bg-indigo-50';
      case 'CLAIM_REWARDS':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleSort = (newSortBy: 'timestamp' | 'value' | 'type') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  // Show compact version for sidebar
  if (compact) {
    const recentTransactions = displayTransactions.slice(0, 5);
    
    if (recentTransactions.length === 0) {
      return (
        <div className="text-center py-6">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-lg">📈</span>
          </div>
          <p className="text-sm text-gray-500">No recent activity</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {recentTransactions.map((tx) => (
          <div key={tx.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className={`p-1.5 rounded-full ${getTypeColor(tx.type)}`}>
              {getTransactionIcon(tx.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {tx.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency((tx.tokenIn?.value || 0) + (tx.tokenOut?.value || 0))}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 truncate">
                  {tx.protocol && `${tx.protocol.replace('-', ' ')} • `}
                  {tx.timestamp.toLocaleDateString()}
                </p>
                <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${
                  tx.status === 'success' ? 'bg-green-100 text-green-800' :
                  tx.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {tx.status === 'success' ? '✓' : tx.status === 'failed' ? '×' : '•'}
                </span>
              </div>
            </div>
          </div>
        ))}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Showing {recentTransactions.length} of {displayTransactions.length} transactions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
        
        {/* Filter and Sort Controls */}
        <div className="flex items-center space-x-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="SWAP">Swaps</option>
            <option value="ADD_LIQUIDITY">Add Liquidity</option>
            <option value="REMOVE_LIQUIDITY">Remove Liquidity</option>
            <option value="TRANSFER">Transfers</option>
            <option value="STAKE">Staking</option>
            <option value="CLAIM_REWARDS">Claims</option>
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
              <th 
                className="text-left py-3 px-4 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('timestamp')}
              >
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  {sortBy === 'timestamp' && (
                    sortOrder === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
                  )}
                </div>
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Assets</th>
              <th 
                className="text-right py-3 px-4 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('value')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Value</span>
                  {sortBy === 'value' && (
                    sortOrder === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
                  )}
                </div>
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Gas</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Status</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedTransactions.map((tx, index) => (
              <tr key={tx.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${getTypeColor(tx.type)}`}>
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {tx.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      {tx.protocol && (
                        <p className="text-xs text-gray-500 capitalize">
                          {tx.protocol.replace('-', ' ')}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                
                <td className="py-4 px-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {tx.timestamp.toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {tx.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </td>
                
                <td className="py-4 px-4">
                  <div className="space-y-1">
                    {tx.tokenIn && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-green-600">+{tx.tokenIn.amount.toLocaleString()}</span>
                        <span className="text-sm font-medium">{tx.tokenIn.symbol}</span>
                      </div>
                    )}
                    {tx.tokenOut && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-red-600">-{tx.tokenOut.amount.toLocaleString()}</span>
                        <span className="text-sm font-medium">{tx.tokenOut.symbol}</span>
                      </div>
                    )}
                  </div>
                </td>
                
                <td className="py-4 px-4 text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency((tx.tokenIn?.value || 0) + (tx.tokenOut?.value || 0))}
                  </p>
                </td>
                
                <td className="py-4 px-4 text-right">
                  <p className="text-sm text-gray-600">
                    {formatCurrency(tx.gasCost)}
                  </p>
                </td>
                
                <td className="py-4 px-4 text-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    tx.status === 'success' ? 'bg-green-100 text-green-800' :
                    tx.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {tx.status}
                  </span>
                </td>
                
                <td className="py-4 px-4">
                  <button
                    onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {expandedTx === tx.id ? 
                      <ChevronUpIcon className="h-4 w-4" /> : 
                      <ChevronDownIcon className="h-4 w-4" />
                    }
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Transaction Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">Total Transactions</p>
            <p className="text-lg font-semibold text-gray-900">{sortedTransactions.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Volume</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(
                sortedTransactions.reduce((sum, tx) => 
                  sum + (tx.tokenIn?.value || 0) + (tx.tokenOut?.value || 0), 0
                )
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Gas Spent</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(
                sortedTransactions.reduce((sum, tx) => sum + tx.gasCost, 0)
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionHistoryLoader() {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 bg-gray-200 rounded w-40"></div>
        <div className="h-8 bg-gray-200 rounded w-32"></div>
      </div>
      
      <div className="space-y-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 py-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}