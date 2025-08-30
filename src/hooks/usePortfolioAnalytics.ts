'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

interface PortfolioAnalyticsResponse {
  address: string;
  hasPositions: boolean;
  metrics: {
    totalValue: number;
    totalClaimable: number;
    weightedAverageAPY: number;
    positionCount: number;
    protocolCount: number;
    networkCount: number;
    diversificationScore: number;
    riskScore: number;
    liquidationRisk: number;
    estimatedDailyYield: number;
    estimatedMonthlyYield: number;
    estimatedAnnualYield: number;
    protocolAllocation: Record<string, { value: number; percentage: number; count: number }>;
    typeAllocation: Record<string, { value: number; percentage: number; count: number }>;
    networkAllocation: Record<string, { value: number; percentage: number; count: number }>;
    tokenAllocation: Record<string, { value: number; percentage: number; positions: number }>;
    riskFactors: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      title: string;
      description: string;
      affectedValue: number;
      recommendation?: string;
    }>;
    opportunities: Array<{
      type: string;
      impact: 'low' | 'medium' | 'high';
      title: string;
      description: string;
      potentialGain: number;
      effort: 'low' | 'medium' | 'high';
      action?: string;
    }>;
  };
  positionAnalyses: Array<{
    positionId: string;
    protocol: string;
    type: string;
    value: number;
    apy: number;
    healthScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    yieldEfficiency: number;
    smartContractRisk: number;
    estimatedDailyEarnings: number;
    recommendations: string[];
    warnings: string[];
    compoundingFrequency: 'manual' | 'daily' | 'auto' | 'real-time';
    gasCostImpact: number;
  }>;
  insights: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
    impact: string;
  }>;
  recommendations: Array<{
    type: string;
    priority: string;
    title: string;
    description: string;
    action: string;
    potentialGain?: number;
    effort?: string;
    affectedValue?: number;
    positionId?: string;
    positionValue?: number;
  }>;
  timestamp: string;
  note?: string;
}

export function usePortfolioAnalytics() {
  const { address, isConnected } = useAccount();

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery<PortfolioAnalyticsResponse>({
    queryKey: ['portfolioAnalytics', address],
    queryFn: async () => {
      if (!address) throw new Error('No wallet address available');
      
      const response = await fetch(`/api/analytics/${address}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch portfolio analytics: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: isConnected && !!address,
    refetchInterval: 300000, // Refetch every 5 minutes
    staleTime: 120000, // Consider data fresh for 2 minutes
  });

  // Helper functions for common analytics queries
  const getTopRisks = (limit: number = 5) => {
    if (!data?.metrics.riskFactors) return [];
    
    return data.metrics.riskFactors
      .sort((a, b) => {
        const severityWeights = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityWeights[b.severity] - severityWeights[a.severity];
      })
      .slice(0, limit);
  };

  const getTopOpportunities = (limit: number = 5) => {
    if (!data?.metrics.opportunities) return [];
    
    return data.metrics.opportunities
      .sort((a, b) => {
        const impactWeights = { high: 3, medium: 2, low: 1 };
        return impactWeights[b.impact] - impactWeights[a.impact];
      })
      .slice(0, limit);
  };

  const getPositionsByRisk = () => {
    if (!data?.positionAnalyses) return { critical: [], high: [], medium: [], low: [] };
    
    return data.positionAnalyses.reduce((acc, position) => {
      acc[position.riskLevel].push(position);
      return acc;
    }, { critical: [] as any[], high: [] as any[], medium: [] as any[], low: [] as any[] });
  };

  const getTopPerformingPositions = (limit: number = 5) => {
    if (!data?.positionAnalyses) return [];
    
    return data.positionAnalyses
      .sort((a, b) => b.yieldEfficiency - a.yieldEfficiency)
      .slice(0, limit);
  };

  const getProtocolBreakdown = () => {
    if (!data?.metrics.protocolAllocation) return [];
    
    return Object.entries(data.metrics.protocolAllocation)
      .sort(([,a], [,b]) => b.percentage - a.percentage)
      .map(([protocol, allocation]) => ({
        protocol,
        ...allocation,
      }));
  };

  const getRiskAnalysis = () => {
    if (!data?.metrics) return null;
    
    return {
      overallRisk: data.metrics.riskScore > 70 ? 'high' : 
                   data.metrics.riskScore > 40 ? 'medium' : 'low',
      diversification: data.metrics.diversificationScore > 70 ? 'excellent' :
                      data.metrics.diversificationScore > 50 ? 'good' :
                      data.metrics.diversificationScore > 30 ? 'fair' : 'poor',
      liquidationRisk: data.metrics.liquidationRisk > 50 ? 'high' :
                      data.metrics.liquidationRisk > 25 ? 'medium' : 'low',
      riskScore: data.metrics.riskScore,
      diversificationScore: data.metrics.diversificationScore,
      liquidationRiskScore: data.metrics.liquidationRisk,
    };
  };

  const getYieldAnalysis = () => {
    if (!data?.metrics) return null;
    
    return {
      currentAPY: data.metrics.weightedAverageAPY,
      dailyYield: data.metrics.estimatedDailyYield,
      monthlyYield: data.metrics.estimatedMonthlyYield,
      annualYield: data.metrics.estimatedAnnualYield,
      yieldGrade: data.metrics.weightedAverageAPY > 15 ? 'A' :
                  data.metrics.weightedAverageAPY > 10 ? 'B' :
                  data.metrics.weightedAverageAPY > 5 ? 'C' : 'D',
      totalClaimable: data.metrics.totalClaimable,
    };
  };

  const getHealthOverview = () => {
    if (!data?.positionAnalyses) return null;
    
    const healthScores = data.positionAnalyses.map(p => p.healthScore);
    const averageHealth = healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;
    
    return {
      averageHealthScore: averageHealth,
      healthGrade: averageHealth > 80 ? 'Excellent' :
                   averageHealth > 60 ? 'Good' :
                   averageHealth > 40 ? 'Fair' : 'Poor',
      criticalPositions: data.positionAnalyses.filter(p => p.riskLevel === 'critical').length,
      highRiskPositions: data.positionAnalyses.filter(p => p.riskLevel === 'high').length,
      lowEfficiencyPositions: data.positionAnalyses.filter(p => p.yieldEfficiency < 50).length,
    };
  };

  return {
    // Core data
    data,
    metrics: data?.metrics,
    positionAnalyses: data?.positionAnalyses,
    insights: data?.insights,
    recommendations: data?.recommendations,
    
    // Loading states
    isLoading,
    error,
    hasData: data?.hasPositions || false,
    hasMockData: data?.note?.includes('mock') || false,
    
    // Helper functions
    getTopRisks,
    getTopOpportunities,
    getPositionsByRisk,
    getTopPerformingPositions,
    getProtocolBreakdown,
    getRiskAnalysis,
    getYieldAnalysis,
    getHealthOverview,
    refetch,
    
    // Convenience flags
    isConnected,
    address: address || null,
  };
}

// Hook for specific position analysis
export function usePositionAnalysis(positionId: string) {
  const { address, isConnected } = useAccount();

  return useQuery({
    queryKey: ['positionAnalysis', address, positionId],
    queryFn: async () => {
      if (!address) throw new Error('No wallet address available');
      
      const response = await fetch(`/api/analytics/${address}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address, 
          analysisType: 'position', 
          positionId 
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch position analysis`);
      }
      
      return response.json();
    },
    enabled: isConnected && !!address && !!positionId,
    refetchInterval: 300000,
  });
}