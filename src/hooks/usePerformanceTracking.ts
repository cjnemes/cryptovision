import { useState, useEffect, useCallback } from 'react';
import { DeFiPosition } from '@/types';
import { 
  performanceTracker, 
  PerformanceMetrics, 
  PositionPerformance,
  ProtocolPerformance
} from '@/lib/analytics/performance-tracker';

interface UsePerformanceTrackingReturn {
  // Performance Metrics
  performanceMetrics: PerformanceMetrics | null;
  
  // Loading States
  isLoading: boolean;
  isRefreshing: boolean;
  
  // Error Handling
  error: string | null;
  
  // Actions
  refreshPerformance: () => Promise<void>;
  trackNewPosition: (position: DeFiPosition) => Promise<void>;
  removePositionTracking: (positionId: string) => Promise<void>;
  clearAllData: () => void;
  
  // Historical Data
  getHistoricalData: (days?: number) => Array<{ timestamp: number; value: number }>;
  getPortfolioValueHistory: (days?: number) => Array<{ timestamp: number; value: number }>;
  
  // Utility Functions
  getPositionPnL: (positionId: string) => PositionPerformance | null;
  getProtocolPnL: (protocol: string) => ProtocolPerformance | null;
  getTotalPnL: () => { amount: number; percent: number };
}

interface UsePerformanceTrackingOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  enableSnapshots?: boolean;
}

export function usePerformanceTracking(
  positions: DeFiPosition[] = [],
  options: UsePerformanceTrackingOptions = {}
): UsePerformanceTrackingReturn {
  const {
    autoRefresh = true,
    refreshInterval = 60000, // 1 minute default
    enableSnapshots = true
  } = options;

  // State
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calculate and update performance metrics
   */
  const calculatePerformanceMetrics = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      if (positions.length === 0) {
        setPerformanceMetrics(null);
        return;
      }

      // Calculate comprehensive performance metrics
      const metrics = await performanceTracker.calculatePerformanceMetrics(positions);
      setPerformanceMetrics(metrics);

    } catch (err) {
      console.error('Failed to calculate performance metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate performance metrics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [positions]);

  /**
   * Refresh performance data
   */
  const refreshPerformance = useCallback(async () => {
    await calculatePerformanceMetrics(false);
  }, [calculatePerformanceMetrics]);

  /**
   * Track a new position entry
   */
  const trackNewPosition = useCallback(async (position: DeFiPosition) => {
    try {
      await performanceTracker.trackPositionEntry(position);
      // Recalculate metrics after adding new position
      await calculatePerformanceMetrics(false);
    } catch (err) {
      console.error('Failed to track new position:', err);
      setError(err instanceof Error ? err.message : 'Failed to track new position');
    }
  }, [calculatePerformanceMetrics]);

  /**
   * Remove position from tracking
   */
  const removePositionTracking = useCallback(async (positionId: string) => {
    try {
      await performanceTracker.removePositionTracking(positionId);
      // Recalculate metrics after removing position
      await calculatePerformanceMetrics(false);
    } catch (err) {
      console.error('Failed to remove position tracking:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove position tracking');
    }
  }, [calculatePerformanceMetrics]);

  /**
   * Clear all performance data
   */
  const clearAllData = useCallback(() => {
    try {
      performanceTracker.clearAllData();
      setPerformanceMetrics(null);
      setError(null);
    } catch (err) {
      console.error('Failed to clear performance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear performance data');
    }
  }, []);

  /**
   * Get historical data for charting
   */
  const getHistoricalData = useCallback((days = 30) => {
    return performanceTracker.getPortfolioValueHistory(days);
  }, []);

  /**
   * Get portfolio value history
   */
  const getPortfolioValueHistory = useCallback((days = 30) => {
    return performanceTracker.getPortfolioValueHistory(days);
  }, []);

  /**
   * Get P&L for specific position
   */
  const getPositionPnL = useCallback((positionId: string): PositionPerformance | null => {
    if (!performanceMetrics) return null;
    return performanceMetrics.positions.find(p => p.positionId === positionId) || null;
  }, [performanceMetrics]);

  /**
   * Get P&L for specific protocol
   */
  const getProtocolPnL = useCallback((protocol: string): ProtocolPerformance | null => {
    if (!performanceMetrics) return null;
    return performanceMetrics.protocolPerformance[protocol] || null;
  }, [performanceMetrics]);

  /**
   * Get total portfolio P&L
   */
  const getTotalPnL = useCallback(() => {
    if (!performanceMetrics) {
      return { amount: 0, percent: 0 };
    }
    return {
      amount: performanceMetrics.unrealizedPnL,
      percent: performanceMetrics.unrealizedPnLPercent
    };
  }, [performanceMetrics]);

  // Initial load and position changes
  useEffect(() => {
    calculatePerformanceMetrics(true);
  }, [calculatePerformanceMetrics]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || positions.length === 0) return;

    const interval = setInterval(() => {
      refreshPerformance();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, positions.length, refreshPerformance]);

  // Snapshot taking (daily)
  useEffect(() => {
    if (!enableSnapshots || positions.length === 0) return;

    // Take snapshot once per day
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilTomorrow = tomorrow.getTime() - now.getTime();

    // Take initial snapshot if needed
    performanceTracker.takeSnapshot(positions);

    // Schedule daily snapshots
    const timeout = setTimeout(() => {
      const dailyInterval = setInterval(() => {
        if (positions.length > 0) {
          performanceTracker.takeSnapshot(positions);
        }
      }, 24 * 60 * 60 * 1000); // Once per day

      return () => clearInterval(dailyInterval);
    }, msUntilTomorrow);

    return () => clearTimeout(timeout);
  }, [positions, enableSnapshots]);

  return {
    performanceMetrics,
    isLoading,
    isRefreshing,
    error,
    refreshPerformance,
    trackNewPosition,
    removePositionTracking,
    clearAllData,
    getHistoricalData,
    getPortfolioValueHistory,
    getPositionPnL,
    getProtocolPnL,
    getTotalPnL,
  };
}

// Helper hook for position-specific performance
export function usePositionPerformance(positionId: string, positions: DeFiPosition[] = []) {
  const { getPositionPnL, performanceMetrics, isLoading } = usePerformanceTracking(positions, {
    autoRefresh: false // Avoid duplicate tracking
  });

  const positionPnL = getPositionPnL(positionId);

  return {
    positionPnL,
    isLoading,
    hasData: !!positionPnL
  };
}

// Helper hook for protocol-specific performance
export function useProtocolPerformance(protocol: string, positions: DeFiPosition[] = []) {
  const { getProtocolPnL, performanceMetrics, isLoading } = usePerformanceTracking(positions, {
    autoRefresh: false // Avoid duplicate tracking
  });

  const protocolPnL = getProtocolPnL(protocol);

  return {
    protocolPnL,
    isLoading,
    hasData: !!protocolPnL
  };
}

// Export types for components
export type {
  PerformanceMetrics,
  PositionPerformance,
  ProtocolPerformance
} from '@/lib/analytics/performance-tracker';