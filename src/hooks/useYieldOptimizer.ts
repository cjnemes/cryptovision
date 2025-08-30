'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { useDeFiPositions } from './useDeFiPositions';
import { yieldOptimizer, type YieldOpportunity, type OptimizerAnalysis } from '@/lib/analytics/yield-optimizer';

export function useYieldOptimizer() {
  const { address, isConnected } = useAccount();
  const { positions, isLoading: positionsLoading } = useDeFiPositions();

  const {
    data: analysis,
    isLoading,
    error,
    refetch
  } = useQuery<OptimizerAnalysis>({
    queryKey: ['yieldOptimizer', address],
    queryFn: async () => {
      if (!positions || positions.length === 0) {
        return {
          totalPotentialGain: 0,
          highImpactOpportunities: [],
          quickWins: [],
          riskAssessment: {
            portfolioRisk: 'low',
            diversificationNeeded: false,
            leverageExposure: 0,
            concentrationRisk: 0
          },
          recommendations: {
            immediate: [],
            shortTerm: [],
            longTerm: []
          }
        } as OptimizerAnalysis;
      }
      
      return yieldOptimizer.analyzePortfolio(positions);
    },
    enabled: isConnected && !!address && !positionsLoading && positions && positions.length > 0,
    refetchInterval: 600000, // Refetch every 10 minutes
    staleTime: 300000, // Consider data fresh for 5 minutes
  });

  const {
    data: quickWins,
    isLoading: quickWinsLoading
  } = useQuery<YieldOpportunity[]>({
    queryKey: ['yieldOptimizer', 'quickWins', address],
    queryFn: async () => {
      if (!positions || positions.length === 0) return [];
      return yieldOptimizer.getQuickRecommendations(positions);
    },
    enabled: isConnected && !!address && !positionsLoading && positions && positions.length > 0,
    refetchInterval: 600000,
    staleTime: 300000,
  });

  const {
    data: highImpactOpportunities,
    isLoading: highImpactLoading
  } = useQuery<YieldOpportunity[]>({
    queryKey: ['yieldOptimizer', 'highImpact', address],
    queryFn: async () => {
      if (!positions || positions.length === 0) return [];
      return yieldOptimizer.getHighImpactOpportunities(positions);
    },
    enabled: isConnected && !!address && !positionsLoading && positions && positions.length > 0,
    refetchInterval: 600000,
    staleTime: 300000,
  });

  // Helper functions
  const getOpportunitiesByType = (type: YieldOpportunity['type']) => {
    return analysis?.highImpactOpportunities.filter(op => op.type === type) || [];
  };

  const getOpportunitiesByRisk = (risk: YieldOpportunity['risk']) => {
    return analysis?.highImpactOpportunities.filter(op => op.risk === risk) || [];
  };

  const getOpportunitiesByDifficulty = (difficulty: YieldOpportunity['difficulty']) => {
    return analysis?.highImpactOpportunities.filter(op => op.difficulty === difficulty) || [];
  };

  const getTotalPotentialGainByCategory = (category: string) => {
    if (!analysis) return 0;
    return analysis.highImpactOpportunities
      .filter(op => op.category === category)
      .reduce((sum, op) => sum + op.potentialGain.amount, 0);
  };

  const getAverageConfidence = () => {
    if (!analysis || analysis.highImpactOpportunities.length === 0) return 0;
    return analysis.highImpactOpportunities.reduce((sum, op) => sum + op.confidence, 0) / analysis.highImpactOpportunities.length;
  };

  const getTopOpportunityByCategory = () => {
    if (!analysis) return null;
    const categories = ['Compounding', 'Migration', 'Rebalancing', 'Diversification', 'Leverage'];
    
    return categories.map(category => {
      const categoryOps = analysis.highImpactOpportunities.filter(op => op.category === category);
      if (categoryOps.length === 0) return null;
      
      return {
        category,
        opportunity: categoryOps.sort((a, b) => b.potentialGain.amount - a.potentialGain.amount)[0],
        count: categoryOps.length
      };
    }).filter(Boolean);
  };

  const getRiskDistribution = () => {
    if (!analysis) return { low: 0, medium: 0, high: 0 };
    
    return analysis.highImpactOpportunities.reduce((dist, op) => {
      dist[op.risk]++;
      return dist;
    }, { low: 0, medium: 0, high: 0 });
  };

  const getEstimatedGasForAllActions = () => {
    if (!analysis) return 0;
    return analysis.recommendations.immediate.reduce((sum, op) => sum + op.gasEstimate, 0);
  };

  return {
    // Core data
    analysis,
    quickWins,
    highImpactOpportunities,
    
    // Loading states
    isLoading: isLoading || positionsLoading,
    quickWinsLoading,
    highImpactLoading,
    error,
    
    // Data availability
    hasData: !!analysis && analysis.highImpactOpportunities.length > 0,
    hasQuickWins: !!quickWins && quickWins.length > 0,
    hasHighImpactOps: !!highImpactOpportunities && highImpactOpportunities.length > 0,
    
    // Helper functions
    getOpportunitiesByType,
    getOpportunitiesByRisk,
    getOpportunitiesByDifficulty,
    getTotalPotentialGainByCategory,
    getAverageConfidence,
    getTopOpportunityByCategory,
    getRiskDistribution,
    getEstimatedGasForAllActions,
    refetch,
    
    // Convenience flags
    isConnected,
    address: address || null,
    hasPositions: positions && positions.length > 0,
  };
}