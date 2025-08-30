'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useYieldOptimizer } from '@/hooks/useYieldOptimizer';
import { YieldOpportunity } from '@/lib/analytics/yield-optimizer';
import { 
  ArrowTrendingUpIcon, 
  ExclamationTriangleIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowRightIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  FireIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const riskColors = {
  low: 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800',
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800',
  high: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800',
};

const difficultyIcons = {
  easy: '⚡',
  medium: '🔧',
  hard: '🎯',
};

const typeIcons = {
  compound: '🔄',
  migrate: '🚀',
  rebalance: '⚖️',
  leverage: '📊',
  arbitrage: '💰',
};

function OpportunityCard({ opportunity, onExecute }: { 
  opportunity: YieldOpportunity; 
  onExecute?: (op: YieldOpportunity) => void;
}) {
  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-300"></div>
      <Card className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-lg font-bold">
                {typeIcons[opportunity.type]}
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {opportunity.title}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${riskColors[opportunity.risk]}`}>
                    {opportunity.risk} risk
                  </span>
                  <span className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {difficultyIcons[opportunity.difficulty]} {opportunity.difficulty}
                  </span>
                  <span className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    {opportunity.confidence}% confidence
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <CardDescription className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {opportunity.description}
          </CardDescription>
          
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2 mb-1">
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Potential Gain</span>
              </div>
              <div className="text-lg font-bold text-green-800 dark:text-green-200">
                ${opportunity.potentialGain.amount.toFixed(2)}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                +{opportunity.potentialGain.percentage.toFixed(1)}% over {opportunity.potentialGain.timeframe}
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2 mb-1">
                <ChartBarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">APY Change</span>
              </div>
              <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                {opportunity.metrics.currentAPY.toFixed(1)}% → {opportunity.metrics.targetAPY.toFixed(1)}%
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                Gas: ~${opportunity.gasEstimate}
              </div>
            </div>
          </div>

          {/* Action Steps */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-2">
              <LightBulbIcon className="w-4 h-4" />
              <span>Action Steps</span>
            </h4>
            <div className="space-y-2">
              {opportunity.steps.map((step, index) => (
                <div key={index} className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-xs font-bold text-purple-700 dark:text-purple-300">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{step.action}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{step.description}</div>
                  </div>
                  {step.gasEstimate > 0 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">~${step.gasEstimate}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          {opportunity.requirements && opportunity.requirements.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                <ShieldCheckIcon className="w-4 h-4" />
                <span>Requirements</span>
              </h4>
              <div className="space-y-1">
                {opportunity.requirements.map((req, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <button 
            onClick={() => onExecute?.(opportunity)}
            className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
          >
            <span>{opportunity.recommendedAction}</span>
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

export function YieldOptimizer() {
  const { 
    analysis, 
    quickWins, 
    highImpactOpportunities,
    isLoading, 
    hasData,
    getTotalPotentialGainByCategory,
    getAverageConfidence,
    getRiskDistribution,
    getEstimatedGasForAllActions
  } = useYieldOptimizer();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'quick-wins' | 'high-impact' | 'strategy'>('overview');

  const handleExecuteOpportunity = (opportunity: YieldOpportunity) => {
    // This would integrate with wallet connections and protocol interactions
    console.log('Execute opportunity:', opportunity);
    alert(`Execute: ${opportunity.title}\n\nThis would initiate the transaction sequence for this optimization.`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <RocketLaunchIcon className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">
          No Optimization Opportunities Yet
        </h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Add some DeFi positions to your portfolio to receive personalized yield optimization recommendations.
        </p>
      </div>
    );
  }

  const riskDist = getRiskDistribution();
  const avgConfidence = getAverageConfidence();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Yield Optimizer
          </h2>
          <p className="text-slate-600 dark:text-slate-400">AI-powered recommendations to maximize your DeFi returns</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${analysis?.totalPotentialGain.toFixed(2) || '0'}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Total Potential Gain</div>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <FireIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {quickWins?.length || 0}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400 font-medium">Quick Wins</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {highImpactOpportunities?.length || 0}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">High Impact</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {avgConfidence.toFixed(0)}%
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Avg Confidence</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                <CurrencyDollarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  ${getEstimatedGasForAllActions()}
                </div>
                <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">Est. Gas Cost</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center space-x-1 p-1 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg">
        {[
          { id: 'overview', label: 'Overview', icon: ChartBarIcon },
          { id: 'quick-wins', label: 'Quick Wins', icon: FireIcon },
          { id: 'high-impact', label: 'High Impact', icon: ArrowTrendingUpIcon },
          { id: 'strategy', label: 'Strategy', icon: LightBulbIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShieldCheckIcon className="w-5 h-5" />
                  <span>Risk Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-green-600 font-medium">Low Risk</span>
                    <span className="font-bold">{riskDist.low} opportunities</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-600 font-medium">Medium Risk</span>
                    <span className="font-bold">{riskDist.medium} opportunities</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-red-600 font-medium">High Risk</span>
                    <span className="font-bold">{riskDist.high} opportunities</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Risk Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  <span>Portfolio Assessment</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Overall Risk</span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${riskColors[analysis?.riskAssessment.portfolioRisk || 'low']}`}>
                      {analysis?.riskAssessment.portfolioRisk}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Diversification Needed</span>
                    <span className={analysis?.riskAssessment.diversificationNeeded ? 'text-amber-600' : 'text-green-600'}>
                      {analysis?.riskAssessment.diversificationNeeded ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Leverage Exposure</span>
                    <span>{analysis?.riskAssessment.leverageExposure.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Concentration Risk</span>
                    <span>{analysis?.riskAssessment.concentrationRisk.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'quick-wins' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {quickWins?.map((opportunity) => (
              <OpportunityCard 
                key={opportunity.id} 
                opportunity={opportunity} 
                onExecute={handleExecuteOpportunity}
              />
            ))}
            {(!quickWins || quickWins.length === 0) && (
              <div className="col-span-2 text-center py-8 text-slate-500 dark:text-slate-400">
                No quick wins available at the moment.
              </div>
            )}
          </div>
        )}

        {activeTab === 'high-impact' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {highImpactOpportunities?.map((opportunity) => (
              <OpportunityCard 
                key={opportunity.id} 
                opportunity={opportunity} 
                onExecute={handleExecuteOpportunity}
              />
            ))}
            {(!highImpactOpportunities || highImpactOpportunities.length === 0) && (
              <div className="col-span-2 text-center py-8 text-slate-500 dark:text-slate-400">
                No high-impact opportunities found.
              </div>
            )}
          </div>
        )}

        {activeTab === 'strategy' && (
          <div className="space-y-6">
            {/* Immediate Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FireIcon className="w-5 h-5 text-red-500" />
                  <span>Immediate Actions</span>
                </CardTitle>
                <CardDescription>Take these actions now for quick gains</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis?.recommendations.immediate.map((op) => (
                    <div key={op.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <div>
                        <div className="font-semibold">{op.title}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{op.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">+${op.potentialGain.amount.toFixed(2)}</div>
                        <div className="text-xs text-slate-500">~${op.gasEstimate} gas</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Short-term and Long-term strategies... */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ClockIcon className="w-5 h-5 text-blue-500" />
                    <span>Short-term (1-3 months)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis?.recommendations.shortTerm.map((op) => (
                      <div key={op.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="font-medium">{op.title}</div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">+${op.potentialGain.amount.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <RocketLaunchIcon className="w-5 h-5 text-purple-500" />
                    <span>Long-term (6+ months)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis?.recommendations.longTerm.map((op) => (
                      <div key={op.id} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="font-medium">{op.title}</div>
                        <div className="text-sm text-purple-600 dark:text-purple-400">+${op.potentialGain.amount.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}