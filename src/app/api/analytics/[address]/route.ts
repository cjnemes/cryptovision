import { NextRequest, NextResponse } from 'next/server';
import { defiAggregator } from '@/lib/defi/aggregator';
import { manualPositionsService } from '@/lib/manual-positions';
import { portfolioAnalytics } from '@/lib/analytics/portfolio-analytics';
import { isValidAddress, serializeBigInt } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // Validate address format
    if (!isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    // Get positions from both auto-detected and manual sources
    const useMockData = !process.env.ALCHEMY_API_KEY || 
                       process.env.ALCHEMY_API_KEY === 'demo' || 
                       process.env.ALCHEMY_API_KEY === 'your_alchemy_api_key_here';

    let autoPositions;
    if (useMockData) {
      console.log('Using mock DeFi data for analytics');
      autoPositions = await defiAggregator.getMockPositions(address);
    } else {
      autoPositions = await defiAggregator.getAllPositions(address);
    }

    // Get manual positions
    const manualPositions = await manualPositionsService.convertToDeFiPositions(address);

    // Combine all positions
    const allPositions = [...autoPositions, ...manualPositions];

    if (allPositions.length === 0) {
      return NextResponse.json({
        address,
        hasPositions: false,
        metrics: await portfolioAnalytics.analyzePortfolio([]),
        positionAnalyses: [],
        summary: {
          message: 'No DeFi positions found for analysis',
          recommendations: [
            'Connect your wallet to start tracking DeFi positions',
            'Add manual positions for protocols not yet supported',
            'Consider diversifying across multiple DeFi protocols'
          ]
        },
        timestamp: new Date().toISOString(),
        ...(useMockData && { note: 'Using mock data for development' })
      });
    }

    // Perform comprehensive portfolio analysis
    console.log(`Analyzing portfolio of ${allPositions.length} positions for ${address}`);
    
    const [portfolioMetrics, ...positionAnalyses] = await Promise.all([
      portfolioAnalytics.analyzePortfolio(allPositions),
      ...allPositions.map(position => portfolioAnalytics.analyzePosition(position))
    ]);

    // Generate insights and recommendations
    const insights = generatePortfolioInsights(portfolioMetrics, positionAnalyses);
    const topRecommendations = generateTopRecommendations(portfolioMetrics, positionAnalyses);

    // Serialize the response data to convert BigInt values to strings
    const responseData = serializeBigInt({
      address,
      hasPositions: true,
      metrics: portfolioMetrics,
      positionAnalyses: positionAnalyses.map(analysis => ({
        positionId: analysis.position.id,
        protocol: analysis.position.protocol,
        type: analysis.position.type,
        value: analysis.position.value,
        apy: analysis.position.apy,
        healthScore: analysis.healthScore,
        riskLevel: analysis.riskLevel,
        yieldEfficiency: analysis.yieldEfficiency,
        smartContractRisk: analysis.smartContractRisk,
        estimatedDailyEarnings: analysis.estimatedDailyEarnings,
        recommendations: analysis.recommendations,
        warnings: analysis.warnings,
        compoundingFrequency: analysis.compoundingFrequency,
        gasCostImpact: analysis.gasCostImpact
      })),
      insights,
      recommendations: topRecommendations,
      timestamp: new Date().toISOString(),
      ...(useMockData && { note: 'Using mock data for development' })
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error analyzing portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to analyze portfolio' },
      { status: 500 }
    );
  }
}

function generatePortfolioInsights(metrics: any, analyses: any[]) {
  const insights = [];

  // Diversification insights
  if (metrics.diversificationScore < 30) {
    insights.push({
      type: 'diversification',
      severity: 'high',
      title: 'Low Portfolio Diversification',
      description: `Your diversification score is ${metrics.diversificationScore}/100. Consider spreading investments across more protocols.`,
      impact: 'high'
    });
  } else if (metrics.diversificationScore < 60) {
    insights.push({
      type: 'diversification',
      severity: 'medium',
      title: 'Moderate Diversification',
      description: `Your diversification score is ${metrics.diversificationScore}/100. Good foundation, but room for improvement.`,
      impact: 'medium'
    });
  }

  // Risk insights
  if (metrics.riskScore > 70) {
    insights.push({
      type: 'risk',
      severity: 'high',
      title: 'High Risk Portfolio',
      description: `Portfolio risk score is ${metrics.riskScore}/100. Consider reducing exposure to high-risk positions.`,
      impact: 'high'
    });
  }

  // Yield insights
  if (metrics.weightedAverageAPY < 3) {
    insights.push({
      type: 'yield',
      severity: 'medium',
      title: 'Low Average Yield',
      description: `Portfolio APY is ${metrics.weightedAverageAPY.toFixed(2)}%. Consider higher-yield opportunities.`,
      impact: 'medium'
    });
  } else if (metrics.weightedAverageAPY > 15) {
    insights.push({
      type: 'yield',
      severity: 'medium',
      title: 'High Yield Portfolio',
      description: `Excellent ${metrics.weightedAverageAPY.toFixed(2)}% APY, but verify if risk levels are acceptable.`,
      impact: 'positive'
    });
  }

  // Network concentration
  const topNetwork = Object.entries(metrics.networkAllocation)
    .sort(([,a], [,b]) => (b as any).percentage - (a as any).percentage)[0];
  
  if (topNetwork && (topNetwork[1] as any).percentage > 80) {
    insights.push({
      type: 'concentration',
      severity: 'medium',
      title: `${topNetwork[0]} Network Concentration`,
      description: `${(topNetwork[1] as any).percentage.toFixed(1)}% of portfolio is on ${topNetwork[0]}. Consider multi-chain diversification.`,
      impact: 'medium'
    });
  }

  // Gas efficiency insights
  const highGasCostPositions = analyses.filter(a => a.gasCostImpact > 5).length;
  if (highGasCostPositions > 0) {
    insights.push({
      type: 'efficiency',
      severity: 'low',
      title: 'Gas Cost Impact',
      description: `${highGasCostPositions} positions have high gas cost impact. Consider consolidation.`,
      impact: 'low'
    });
  }

  return insights;
}

function generateTopRecommendations(metrics: any, analyses: any[]) {
  const recommendations = [];

  // Top opportunities from metrics
  const topOpportunities = metrics.opportunities
    .sort((a: any, b: any) => {
      const impactWeights = { high: 3, medium: 2, low: 1 };
      return impactWeights[b.impact] - impactWeights[a.impact];
    })
    .slice(0, 3);

  topOpportunities.forEach((opp: any) => {
    recommendations.push({
      type: 'opportunity',
      priority: opp.impact,
      title: opp.title,
      description: opp.description,
      action: opp.action || 'Review and take action',
      potentialGain: opp.potentialGain,
      effort: opp.effort
    });
  });

  // Top risks that need attention
  const topRisks = metrics.riskFactors
    .sort((a: any, b: any) => {
      const severityWeights = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityWeights[b.severity] - severityWeights[a.severity];
    })
    .slice(0, 2);

  topRisks.forEach((risk: any) => {
    recommendations.push({
      type: 'risk-mitigation',
      priority: risk.severity,
      title: risk.title,
      description: risk.description,
      action: risk.recommendation || 'Review and mitigate risk',
      affectedValue: risk.affectedValue
    });
  });

  // Position-specific recommendations (top 3 by potential impact)
  const positionRecs = analyses
    .filter(a => a.recommendations.length > 0)
    .sort((a, b) => b.estimatedDailyEarnings - a.estimatedDailyEarnings)
    .slice(0, 3);

  positionRecs.forEach(analysis => {
    if (analysis.recommendations[0]) {
      recommendations.push({
        type: 'position-optimization',
        priority: analysis.riskLevel === 'high' ? 'high' : 'medium',
        title: `Optimize ${analysis.protocol} Position`,
        description: analysis.recommendations[0],
        action: 'Review position details and take action',
        positionId: analysis.positionId,
        positionValue: analysis.value
      });
    }
  });

  // Limit to top 8 recommendations
  return recommendations
    .sort((a, b) => {
      const priorityWeights = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityWeights[b.priority] - priorityWeights[a.priority];
    })
    .slice(0, 8);
}

// Export for potential POST requests for more specific analytics
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, analysisType, positionId } = body;

    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Valid address is required' },
        { status: 400 }
      );
    }

    // Handle specific analysis requests
    if (analysisType === 'position' && positionId) {
      // Get specific position analysis
      const positions = await defiAggregator.getAllPositions(address);
      const position = positions.find(p => p.id === positionId);
      
      if (!position) {
        return NextResponse.json(
          { error: 'Position not found' },
          { status: 404 }
        );
      }

      const analysis = await portfolioAnalytics.analyzePosition(position);
      
      return NextResponse.json(serializeBigInt({
        address,
        positionId,
        analysis,
        timestamp: new Date().toISOString()
      }));
    }

    return NextResponse.json(
      { error: 'Unsupported analysis type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in analytics POST:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics request' },
      { status: 500 }
    );
  }
}