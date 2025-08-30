import { DeFiPosition, TokenBalance } from '@/types';
import { priceService } from '@/lib/prices';

export interface PortfolioMetrics {
  totalValue: number;
  totalClaimable: number;
  weightedAverageAPY: number;
  positionCount: number;
  protocolCount: number;
  networkCount: number;
  
  // Risk Metrics
  diversificationScore: number; // 0-100, higher is more diversified
  riskScore: number; // 0-100, higher is riskier
  liquidationRisk: number; // 0-100, higher is more at risk
  
  // Performance Metrics
  estimatedDailyYield: number;
  estimatedMonthlyYield: number;
  estimatedAnnualYield: number;
  
  // Composition Analysis
  protocolAllocation: Record<string, { value: number; percentage: number; count: number }>;
  typeAllocation: Record<string, { value: number; percentage: number; count: number }>;
  networkAllocation: Record<string, { value: number; percentage: number; count: number }>;
  tokenAllocation: Record<string, { value: number; percentage: number; positions: number }>;
  
  // Risk Factors
  riskFactors: RiskFactor[];
  opportunities: OpportunityFactor[];
}

export interface RiskFactor {
  type: 'high-concentration' | 'low-diversification' | 'liquidation-risk' | 'smart-contract' | 'impermanent-loss' | 'protocol-risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedValue: number;
  affectedPositions: string[];
  recommendation?: string;
}

export interface OpportunityFactor {
  type: 'yield-optimization' | 'rebalancing' | 'compound-rewards' | 'protocol-migration' | 'risk-reduction';
  impact: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  potentialGain: number;
  effort: 'low' | 'medium' | 'high';
  positions: string[];
  action?: string;
}

export interface PositionAnalysis {
  position: DeFiPosition;
  healthScore: number; // 0-100, higher is healthier
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Yield Analysis
  yieldEfficiency: number; // How well this position is performing vs alternatives
  compoundingFrequency: 'manual' | 'daily' | 'auto' | 'real-time';
  
  // Risk Analysis
  liquidationDistance?: number; // How close to liquidation (if applicable)
  impermanentLossRisk?: number; // For LP positions
  smartContractRisk: number; // Based on protocol maturity, audits, TVL
  
  // Performance
  estimatedDailyEarnings: number;
  gasCostImpact: number; // How much gas costs affect yield
  
  // Recommendations
  recommendations: string[];
  warnings: string[];
}

export class PortfolioAnalyticsService {
  
  /**
   * Analyze a complete DeFi portfolio
   */
  async analyzePortfolio(positions: DeFiPosition[]): Promise<PortfolioMetrics> {
    if (positions.length === 0) {
      return this.getEmptyMetrics();
    }

    const totalValue = positions.reduce((sum, p) => sum + p.value, 0);
    const totalClaimable = positions.reduce((sum, p) => sum + (p.claimable || 0), 0);
    
    // Calculate weighted average APY
    const totalWeightedAPY = positions.reduce((sum, p) => sum + (p.apy * p.value), 0);
    const weightedAverageAPY = totalValue > 0 ? totalWeightedAPY / totalValue : 0;

    // Analyze allocations
    const protocolAllocation = this.calculateProtocolAllocation(positions, totalValue);
    const typeAllocation = this.calculateTypeAllocation(positions, totalValue);
    const networkAllocation = this.calculateNetworkAllocation(positions, totalValue);
    const tokenAllocation = this.calculateTokenAllocation(positions, totalValue);

    // Calculate risk metrics
    const diversificationScore = this.calculateDiversificationScore(protocolAllocation, typeAllocation);
    const riskScore = this.calculateRiskScore(positions, protocolAllocation);
    const liquidationRisk = this.calculateLiquidationRisk(positions);

    // Identify risks and opportunities
    const riskFactors = this.identifyRiskFactors(positions, protocolAllocation, totalValue);
    const opportunities = this.identifyOpportunities(positions, totalValue);

    // Calculate yield projections
    const estimatedDailyYield = totalValue * (weightedAverageAPY / 100) / 365;
    const estimatedMonthlyYield = estimatedDailyYield * 30;
    const estimatedAnnualYield = totalValue * (weightedAverageAPY / 100);

    return {
      totalValue,
      totalClaimable,
      weightedAverageAPY,
      positionCount: positions.length,
      protocolCount: Object.keys(protocolAllocation).length,
      networkCount: Object.keys(networkAllocation).length,
      
      diversificationScore,
      riskScore,
      liquidationRisk,
      
      estimatedDailyYield,
      estimatedMonthlyYield,
      estimatedAnnualYield,
      
      protocolAllocation,
      typeAllocation,
      networkAllocation,
      tokenAllocation,
      
      riskFactors,
      opportunities,
    };
  }

  /**
   * Analyze individual position health and performance
   */
  async analyzePosition(position: DeFiPosition): Promise<PositionAnalysis> {
    const healthScore = this.calculatePositionHealthScore(position);
    const riskLevel = this.determineRiskLevel(healthScore, position);
    const yieldEfficiency = await this.calculateYieldEfficiency(position);
    const smartContractRisk = this.assessSmartContractRisk(position);
    
    const estimatedDailyEarnings = position.value * (position.apy / 100) / 365;
    const gasCostImpact = this.calculateGasCostImpact(position);
    
    const recommendations = this.generatePositionRecommendations(position, healthScore);
    const warnings = this.generatePositionWarnings(position, riskLevel);

    return {
      position,
      healthScore,
      riskLevel,
      yieldEfficiency,
      compoundingFrequency: this.determineCompoundingFrequency(position),
      liquidationDistance: this.calculateLiquidationDistance(position),
      impermanentLossRisk: this.calculateImpermanentLossRisk(position),
      smartContractRisk,
      estimatedDailyEarnings,
      gasCostImpact,
      recommendations,
      warnings,
    };
  }

  private calculateProtocolAllocation(positions: DeFiPosition[], totalValue: number) {
    const allocation: Record<string, { value: number; percentage: number; count: number }> = {};
    
    positions.forEach(position => {
      const protocol = position.protocol;
      if (!allocation[protocol]) {
        allocation[protocol] = { value: 0, percentage: 0, count: 0 };
      }
      allocation[protocol].value += position.value;
      allocation[protocol].count += 1;
    });

    // Calculate percentages
    Object.keys(allocation).forEach(protocol => {
      allocation[protocol].percentage = totalValue > 0 ? (allocation[protocol].value / totalValue) * 100 : 0;
    });

    return allocation;
  }

  private calculateTypeAllocation(positions: DeFiPosition[], totalValue: number) {
    const allocation: Record<string, { value: number; percentage: number; count: number }> = {};
    
    positions.forEach(position => {
      const type = position.type;
      if (!allocation[type]) {
        allocation[type] = { value: 0, percentage: 0, count: 0 };
      }
      allocation[type].value += position.value;
      allocation[type].count += 1;
    });

    Object.keys(allocation).forEach(type => {
      allocation[type].percentage = totalValue > 0 ? (allocation[type].value / totalValue) * 100 : 0;
    });

    return allocation;
  }

  private calculateNetworkAllocation(positions: DeFiPosition[], totalValue: number) {
    const allocation: Record<string, { value: number; percentage: number; count: number }> = {};
    
    positions.forEach(position => {
      // Determine network from protocol or metadata
      const network = this.getPositionNetwork(position);
      if (!allocation[network]) {
        allocation[network] = { value: 0, percentage: 0, count: 0 };
      }
      allocation[network].value += position.value;
      allocation[network].count += 1;
    });

    Object.keys(allocation).forEach(network => {
      allocation[network].percentage = totalValue > 0 ? (allocation[network].value / totalValue) * 100 : 0;
    });

    return allocation;
  }

  private calculateTokenAllocation(positions: DeFiPosition[], totalValue: number) {
    const allocation: Record<string, { value: number; percentage: number; positions: number }> = {};
    
    positions.forEach(position => {
      position.tokens.forEach(token => {
        if (!allocation[token.symbol]) {
          allocation[token.symbol] = { value: 0, percentage: 0, positions: 0 };
        }
        allocation[token.symbol].value += token.value;
      });
      
      // Count unique positions per token
      position.tokens.forEach(token => {
        if (allocation[token.symbol]) {
          allocation[token.symbol].positions += 1;
        }
      });
    });

    Object.keys(allocation).forEach(token => {
      allocation[token].percentage = totalValue > 0 ? (allocation[token].value / totalValue) * 100 : 0;
    });

    return allocation;
  }

  private calculateDiversificationScore(
    protocolAllocation: Record<string, { value: number; percentage: number; count: number }>,
    typeAllocation: Record<string, { value: number; percentage: number; count: number }>
  ): number {
    const protocolCount = Object.keys(protocolAllocation).length;
    const typeCount = Object.keys(typeAllocation).length;
    
    // Calculate concentration risk (Herfindahl Index)
    const protocolConcentration = Object.values(protocolAllocation)
      .reduce((sum, alloc) => sum + Math.pow(alloc.percentage / 100, 2), 0);
    
    const typeConcentration = Object.values(typeAllocation)
      .reduce((sum, alloc) => sum + Math.pow(alloc.percentage / 100, 2), 0);
    
    // Higher protocol count and lower concentration = better diversification
    const protocolDiversityScore = Math.min(protocolCount * 10, 50); // Max 50 points
    const concentrationScore = Math.max(0, 50 - (protocolConcentration + typeConcentration) * 50); // Max 50 points
    
    return Math.min(100, protocolDiversityScore + concentrationScore);
  }

  private calculateRiskScore(
    positions: DeFiPosition[], 
    protocolAllocation: Record<string, { value: number; percentage: number; count: number }>
  ): number {
    let riskScore = 0;

    // Protocol concentration risk
    const maxProtocolAllocation = Math.max(...Object.values(protocolAllocation).map(p => p.percentage));
    if (maxProtocolAllocation > 50) riskScore += 30;
    else if (maxProtocolAllocation > 30) riskScore += 15;

    // Smart contract risk based on protocol maturity
    const highRiskProtocols = ['manual', 'new-protocol'];
    const hasHighRiskProtocols = positions.some(p => highRiskProtocols.includes(p.protocol));
    if (hasHighRiskProtocols) riskScore += 20;

    // Liquidity positions (impermanent loss risk)
    const liquidityPositions = positions.filter(p => p.type === 'liquidity').length;
    const liquidityPercentage = liquidityPositions / positions.length;
    if (liquidityPercentage > 0.5) riskScore += 25;

    // Borrowing positions (liquidation risk)
    const borrowingPositions = positions.filter(p => p.type === 'borrowing' || p.metadata?.isDebt).length;
    if (borrowingPositions > 0) riskScore += 20;

    return Math.min(100, riskScore);
  }

  private calculateLiquidationRisk(positions: DeFiPosition[]): number {
    const borrowingPositions = positions.filter(p => 
      p.type === 'borrowing' || p.metadata?.isDebt
    );

    if (borrowingPositions.length === 0) return 0;

    // For simplicity, assume medium risk for any borrowing position
    // In a real implementation, this would check actual health factors
    return Math.min(100, borrowingPositions.length * 25);
  }

  private identifyRiskFactors(
    positions: DeFiPosition[], 
    protocolAllocation: Record<string, { value: number; percentage: number; count: number }>,
    totalValue: number
  ): RiskFactor[] {
    const risks: RiskFactor[] = [];

    // High concentration risk
    Object.entries(protocolAllocation).forEach(([protocol, allocation]) => {
      if (allocation.percentage > 70) {
        risks.push({
          type: 'high-concentration',
          severity: 'high',
          title: `High ${protocol} Concentration`,
          description: `${allocation.percentage.toFixed(1)}% of portfolio is in ${protocol}`,
          affectedValue: allocation.value,
          affectedPositions: positions.filter(p => p.protocol === protocol).map(p => p.id),
          recommendation: 'Consider diversifying into other protocols to reduce concentration risk'
        });
      } else if (allocation.percentage > 50) {
        risks.push({
          type: 'high-concentration',
          severity: 'medium',
          title: `Medium ${protocol} Concentration`,
          description: `${allocation.percentage.toFixed(1)}% of portfolio is in ${protocol}`,
          affectedValue: allocation.value,
          affectedPositions: positions.filter(p => p.protocol === protocol).map(p => p.id),
          recommendation: 'Monitor concentration levels and consider diversification'
        });
      }
    });

    // Liquidation risk
    const borrowingPositions = positions.filter(p => p.type === 'borrowing' || p.metadata?.isDebt);
    if (borrowingPositions.length > 0) {
      const totalBorrowingValue = borrowingPositions.reduce((sum, p) => sum + Math.abs(p.value), 0);
      risks.push({
        type: 'liquidation-risk',
        severity: totalBorrowingValue > totalValue * 0.3 ? 'high' : 'medium',
        title: 'Liquidation Risk Detected',
        description: `${borrowingPositions.length} borrowing positions with $${totalBorrowingValue.toFixed(2)} exposure`,
        affectedValue: totalBorrowingValue,
        affectedPositions: borrowingPositions.map(p => p.id),
        recommendation: 'Monitor health factors and maintain adequate collateral ratios'
      });
    }

    // Impermanent loss risk for LP positions
    const lpPositions = positions.filter(p => p.type === 'liquidity');
    if (lpPositions.length > 0) {
      const totalLPValue = lpPositions.reduce((sum, p) => sum + p.value, 0);
      if (totalLPValue > totalValue * 0.4) {
        risks.push({
          type: 'impermanent-loss',
          severity: 'medium',
          title: 'Impermanent Loss Exposure',
          description: `${(totalLPValue / totalValue * 100).toFixed(1)}% of portfolio in liquidity positions`,
          affectedValue: totalLPValue,
          affectedPositions: lpPositions.map(p => p.id),
          recommendation: 'Monitor token price correlations and consider single-sided staking alternatives'
        });
      }
    }

    return risks;
  }

  private identifyOpportunities(positions: DeFiPosition[], totalValue: number): OpportunityFactor[] {
    const opportunities: OpportunityFactor[] = [];

    // Claimable rewards opportunity
    const totalClaimable = positions.reduce((sum, p) => sum + (p.claimable || 0), 0);
    if (totalClaimable > 10) { // More than $10 in claimable rewards
      const positionsWithRewards = positions.filter(p => (p.claimable || 0) > 1);
      opportunities.push({
        type: 'compound-rewards',
        impact: totalClaimable > 100 ? 'high' : totalClaimable > 50 ? 'medium' : 'low',
        title: 'Compound Pending Rewards',
        description: `$${totalClaimable.toFixed(2)} in claimable rewards ready to compound`,
        potentialGain: totalClaimable,
        effort: 'low',
        positions: positionsWithRewards.map(p => p.id),
        action: 'Claim and reinvest rewards to maximize compounding'
      });
    }

    // Low APY positions
    const lowYieldPositions = positions.filter(p => p.apy < 5 && p.value > 100);
    if (lowYieldPositions.length > 0) {
      const totalLowYieldValue = lowYieldPositions.reduce((sum, p) => sum + p.value, 0);
      opportunities.push({
        type: 'yield-optimization',
        impact: totalLowYieldValue > 1000 ? 'high' : 'medium',
        title: 'Optimize Low-Yield Positions',
        description: `$${totalLowYieldValue.toFixed(2)} in positions earning less than 5% APY`,
        potentialGain: totalLowYieldValue * 0.05, // Assume 5% improvement potential
        effort: 'medium',
        positions: lowYieldPositions.map(p => p.id),
        action: 'Research higher-yield alternatives for these assets'
      });
    }

    return opportunities;
  }

  private calculatePositionHealthScore(position: DeFiPosition): number {
    let score = 100;

    // APY factor (higher is better)
    if (position.apy < 2) score -= 20;
    else if (position.apy < 5) score -= 10;
    else if (position.apy > 20) score += 10;

    // Protocol maturity factor
    const matureProtocols = ['uniswap-v3', 'aave', 'compound-v3', 'lido', 'moonwell', 'aerodrome'];
    if (!matureProtocols.includes(position.protocol)) score -= 15;

    // Position size factor (very small positions are inefficient due to gas)
    if (position.value < 50) score -= 25;
    else if (position.value < 100) score -= 10;

    // Debt positions are inherently riskier
    if (position.metadata?.isDebt) score -= 30;

    return Math.max(0, Math.min(100, score));
  }

  private determineRiskLevel(healthScore: number, position: DeFiPosition): 'low' | 'medium' | 'high' | 'critical' {
    if (position.metadata?.isDebt && healthScore < 40) return 'critical';
    if (healthScore < 30) return 'high';
    if (healthScore < 60) return 'medium';
    return 'low';
  }

  private async calculateYieldEfficiency(position: DeFiPosition): Promise<number> {
    // Simplified - in reality would compare to market rates for similar risk
    if (position.apy > 15) return 90;
    if (position.apy > 10) return 75;
    if (position.apy > 5) return 60;
    if (position.apy > 2) return 40;
    return 20;
  }

  private assessSmartContractRisk(position: DeFiPosition): number {
    const protocolRiskScores: Record<string, number> = {
      'uniswap-v3': 10, // Very low risk
      'aave': 15,
      'compound-v3': 15,
      'lido': 20,
      'moonwell': 25,
      'aerodrome': 30,
      'morpho': 35,
      'beefy': 40,
      'manual': 80, // High risk for manual/unverified
    };

    return protocolRiskScores[position.protocol] || 50;
  }

  private calculateGasCostImpact(position: DeFiPosition): number {
    // Estimate gas costs as percentage of position value
    const estimatedGasCost = 50; // $50 average transaction cost
    return (estimatedGasCost / position.value) * 100;
  }

  private generatePositionRecommendations(position: DeFiPosition, healthScore: number): string[] {
    const recommendations: string[] = [];

    if (position.value < 100) {
      recommendations.push('Consider consolidating small positions to reduce gas cost impact');
    }

    if (position.apy < 3) {
      recommendations.push('Research higher-yield alternatives for better returns');
    }

    if (position.claimable && position.claimable > 10) {
      recommendations.push('Claim pending rewards and compound for better returns');
    }

    if (position.type === 'liquidity') {
      recommendations.push('Monitor impermanent loss and consider single-sided alternatives if correlation is low');
    }

    if (healthScore < 50) {
      recommendations.push('Consider reducing exposure or migrating to more mature protocols');
    }

    return recommendations;
  }

  private generatePositionWarnings(position: DeFiPosition, riskLevel: 'low' | 'medium' | 'high' | 'critical'): string[] {
    const warnings: string[] = [];

    if (riskLevel === 'critical') {
      warnings.push('CRITICAL: This position requires immediate attention');
    }

    if (position.metadata?.isDebt) {
      warnings.push('Borrowing position - monitor liquidation risk closely');
    }

    if (position.protocol === 'manual') {
      warnings.push('Manual position - ensure accuracy of entered data');
    }

    const gasCostImpact = this.calculateGasCostImpact(position);
    if (gasCostImpact > 10) {
      warnings.push(`High gas cost impact (${gasCostImpact.toFixed(1)}% of position value)`);
    }

    return warnings;
  }

  private determineCompoundingFrequency(position: DeFiPosition): 'manual' | 'daily' | 'auto' | 'real-time' {
    if (position.metadata?.isBeefyVault || position.metadata?.autoCompounding) return 'auto';
    if (position.protocol === 'compound-v3' || position.protocol === 'aave') return 'real-time';
    if (position.claimable && position.claimable > 0) return 'manual';
    return 'daily';
  }

  private calculateLiquidationDistance(position: DeFiPosition): number | undefined {
    if (!position.metadata?.isDebt) return undefined;
    
    // Simplified calculation - would use actual health factors in production
    return Math.random() * 100; // Placeholder
  }

  private calculateImpermanentLossRisk(position: DeFiPosition): number | undefined {
    if (position.type !== 'liquidity') return undefined;
    
    // Simplified - would analyze token price correlations
    return Math.random() * 50; // Placeholder
  }

  private getPositionNetwork(position: DeFiPosition): string {
    // Map protocols to their primary networks
    const protocolNetworks: Record<string, string> = {
      'uniswap-v3': 'Multi-chain',
      'aerodrome': 'Base',
      'moonwell': 'Base',
      'mamo': 'Base',
      'compound-v3': 'Base',
      'aave': 'Base',
      'morpho': 'Base',
      'beefy': 'Base',
      'extra-finance': 'Base',
      'thena': 'BSC',
      'gammaswap': 'Multi-chain',
    };

    return protocolNetworks[position.protocol] || 'Unknown';
  }

  private getEmptyMetrics(): PortfolioMetrics {
    return {
      totalValue: 0,
      totalClaimable: 0,
      weightedAverageAPY: 0,
      positionCount: 0,
      protocolCount: 0,
      networkCount: 0,
      diversificationScore: 0,
      riskScore: 0,
      liquidationRisk: 0,
      estimatedDailyYield: 0,
      estimatedMonthlyYield: 0,
      estimatedAnnualYield: 0,
      protocolAllocation: {},
      typeAllocation: {},
      networkAllocation: {},
      tokenAllocation: {},
      riskFactors: [],
      opportunities: [],
    };
  }
}

export const portfolioAnalytics = new PortfolioAnalyticsService();