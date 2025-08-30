import { DeFiPosition } from '@/types';

export interface YieldOpportunity {
  id: string;
  type: 'rebalance' | 'migrate' | 'compound' | 'leverage' | 'arbitrage';
  title: string;
  description: string;
  currentPosition?: DeFiPosition;
  recommendedAction: string;
  potentialGain: {
    amount: number;
    percentage: number;
    timeframe: string;
  };
  risk: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
  gasEstimate: number;
  confidence: number; // 0-100
  protocol: string;
  category: string;
  requirements?: string[];
  steps: Array<{
    action: string;
    description: string;
    gasEstimate: number;
  }>;
  metrics: {
    currentAPY: number;
    targetAPY: number;
    impermanentLossRisk: number;
    liquidationRisk: number;
    smartContractRisk: number;
  };
}

export interface OptimizerAnalysis {
  totalPotentialGain: number;
  highImpactOpportunities: YieldOpportunity[];
  quickWins: YieldOpportunity[];
  riskAssessment: {
    portfolioRisk: 'low' | 'medium' | 'high';
    diversificationNeeded: boolean;
    leverageExposure: number;
    concentrationRisk: number;
  };
  recommendations: {
    immediate: YieldOpportunity[];
    shortTerm: YieldOpportunity[];
    longTerm: YieldOpportunity[];
  };
}

class YieldOptimizer {
  async analyzePortfolio(positions: DeFiPosition[]): Promise<OptimizerAnalysis> {
    const opportunities: YieldOpportunity[] = [];

    // Analyze each position for optimization opportunities
    for (const position of positions) {
      const positionOpportunities = await this.analyzePosition(position);
      opportunities.push(...positionOpportunities);
    }

    // Portfolio-wide analysis
    const portfolioOpportunities = await this.analyzePortfolioStrategy(positions);
    opportunities.push(...portfolioOpportunities);

    // Sort opportunities by potential impact
    const sortedOpportunities = opportunities.sort((a, b) => 
      (b.potentialGain.amount * b.confidence / 100) - (a.potentialGain.amount * a.confidence / 100)
    );

    const highImpact = sortedOpportunities.filter(op => 
      op.potentialGain.amount > 100 && op.confidence > 70
    ).slice(0, 5);

    const quickWins = sortedOpportunities.filter(op => 
      op.difficulty === 'easy' && op.gasEstimate < 50
    ).slice(0, 3);

    return {
      totalPotentialGain: opportunities.reduce((sum, op) => sum + op.potentialGain.amount, 0),
      highImpactOpportunities: highImpact,
      quickWins,
      riskAssessment: this.assessPortfolioRisk(positions),
      recommendations: {
        immediate: sortedOpportunities.filter(op => op.difficulty === 'easy').slice(0, 3),
        shortTerm: sortedOpportunities.filter(op => op.difficulty === 'medium').slice(0, 3),
        longTerm: sortedOpportunities.filter(op => op.difficulty === 'hard').slice(0, 2),
      }
    };
  }

  private async analyzePosition(position: DeFiPosition): Promise<YieldOpportunity[]> {
    const opportunities: YieldOpportunity[] = [];

    // Check for compounding opportunities
    if (position.claimable && position.claimable > 10) {
      opportunities.push({
        id: `compound-${position.id}`,
        type: 'compound',
        title: `Compound ${position.protocol} Rewards`,
        description: `Auto-compound ${position.claimable.toFixed(2)} ${position.token} rewards to increase yield`,
        currentPosition: position,
        recommendedAction: 'Claim and reinvest rewards',
        potentialGain: {
          amount: position.claimable * 0.1, // Estimated 10% boost from compounding
          percentage: 10,
          timeframe: '1 month'
        },
        risk: 'low',
        difficulty: 'easy',
        gasEstimate: 25,
        confidence: 85,
        protocol: position.protocol,
        category: 'Compounding',
        steps: [
          {
            action: 'Claim rewards',
            description: 'Harvest pending rewards',
            gasEstimate: 15
          },
          {
            action: 'Reinvest',
            description: 'Add rewards back to position',
            gasEstimate: 10
          }
        ],
        metrics: {
          currentAPY: position.apy,
          targetAPY: position.apy * 1.1,
          impermanentLossRisk: 0,
          liquidationRisk: 0,
          smartContractRisk: 20
        }
      });
    }

    // Check for migration opportunities (higher yield protocols)
    const migrationTarget = await this.findBetterYieldProtocol(position);
    if (migrationTarget) {
      opportunities.push({
        id: `migrate-${position.id}`,
        type: 'migrate',
        title: `Migrate to ${migrationTarget.protocol}`,
        description: `Move funds from ${position.protocol} (${position.apy.toFixed(1)}% APY) to ${migrationTarget.protocol} (${migrationTarget.apy.toFixed(1)}% APY)`,
        currentPosition: position,
        recommendedAction: `Withdraw from ${position.protocol} and deposit to ${migrationTarget.protocol}`,
        potentialGain: {
          amount: position.value * (migrationTarget.apy - position.apy) / 100,
          percentage: ((migrationTarget.apy - position.apy) / position.apy) * 100,
          timeframe: '1 year'
        },
        risk: 'medium',
        difficulty: 'medium',
        gasEstimate: 75,
        confidence: 70,
        protocol: migrationTarget.protocol,
        category: 'Migration',
        requirements: ['Research new protocol thoroughly', 'Check audit status'],
        steps: [
          {
            action: 'Withdraw',
            description: `Remove liquidity from ${position.protocol}`,
            gasEstimate: 35
          },
          {
            action: 'Deposit',
            description: `Provide liquidity to ${migrationTarget.protocol}`,
            gasEstimate: 40
          }
        ],
        metrics: {
          currentAPY: position.apy,
          targetAPY: migrationTarget.apy,
          impermanentLossRisk: migrationTarget.ilRisk,
          liquidationRisk: migrationTarget.liquidationRisk,
          smartContractRisk: migrationTarget.smartContractRisk
        }
      });
    }

    // Check for rebalancing opportunities
    if (position.type === 'liquidity' && position.healthScore < 70) {
      opportunities.push({
        id: `rebalance-${position.id}`,
        type: 'rebalance',
        title: `Rebalance ${position.protocol} LP Position`,
        description: `Current position is out of optimal range. Rebalancing could improve yield efficiency.`,
        currentPosition: position,
        recommendedAction: 'Adjust position ranges or token ratios',
        potentialGain: {
          amount: position.value * 0.05, // 5% improvement
          percentage: 5,
          timeframe: '1 month'
        },
        risk: 'low',
        difficulty: 'medium',
        gasEstimate: 50,
        confidence: 75,
        protocol: position.protocol,
        category: 'Rebalancing',
        steps: [
          {
            action: 'Analyze ranges',
            description: 'Check current vs optimal price ranges',
            gasEstimate: 0
          },
          {
            action: 'Rebalance',
            description: 'Adjust LP position parameters',
            gasEstimate: 50
          }
        ],
        metrics: {
          currentAPY: position.apy,
          targetAPY: position.apy * 1.05,
          impermanentLossRisk: 15,
          liquidationRisk: 0,
          smartContractRisk: 10
        }
      });
    }

    return opportunities;
  }

  private async analyzePortfolioStrategy(positions: DeFiPosition[]): Promise<YieldOpportunity[]> {
    const opportunities: YieldOpportunity[] = [];
    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);

    // Check for diversification opportunities
    const protocolCount = new Set(positions.map(p => p.protocol)).size;
    if (protocolCount < 3 && totalValue > 1000) {
      opportunities.push({
        id: 'diversify-protocols',
        type: 'rebalance',
        title: 'Diversify Across More Protocols',
        description: `Portfolio is concentrated in ${protocolCount} protocol(s). Spreading across more protocols could reduce risk and improve yield stability.`,
        recommendedAction: 'Allocate funds to 2-3 additional high-quality protocols',
        potentialGain: {
          amount: totalValue * 0.02, // 2% risk-adjusted return improvement
          percentage: 2,
          timeframe: '6 months'
        },
        risk: 'low',
        difficulty: 'medium',
        gasEstimate: 100,
        confidence: 80,
        protocol: 'Multiple',
        category: 'Diversification',
        requirements: ['Research additional protocols', 'Maintain similar risk level'],
        steps: [
          {
            action: 'Research',
            description: 'Identify complementary protocols',
            gasEstimate: 0
          },
          {
            action: 'Allocate',
            description: 'Gradually move funds to new protocols',
            gasEstimate: 100
          }
        ],
        metrics: {
          currentAPY: positions.reduce((sum, p) => sum + p.apy * p.value, 0) / totalValue,
          targetAPY: positions.reduce((sum, p) => sum + p.apy * p.value, 0) / totalValue * 1.02,
          impermanentLossRisk: 10,
          liquidationRisk: 5,
          smartContractRisk: 15
        }
      });
    }

    // Check for leverage opportunities (if portfolio is conservative)
    const avgAPY = positions.reduce((sum, p) => sum + p.apy * p.value, 0) / totalValue;
    if (avgAPY < 8 && totalValue > 5000) {
      opportunities.push({
        id: 'consider-leverage',
        type: 'leverage',
        title: 'Consider Moderate Leverage',
        description: `Portfolio is very conservative (${avgAPY.toFixed(1)}% APY). Strategic use of 1.5-2x leverage on blue-chip assets could boost returns.`,
        recommendedAction: 'Use moderate leverage on ETH/USDC positions',
        potentialGain: {
          amount: totalValue * 0.08, // 8% additional yield
          percentage: 8,
          timeframe: '1 year'
        },
        risk: 'medium',
        difficulty: 'hard',
        gasEstimate: 150,
        confidence: 60,
        protocol: 'Multiple',
        category: 'Leverage',
        requirements: ['Understand liquidation risks', 'Monitor positions actively', 'Start with small amounts'],
        steps: [
          {
            action: 'Education',
            description: 'Learn about leverage mechanics and risks',
            gasEstimate: 0
          },
          {
            action: 'Test',
            description: 'Start with small leveraged position',
            gasEstimate: 75
          },
          {
            action: 'Scale',
            description: 'Gradually increase if comfortable',
            gasEstimate: 75
          }
        ],
        metrics: {
          currentAPY: avgAPY,
          targetAPY: avgAPY * 1.8, // 1.8x leverage
          impermanentLossRisk: 20,
          liquidationRisk: 40,
          smartContractRisk: 25
        }
      });
    }

    return opportunities;
  }

  private async findBetterYieldProtocol(position: DeFiPosition): Promise<{
    protocol: string;
    apy: number;
    ilRisk: number;
    liquidationRisk: number;
    smartContractRisk: number;
  } | null> {
    // This would integrate with protocol APIs to find better yields
    // For now, return mock data for demonstration
    const alternatives = [
      {
        protocol: 'Moonwell',
        apy: position.apy * 1.2,
        ilRisk: 15,
        liquidationRisk: 10,
        smartContractRisk: 20
      },
      {
        protocol: 'Compound V3',
        apy: position.apy * 1.15,
        ilRisk: 0,
        liquidationRisk: 15,
        smartContractRisk: 15
      }
    ];

    // Return best alternative if APY is significantly higher
    const bestAlternative = alternatives.find(alt => alt.apy > position.apy * 1.1);
    return bestAlternative || null;
  }

  private assessPortfolioRisk(positions: DeFiPosition[]): OptimizerAnalysis['riskAssessment'] {
    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
    const protocolCount = new Set(positions.map(p => p.protocol)).size;
    const leveragedPositions = positions.filter(p => p.type === 'lending' || p.type === 'borrowing');
    
    // Calculate concentration risk
    const largestPosition = Math.max(...positions.map(p => p.value));
    const concentrationRisk = (largestPosition / totalValue) * 100;

    // Calculate leverage exposure
    const leverageExposure = leveragedPositions.reduce((sum, p) => sum + p.value, 0) / totalValue * 100;

    return {
      portfolioRisk: concentrationRisk > 50 || leverageExposure > 60 ? 'high' : 
                     concentrationRisk > 30 || leverageExposure > 30 ? 'medium' : 'low',
      diversificationNeeded: protocolCount < 3,
      leverageExposure,
      concentrationRisk
    };
  }

  // Get quick actionable recommendations
  async getQuickRecommendations(positions: DeFiPosition[]): Promise<YieldOpportunity[]> {
    const analysis = await this.analyzePortfolio(positions);
    return analysis.quickWins;
  }

  // Get high-impact opportunities
  async getHighImpactOpportunities(positions: DeFiPosition[]): Promise<YieldOpportunity[]> {
    const analysis = await this.analyzePortfolio(positions);
    return analysis.highImpactOpportunities;
  }
}

export const yieldOptimizer = new YieldOptimizer();