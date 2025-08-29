'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { DeFiPosition } from '@/types';

interface DeFiPositionsResponse {
  address: string;
  summary: {
    totalValue: number;
    totalClaimable: number;
    averageAPY: number;
    positionCount: number;
    protocolCount: number;
  };
  positions: DeFiPosition[];
  protocolBreakdown: Record<string, {
    count: number;
    totalValue: number;
    positions: DeFiPosition[];
  }>;
  timestamp: string;
  note?: string;
}

export function useDeFiPositions() {
  const { address, isConnected } = useAccount();

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery<DeFiPositionsResponse>({
    queryKey: ['defiPositions', address],
    queryFn: async () => {
      if (!address) throw new Error('No wallet address available');
      
      const response = await fetch(`/api/defi/${address}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch DeFi positions: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: isConnected && !!address,
    refetchInterval: 120000, // Refetch every 2 minutes (DeFi data changes less frequently)
    staleTime: 60000, // Consider data fresh for 1 minute
  });

  const positions = data?.positions || [];
  const summary = data?.summary || {
    totalValue: 0,
    totalClaimable: 0,
    averageAPY: 0,
    positionCount: 0,
    protocolCount: 0,
  };

  // Helper functions for filtered data
  const getPositionsByProtocol = (protocol: string) => {
    return positions.filter(pos => pos.protocol === protocol);
  };

  const getPositionsByType = (type: string) => {
    return positions.filter(pos => pos.type === type);
  };

  const getTopPositionsByValue = (limit: number = 5) => {
    return [...positions]
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  };

  const getProtocolSummary = () => {
    return data?.protocolBreakdown || {};
  };

  const hasPositions = positions.length > 0;
  const hasMockData = data?.note?.includes('mock');

  return {
    // Core data
    positions,
    summary,
    protocolBreakdown: data?.protocolBreakdown || {},
    
    // Loading states
    isLoading,
    error,
    hasPositions,
    hasMockData,
    
    // Helper functions
    getPositionsByProtocol,
    getPositionsByType,
    getTopPositionsByValue,
    getProtocolSummary,
    refetch,
    
    // Convenience flags
    isConnected,
    address: address || null,
  };
}

// Hook for specific protocol positions
export function useDeFiPositionsByProtocol(protocol: string) {
  const { address, isConnected } = useAccount();

  return useQuery<DeFiPosition[]>({
    queryKey: ['defiPositions', protocol, address],
    queryFn: async () => {
      if (!address) throw new Error('No wallet address available');
      
      const response = await fetch(`/api/defi/${address}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, protocol }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${protocol} positions`);
      }
      
      const data = await response.json();
      return data.positions;
    },
    enabled: isConnected && !!address && !!protocol,
    refetchInterval: 120000,
  });
}