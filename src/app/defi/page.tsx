'use client'

import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConnectButton } from "@/components/wallet/ConnectButton"
import { DeFiPositions } from "@/components/portfolio/DeFiPositions"
import { useDeFiPositions } from "@/hooks/useDeFiPositions"
import Link from "next/link"
import { ArrowLeftIcon } from "@heroicons/react/24/outline"

export default function DeFiPage() {
  const { address, isConnected } = useAccount()
  const { positions, summary, protocolBreakdown } = useDeFiPositions()

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-950/80 dark:border-gray-800">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/portfolio" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CV</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">DeFi Positions</h1>
              </div>
            </div>
            <ConnectButton />
          </div>
        </header>

        {/* Connect Wallet Prompt */}
        <main className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-2xl">🏦</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              Connect your wallet to view your DeFi positions across all protocols.
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
          <div className="flex items-center space-x-4">
            <Link href="/portfolio" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CV</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">DeFi Positions</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <nav className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Dashboard
              </Link>
              <Link href="/portfolio" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Portfolio
              </Link>
              <span className="text-blue-600 font-medium dark:text-blue-400">
                DeFi
              </span>
            </nav>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* DeFi Dashboard */}
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb and Title */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link href="/portfolio" className="hover:text-gray-700">Portfolio</Link>
            <span>›</span>
            <span>DeFi Positions</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">DeFi Positions</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Connected wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>

        {/* Full DeFi Positions Display */}
        <DeFiPositions />
      </main>
    </div>
  )
}