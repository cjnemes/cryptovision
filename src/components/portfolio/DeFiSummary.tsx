'use client';

import { useDeFiPositions } from '@/hooks/useDeFiPositions';
import { formatCurrency, formatPercent } from '@/lib/utils';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export function DeFiSummary() {
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
    return <DeFiSummaryLoader />;
  }

  if (!hasPositions) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">DeFi Positions</h3>
          <Link 
            href="/defi" 
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>View Details</span>
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <span className="text-4xl">🏦</span>
          </div>
          <p className="text-gray-600">No DeFi positions detected</p>
        </div>
      </div>
    );
  }

  const topPositions = getTopPositionsByValue(3);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">DeFi Positions</h3>
        <Link 
          href="/defi" 
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1 transition-colors"
        >
          <span>View All {summary.positionCount}</span>
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {hasMockData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            📊 Showing demo data. Connect with API keys to see real positions.
          </p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(summary.totalValue)}
          </p>
          <p className="text-sm text-gray-600">Total Value</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.totalClaimable)}
          </p>
          <p className="text-sm text-gray-600">Claimable</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {formatPercent(summary.averageAPY)}
          </p>
          <p className="text-sm text-gray-600">Avg APY</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {summary.protocolCount}
          </p>
          <p className="text-sm text-gray-600">Protocols</p>
        </div>
      </div>

      {/* Protocol Summary */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Top Protocols</h4>
        {Object.entries(protocolBreakdown)
          .sort(([,a], [,b]) => b.totalValue - a.totalValue)
          .slice(0, 3)
          .map(([protocol, data]) => (
            <div key={protocol} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xl">
                  {getProtocolIcon(protocol)}
                </span>
                <div>
                  <p className="font-medium capitalize">
                    {getProtocolName(protocol)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {data.count} position{data.count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <p className="font-semibold">{formatCurrency(data.totalValue)}</p>
            </div>
          ))}
      </div>
    </div>
  );
}

function DeFiSummaryLoader() {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center">
            <div className="h-8 bg-gray-200 rounded w-20 mx-auto mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
}

function getProtocolIcon(protocol: string) {
  switch (protocol) {
    case 'uniswap-v3': return '🦄';
    case 'aave': return '👻';
    case 'lido': return '🏛️';
    case 'compound': return '🏦';
    case 'curve': return '🌊';
    case 'aerodrome': return '🛩️';
    case 'moonwell': return '🌙';
    default: return '💎';
  }
}

function getProtocolName(protocol: string) {
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