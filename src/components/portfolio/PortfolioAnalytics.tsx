'use client';

import { usePortfolioAnalytics } from '@/hooks/usePortfolioAnalytics';
import { usePerformanceTracking } from '@/hooks/usePerformanceTracking';
import { useDeFiPositions } from '@/hooks/useDeFiPositions';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { formatPnL, formatPnLPercent, getPnLColorClass } from '@/lib/analytics/performance-tracker';
import { useState } from 'react';
import { 
  ChartBarIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  CpuChipIcon,
  FireIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

export function PortfolioAnalytics() {
  const {
    data,
    metrics,
    insights,
    recommendations,
    isLoading,
    hasData,
    hasMockData,
    getRiskAnalysis,
    getYieldAnalysis,
    getHealthOverview,
    getProtocolBreakdown,
    getTopRisks,
    getTopOpportunities
  } = usePortfolioAnalytics();

  // Get current positions for performance tracking
  const { positions } = useDeFiPositions();
  
  // Performance tracking hook
  const {
    performanceMetrics,
    isLoading: isPnLLoading,
    getTotalPnL,
    getPortfolioValueHistory
  } = usePerformanceTracking(positions, { autoRefresh: true });

  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'risks' | 'opportunities' | 'allocation'>('overview');

  if (isLoading) {
    return <AnalyticsLoader />;
  }

  if (!hasData) {
    return <NoAnalyticsData />;
  }

  const riskAnalysis = getRiskAnalysis();
  const yieldAnalysis = getYieldAnalysis();
  const healthOverview = getHealthOverview();
  const protocolBreakdown = getProtocolBreakdown();

  return (
    <div className="space-y-8">
      {/* Header with Key Metrics */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/30 to-purple-50/30 dark:from-violet-900/10 dark:to-purple-900/10 rounded-3xl"></div>
        <div className="relative p-8 bg-gradient-to-br from-violet-50/80 to-purple-50/80 dark:from-violet-900/20 dark:to-purple-900/20 backdrop-blur-xl rounded-3xl border border-violet-200/50 dark:border-violet-700/50 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl blur opacity-40"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <CpuChipIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Portfolio Analytics</h2>
                <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">AI-powered insights and optimization</p>
              </div>
            </div>

            {hasMockData && (
              <div className="px-4 py-2 bg-gradient-to-r from-amber-100/80 to-orange-100/80 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full border border-amber-200/50 dark:border-amber-700/50">
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">📊 Demo Data</span>
              </div>
            )}
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Portfolio Health */}
            <div className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-600/50 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <ShieldCheckIcon className="w-8 h-8 text-emerald-500" />
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  healthOverview && healthOverview.averageHealthScore > 80 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : healthOverview && healthOverview.averageHealthScore > 60
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {healthOverview?.healthGrade || 'N/A'}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Portfolio Health</h3>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {healthOverview ? Math.round(healthOverview.averageHealthScore) : 0}/100
              </p>
            </div>

            {/* Risk Score */}
            <div className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-600/50 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-orange-500" />
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  riskAnalysis && riskAnalysis.overallRisk === 'low'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : riskAnalysis && riskAnalysis.overallRisk === 'medium'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {riskAnalysis?.overallRisk.toUpperCase() || 'N/A'}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Risk Level</h3>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {riskAnalysis ? riskAnalysis.riskScore : 0}/100
              </p>
            </div>

            {/* APY Performance */}
            <div className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-600/50 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <ArrowArrowTrendingUpIcon className="w-8 h-8 text-blue-500" />
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  yieldAnalysis && yieldAnalysis.yieldGrade === 'A'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : yieldAnalysis && (yieldAnalysis.yieldGrade === 'B' || yieldAnalysis.yieldGrade === 'C')
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {yieldAnalysis?.yieldGrade || 'N/A'}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Weighted APY</h3>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {formatPercent(metrics?.weightedAverageAPY || 0)}
              </p>
            </div>

            {/* Daily Yield */}
            <div className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-600/50 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <BanknotesIcon className="w-8 h-8 text-emerald-500" />
                {yieldAnalysis && yieldAnalysis.totalClaimable > 10 && (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-full text-xs font-bold">
                    Claimable!
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Est. Daily Yield</h3>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(metrics?.estimatedDailyYield || 0)}
              </p>
            </div>
          </div>

          {/* P&L Summary Row */}
          {performanceMetrics && (
            <div className="mt-6 p-6 bg-gradient-to-r from-slate-50/90 to-white/90 dark:from-slate-700/90 dark:to-slate-600/90 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-500/50 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center">
                  {performanceMetrics.unrealizedPnL >= 0 ? (
                    <ArrowTrendingUpIcon className="w-5 h-5 mr-2 text-green-500" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-5 h-5 mr-2 text-red-500" />
                  )}
                  Portfolio Performance
                </h3>
                <div className="text-right">
                  <div className={`text-2xl font-black ${getPnLColorClass(performanceMetrics.unrealizedPnL).text}`}>
                    {formatPnL(performanceMetrics.unrealizedPnL)}
                  </div>
                  <div className={`text-sm font-semibold ${getPnLColorClass(performanceMetrics.unrealizedPnLPercent).text}`}>
                    {formatPnLPercent(performanceMetrics.unrealizedPnLPercent)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div>
                  <div className={`text-lg font-semibold ${getPnLColorClass(performanceMetrics.dailyChange).text}`}>
                    {formatPnL(performanceMetrics.dailyChange)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">24h Change</div>
                </div>
                <div>
                  <div className={`text-lg font-semibold ${getPnLColorClass(performanceMetrics.weeklyChange).text}`}>
                    {formatPnL(performanceMetrics.weeklyChange)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">7d Change</div>
                </div>
                <div>
                  <div className={`text-lg font-semibold ${getPnLColorClass(performanceMetrics.monthlyChange).text}`}>
                    {formatPnL(performanceMetrics.monthlyChange)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">30d Change</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 p-1 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
        {[
          { id: 'overview', label: 'Overview', icon: ChartBarIcon },
          { id: 'performance', label: 'P&L Tracking', icon: ArrowTrendingUpIcon },
          { id: 'risks', label: 'Risk Analysis', icon: ExclamationTriangleIcon },
          { id: 'opportunities', label: 'Opportunities', icon: LightBulbIcon },
          { id: 'allocation', label: 'Allocation', icon: FireIcon }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-lg'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab 
          metrics={metrics} 
          insights={insights} 
          recommendations={recommendations}
          yieldAnalysis={yieldAnalysis}
        />
      )}

      {activeTab === 'performance' && (
        <PerformanceTab 
          performanceMetrics={performanceMetrics}
          isLoading={isPnLLoading}
          getPortfolioValueHistory={getPortfolioValueHistory}
        />
      )}

      {activeTab === 'risks' && (
        <RiskAnalysisTab 
          riskAnalysis={riskAnalysis}
          riskFactors={getTopRisks(10)}
          healthOverview={healthOverview}
        />
      )}

      {activeTab === 'opportunities' && (
        <OpportunitiesTab 
          opportunities={getTopOpportunities(10)}
          recommendations={recommendations}
          metrics={metrics}
        />
      )}

      {activeTab === 'allocation' && (
        <AllocationTab 
          protocolBreakdown={protocolBreakdown}
          metrics={metrics}
        />
      )}
    </div>
  );
}

// Tab Components
function OverviewTab({ metrics, insights, recommendations, yieldAnalysis }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Key Insights */}
      <div className="space-y-6">
        <div className="p-6 bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-600/50 shadow-lg">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center">
            <LightBulbIcon className="w-5 h-5 mr-2 text-amber-500" />
            Key Insights
          </h3>
          <div className="space-y-4">
            {insights?.slice(0, 4).map((insight: any, index: number) => (
              <div key={index} className={`p-4 rounded-xl border ${
                insight.severity === 'high' 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50'
                  : insight.severity === 'medium'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50'
              }`}>
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-1">
                  {insight.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {insight.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Yield Breakdown */}
        {yieldAnalysis && (
          <div className="p-6 bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-900/20 dark:to-green-900/20 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-700/50 shadow-lg">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center">
              <ArrowArrowTrendingUpIcon className="w-5 h-5 mr-2 text-emerald-500" />
              Yield Projections
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(yieldAnalysis.dailyYield)}
                </p>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Daily</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(yieldAnalysis.monthlyYield)}
                </p>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Monthly</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(yieldAnalysis.annualYield)}
                </p>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Annual</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Recommendations */}
      <div className="p-6 bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-600/50 shadow-lg">
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center">
          <FireIcon className="w-5 h-5 mr-2 text-orange-500" />
          Top Recommendations
        </h3>
        <div className="space-y-4">
          {recommendations?.slice(0, 6).map((rec: any, index: number) => (
            <div key={index} className={`p-4 rounded-xl border ${
              rec.priority === 'high' || rec.priority === 'critical'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50'
                : rec.priority === 'medium'
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-1">
                    {rec.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    {rec.description}
                  </p>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {rec.action}
                  </p>
                </div>
                {rec.potentialGain && rec.potentialGain > 0 && (
                  <div className="text-right">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(rec.potentialGain)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RiskAnalysisTab({ riskAnalysis, riskFactors, healthOverview }: any) {
  return (
    <div className="space-y-8">
      {/* Risk Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-gradient-to-br from-red-50/80 to-orange-50/80 dark:from-red-900/20 dark:to-orange-900/20 backdrop-blur-xl rounded-2xl border border-red-200/50 dark:border-red-700/50 shadow-lg">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Overall Risk</h3>
          <p className="text-3xl font-black text-red-600 dark:text-red-400">
            {riskAnalysis?.riskScore || 0}/100
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">
            {riskAnalysis?.overallRisk} Risk Level
          </p>
        </div>

        <div className="p-6 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-xl rounded-2xl border border-blue-200/50 dark:border-blue-700/50 shadow-lg">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Diversification</h3>
          <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
            {riskAnalysis?.diversificationScore || 0}/100
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">
            {riskAnalysis?.diversification} Spread
          </p>
        </div>

        <div className="p-6 bg-gradient-to-br from-purple-50/80 to-violet-50/80 dark:from-purple-900/20 dark:to-violet-900/20 backdrop-blur-xl rounded-2xl border border-purple-200/50 dark:border-purple-700/50 shadow-lg">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Liquidation Risk</h3>
          <p className="text-3xl font-black text-purple-600 dark:text-purple-400">
            {riskAnalysis?.liquidationRiskScore || 0}/100
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">
            {riskAnalysis?.liquidationRisk} Exposure
          </p>
        </div>
      </div>

      {/* Risk Factors */}
      <div className="p-6 bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-600/50 shadow-lg">
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-orange-500" />
          Identified Risk Factors
        </h3>
        <div className="space-y-4">
          {riskFactors?.map((risk: any, index: number) => (
            <div key={index} className={`p-4 rounded-xl border ${
              risk.severity === 'critical'
                ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700'
                : risk.severity === 'high'
                ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700'
                : risk.severity === 'medium'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700'
                : 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                      {risk.title}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                      risk.severity === 'critical'
                        ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                        : risk.severity === 'high'
                        ? 'bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200'
                        : risk.severity === 'medium'
                        ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
                        : 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                    }`}>
                      {risk.severity}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {risk.description}
                  </p>
                  {risk.recommendation && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      💡 {risk.recommendation}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(risk.affectedValue)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">at risk</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OpportunitiesTab({ opportunities, recommendations, metrics }: any) {
  return (
    <div className="space-y-8">
      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {opportunities?.map((opp: any, index: number) => (
          <div key={index} className={`p-6 rounded-2xl border shadow-lg ${
            opp.impact === 'high'
              ? 'bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200/50 dark:border-emerald-700/50'
              : opp.impact === 'medium'
              ? 'bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-700/50'
              : 'bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 border-slate-200/50 dark:border-slate-600/50'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-black text-slate-900 dark:text-white">{opp.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                opp.impact === 'high'
                  ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200'
                  : opp.impact === 'medium'
                  ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                  : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
              }`}>
                {opp.impact} Impact
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {opp.description}
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(opp.potentialGain)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Potential Gain</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {opp.effort} Effort
                </p>
                {opp.action && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {opp.action}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="p-6 bg-gradient-to-br from-violet-50/80 to-purple-50/80 dark:from-violet-900/20 dark:to-purple-900/20 backdrop-blur-xl rounded-2xl border border-violet-200/50 dark:border-violet-700/50 shadow-lg">
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center">
          <FireIcon className="w-5 h-5 mr-2 text-violet-500" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics?.totalClaimable > 10 && (
            <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
                Claim Rewards
              </h4>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                {formatCurrency(metrics.totalClaimable)} ready to claim
              </p>
            </div>
          )}
          
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Rebalance Portfolio
            </h4>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Optimize allocation across protocols
            </p>
          </div>
          
          <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
              Add Manual Position
            </h4>
            <p className="text-sm text-purple-600 dark:text-purple-400">
              Track unsupported protocols
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// New Performance Tab Component
function PerformanceTab({ performanceMetrics, isLoading, getPortfolioValueHistory }: any) {
  if (isLoading) {
    return <PerformanceTabLoader />;
  }

  if (!performanceMetrics) {
    return <NoPerformanceData />;
  }

  const totalPnL = performanceMetrics.unrealizedPnL;
  const totalPnLPercent = performanceMetrics.unrealizedPnLPercent;

  return (
    <div className="space-y-8">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Total P&L Card */}
        <div className={`p-8 backdrop-blur-xl rounded-2xl border shadow-lg ${
          totalPnL >= 0 
            ? 'bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-700/50'
            : 'bg-gradient-to-br from-red-50/80 to-orange-50/80 dark:from-red-900/20 dark:to-orange-900/20 border-red-200/50 dark:border-red-700/50'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Total P&L</h3>
            {totalPnL >= 0 ? (
              <ArrowTrendingUpIcon className="w-8 h-8 text-green-500" />
            ) : (
              <ArrowTrendingDownIcon className="w-8 h-8 text-red-500" />
            )}
          </div>
          <div className="text-center">
            <div className={`text-4xl font-black mb-2 ${getPnLColorClass(totalPnL).text}`}>
              {formatPnL(totalPnL)}
            </div>
            <div className={`text-xl font-semibold ${getPnLColorClass(totalPnLPercent).text}`}>
              {formatPnLPercent(totalPnLPercent)}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-4">
              Entry Value: {formatCurrency(performanceMetrics.totalEntryValue)}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Current Value: {formatCurrency(performanceMetrics.totalValue)}
            </div>
          </div>
        </div>

        {/* Time-based Performance */}
        <div className="p-6 bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-600/50 shadow-lg">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Time-based Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/90 dark:bg-slate-700/90 rounded-xl">
              <span className="font-semibold text-slate-700 dark:text-slate-300">24h Change</span>
              <div className="text-right">
                <div className={`font-semibold ${getPnLColorClass(performanceMetrics.dailyChange).text}`}>
                  {formatPnL(performanceMetrics.dailyChange)}
                </div>
                <div className={`text-sm ${getPnLColorClass(performanceMetrics.dailyChangePercent).text}`}>
                  {formatPnLPercent(performanceMetrics.dailyChangePercent)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white/90 dark:bg-slate-700/90 rounded-xl">
              <span className="font-semibold text-slate-700 dark:text-slate-300">7d Change</span>
              <div className="text-right">
                <div className={`font-semibold ${getPnLColorClass(performanceMetrics.weeklyChange).text}`}>
                  {formatPnL(performanceMetrics.weeklyChange)}
                </div>
                <div className={`text-sm ${getPnLColorClass(performanceMetrics.weeklyChangePercent).text}`}>
                  {formatPnLPercent(performanceMetrics.weeklyChangePercent)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white/90 dark:bg-slate-700/90 rounded-xl">
              <span className="font-semibold text-slate-700 dark:text-slate-300">30d Change</span>
              <div className="text-right">
                <div className={`font-semibold ${getPnLColorClass(performanceMetrics.monthlyChange).text}`}>
                  {formatPnL(performanceMetrics.monthlyChange)}
                </div>
                <div className={`text-sm ${getPnLColorClass(performanceMetrics.monthlyChangePercent).text}`}>
                  {formatPnLPercent(performanceMetrics.monthlyChangePercent)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Best/Worst Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Best Performer */}
        {performanceMetrics.bestPerformer && (
          <div className="p-6 bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 backdrop-blur-xl rounded-2xl border border-green-200/50 dark:border-green-700/50 shadow-lg">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center">
              <ArrowTrendingUpIcon className="w-5 h-5 mr-2 text-green-500" />
              Best Performer
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                  {performanceMetrics.bestPerformer.protocol}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                  {performanceMetrics.bestPerformer.type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">P&L</span>
                <div className="text-right">
                  <div className="text-green-600 dark:text-green-400 font-semibold">
                    {formatPnL(performanceMetrics.bestPerformer.unrealizedPnL)}
                  </div>
                  <div className="text-green-600 dark:text-green-400 text-sm">
                    {formatPnLPercent(performanceMetrics.bestPerformer.unrealizedPnLPercent)}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Value</span>
                <div className="text-right">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(performanceMetrics.bestPerformer.currentValue)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Entry: {formatCurrency(performanceMetrics.bestPerformer.entryValue)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Worst Performer */}
        {performanceMetrics.worstPerformer && (
          <div className="p-6 bg-gradient-to-br from-red-50/80 to-orange-50/80 dark:from-red-900/20 dark:to-orange-900/20 backdrop-blur-xl rounded-2xl border border-red-200/50 dark:border-red-700/50 shadow-lg">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center">
              <ArrowTrendingDownIcon className="w-5 h-5 mr-2 text-red-500" />
              Worst Performer
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                  {performanceMetrics.worstPerformer.protocol}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                  {performanceMetrics.worstPerformer.type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">P&L</span>
                <div className="text-right">
                  <div className="text-red-600 dark:text-red-400 font-semibold">
                    {formatPnL(performanceMetrics.worstPerformer.unrealizedPnL)}
                  </div>
                  <div className="text-red-600 dark:text-red-400 text-sm">
                    {formatPnLPercent(performanceMetrics.worstPerformer.unrealizedPnLPercent)}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Value</span>
                <div className="text-right">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(performanceMetrics.worstPerformer.currentValue)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Entry: {formatCurrency(performanceMetrics.worstPerformer.entryValue)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Protocol Performance Breakdown */}
      <div className="p-6 bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-600/50 shadow-lg">
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Protocol P&L Breakdown</h3>
        <div className="space-y-4">
          {Object.values(performanceMetrics.protocolPerformance).map((protocol: any, index: number) => (
            <div key={protocol.protocol} className="flex items-center justify-between p-4 bg-white/90 dark:bg-slate-700/90 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full" style={{
                  backgroundColor: `hsl(${index * 45}, 70%, 50%)`
                }}></div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {protocol.protocol}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({protocol.positionCount} position{protocol.positionCount !== 1 ? 's' : ''})
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className={`font-semibold ${getPnLColorClass(protocol.unrealizedPnL).text}`}>
                    {formatPnL(protocol.unrealizedPnL)}
                  </div>
                  <div className={`text-sm ${getPnLColorClass(protocol.unrealizedPnLPercent).text}`}>
                    {formatPnLPercent(protocol.unrealizedPnLPercent)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(protocol.totalCurrentValue)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Entry: {formatCurrency(protocol.totalEntryValue)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AllocationTab({ protocolBreakdown, metrics }: any) {
  return (
    <div className="space-y-8">
      {/* Protocol Allocation */}
      <div className="p-6 bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-600/50 shadow-lg">
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Protocol Allocation</h3>
        <div className="space-y-4">
          {protocolBreakdown?.slice(0, 8).map((protocol: any, index: number) => (
            <div key={protocol.protocol} className="flex items-center justify-between p-4 bg-white/90 dark:bg-slate-700/90 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full" style={{
                  backgroundColor: `hsl(${index * 45}, 70%, 50%)`
                }}></div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {protocol.protocol}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(protocol.value)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {protocol.count} position{protocol.count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="w-20 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                    style={{ width: `${Math.min(protocol.percentage, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 w-12 text-right">
                  {protocol.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Allocation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Position Type */}
        <div className="p-6 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-xl rounded-2xl border border-blue-200/50 dark:border-blue-700/50 shadow-lg">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">By Position Type</h3>
          <div className="space-y-3">
            {Object.entries(metrics?.typeAllocation || {}).map(([type, allocation]: [string, any]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                  {type}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {allocation.percentage.toFixed(1)}%
                  </span>
                  <div className="w-16 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${Math.min(allocation.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Network */}
        <div className="p-6 bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-900/20 dark:to-green-900/20 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-700/50 shadow-lg">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">By Network</h3>
          <div className="space-y-3">
            {Object.entries(metrics?.networkAllocation || {}).map(([network, allocation]: [string, any]) => (
              <div key={network} className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {network}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {allocation.percentage.toFixed(1)}%
                  </span>
                  <div className="w-16 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(allocation.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsLoader() {
  return (
    <div className="space-y-8">
      <div className="p-8 bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 rounded-3xl border border-slate-200/50 dark:border-slate-600/50 shadow-xl animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-600 rounded w-48 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 bg-white/90 dark:bg-slate-700/90 rounded-2xl">
              <div className="h-6 bg-slate-200 dark:bg-slate-600 rounded w-24 mb-4"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-600 rounded w-16 mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PerformanceTabLoader() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="p-8 bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 rounded-2xl border border-slate-200/50 dark:border-slate-600/50 shadow-lg animate-pulse">
            <div className="h-6 bg-slate-200 dark:bg-slate-600 rounded w-32 mb-6"></div>
            <div className="h-12 bg-slate-200 dark:bg-slate-600 rounded w-48 mb-4"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-600 rounded w-32"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NoPerformanceData() {
  return (
    <div className="p-12 bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-600/50 shadow-xl text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-slate-400 to-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
        <ArrowTrendingUpIcon className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">No Performance Data</h3>
      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
        Start by adding DeFi positions to your portfolio. Performance tracking will begin automatically and show your P&L over time.
      </p>
    </div>
  );
}

function NoAnalyticsData() {
  return (
    <div className="p-12 bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-600/50 shadow-xl text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-slate-400 to-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
        <CpuChipIcon className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">No Analytics Available</h3>
      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
        Connect your wallet and add DeFi positions to unlock powerful portfolio analytics and insights.
      </p>
    </div>
  );
}