'use client'

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConnectButton } from "@/components/wallet/ConnectButton"
import { useAccount } from "wagmi"
import { useTokenBalances } from "@/hooks/useTokenBalances"
import { useDeFiPositions } from "@/hooks/useDeFiPositions"
import { PortfolioStats } from "@/components/portfolio/PortfolioStats"
import { MarketOverview } from "@/components/portfolio/MarketOverview"
import { DeFiSummary } from "@/components/portfolio/DeFiSummary"
import { EnhancedTokenList } from "@/components/portfolio/EnhancedTokenList"
import { formatCurrency } from "@/lib/utils"
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  BanknotesIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  LightBulbIcon,
  RocketLaunchIcon
} from "@heroicons/react/24/outline"

export default function Home() {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
        {/* Dynamic Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute -bottom-40 right-20 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
          <div className="absolute top-20 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '6s'}}></div>
          
          {/* Floating particles */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-bounce opacity-60" style={{animationDelay: '1s', animationDuration: '3s'}}></div>
          <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-purple-400 rounded-full animate-bounce opacity-60" style={{animationDelay: '2.5s', animationDuration: '2s'}}></div>
          <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce opacity-60" style={{animationDelay: '4s', animationDuration: '2.5s'}}></div>
        </div>

        {/* Glassmorphism Header */}
        <header className="relative border-b bg-white/70 backdrop-blur-2xl dark:bg-slate-900/70 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-slate-900/50">
          <div className="container mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-300 group-hover:blur-md"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-lg tracking-wider">CV</span>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-100 dark:to-slate-200 bg-clip-text text-transparent">
                  CryptoVision
                </h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 -mt-1">Professional Portfolio Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex items-center space-x-6">
                <a href="/" className="relative text-blue-600 font-semibold dark:text-blue-400 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 transition-all duration-200">
                  <SparklesIcon className="w-4 h-4 inline mr-2" />
                  Dashboard
                </a>
                <a href="/portfolio" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200">
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

        {/* Hero Section */}
        <main className="relative container mx-auto px-6 py-24">
          <div className="text-center mb-20 animate-slide-in-up">
            <div className="relative w-40 h-40 mx-auto mb-10">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-700 rounded-3xl animate-pulse shadow-2xl">
                <div className="absolute inset-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur-lg opacity-70"></div>
              </div>
              <div className="relative w-full h-full bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl">
                <RocketLaunchIcon className="w-20 h-20 text-white" />
              </div>
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-none">
              <span className="bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-100 dark:to-slate-200 bg-clip-text text-transparent">
                Professional
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                Crypto Portfolio
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Management
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed font-medium">
              Experience <span className="font-bold text-blue-600 dark:text-blue-400">institutional-grade</span> portfolio analytics 
              with real-time tracking, advanced DeFi insights, and professional risk assessment tools 
              across <span className="font-bold text-purple-600 dark:text-purple-400">multiple blockchains</span>.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
              <div className="transform hover:scale-105 transition-transform duration-300">
                <ConnectButton />
              </div>
              <Link href="/portfolio" className="group">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-14 px-8 text-lg font-semibold border-2 border-slate-300 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-purple-200"
                >
                  <EyeIcon className="w-5 h-5 mr-2 group-hover:text-purple-600" />
                  Explore Demo
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                <span className="font-medium">Bank-grade Security</span>
              </div>
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Real-time Data</span>
              </div>
              <div className="flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Professional Analytics</span>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <Card className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:-translate-y-3 h-full">
                <CardHeader className="pb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl group-hover:shadow-green-200 transition-all duration-300">
                    <ChartBarIcon className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-3">
                    Portfolio Analytics
                  </CardTitle>
                  <CardDescription className="text-center text-slate-600 dark:text-slate-300 text-base">
                    Professional-grade portfolio analysis with advanced institutional metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Real-time performance tracking</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Risk analysis with HHI & Shannon Index</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Asset allocation optimization</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Multi-timeframe performance charts</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <Card className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:-translate-y-3 h-full">
                <CardHeader className="pb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl group-hover:shadow-blue-200 transition-all duration-300">
                    <CurrencyDollarIcon className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-3">
                    Multi-Chain Support
                  </CardTitle>
                  <CardDescription className="text-center text-slate-600 dark:text-slate-300 text-base">
                    Unified view across Ethereum, Base, and major blockchain networks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Ethereum & Base chain support</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Cross-chain portfolio aggregation</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Real-time price feeds</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Gas optimization insights</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <Card className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:-translate-y-3 h-full">
                <CardHeader className="pb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl group-hover:shadow-purple-200 transition-all duration-300">
                    <BanknotesIcon className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-3">
                    DeFi Integration
                  </CardTitle>
                  <CardDescription className="text-center text-slate-600 dark:text-slate-300 text-base">
                    Advanced DeFi monitoring with yield optimization and risk assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Lending position tracking</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Liquidity pool monitoring</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Real-time APY tracking</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Yield farming opportunities</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Stats section */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-800 dark:via-blue-800 dark:to-indigo-800 rounded-3xl p-12 text-white text-center">
            <h2 className="text-4xl font-bold mb-6">Trusted by DeFi Professionals</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="text-5xl font-black text-transparent bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text mb-2">
                  $50M+
                </div>
                <p className="text-slate-300 font-medium">Total Value Tracked</p>
              </div>
              <div>
                <div className="text-5xl font-black text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text mb-2">
                  15+
                </div>
                <p className="text-slate-300 font-medium">DeFi Protocols Supported</p>
              </div>
              <div>
                <div className="text-5xl font-black text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text mb-2">
                  99.9%
                </div>
                <p className="text-slate-300 font-medium">Uptime Reliability</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Professional Dashboard Header */}
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
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 -mt-1">
                Welcome back, {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <nav className="hidden md:flex items-center space-x-6">
              <a href="/" className="relative text-blue-600 font-semibold dark:text-blue-400 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <SparklesIcon className="w-4 h-4 inline mr-2" />
                Dashboard
              </a>
              <a href="/portfolio" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200">
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

      {/* Connected Dashboard */}
      <main className="container mx-auto px-6 py-8">
        {/* Dashboard Stats */}
        <div className="mb-8">
          <PortfolioStats 
            totalValue={totalValue + defiValue}
            defiValue={defiValue}
            averageYield={averageYield}
            isLoading={isLoading || defiLoading}
          />
        </div>

        {/* Market Overview */}
        <div className="mb-8">
          <MarketOverview />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="xl:col-span-2 space-y-8">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                    Token Holdings
                  </CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/portfolio">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <EnhancedTokenList 
                  balances={balances.slice(0, 6)}
                  isLoading={isLoading}
                  error={error}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  DeFi Positions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <DeFiSummary />
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Button asChild className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold">
                    <Link href="/portfolio">View Full Portfolio</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full h-12">
                    <Link href="/defi">Manage DeFi</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full h-12">
                    <Link href="/analytics">Advanced Analytics</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}