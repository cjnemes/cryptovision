'use client';

import React from 'react';
import { DeFiPosition } from '@/types';

interface PortfolioInsightsProps {
  positions: DeFiPosition[];
}

interface ProtocolAllocation {
  protocol: string;
  value: number;
  percentage: number;
  positions: number;
}

interface TypeAllocation {
  type: string;
  value: number;
  percentage: number;
  positions: number;
}

export const PortfolioInsights: React.FC<PortfolioInsightsProps> = ({ positions }) => {
  const calculateTotalValue = () => {
    return positions.reduce((total, position) => total + position.value, 0);
  };

  const getProtocolAllocations = (): ProtocolAllocation[] => {
    const totalValue = calculateTotalValue();
    if (totalValue === 0) return [];

    const protocolGroups = positions.reduce((groups, position) => {
      const protocol = position.protocol;
      if (!groups[protocol]) {
        groups[protocol] = { value: 0, positions: 0 };
      }
      groups[protocol].value += position.value;
      groups[protocol].positions += 1;
      return groups;
    }, {} as Record<string, { value: number; positions: number }>);

    return Object.entries(protocolGroups)
      .map(([protocol, data]) => ({
        protocol,
        value: data.value,
        percentage: (data.value / totalValue) * 100,
        positions: data.positions,
      }))
      .sort((a, b) => b.value - a.value);
  };

  const getTypeAllocations = (): TypeAllocation[] => {
    const totalValue = calculateTotalValue();
    if (totalValue === 0) return [];

    const typeGroups = positions.reduce((groups, position) => {
      const type = position.type;
      if (!groups[type]) {
        groups[type] = { value: 0, positions: 0 };
      }
      groups[type].value += position.value;
      groups[type].positions += 1;
      return groups;
    }, {} as Record<string, { value: number; positions: number }>);

    return Object.entries(typeGroups)
      .map(([type, data]) => ({
        type: type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: data.value,
        percentage: (data.value / totalValue) * 100,
        positions: data.positions,
      }))
      .sort((a, b) => b.value - a.value);
  };

  const getTopPerformers = () => {
    return positions
      .filter(p => p.apy && p.apy > 0)
      .sort((a, b) => (b.apy || 0) - (a.apy || 0))
      .slice(0, 5);
  };

  const getHealthMetrics = () => {
    const totalPositions = positions.length;
    const totalValue = calculateTotalValue();
    const avgAPY = positions.reduce((sum, p) => sum + (p.apy || 0), 0) / totalPositions;
    const totalClaimable = positions.reduce((sum, p) => sum + (p.claimable || 0), 0);
    
    return {
      totalPositions,
      totalValue,
      avgAPY,
      totalClaimable,
      protocolCount: getProtocolAllocations().length,
      diversificationScore: getProtocolAllocations().length > 0 
        ? Math.min(100, (getProtocolAllocations().length * 20)) // Score out of 100
        : 0
    };
  };

  if (positions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Portfolio Data Yet</h3>
        <p className="text-gray-500">Connect your wallet or add manual positions to see insights</p>
      </div>
    );
  }

  const protocolAllocations = getProtocolAllocations();
  const typeAllocations = getTypeAllocations();
  const topPerformers = getTopPerformers();
  const healthMetrics = getHealthMetrics();

  return (
    <div className="space-y-8">
      {/* Portfolio Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="text-sm font-medium text-blue-600 mb-1">Total Value</div>
          <div className="text-2xl font-bold text-blue-900">
            ${healthMetrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="text-sm font-medium text-green-600 mb-1">Average APY</div>
          <div className="text-2xl font-bold text-green-900">
            {healthMetrics.avgAPY.toFixed(2)}%
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
          <div className="text-sm font-medium text-purple-600 mb-1">Protocols</div>
          <div className="text-2xl font-bold text-purple-900">{healthMetrics.protocolCount}</div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
          <div className="text-sm font-medium text-orange-600 mb-1">Claimable</div>
          <div className="text-2xl font-bold text-orange-900">
            ${healthMetrics.totalClaimable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Protocol Allocation */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Protocol Allocation</h3>
        <div className="space-y-4">
          {protocolAllocations.map((allocation, index) => (
            <div key={allocation.protocol} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full bg-${['blue', 'green', 'purple', 'orange', 'red'][index % 5]}-500`} />
                <div>
                  <div className="font-medium text-gray-900">{allocation.protocol}</div>
                  <div className="text-sm text-gray-500">{allocation.positions} position{allocation.positions !== 1 ? 's' : ''}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  ${allocation.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-500">{allocation.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Position Type Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Position Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {typeAllocations.map((allocation) => (
            <div key={allocation.type} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-900">{allocation.type}</div>
                <div className="text-sm font-semibold text-blue-600">{allocation.percentage.toFixed(1)}%</div>
              </div>
              <div className="text-sm text-gray-600">
                {allocation.positions} position{allocation.positions !== 1 ? 's' : ''} • 
                ${allocation.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Highest Yielding Positions</h3>
          <div className="space-y-4">
            {topPerformers.map((position, index) => (
              <div key={position.id} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{position.metadata?.description || 'Unknown Position'}</div>
                  <div className="text-sm text-gray-600">{position.protocol} • {position.type}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">{position.apy}% APY</div>
                  <div className="text-sm text-gray-600">
                    ${position.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diversification Score */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Portfolio Health</h3>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Diversification Score</span>
              <span className="text-sm font-semibold text-blue-600">{healthMetrics.diversificationScore}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  healthMetrics.diversificationScore >= 80 ? 'bg-green-500' :
                  healthMetrics.diversificationScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${healthMetrics.diversificationScore}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {healthMetrics.diversificationScore >= 80 ? 'Excellent diversification' :
               healthMetrics.diversificationScore >= 60 ? 'Good diversification' : 
               'Consider diversifying across more protocols'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{healthMetrics.totalPositions}</div>
              <div className="text-gray-600">Total Positions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{healthMetrics.protocolCount}</div>
              <div className="text-gray-600">Protocols Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {positions.filter(p => p.value > 1000).length}
              </div>
              <div className="text-gray-600">Positions &gt; $1K</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};