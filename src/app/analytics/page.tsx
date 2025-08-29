'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { PortfolioComposition } from '@/components/charts/PortfolioComposition';
import { PortfolioPerformance } from '@/components/charts/PortfolioPerformance';
import { DeFiYieldChart } from '@/components/charts/DeFiYieldChart';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useDeFiPositions } from '@/hooks/useDeFiPositions';

export default function AnalyticsPage() {
  const { address, isConnected } = useAccount();
  const { balances, isLoading: tokensLoading } = useTokenBalances();
  const { positions, isLoading: defiLoading } = useDeFiPositions();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-950/80 dark:border-gray-800">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CV</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">CryptoVision</h1>
            </div>
            <ConnectButton />
          </div>
        </header>

        {/* Connect Wallet Prompt */}
        <main className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-2xl">📊</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Portfolio Analytics
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              Connect your wallet to access advanced portfolio analytics, performance tracking, and yield optimization insights.
            </p>
            <ConnectButton />
            
            <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border">
                <div className="text-2xl mb-2">🥧</div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Portfolio Composition</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Visual breakdown of your holdings</p>
              </div>
              <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border">
                <div className="text-2xl mb-2">📈</div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Performance Tracking</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Historical portfolio performance</p>
              </div>
              <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border">
                <div className="text-2xl mb-2">💰</div>
                <h3 className="font-semibold text-gray-900 dark:text-white">DeFi Yields</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Optimize your yield opportunities</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-950/80 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CV</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">CryptoVision</h1>
          </div>
          <div className="flex items-center space-x-4">
            <nav className="flex items-center space-x-4">
              <a href="/" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Dashboard
              </a>
              <a href="/portfolio" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Portfolio
              </a>
              <a href="/analytics" className="text-blue-600 font-medium dark:text-blue-400">
                Analytics
              </a>
            </nav>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Analytics Dashboard */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Portfolio Analytics</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Advanced insights and performance analysis for wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>

        {/* Charts Grid */}
        <div className="space-y-8">
          {/* Top Row - Performance Chart (Full Width) */}
          <div className="w-full">
            <PortfolioPerformance
              data={[]} // Will use mock data for now
              isLoading={tokensLoading}
              timeframe="30d"
            />
          </div>

          {/* Second Row - Composition and Yield Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PortfolioComposition
              tokens={balances}
              defiPositions={positions}
              isLoading={tokensLoading || defiLoading}
            />
            
            <DeFiYieldChart
              positions={positions}
              isLoading={defiLoading}
            />
          </div>

          {/* Additional Analytics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Risk Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Portfolio Beta</span>
                  <span className="font-medium">1.24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Sharpe Ratio</span>
                  <span className="font-medium">2.18</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Max Drawdown</span>
                  <span className="font-medium text-red-600">-12.4%</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Diversification</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Asset Types</span>
                  <span className="font-medium">6</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Protocols</span>
                  <span className="font-medium">5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Chains</span>
                  <span className="font-medium">2</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Yield Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total APY</span>
                  <span className="font-medium text-green-600">14.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Monthly Yield</span>
                  <span className="font-medium">$847.50</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Claimable</span>
                  <span className="font-medium text-blue-600">$71.75</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}