import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Home() {
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
          <Button>Connect Wallet</Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Your Complete Crypto Portfolio
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Track all your crypto holdings, DeFi positions, and analyze your portfolio performance 
            across multiple wallets and protocols in one unified dashboard.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">Get Started</Button>
            <Button variant="outline" size="lg">View Demo</Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-md flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-sm">📊</span>
                </div>
                Multi-Wallet Dashboard
              </CardTitle>
              <CardDescription>
                Connect multiple wallets and see all your holdings in one place
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Real-time portfolio tracking</li>
                <li>• Token balance aggregation</li>
                <li>• Multi-chain support</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-md flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 text-sm">🌾</span>
                </div>
                DeFi Integration
              </CardTitle>
              <CardDescription>
                Track your positions across major DeFi protocols
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Liquidity pool tracking</li>
                <li>• Yield farming positions</li>
                <li>• Lending & borrowing</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-md flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 text-sm">📈</span>
                </div>
                P&L Analytics
              </CardTitle>
              <CardDescription>
                Comprehensive profit and loss tracking with tax reporting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Realized & unrealized gains</li>
                <li>• Cost basis tracking</li>
                <li>• Tax report generation</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Coming Soon</CardTitle>
            <CardDescription>
              We&apos;re building the most comprehensive crypto portfolio management platform
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                <div className="font-semibold text-blue-600 dark:text-blue-400">Phase 1</div>
                <div className="text-gray-600 dark:text-gray-400">Basic Portfolio Dashboard</div>
              </div>
              <div className="p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                <div className="font-semibold text-green-600 dark:text-green-400">Phase 2</div>
                <div className="text-gray-600 dark:text-gray-400">Advanced DeFi Integration</div>
              </div>
              <div className="p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                <div className="font-semibold text-purple-600 dark:text-purple-400">Phase 3</div>
                <div className="text-gray-600 dark:text-gray-400">Direct Protocol Interaction</div>
              </div>
              <div className="p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                <div className="font-semibold text-orange-600 dark:text-orange-400">Future</div>
                <div className="text-gray-600 dark:text-gray-400">Mobile & Multi-chain</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm dark:bg-gray-950/80 dark:border-gray-800 mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            CryptoVision - Built for crypto investors who want complete portfolio visibility
          </p>
        </div>
      </footer>
    </div>
  )
}