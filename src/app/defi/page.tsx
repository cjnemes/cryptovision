'use client'

import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConnectButton } from "@/components/wallet/ConnectButton"
import { DeFiPositions } from "@/components/portfolio/DeFiPositions"
import { useDeFiPositions } from "@/hooks/useDeFiPositions"
import Link from "next/link"
import { ArrowLeftIcon, SparklesIcon } from "@heroicons/react/24/outline"

export default function DeFiPage() {
  const { address, isConnected } = useAccount()
  const { positions, summary, protocolBreakdown } = useDeFiPositions()

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
        {/* Dynamic Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute -bottom-40 right-20 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        {/* Enhanced Header */}
        <header className="relative border-b bg-white/70 backdrop-blur-2xl dark:bg-slate-900/70 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-slate-900/50">
          <div className="container mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/portfolio" className="p-3 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200">
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-black text-lg">CV</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-100 dark:to-slate-200 bg-clip-text text-transparent">DeFi Positions</h1>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 -mt-1">Decentralized Finance</p>
                </div>
              </div>
            </div>
            <ConnectButton />
          </div>
        </header>

        {/* Connect Wallet Prompt */}
        <main className="relative container mx-auto px-6 py-24">
          <div className="text-center animate-slide-in-up">
            <div className="relative w-32 h-32 mx-auto mb-10">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-700 rounded-3xl animate-pulse shadow-2xl">
                <div className="absolute inset-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur-lg opacity-70"></div>
              </div>
              <div className="relative w-full h-full bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl">
                <span className="text-white text-5xl">🏦</span>
              </div>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-black mb-8 leading-tight">
              <span className="bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-100 dark:to-slate-200 bg-clip-text text-transparent">
                Connect Your Wallet
              </span>
            </h2>
            
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Connect your wallet to access <span className="font-bold text-purple-600 dark:text-purple-400">professional DeFi analytics</span> 
              and monitor your positions across all protocols with real-time tracking.
            </p>
            
            <div className="transform hover:scale-105 transition-transform duration-300">
              <ConnectButton />
            </div>

            {/* Feature highlights */}
            <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border-0 shadow-xl p-6 group-hover:shadow-2xl transition-all duration-500">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-white text-2xl">📊</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Position Tracking</h3>
                  <p className="text-slate-600 dark:text-slate-300">Monitor lending, borrowing, and liquidity positions across all DeFi protocols</p>
                </div>
              </div>
              
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border-0 shadow-xl p-6 group-hover:shadow-2xl transition-all duration-500">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-white text-2xl">💰</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Yield Optimization</h3>
                  <p className="text-slate-600 dark:text-slate-300">Real-time APY tracking and yield farming opportunity discovery</p>
                </div>
              </div>
              
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border-0 shadow-xl p-6 group-hover:shadow-2xl transition-all duration-500">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-white text-2xl">⚡</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Risk Management</h3>
                  <p className="text-slate-600 dark:text-slate-300">Advanced risk assessment and liquidation protection alerts</p>
                </div>
              </div>
            </div>
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
          <div className="flex items-center space-x-6">
            <Link href="/portfolio" className="p-3 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200">
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-lg">CV</span>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-100 dark:to-slate-200 bg-clip-text text-transparent">DeFi Positions</h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 -mt-1">Decentralized Finance Management</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200">
                Dashboard
              </Link>
              <Link href="/portfolio" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200">
                Portfolio
              </Link>
              <span className="relative text-blue-600 font-semibold dark:text-blue-400 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <SparklesIcon className="w-4 h-4 inline mr-2" />
                DeFi
              </span>
              <Link href="/analytics" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200">
                Analytics
              </Link>
            </nav>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* DeFi Dashboard */}
      <main className="container mx-auto px-6 py-8">
        {/* Enhanced Breadcrumb and Title */}
        <div className="mb-12 animate-slide-in-up">
          <div className="flex items-center space-x-3 text-sm mb-6">
            <Link href="/portfolio" className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/30 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md">
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Portfolio</span>
            </Link>
            <span className="text-slate-400 text-lg">›</span>
            <span className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl font-semibold shadow-sm">DeFi Positions</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-100 dark:to-slate-200 bg-clip-text text-transparent mb-4 leading-tight">DeFi Positions</h2>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
                </div>
                <div className="px-4 py-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 shadow-sm">
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">🏦 DeFi Protocol Integration</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full DeFi Positions Display with Enhanced Styling */}
        <div className="group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
          <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl rounded-2xl border-0 shadow-2xl group-hover:shadow-3xl transition-all duration-500">
            <DeFiPositions />
          </div>
        </div>
      </main>
    </div>
  )
}