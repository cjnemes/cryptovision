'use client';

import { useDeFiPositions } from '@/hooks/useDeFiPositions';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { DeFiPosition } from '@/types';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export function DeFiPositions() {
  const {
    positions,
    summary,
    protocolBreakdown,
    isLoading,
    hasPositions,
    hasMockData
  } = useDeFiPositions();

  const [sortBy, setSortBy] = useState<'value' | 'apy' | 'protocol'>('value');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [filterProtocol, setFilterProtocol] = useState<string>('');

  if (isLoading) {
    return <DeFiPositionsLoader />;
  }

  if (!hasPositions) {
    return <NoDeFiPositions />;
  }

  // Filter and sort positions
  const filteredPositions = positions.filter(position => {
    if (!filterProtocol) return true;
    return position.protocol === filterProtocol;
  });

  const sortedPositions = [...filteredPositions].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'value':
        comparison = a.value - b.value;
        break;
      case 'apy':
        comparison = a.apy - b.apy;
        break;
      case 'protocol':
        comparison = a.protocol.localeCompare(b.protocol);
        break;
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const handleSort = (field: 'value' | 'apy' | 'protocol') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50 shadow-lg">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Total DeFi Value</h3>
          <p className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {formatCurrency(summary.totalValue)}
          </p>
          <div className="w-full bg-blue-200/30 dark:bg-blue-700/20 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
        
        <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50 shadow-lg">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Claimable Rewards</h3>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-1">
            {formatCurrency(summary.totalClaimable)}
          </p>
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            🎯 Ready to claim
          </div>
        </div>
        
        <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200/50 dark:border-amber-700/50 shadow-lg">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Average APY</h3>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mb-1">
            {formatPercent(summary.averageAPY)}
          </p>
          <div className="text-xs font-medium text-amber-600 dark:text-amber-400">
            📈 Weighted average
          </div>
        </div>
        
        <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50 shadow-lg">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Active Positions</h3>
          <p className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {summary.positionCount}
          </p>
          <p className="text-xs font-medium text-purple-600 dark:text-purple-400">
            🏛️ {summary.protocolCount} protocols
          </p>
        </div>
      </div>

      {hasMockData && (
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl blur"></div>
          <div className="relative bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/30 dark:to-indigo-900/30 backdrop-blur-xl border border-blue-200/50 dark:border-blue-700/50 rounded-xl p-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">📊</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Demo DeFi Portfolio
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Connect with API keys to see real data
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Protocol Summary Cards */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/30 to-slate-100/30 dark:from-slate-800/30 dark:to-slate-700/30 rounded-2xl"></div>
        <div className="relative p-8 bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-600/50 shadow-lg">
          <div className="flex items-center space-x-4 mb-8">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-slate-500 to-slate-700 rounded-xl blur opacity-30"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">🏛️</span>
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Protocol Overview</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(protocolBreakdown).map(([protocol, data]) => (
              <ProtocolSummaryCard key={protocol} protocol={protocol} data={data} />
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Positions Table */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/30 to-slate-100/30 dark:from-slate-800/30 dark:to-slate-700/30 rounded-2xl"></div>
        <div className="relative bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-600/50 shadow-lg overflow-hidden">
        <div className="p-8 pb-6 border-b border-slate-200/50 dark:border-slate-600/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-30"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">📋</span>
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">All Positions</h3>
            </div>
            <div className="flex items-center gap-3">
              {/* Protocol Filter */}
              <select
                value={filterProtocol}
                onChange={(e) => setFilterProtocol(e.target.value)}
                className="px-4 py-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-600/50 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 shadow-sm transition-all"
              >
                <option value="">All Protocols</option>
                {Object.keys(protocolBreakdown).map(protocol => (
                  <option key={protocol} value={protocol}>
                    {getProtocolName(protocol)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Positions Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-100/80 to-slate-200/80 dark:from-slate-700/50 dark:to-slate-600/50 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-600/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Position
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-600/30 transition-colors rounded-lg"
                  onClick={() => handleSort('protocol')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Protocol</span>
                    {sortBy === 'protocol' && (
                      sortOrder === 'desc' ? <ChevronDownIcon className="h-3 w-3" /> : <ChevronUpIcon className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-right text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-600/30 transition-colors rounded-lg"
                  onClick={() => handleSort('value')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Value</span>
                    {sortBy === 'value' && (
                      sortOrder === 'desc' ? <ChevronDownIcon className="h-3 w-3" /> : <ChevronUpIcon className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-right text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-600/30 transition-colors rounded-lg"
                  onClick={() => handleSort('apy')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>APY</span>
                    {sortBy === 'apy' && (
                      sortOrder === 'desc' ? <ChevronDownIcon className="h-3 w-3" /> : <ChevronUpIcon className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Rewards
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 dark:bg-slate-800/30 divide-y divide-slate-200/50 dark:divide-slate-600/30 backdrop-blur-xl">
              {sortedPositions.map((position) => (
                <PositionTableRow key={position.id} position={position} />
              ))}
            </tbody>
          </table>
        </div>
        </div>
        </div>
      </div>
  );
}

// Helper functions
function getProtocolName(protocol: string): string {
  const protocolNames: Record<string, string> = {
    'uniswap-v3': 'Uniswap V3',
    'aave': 'Aave',
    'lido': 'Lido',
    'compound': 'Compound',
    'curve': 'Curve',
    'aerodrome': 'Aerodrome',
    'moonwell': 'Moonwell',
    'mamo': 'Mamo',
    'thena': 'Thena Finance',
    'gammaswap': 'GammaSwap',
    'morpho': 'Morpho'
  };
  return protocolNames[protocol] || protocol;
}

function getProtocolIcon(protocol: string): string {
  switch (protocol) {
    case 'uniswap-v3':
      return '🦄';
    case 'aave':
      return '👻';
    case 'lido':
      return '🏛️';
    case 'compound':
      return '🏦';
    case 'curve':
      return '🌊';
    case 'aerodrome':
      return '🛩️';
    case 'moonwell':
      return '🌙';
    case 'mamo':
      return '🤖'; // AI robot emoji for Mamo AI agent
    case 'thena':
      return '⚡'; // Lightning bolt for Thena Finance
    case 'gammaswap':
      return '♦️'; // Diamond for GammaSwap options protocol
    case 'morpho':
      return '🔵'; // Blue circle for Morpho lending protocol
    default:
      return '💎';
  }
}

function ProtocolSummaryCard({ protocol, data }: { 
  protocol: string; 
  data: { count: number; totalValue: number; positions: DeFiPosition[] } 
}) {
  // Calculate average APY for this protocol
  const totalAPY = data.positions.reduce((sum, pos) => sum + (pos.apy * pos.value), 0);
  const avgAPY = data.totalValue > 0 ? totalAPY / data.totalValue : 0;
  const totalRewards = data.positions.reduce((sum, pos) => sum + (pos.claimable || 0), 0);

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
      <div className="relative p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-600/50 rounded-xl hover:border-slate-300/50 dark:hover:border-slate-500/50 transition-all shadow-sm hover:shadow-md">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-xl">{getProtocolIcon(protocol)}</span>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">{getProtocolName(protocol)}</h4>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Value</span>
            <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(data.totalValue)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Positions</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{data.count}</span>
          </div>
          
          {avgAPY > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Avg APY</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{formatPercent(avgAPY)}</span>
            </div>
          )}
          
          {totalRewards > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Rewards</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalRewards)}</span>
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-600/50">
          <div className="w-full bg-slate-200/50 dark:bg-slate-600/30 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min((data.totalValue / 50000) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PositionTableRow({ position }: { position: DeFiPosition }) {
  const getTypeIcon = (type: string, protocol?: string) => {
    if (protocol === 'aerodrome' && type === 'staking') return '🏆'; // Special icon for veAERO
    if (protocol === 'mamo' && type === 'yield-farming') return '🤖'; // AI yield farming
    if (protocol === 'mamo' && type === 'token') return '🎯'; // MAMO token
    switch (type) {
      case 'liquidity': return '💧';
      case 'lending': return '🏦';
      case 'staking': return '🔐';
      case 'farming': return '🌾';
      case 'yield-farming': return '🌱';
      case 'token': return '🪙';
      default: return '💎';
    }
  };

  const getStatusColor = (protocol: string, metadata?: any) => {
    if (protocol === 'uniswap-v3' && metadata?.inRange === false) {
      return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700/50';
    }
    if (protocol === 'aerodrome' && metadata?.nftId) {
      return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700/50';
    }
    if (protocol === 'mamo' && metadata?.isStrategy) {
      return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50';
    }
    if (protocol === 'mamo' && metadata?.isNativeToken) {
      return 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700/50';
    }
    return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50';
  };

  const getStatusText = (protocol: string, metadata?: any) => {
    if (protocol === 'uniswap-v3') {
      return metadata?.inRange ? 'In Range' : 'Out of Range';
    }
    if (protocol === 'aerodrome' && metadata?.nftId) {
      return `NFT #${metadata.nftId}`;
    }
    if (protocol === 'mamo' && metadata?.isStrategy) {
      return 'AI Managed';
    }
    if (protocol === 'mamo' && metadata?.isNativeToken) {
      return 'MAMO Token';
    }
    return 'Active';
  };

  // Special handling for veAERO positions
  const isVeAero = position.protocol === 'aerodrome' && position.type === 'staking' && position.metadata?.nftId;
  const isMamoStrategy = position.protocol === 'mamo' && position.metadata?.isStrategy;
  const isMamoToken = position.protocol === 'mamo' && position.metadata?.isNativeToken;
  
  let displayName: string;
  let displayTokens: string;
  
  if (isVeAero) {
    displayName = position.metadata?.displayName || `${getProtocolName(position.protocol)} ${position.type}`;
    displayTokens = position.metadata?.displayDescription || position.tokens.map(t => t.symbol).join(' / ');
  } else if (isMamoStrategy) {
    displayName = position.metadata?.description || 'Mamo AI Strategy';
    displayTokens = `${position.tokens.map(t => t.symbol).join(' / ')} • Auto-Compound`;
  } else if (isMamoToken) {
    displayName = 'MAMO Token';
    displayTokens = 'Native AI Agent Token';
  } else {
    displayName = `${getProtocolName(position.protocol)} ${position.type}`;
    displayTokens = position.tokens.map(t => t.symbol).join(' / ');
  }

  return (
    <tr className="hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-all duration-200">
      <td className="px-6 py-5 whitespace-nowrap">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-lg">{getTypeIcon(position.type, position.protocol)}</span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {displayName}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
              {displayTokens}
            </div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-5 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-base">{getProtocolIcon(position.protocol)}</span>
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {getProtocolName(position.protocol)}
          </span>
        </div>
      </td>
      
      <td className="px-6 py-5 whitespace-nowrap text-right">
        <div className="text-sm font-bold text-slate-900 dark:text-white">
          {formatCurrency(position.value)}
        </div>
      </td>
      
      <td className="px-6 py-5 whitespace-nowrap text-right">
        <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
          {position.apy > 0 ? formatPercent(position.apy) : '—'}
        </div>
      </td>
      
      <td className="px-6 py-5 whitespace-nowrap text-right">
        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
          {(position.claimable && position.claimable > 0) 
            ? formatCurrency(position.claimable) 
            : '—'
          }
        </div>
      </td>
      
      <td className="px-6 py-5 whitespace-nowrap text-center">
        <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full border backdrop-blur-xl ${
          getStatusColor(position.protocol, position.metadata)
        }`}>
          {getStatusText(position.protocol, position.metadata)}
        </span>
      </td>
    </tr>
  );
}

function DeFiPositionsLoader() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 rounded-xl border border-slate-200/50 dark:border-slate-600/50 shadow-lg animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-24 mb-3 animate-shimmer"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-600 rounded w-32 animate-shimmer"></div>
          </div>
        ))}
      </div>
      <div className="p-8 bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 rounded-2xl border border-slate-200/50 dark:border-slate-600/50 shadow-lg animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-600 rounded w-32 mb-6 animate-shimmer"></div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-600 rounded-xl animate-shimmer"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NoDeFiPositions() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/30 to-slate-100/30 dark:from-slate-800/30 dark:to-slate-700/30 rounded-2xl"></div>
      <div className="relative p-12 bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-600/50 shadow-lg text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-400 to-slate-600 rounded-full blur-2xl opacity-10"></div>
          <div className="relative w-20 h-20 bg-gradient-to-br from-slate-400 to-slate-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <span className="text-4xl">🏦</span>
          </div>
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">No DeFi Positions</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
          You don't have any active DeFi positions, or they haven't been detected yet.
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          <div className="p-3 bg-white/50 dark:bg-slate-700/30 rounded-lg">
            <div className="text-lg mb-1">🦄</div>
            <div className="font-medium">Uniswap V3</div>
          </div>
          <div className="p-3 bg-white/50 dark:bg-slate-700/30 rounded-lg">
            <div className="text-lg mb-1">👻</div>
            <div className="font-medium">Aave</div>
          </div>
          <div className="p-3 bg-white/50 dark:bg-slate-700/30 rounded-lg">
            <div className="text-lg mb-1">🏛️</div>
            <div className="font-medium">Lido</div>
          </div>
          <div className="p-3 bg-white/50 dark:bg-slate-700/30 rounded-lg">
            <div className="text-lg mb-1">🌊</div>
            <div className="font-medium">Curve</div>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-6">
          And more protocols coming soon...
        </p>
      </div>
    </div>
  );
}