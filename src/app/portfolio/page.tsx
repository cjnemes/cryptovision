'use client'

import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConnectButton } from "@/components/wallet/ConnectButton"
import { TokenList } from "@/components/portfolio/TokenList"
import { PortfolioStats } from "@/components/portfolio/PortfolioStats"
import { DeFiSummary } from "@/components/portfolio/DeFiSummary"
import { PnLDashboard } from "@/components/portfolio/PnLDashboard"
import { TransactionHistory } from "@/components/portfolio/TransactionHistory"
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
              <a href="/portfolio" className="text-blue-600 font-medium dark:text-blue-400">
                Portfolio
              </a>
              <a href="/defi" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                DeFi
              </a>
              <a href="/analytics" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Analytics
              </a>
            </nav>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Portfolio Dashboard */}
      <main className="container mx-auto px-4 py-8">
        {/* Portfolio Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Portfolio Overview</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Connected wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>

        {/* Stats Cards */}
        <PortfolioStats 
          totalValue={totalValue + defiValue}
          defiValue={defiValue}
          averageYield={averageYield}
          isLoading={isLoading || defiLoading}
        />

        {/* Main Content */}
        <div className="space-y-8">
          {/* P&L Dashboard */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Profit & Loss Analysis
            </h3>
            <PnLDashboard />
          </div>

          {/* Token Holdings */}
          <TokenList 
            balances={balances}
            isLoading={isLoading}
            error={error}
          />

          {/* DeFi Summary */}
          <DeFiSummary />

          {/* Transaction History */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Recent Transactions
            </h3>
            <TransactionHistory transactions={[]} isLoading={false} />
          </div>
        </div>
      </main>
    </div>
  )
}