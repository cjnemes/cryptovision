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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total DeFi Value</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(summary.totalValue)}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Claimable Rewards</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.totalClaimable)}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Average APY</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatPercent(summary.averageAPY)}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Active Positions</h3>
          <p className="text-2xl font-bold text-gray-900">
            {summary.positionCount}
          </p>
          <p className="text-sm text-gray-500">
            {summary.protocolCount} protocols
          </p>
        </div>
      </div>

      {hasMockData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            📊 Showing demo DeFi positions. Connect with API keys to see real data.
          </p>
        </div>
      )}

      {/* Protocol Summary Cards */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-6">Protocol Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(protocolBreakdown).map(([protocol, data]) => (
            <ProtocolSummaryCard key={protocol} protocol={protocol} data={data} />
          ))}
        </div>
      </div>

      {/* Detailed Positions Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6 pb-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold">All Positions</h3>
            <div className="flex items-center gap-3">
              {/* Protocol Filter */}
              <select
                value={filterProtocol}
                onChange={(e) => setFilterProtocol(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('apy')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>APY</span>
                    {sortBy === 'apy' && (
                      sortOrder === 'desc' ? <ChevronDownIcon className="h-3 w-3" /> : <ChevronUpIcon className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rewards
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedPositions.map((position) => (
                <PositionTableRow key={position.id} position={position} />
              ))}
            </tbody>
          </table>
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
    'moonwell': 'Moonwell'
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
    <div className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getProtocolIcon(protocol)}</span>
          <h4 className="font-semibold text-gray-900">{getProtocolName(protocol)}</h4>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Value</span>
          <span className="font-semibold text-gray-900">{formatCurrency(data.totalValue)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Positions</span>
          <span className="font-medium text-gray-700">{data.count}</span>
        </div>
        
        {avgAPY > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Avg APY</span>
            <span className="font-medium text-blue-600">{formatPercent(avgAPY)}</span>
          </div>
        )}
        
        {totalRewards > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Rewards</span>
            <span className="font-medium text-green-600">{formatCurrency(totalRewards)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function PositionTableRow({ position }: { position: DeFiPosition }) {
  const getTypeIcon = (type: string, protocol?: string) => {
    if (protocol === 'aerodrome' && type === 'staking') return '🏆'; // Special icon for veAERO
    switch (type) {
      case 'liquidity': return '💧';
      case 'lending': return '🏦';
      case 'staking': return '🔐';
      case 'farming': return '🌾';
      default: return '💎';
    }
  };

  const getStatusColor = (protocol: string, metadata?: any) => {
    if (protocol === 'uniswap-v3' && metadata?.inRange === false) {
      return 'text-orange-600 bg-orange-50 border-orange-200';
    }
    if (protocol === 'aerodrome' && metadata?.nftId) {
      return 'text-purple-600 bg-purple-50 border-purple-200';
    }
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusText = (protocol: string, metadata?: any) => {
    if (protocol === 'uniswap-v3') {
      return metadata?.inRange ? 'In Range' : 'Out of Range';
    }
    if (protocol === 'aerodrome' && metadata?.nftId) {
      return `NFT #${metadata.nftId}`;
    }
    return 'Active';
  };

  // Special handling for veAERO positions
  const isVeAero = position.protocol === 'aerodrome' && position.type === 'staking' && position.metadata?.nftId;
  const displayName = isVeAero ? position.metadata?.displayName : `${getProtocolName(position.protocol)} ${position.type}`;
  const displayTokens = isVeAero ? position.metadata?.displayDescription : position.tokens.map(t => t.symbol).join(' / ');

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <span className="text-xl">{getTypeIcon(position.type, position.protocol)}</span>
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {displayName}
            </div>
            <div className="text-sm text-gray-500 truncate">
              {displayTokens}
            </div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getProtocolIcon(position.protocol)}</span>
          <span className="text-sm font-medium text-gray-900">
            {getProtocolName(position.protocol)}
          </span>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="text-sm font-semibold text-gray-900">
          {formatCurrency(position.value)}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="text-sm font-medium text-blue-600">
          {position.apy > 0 ? formatPercent(position.apy) : '—'}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="text-sm font-medium text-green-600">
          {(position.claimable && position.claimable > 0) 
            ? formatCurrency(position.claimable) 
            : '—'
          }
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NoDeFiPositions() {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
      <div className="text-gray-400 mb-4">
        <span className="text-6xl">🏦</span>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No DeFi Positions</h3>
      <p className="text-gray-600 mb-6">
        You don't have any active DeFi positions, or they haven't been detected yet.
      </p>
      <div className="space-y-2 text-sm text-gray-500">
        <p>• Uniswap V3 liquidity positions</p>
        <p>• Aave lending positions</p>
        <p>• Lido staking positions</p>
        <p>• And more protocols coming soon...</p>
      </div>
    </div>
  );
}