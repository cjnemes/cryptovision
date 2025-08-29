'use client';

import { useDeFiPositions } from '@/hooks/useDeFiPositions';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { DeFiPosition } from '@/types';

export function DeFiPositions() {
  const {
    positions,
    summary,
    protocolBreakdown,
    isLoading,
    hasPositions,
    hasMockData,
    getTopPositionsByValue
  } = useDeFiPositions();

  if (isLoading) {
    return <DeFiPositionsLoader />;
  }

  if (!hasPositions) {
    return <NoDeFiPositions />;
  }

  const topPositions = getTopPositionsByValue(3);

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

      {/* Protocol Breakdown */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Protocols</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(protocolBreakdown).map(([protocol, data]) => (
            <ProtocolCard key={protocol} protocol={protocol} data={data} />
          ))}
        </div>
      </div>

      {/* Top Positions */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Top Positions</h3>
        <div className="space-y-4">
          {topPositions.map((position) => (
            <PositionCard key={position.id} position={position} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProtocolCard({ protocol, data }: { 
  protocol: string; 
  data: { count: number; totalValue: number; positions: DeFiPosition[] } 
}) {
  const protocolNames: Record<string, string> = {
    'uniswap-v3': 'Uniswap V3',
    'aave': 'Aave',
    'lido': 'Lido',
    'compound': 'Compound',
    'curve': 'Curve',
    'aerodrome': 'Aerodrome',
    'moonwell': 'Moonwell'
  };

  const getProtocolIcon = (protocol: string) => {
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
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getProtocolIcon(protocol)}</span>
          <h4 className="font-medium">{protocolNames[protocol] || protocol}</h4>
        </div>
        <span className="text-sm text-gray-500">{data.count} positions</span>
      </div>
      <p className="text-lg font-semibold text-gray-900">
        {formatCurrency(data.totalValue)}
      </p>
    </div>
  );
}

function PositionCard({ position }: { position: DeFiPosition }) {
  const getTypeIcon = (type: string) => {
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
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusText = (protocol: string, metadata?: any) => {
    if (protocol === 'uniswap-v3') {
      return metadata?.inRange ? 'In Range' : 'Out of Range';
    }
    return 'Active';
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getTypeIcon(position.type)}</span>
          <div>
            <h4 className="font-medium capitalize">
              {position.protocol.replace('-', ' ')} {position.type}
            </h4>
            <p className="text-sm text-gray-500">
              {position.tokens.map(t => t.symbol).join(' / ')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">{formatCurrency(position.value)}</p>
          <p className="text-sm text-blue-600">{formatPercent(position.apy)} APY</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
          getStatusColor(position.protocol, position.metadata)
        }`}>
          {getStatusText(position.protocol, position.metadata)}
        </span>
        
        {position.claimable && position.claimable > 0 && (
          <span className="text-sm text-green-600">
            {formatCurrency(position.claimable)} claimable
          </span>
        )}
      </div>
    </div>
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