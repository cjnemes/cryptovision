import { DeFiPosition, TokenBalance } from '@/types';
import { priceService } from '@/lib/prices';

// Core P&L and Performance Types
export interface PositionSnapshot {
  positionId: string;
  timestamp: number;
  value: number;
  tokens: Array<{
    symbol: string;
    amount: string;
    price: number;
    value: number;
  }>;
  apy: number;
  protocol: string;
}

export interface PositionEntry {
  positionId: string;
  entryTimestamp: number;
  entryValue: number;
  entryPrice: number; // Average entry price for token positions
  tokens: Array<{
    symbol: string;
    amount: string;
    entryPrice: number;
  }>;
  protocol: string;
  type: string;
}

export interface PerformanceMetrics {
  // Overall Portfolio Performance
  totalValue: number;
  totalEntryValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  
  // Time-based Performance
  dailyChange: number;
  dailyChangePercent: number;
  weeklyChange: number;
  weeklyChangePercent: number;
  monthlyChange: number;
  monthlyChangePercent: number;
  
  // Best/Worst Performers
  bestPerformer: PositionPerformance | null;
  worstPerformer: PositionPerformance | null;
  
  // Protocol Attribution
  protocolPerformance: Record<string, ProtocolPerformance>;
  
  // Position Breakdown
  positions: PositionPerformance[];
}

export interface PositionPerformance {
  positionId: string;
  protocol: string;
  type: string;
  currentValue: number;
  entryValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  tokens: Array<{
    symbol: string;
    currentAmount: string;
    currentPrice: number;
    currentValue: number;
    entryPrice: number;
    entryValue: number;
    pnl: number;
    pnlPercent: number;
  }>;
  bestPerformanceDate?: number;
  worstPerformanceDate?: number;
  peakValue?: number;
  troughValue?: number;
}

export interface ProtocolPerformance {
  protocol: string;
  totalCurrentValue: number;
  totalEntryValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  positionCount: number;
  contributionToPortfolio: number; // Percentage of total portfolio PnL
}

export interface PerformanceStorage {
  positionEntries: Record<string, PositionEntry>;
  dailySnapshots: PositionSnapshot[];
  lastSnapshotTimestamp: number;
}

export class PerformanceTracker {
  private storageKey = 'cryptovision-performance-data';
  
  /**
   * Get or initialize performance data from localStorage
   */
  private getStorageData(): PerformanceStorage {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to parse performance storage data:', error);
    }
    
    return {
      positionEntries: {},
      dailySnapshots: [],
      lastSnapshotTimestamp: 0,
    };
  }
  
  /**
   * Save performance data to localStorage
   */
  private saveStorageData(data: PerformanceStorage): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save performance data:', error);
    }
  }
  
  /**
   * Track entry for new positions
   */
  async trackPositionEntry(position: DeFiPosition): Promise<void> {
    const storage = this.getStorageData();
    
    // Skip if already tracking this position
    if (storage.positionEntries[position.id]) {
      return;
    }
    
    const now = Date.now();
    const entry: PositionEntry = {
      positionId: position.id,
      entryTimestamp: now,
      entryValue: position.value,
      entryPrice: position.value, // For complex positions, this is the total value
      tokens: position.tokens.map(token => ({
        symbol: token.symbol,
        amount: token.balance,
        entryPrice: token.price,
      })),
      protocol: position.protocol,
      type: position.type,
    };
    
    storage.positionEntries[position.id] = entry;
    this.saveStorageData(storage);
  }
  
  /**
   * Track entries for multiple positions
   */
  async trackPositionEntries(positions: DeFiPosition[]): Promise<void> {
    const storage = this.getStorageData();
    let hasChanges = false;
    
    const now = Date.now();
    
    for (const position of positions) {
      // Skip if already tracking
      if (storage.positionEntries[position.id]) {
        continue;
      }
      
      const entry: PositionEntry = {
        positionId: position.id,
        entryTimestamp: now,
        entryValue: position.value,
        entryPrice: position.value,
        tokens: position.tokens.map(token => ({
          symbol: token.symbol,
          amount: token.balance,
          entryPrice: token.price,
        })),
        protocol: position.protocol,
        type: position.type,
      };
      
      storage.positionEntries[position.id] = entry;
      hasChanges = true;
    }
    
    if (hasChanges) {
      this.saveStorageData(storage);
    }
  }
  
  /**
   * Take daily snapshot of portfolio positions
   */
  async takeSnapshot(positions: DeFiPosition[]): Promise<void> {
    const storage = this.getStorageData();
    const now = Date.now();
    const today = new Date(now).toDateString();
    
    // Check if we already have a snapshot for today
    const existingToday = storage.dailySnapshots.find(snapshot => 
      new Date(snapshot.timestamp).toDateString() === today
    );
    
    if (existingToday) {
      return; // Already have today's snapshot
    }
    
    const snapshots: PositionSnapshot[] = positions.map(position => ({
      positionId: position.id,
      timestamp: now,
      value: position.value,
      tokens: position.tokens.map(token => ({
        symbol: token.symbol,
        amount: token.balance,
        price: token.price,
        value: token.value,
      })),
      apy: position.apy,
      protocol: position.protocol,
    }));
    
    storage.dailySnapshots.push(...snapshots);
    storage.lastSnapshotTimestamp = now;
    
    // Keep only last 90 days of snapshots
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
    storage.dailySnapshots = storage.dailySnapshots.filter(
      snapshot => snapshot.timestamp > ninetyDaysAgo
    );
    
    this.saveStorageData(storage);
  }
  
  /**
   * Calculate comprehensive performance metrics
   */
  async calculatePerformanceMetrics(currentPositions: DeFiPosition[]): Promise<PerformanceMetrics> {
    const storage = this.getStorageData();
    
    // Ensure we're tracking entries for all current positions
    await this.trackPositionEntries(currentPositions);
    
    // Take snapshot if needed
    await this.takeSnapshot(currentPositions);
    
    const positions: PositionPerformance[] = [];
    let totalValue = 0;
    let totalEntryValue = 0;
    
    // Calculate performance for each position
    for (const position of currentPositions) {
      const entry = storage.positionEntries[position.id];
      if (!entry) continue; // Skip positions without entry data
      
      const positionPerf = this.calculatePositionPerformance(position, entry, storage);
      positions.push(positionPerf);
      
      totalValue += positionPerf.currentValue;
      totalEntryValue += positionPerf.entryValue;
    }
    
    const unrealizedPnL = totalValue - totalEntryValue;
    const unrealizedPnLPercent = totalEntryValue > 0 ? (unrealizedPnL / totalEntryValue) * 100 : 0;
    
    // Calculate time-based performance
    const timeBasedMetrics = this.calculateTimeBasedPerformance(storage.dailySnapshots, totalValue);
    
    // Find best/worst performers
    const bestPerformer = positions.reduce((best, pos) => 
      (!best || pos.unrealizedPnLPercent > best.unrealizedPnLPercent) ? pos : best, 
      null as PositionPerformance | null
    );
    
    const worstPerformer = positions.reduce((worst, pos) => 
      (!worst || pos.unrealizedPnLPercent < worst.unrealizedPnLPercent) ? pos : worst,
      null as PositionPerformance | null
    );
    
    // Calculate protocol performance
    const protocolPerformance = this.calculateProtocolPerformance(positions, unrealizedPnL);
    
    return {
      totalValue,
      totalEntryValue,
      unrealizedPnL,
      unrealizedPnLPercent,
      ...timeBasedMetrics,
      bestPerformer,
      worstPerformer,
      protocolPerformance,
      positions,
    };
  }
  
  /**
   * Calculate performance for individual position
   */
  private calculatePositionPerformance(
    position: DeFiPosition, 
    entry: PositionEntry,
    storage: PerformanceStorage
  ): PositionPerformance {
    const currentValue = position.value;
    const entryValue = entry.entryValue;
    const unrealizedPnL = currentValue - entryValue;
    const unrealizedPnLPercent = entryValue > 0 ? (unrealizedPnL / entryValue) * 100 : 0;
    
    // Calculate token-level performance
    const tokenPerformance = position.tokens.map(currentToken => {
      const entryToken = entry.tokens.find(t => t.symbol === currentToken.symbol);
      if (!entryToken) {
        return {
          symbol: currentToken.symbol,
          currentAmount: currentToken.balance,
          currentPrice: currentToken.price,
          currentValue: currentToken.value,
          entryPrice: currentToken.price, // Fallback to current price
          entryValue: currentToken.value,
          pnl: 0,
          pnlPercent: 0,
        };
      }
      
      const entryValue = parseFloat(entryToken.amount) * entryToken.entryPrice;
      const pnl = currentToken.value - entryValue;
      const pnlPercent = entryValue > 0 ? (pnl / entryValue) * 100 : 0;
      
      return {
        symbol: currentToken.symbol,
        currentAmount: currentToken.balance,
        currentPrice: currentToken.price,
        currentValue: currentToken.value,
        entryPrice: entryToken.entryPrice,
        entryValue,
        pnl,
        pnlPercent,
      };
    });
    
    // Find historical peaks and troughs from snapshots
    const positionSnapshots = storage.dailySnapshots
      .filter(s => s.positionId === position.id)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    let peakValue = currentValue;
    let troughValue = currentValue;
    let bestPerformanceDate: number | undefined;
    let worstPerformanceDate: number | undefined;
    
    if (positionSnapshots.length > 0) {
      peakValue = Math.max(currentValue, ...positionSnapshots.map(s => s.value));
      troughValue = Math.min(currentValue, ...positionSnapshots.map(s => s.value));
      
      const peakSnapshot = positionSnapshots.find(s => s.value === peakValue);
      const troughSnapshot = positionSnapshots.find(s => s.value === troughValue);
      
      bestPerformanceDate = peakSnapshot?.timestamp;
      worstPerformanceDate = troughSnapshot?.timestamp;
    }
    
    return {
      positionId: position.id,
      protocol: position.protocol,
      type: position.type,
      currentValue,
      entryValue,
      unrealizedPnL,
      unrealizedPnLPercent,
      tokens: tokenPerformance,
      bestPerformanceDate,
      worstPerformanceDate,
      peakValue,
      troughValue,
    };
  }
  
  /**
   * Calculate time-based performance metrics
   */
  private calculateTimeBasedPerformance(snapshots: PositionSnapshot[], currentTotalValue: number) {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    // Find closest snapshots to time periods
    const dailySnapshot = this.findClosestSnapshot(snapshots, oneDayAgo);
    const weeklySnapshot = this.findClosestSnapshot(snapshots, oneWeekAgo);
    const monthlySnapshot = this.findClosestSnapshot(snapshots, oneMonthAgo);
    
    // Calculate daily change
    const dailyValue = dailySnapshot ? this.calculateSnapshotTotalValue(snapshots, dailySnapshot.timestamp) : currentTotalValue;
    const dailyChange = currentTotalValue - dailyValue;
    const dailyChangePercent = dailyValue > 0 ? (dailyChange / dailyValue) * 100 : 0;
    
    // Calculate weekly change
    const weeklyValue = weeklySnapshot ? this.calculateSnapshotTotalValue(snapshots, weeklySnapshot.timestamp) : currentTotalValue;
    const weeklyChange = currentTotalValue - weeklyValue;
    const weeklyChangePercent = weeklyValue > 0 ? (weeklyChange / weeklyValue) * 100 : 0;
    
    // Calculate monthly change
    const monthlyValue = monthlySnapshot ? this.calculateSnapshotTotalValue(snapshots, monthlySnapshot.timestamp) : currentTotalValue;
    const monthlyChange = currentTotalValue - monthlyValue;
    const monthlyChangePercent = monthlyValue > 0 ? (monthlyChange / monthlyValue) * 100 : 0;
    
    return {
      dailyChange,
      dailyChangePercent,
      weeklyChange,
      weeklyChangePercent,
      monthlyChange,
      monthlyChangePercent,
    };
  }
  
  /**
   * Find closest snapshot to target timestamp
   */
  private findClosestSnapshot(snapshots: PositionSnapshot[], targetTimestamp: number): PositionSnapshot | null {
    if (snapshots.length === 0) return null;
    
    return snapshots.reduce((closest, snapshot) => {
      const currentDiff = Math.abs(snapshot.timestamp - targetTimestamp);
      const closestDiff = Math.abs(closest.timestamp - targetTimestamp);
      return currentDiff < closestDiff ? snapshot : closest;
    });
  }
  
  /**
   * Calculate total portfolio value at a specific timestamp
   */
  private calculateSnapshotTotalValue(snapshots: PositionSnapshot[], timestamp: number): number {
    const snapshotsAtTime = snapshots.filter(s => 
      Math.abs(s.timestamp - timestamp) < (60 * 60 * 1000) // Within 1 hour
    );
    
    return snapshotsAtTime.reduce((total, snapshot) => total + snapshot.value, 0);
  }
  
  /**
   * Calculate protocol-level performance metrics
   */
  private calculateProtocolPerformance(
    positions: PositionPerformance[], 
    totalPortfolioPnL: number
  ): Record<string, ProtocolPerformance> {
    const protocolMap: Record<string, ProtocolPerformance> = {};
    
    for (const position of positions) {
      const protocol = position.protocol;
      
      if (!protocolMap[protocol]) {
        protocolMap[protocol] = {
          protocol,
          totalCurrentValue: 0,
          totalEntryValue: 0,
          unrealizedPnL: 0,
          unrealizedPnLPercent: 0,
          positionCount: 0,
          contributionToPortfolio: 0,
        };
      }
      
      const protocolPerf = protocolMap[protocol];
      protocolPerf.totalCurrentValue += position.currentValue;
      protocolPerf.totalEntryValue += position.entryValue;
      protocolPerf.unrealizedPnL += position.unrealizedPnL;
      protocolPerf.positionCount += 1;
    }
    
    // Calculate percentages and contributions
    for (const protocol of Object.keys(protocolMap)) {
      const protocolPerf = protocolMap[protocol];
      
      if (protocolPerf.totalEntryValue > 0) {
        protocolPerf.unrealizedPnLPercent = (protocolPerf.unrealizedPnL / protocolPerf.totalEntryValue) * 100;
      }
      
      if (totalPortfolioPnL !== 0) {
        protocolPerf.contributionToPortfolio = (protocolPerf.unrealizedPnL / totalPortfolioPnL) * 100;
      }
    }
    
    return protocolMap;
  }
  
  /**
   * Remove position from tracking (when position is closed)
   */
  async removePositionTracking(positionId: string): Promise<void> {
    const storage = this.getStorageData();
    
    // Remove entry
    delete storage.positionEntries[positionId];
    
    // Remove snapshots
    storage.dailySnapshots = storage.dailySnapshots.filter(
      snapshot => snapshot.positionId !== positionId
    );
    
    this.saveStorageData(storage);
  }
  
  /**
   * Clear all performance tracking data
   */
  clearAllData(): void {
    localStorage.removeItem(this.storageKey);
  }
  
  /**
   * Export performance data for backup
   */
  exportData(): PerformanceStorage {
    return this.getStorageData();
  }
  
  /**
   * Import performance data from backup
   */
  importData(data: PerformanceStorage): void {
    this.saveStorageData(data);
  }
  
  /**
   * Get historical snapshots for charting
   */
  getHistoricalData(days: number = 30): PositionSnapshot[] {
    const storage = this.getStorageData();
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    return storage.dailySnapshots
      .filter(snapshot => snapshot.timestamp > cutoffTime)
      .sort((a, b) => a.timestamp - b.timestamp);
  }
  
  /**
   * Get portfolio value history for performance charts
   */
  getPortfolioValueHistory(days: number = 30): Array<{ timestamp: number; value: number }> {
    const snapshots = this.getHistoricalData(days);
    const valueByDay = new Map<string, number>();
    
    // Group snapshots by day and sum values
    for (const snapshot of snapshots) {
      const day = new Date(snapshot.timestamp).toDateString();
      const currentValue = valueByDay.get(day) || 0;
      valueByDay.set(day, currentValue + snapshot.value);
    }
    
    return Array.from(valueByDay.entries()).map(([day, value]) => ({
      timestamp: new Date(day).getTime(),
      value,
    })).sort((a, b) => a.timestamp - b.timestamp);
  }
}

// Export singleton instance
export const performanceTracker = new PerformanceTracker();

// Utility functions
export function formatPnL(pnl: number): string {
  const sign = pnl >= 0 ? '+' : '';
  return `${sign}$${pnl.toFixed(2)}`;
}

export function formatPnLPercent(pnlPercent: number): string {
  const sign = pnlPercent >= 0 ? '+' : '';
  return `${sign}${pnlPercent.toFixed(2)}%`;
}

export function getPnLColor(pnl: number): string {
  if (pnl > 0) return 'text-green-600';
  if (pnl < 0) return 'text-red-600';
  return 'text-gray-600';
}

export function getPnLColorClass(pnl: number): { text: string; bg: string } {
  if (pnl > 0) return { text: 'text-green-600', bg: 'bg-green-50' };
  if (pnl < 0) return { text: 'text-red-600', bg: 'bg-red-50' };
  return { text: 'text-gray-600', bg: 'bg-gray-50' };
}