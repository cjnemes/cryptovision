'use client'

import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConnectButton } from "@/components/wallet/ConnectButton"
import { TokenList } from "@/components/portfolio/TokenList"
import { PortfolioStats } from "@/components/portfolio/PortfolioStats"
import { DeFiSummary } from "@/components/portfolio/DeFiSummary"
import { PortfolioOverview } from "@/components/portfolio/PortfolioOverview"
import { PortfolioInsights } from "@/components/portfolio/PortfolioInsights"
import { Watchlist } from "@/components/portfolio/Watchlist"
import { MarketOverview } from "@/components/portfolio/MarketOverview"
import { TransactionHistory } from "@/components/portfolio/TransactionHistory"
import { EnhancedTokenList } from "@/components/portfolio/EnhancedTokenList"
import { useTokenBalances } from "@/hooks/useTokenBalances"
import { useDeFiPositions } from "@/hooks/useDeFiPositions"

export default function PortfolioPage() {
  const { address, isConnected } = useAccount()
  const { balances, totalValue, isLoading, error } = useTokenBalances()
  const { positions, isLoading: defiLoading } = useDeFiPositions()

  // Calculate DeFi stats
  const defiValue = positions.reduce((sum, position) => sum + position.value, 0)
  const averageYield = positions.length > 0 
    ? positions.reduce((sum, position) => sum + (position.apy * position.value), 0) / defiValue
    : 0

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
            <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-2xl">🔗</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              Connect your wallet to view your complete crypto portfolio across all chains and protocols.
            </p>
            <ConnectButton />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Enhanced Header */}
      <header className="border-b bg-white/70 backdrop-blur-2xl dark:bg-slate-900/70 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-slate-900/50">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-lg">CV</span>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-100 dark:to-slate-200 bg-clip-text text-transparent">
                CryptoVision
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 -mt-1">Portfolio Management</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <nav className="hidden md:flex items-center space-x-6">
              <a href="/" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200">
                Dashboard
              </a>
              <a href="/portfolio" className="relative text-blue-600 font-semibold dark:text-blue-400 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                Portfolio
              </a>
              <a href="/defi" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200">
                DeFi
              </a>
              <a href="/analytics" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200">
                Analytics
              </a>
            </nav>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Portfolio Dashboard */}
      <main className="container mx-auto px-6 py-8">
        {/* Enhanced Portfolio Header */}
        <div className="mb-10 animate-slide-in-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-100 dark:to-slate-200 bg-clip-text text-transparent mb-4 leading-tight">Portfolio</h1>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-3 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">Multi-chain enabled</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-slate-500 mb-2">Last updated</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <PortfolioStats 
          totalValue={totalValue + defiValue}
          defiValue={defiValue}
          averageYield={averageYield}
          isLoading={isLoading || defiLoading}
        />

        {/* Portfolio Performance Overview */}
        <div className="mt-8">
          <PortfolioOverview 
            tokenBalances={balances}
            defiPositions={positions}
            totalValue={totalValue + defiValue}
          />
        </div>

        {/* Portfolio Insights */}
        <div className="mt-8">
          <PortfolioInsights 
            tokenBalances={balances}
            defiPositions={positions}
            totalValue={totalValue + defiValue}
          />
        </div>

        {/* Market Overview */}
        <div className="mt-8">
          <MarketOverview />
        </div>

        {/* Watchlist */}
        <div className="mt-8">
          <Watchlist />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-12">
          {/* Left Column - Primary Content */}
          <div className="xl:col-span-2 space-y-8">
            {/* Token Holdings Card */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
              <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl rounded-2xl border-0 shadow-2xl group-hover:shadow-3xl transition-all duration-500">
                <div className="p-8 border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-xl">💰</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Token Holdings</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{balances.length} tokens in portfolio</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{balances.length} assets</span>
                      </div>
                      <button className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-lg transition-all duration-200">View all</button>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <EnhancedTokenList 
                    balances={balances.slice(0, 8)}
                    isLoading={isLoading}
                    error={error}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Secondary Content */}
          <div className="space-y-8">
            {/* DeFi Summary Card */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
              <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl rounded-2xl border-0 shadow-2xl group-hover:shadow-3xl transition-all duration-500">
                <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-lg">🏦</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">DeFi Positions</h2>
                  </div>
                </div>
                <div className="p-6">
                  <DeFiSummary />
                </div>
              </div>
            </div>

            {/* Recent Activity Card */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
              <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl rounded-2xl border-0 shadow-2xl group-hover:shadow-3xl transition-all duration-500">
                <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-lg">📊</span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Activity</h2>
                    </div>
                    <button className="px-4 py-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 rounded-lg transition-all duration-200">View all</button>
                  </div>
                </div>
                <div className="p-6">
                  <TransactionHistory transactions={[]} isLoading={false} compact={true} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}