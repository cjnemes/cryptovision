# CryptoVision API Setup Guide 🔑

This guide will help you set up real API keys to access live blockchain and price data instead of mock data.

## Current Status

✅ **Price Data**: Working with CoinGecko free tier  
❌ **Blockchain Data**: Needs Alchemy API key  
❌ **Wallet Connections**: Needs WalletConnect Project ID  

## Required API Keys

### 1. Alchemy API Key (Required for blockchain data)

**What it does**: Fetches real token balances, transaction history, and blockchain data

**How to get it**:
1. Go to [alchemy.com](https://alchemy.com)
2. Sign up for a free account
3. Create a new app
4. Choose "Ethereum" as the network
5. Copy your API key from the dashboard

**Free tier limits**: 300M requests/month (generous for development)

### 2. WalletConnect Project ID (Required for wallet connections)

**What it does**: Enables secure wallet connections (MetaMask, Coinbase Wallet, etc.)

**How to get it**:
1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Sign up for a free account
3. Create a new project
4. Copy your Project ID from the dashboard

**Free tier**: Unlimited for development

### 3. CoinGecko API Key (Optional - already working with free tier)

**What it does**: Provides cryptocurrency price data and market information

**How to get it**:
1. Go to [coingecko.com](https://coingecko.com)
2. Sign up for a free account
3. Go to Developer Dashboard
4. Generate an API key

**Note**: CryptoVision already works with CoinGecko's free tier (no key required)

### 4. CoinMarketCap API Key (Optional backup)

**What it does**: Alternative source for cryptocurrency price data

**How to get it**:
1. Go to [coinmarketcap.com/api](https://coinmarketcap.com/api)
2. Sign up for free Basic plan
3. Copy your API key from the dashboard

**Free tier**: 10,000 requests/month

## Setup Instructions

### Quick Setup (Recommended)

1. **Get your API keys** (see sections above)

2. **Run the interactive configuration**:
   ```bash
   npm run configure
   ```

3. **Enter your keys when prompted**

4. **Restart the development server**:
   ```bash
   npm run dev
   ```

### Manual Setup

1. **Copy the environment file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` with your API keys**:
   ```env
   # Blockchain APIs (Required)
   ALCHEMY_API_KEY=your_actual_alchemy_key_here
   
   # Wallet Connection (Required)
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here
   
   # Price APIs (Optional)
   COINGECKO_API_KEY=your_coingecko_key_here
   COINMARKETCAP_API_KEY=your_coinmarketcap_key_here
   ```

3. **Restart the development server**:
   ```bash
   npm run dev
   ```

## Testing Your Setup

### 1. Test Wallet Connection
- Visit [http://localhost:3001](http://localhost:3001)
- Click "Connect Wallet"
- You should see wallet options (not just a demo message)

### 2. Test Blockchain Data
- Connect your wallet
- Go to Portfolio page
- You should see your actual token balances instead of mock data

### 3. Test Price Data
- Connected wallets should show real USD values
- Charts should display current market prices

## Troubleshooting

### ❌ "Alchemy API key not configured"
- **Problem**: Token balances showing mock data
- **Solution**: Add real Alchemy API key to `.env.local`
- **Test**: Check API response: `curl "http://localhost:3001/api/balances/YOUR_ADDRESS"`

### ❌ "Wallet connection failed" 
- **Problem**: Can't connect MetaMask or other wallets
- **Solution**: Add real WalletConnect Project ID to `.env.local`
- **Test**: Look for "demo-project-id" warnings in browser console

### ❌ "Price data unavailable"
- **Problem**: Token values showing as $0
- **Solution**: Usually works without keys, check your internet connection
- **Test**: Check API response: `curl -X POST http://localhost:3001/api/prices -H "Content-Type: application/json" -d '{"tokenAddresses": ["0x0000000000000000000000000000000000000000"]}'`

### ❌ "Rate limit exceeded"
- **Problem**: Too many API requests
- **Solution**: 
  - Alchemy: Upgrade plan or wait for limit reset
  - CoinGecko: Add API key for higher limits
  - CoinMarketCap: Add API key for higher limits

## API Limits Reference

| Provider | Free Tier | Rate Limit | Upgrade Cost |
|----------|-----------|------------|--------------|
| **Alchemy** | 300M requests/month | No rate limit | $99/month for Growth |
| **WalletConnect** | Unlimited | No limit | Free for development |
| **CoinGecko** | 10 calls/minute | No key required | $6/month for Pro |
| **CoinMarketCap** | 10k calls/month | 100 calls/day | $29/month for Hobbyist |

## Development vs Production

### Development (Current)
- Use free tier API keys
- Mock data fallbacks for missing keys
- Rate limits are usually sufficient

### Production
- Use paid API plans for higher limits
- Set up proper error monitoring
- Implement caching to reduce API calls
- Use multiple API providers for redundancy

## Security Notes

⚠️ **Important Security Practices**:

1. **Never commit API keys to version control**
   - API keys should only be in `.env.local`
   - `.env.local` is in `.gitignore`

2. **Use different keys for development and production**
   - Keep production keys secure
   - Rotate keys regularly

3. **Environment-specific configuration**
   - Development: `.env.local`
   - Production: Vercel environment variables

4. **Monitor your usage**
   - Check API dashboards regularly
   - Set up alerts for high usage
   - Watch for suspicious activity

## Next Steps

Once you have real API keys configured:

1. ✅ **Real Data**: Your portfolio will show actual blockchain data
2. ✅ **Live Prices**: Current market values from CoinGecko
3. ✅ **Wallet Connections**: Seamless connection to MetaMask, Coinbase Wallet, etc.
4. 🚀 **Production Ready**: Ready to deploy with real user data

---

## Quick Start Commands

```bash
# Interactive setup
npm run configure

# Manual setup
cp .env.example .env.local
# Edit .env.local with your keys

# Test your setup
npm run dev
curl "http://localhost:3001/api/balances/YOUR_WALLET_ADDRESS"

# Deploy with real keys
npm run deploy
```

**Need help?** Check our [troubleshooting guide](./TROUBLESHOOTING.md) or open an issue on GitHub.