'use client'

import { TokenBalance, DeFiPosition } from '@/types'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import { useState } from 'react'
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon, 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface PortfolioInsightsProps {
  tokenBalances: TokenBalance[]
  defiPositions: DeFiPosition[]
  totalValue: number
}

export function PortfolioInsights({ tokenBalances, defiPositions, totalValue }: PortfolioInsightsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'allocation' | 'risk' | 'yield'>('overview')
  
  // Advanced portfolio calculations
  const spotValue = tokenBalances.reduce((sum, token) => sum + token.value, 0)
  const defiValue = defiPositions.reduce((sum, position) => sum + position.value, 0)
  
  // Token analysis with advanced metrics
  const tokenAnalysis = tokenBalances.map(token => {
    const allocation = totalValue > 0 ? (token.value / totalValue) * 100 : 0
    const isStablecoin = ['USDC', 'USDT', 'DAI', 'FRAX', 'LUSD', 'USDbC'].includes(token.symbol.toUpperCase())
    const isETH = token.symbol.toUpperCase().includes('ETH')
    const isBTC = token.symbol.toUpperCase().includes('BTC')
    
    return {
      ...token,
      allocation,
      isStablecoin,
      isETH,
      isBTC,
      category: isStablecoin ? 'Stablecoin' : isETH ? 'Ethereum' : isBTC ? 'Bitcoin' : 'Altcoin'
    }
  }).sort((a, b) => b.value - a.value)

  // Category breakdown
  const categoryBreakdown = tokenAnalysis.reduce((acc, token) => {
    if (!acc[token.category]) {
      acc[token.category] = { value: 0, count: 0, allocation: 0 }
    }
    acc[token.category].value += token.value
    acc[token.category].count += 1
    acc[token.category].allocation += token.allocation
    return acc
  }, {} as Record<string, { value: number; count: number; allocation: number }>)

  // Protocol analysis with advanced metrics
  const protocolAnalysis = defiPositions.reduce((acc, position) => {
    const protocol = position.protocol
    if (!acc[protocol]) {
      acc[protocol] = { 
        name: protocol, 
        value: 0, 
        count: 0, 
        totalAPY: 0, 
        claimable: 0,
        types: new Set() as Set<string>
      }
    }
    acc[protocol].value += position.value
    acc[protocol].count += 1
    acc[protocol].totalAPY += position.apy || 0
    acc[protocol].claimable += position.claimable || 0
    acc[protocol].types.add(position.type)
    return acc
  }, {} as Record<string, { name: string; value: number; count: number; totalAPY: number; claimable: number; types: Set<string> }>)

  Object.values(protocolAnalysis).forEach(protocol => {
    protocol.totalAPY = protocol.totalAPY / protocol.count // Average APY
  })

  // Risk analysis
  const stablecoinAllocation = categoryBreakdown['Stablecoin']?.allocation || 0
  const altcoinAllocation = categoryBreakdown['Altcoin']?.allocation || 0
  const defiAllocation = (defiValue / totalValue) * 100
  
  // Concentration risk (Herfindahl-Hirschman Index)
  const hhi = tokenAnalysis.reduce((sum, token) => sum + Math.pow(token.allocation, 2), 0)
  const concentrationRisk = hhi > 2500 ? 'High' : hhi > 1500 ? 'Medium' : 'Low'
  
  // Yield analysis
  const totalYieldEarning = defiPositions.reduce((sum, pos) => sum + ((pos.apy || 0) * pos.value / 100), 0)
  const weightedAvgAPY = defiValue > 0 ? (totalYieldEarning / defiValue) * 100 : 0
  const totalClaimable = defiPositions.reduce((sum, pos) => sum + (pos.claimable || 0), 0)
  
  // Portfolio diversity metrics
  const totalAssets = tokenBalances.length + defiPositions.length
  const shannonDiversity = -tokenAnalysis.reduce((sum, token) => {
    const p = token.allocation / 100
    return p > 0 ? sum + (p * Math.log(p)) : sum
  }, 0)
  const diversityScore = Math.min((shannonDiversity / Math.log(Math.max(totalAssets, 1))) * 100, 100)
  
  // Mock price trend data for demonstration
  const mockTrendData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    value: totalValue * (0.95 + (Math.random() * 0.1))
  }))

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: ChartBarIcon },
          { id: 'allocation', label: 'Allocation', icon: CurrencyDollarIcon },
          { id: 'risk', label: 'Risk Analysis', icon: ShieldCheckIcon },
          { id: 'yield', label: 'Yield', icon: ArrowTrendingUpIcon }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
              activeTab === id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab 
          tokenAnalysis={tokenAnalysis}
          protocolAnalysis={protocolAnalysis}
          totalValue={totalValue}
          diversityScore={diversityScore}
          mockTrendData={mockTrendData}
        />
      )}
      
      {activeTab === 'allocation' && (
        <AllocationTab 
          tokenAnalysis={tokenAnalysis}
          categoryBreakdown={categoryBreakdown}
          totalValue={totalValue}
        />
      )}
      
      {activeTab === 'risk' && (
        <RiskTab 
          concentrationRisk={concentrationRisk}
          stablecoinAllocation={stablecoinAllocation}
          defiAllocation={defiAllocation}
          altcoinAllocation={altcoinAllocation}
          hhi={hhi}
        />
      )}
      
      {activeTab === 'yield' && (
        <YieldTab 
          defiPositions={defiPositions}
          protocolAnalysis={protocolAnalysis}
          weightedAvgAPY={weightedAvgAPY}
          totalClaimable={totalClaimable}
          totalYieldEarning={totalYieldEarning}
        />
      )}
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ tokenAnalysis, protocolAnalysis, totalValue, diversityScore, mockTrendData }: any) {
  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
            <span className="text-xs text-blue-600 bg-blue-200 px-2 py-1 rounded-full">Total</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</div>
          <div className="text-sm text-blue-600">Portfolio Value</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
            <span className="text-xs text-green-600 bg-green-200 px-2 py-1 rounded-full">Score</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{Math.round(diversityScore)}%</div>
          <div className="text-sm text-green-600">Diversity</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <ChartBarIcon className="h-5 w-5 text-purple-600" />
            <span className="text-xs text-purple-600 bg-purple-200 px-2 py-1 rounded-full">Assets</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{tokenAnalysis.length}</div>
          <div className="text-sm text-purple-600">Holdings</div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <ShieldCheckIcon className="h-5 w-5 text-orange-600" />
            <span className="text-xs text-orange-600 bg-orange-200 px-2 py-1 rounded-full">DeFi</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{Object.keys(protocolAnalysis).length}</div>
          <div className="text-sm text-orange-600">Protocols</div>
        </div>
      </div>

      {/* Portfolio Trend */}
      <div className="bg-white rounded-xl border p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Trend (30D Mock)</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockTrendData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" hide />
              <YAxis hide />
              <Tooltip 
                formatter={(value: any) => [formatCurrency(value), 'Portfolio Value']}
                labelFormatter={(day) => `Day ${day}`}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6" 
                fillOpacity={1} 
                fill="url(#colorValue)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Holdings */}
      <div className="bg-white rounded-xl border p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Holdings</h4>
        <div className="space-y-3">
          {tokenAnalysis.slice(0, 5).map((token: any, index: number) => (
            <div key={token.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">{index + 1}</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{token.symbol}</div>
                  <div className="text-sm text-gray-500">{token.category}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{formatCurrency(token.value)}</div>
                <div className="text-sm text-gray-500">{formatPercent(token.allocation)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Allocation Tab Component  
function AllocationTab({ tokenAnalysis, categoryBreakdown, totalValue }: any) {
  const chartData = Object.entries(categoryBreakdown).map(([category, data]: [string, any]) => ({
    category,
    value: data.value,
    allocation: data.allocation,
    count: data.count
  }))

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']

  return (
    <div className="space-y-6">
      {/* Asset Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Asset Categories</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, allocation }) => `${category}: ${formatPercent(allocation)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Allocation Details</h4>
          <div className="space-y-4">
            {Object.entries(categoryBreakdown).map(([category, data]: [string, any], index) => (
              <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div>
                    <div className="font-medium text-gray-900">{category}</div>
                    <div className="text-sm text-gray-500">{data.count} assets</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatCurrency(data.value)}</div>
                  <div className="text-sm text-gray-500">{formatPercent(data.allocation)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Holdings Table */}
      <div className="bg-white rounded-xl border p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">All Holdings</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Asset</th>
                <th className="text-right py-2">Balance</th>
                <th className="text-right py-2">Price</th>
                <th className="text-right py-2">Value</th>
                <th className="text-right py-2">Allocation</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tokenAnalysis.map((token: any) => (
                <tr key={token.symbol}>
                  <td className="py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">{token.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-xs text-gray-500">{token.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-3">{parseFloat(token.balance).toFixed(4)}</td>
                  <td className="text-right py-3">{formatCurrency(token.price)}</td>
                  <td className="text-right py-3 font-semibold">{formatCurrency(token.value)}</td>
                  <td className="text-right py-3">{formatPercent(token.allocation)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Risk Analysis Tab
function RiskTab({ concentrationRisk, stablecoinAllocation, defiAllocation, altcoinAllocation, hhi }: any) {
  const riskFactors = [
    {
      title: 'Concentration Risk',
      value: concentrationRisk,
      color: concentrationRisk === 'High' ? 'text-red-600' : concentrationRisk === 'Medium' ? 'text-yellow-600' : 'text-green-600',
      icon: concentrationRisk === 'High' ? ExclamationTriangleIcon : ShieldCheckIcon,
      description: `HHI: ${Math.round(hhi)} - ${concentrationRisk === 'High' ? 'Highly concentrated portfolio' : concentrationRisk === 'Medium' ? 'Moderately concentrated' : 'Well diversified'}`
    },
    {
      title: 'Stablecoin Allocation',
      value: formatPercent(stablecoinAllocation),
      color: stablecoinAllocation < 10 ? 'text-red-600' : stablecoinAllocation < 30 ? 'text-yellow-600' : 'text-green-600',
      icon: ShieldCheckIcon,
      description: stablecoinAllocation < 10 ? 'Low stability buffer' : 'Good stability allocation'
    },
    {
      title: 'DeFi Exposure',
      value: formatPercent(defiAllocation),
      color: defiAllocation > 70 ? 'text-red-600' : defiAllocation > 40 ? 'text-yellow-600' : 'text-green-600',
      icon: defiAllocation > 70 ? ExclamationTriangleIcon : ShieldCheckIcon,
      description: defiAllocation > 70 ? 'High smart contract risk' : 'Balanced DeFi exposure'
    },
    {
      title: 'Altcoin Risk',
      value: formatPercent(altcoinAllocation),
      color: altcoinAllocation > 50 ? 'text-red-600' : altcoinAllocation > 25 ? 'text-yellow-600' : 'text-green-600',
      icon: altcoinAllocation > 50 ? ExclamationTriangleIcon : ShieldCheckIcon,
      description: altcoinAllocation > 50 ? 'High volatility exposure' : 'Controlled altcoin risk'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {riskFactors.map((factor, index) => {
          const IconComponent = factor.icon
          return (
            <div key={index} className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <IconComponent className="h-5 w-5 text-gray-600" />
                  <h4 className="font-medium text-gray-900">{factor.title}</h4>
                </div>
                <span className={`text-xl font-bold ${factor.color}`}>{factor.value}</span>
              </div>
              <p className="text-sm text-gray-600">{factor.description}</p>
            </div>
          )
        })}
      </div>
      
      {/* Risk Recommendations */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="h-6 w-6 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-800 mb-2">Risk Management Recommendations</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {concentrationRisk === 'High' && <li>• Consider diversifying your largest positions</li>}
              {stablecoinAllocation < 10 && <li>• Increase stablecoin allocation for stability</li>}
              {defiAllocation > 70 && <li>• High DeFi exposure - consider smart contract risks</li>}
              {altcoinAllocation > 50 && <li>• High altcoin allocation may increase volatility</li>}
              <li>• Regularly rebalance to maintain target allocations</li>
              <li>• Consider dollar-cost averaging for volatile positions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Yield Analysis Tab
function YieldTab({ defiPositions, protocolAnalysis, weightedAvgAPY, totalClaimable, totalYieldEarning }: any) {
  const yieldPositions = defiPositions.filter((pos: DeFiPosition) => pos.apy && pos.apy > 0)
  const sortedProtocols = Object.values(protocolAnalysis)
    .filter((p: any) => p.totalAPY > 0)
    .sort((a: any, b: any) => b.totalAPY - a.totalAPY)

  return (
    <div className="space-y-6">
      {/* Yield Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
            <span className="text-xs text-green-600 bg-green-200 px-2 py-1 rounded-full">APY</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatPercent(weightedAvgAPY)}</div>
          <div className="text-sm text-green-600">Weighted Avg APY</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
            <span className="text-xs text-blue-600 bg-blue-200 px-2 py-1 rounded-full">Claimable</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalClaimable)}</div>
          <div className="text-sm text-blue-600">Available Rewards</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
            <span className="text-xs text-purple-600 bg-purple-200 px-2 py-1 rounded-full">Annual</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalYieldEarning * 52)}</div>
          <div className="text-sm text-purple-600">Est. Annual Yield</div>
        </div>
      </div>

      {/* Protocol Yield Breakdown */}
      <div className="bg-white rounded-xl border p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Yield by Protocol</h4>
        <div className="space-y-4">
          {sortedProtocols.map((protocol: any) => (
            <div key={protocol.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-semibold text-gray-900 capitalize">{protocol.name.replace('-', ' ')}</div>
                <div className="text-sm text-gray-500">
                  {formatCurrency(protocol.value)} • {protocol.count} positions
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">{formatPercent(protocol.totalAPY)}</div>
                <div className="text-sm text-gray-500">{formatCurrency(protocol.claimable)} claimable</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Yield Positions */}
      <div className="bg-white rounded-xl border p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Active Yield Positions</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Position</th>
                <th className="text-right py-2">Value</th>
                <th className="text-right py-2">APY</th>
                <th className="text-right py-2">Est. Weekly</th>
                <th className="text-right py-2">Claimable</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {yieldPositions.map((position: DeFiPosition) => {
                const weeklyYield = (position.value * (position.apy || 0) / 100) / 52
                return (
                  <tr key={position.id}>
                    <td className="py-3">
                      <div>
                        <div className="font-medium capitalize">{position.protocol.replace('-', ' ')}</div>
                        <div className="text-sm text-gray-500">{position.type}</div>
                      </div>
                    </td>
                    <td className="text-right py-3">{formatCurrency(position.value)}</td>
                    <td className="text-right py-3">
                      <span className="text-green-600 font-semibold">{formatPercent(position.apy || 0)}</span>
                    </td>
                    <td className="text-right py-3">{formatCurrency(weeklyYield)}</td>
                    <td className="text-right py-3">
                      {position.claimable && position.claimable > 0 
                        ? formatCurrency(position.claimable)
                        : '—'
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}