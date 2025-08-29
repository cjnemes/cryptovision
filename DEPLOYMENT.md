# CryptoVision Production Deployment Guide

This guide outlines the steps to deploy CryptoVision to production using Vercel and PostgreSQL.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **PostgreSQL Database**: Set up a cloud PostgreSQL instance
3. **API Keys**: Obtain required API keys for blockchain and price data

## Required API Keys

### Essential (Required)
- **Alchemy API Key**: Get from [alchemy.com](https://alchemy.com)
  - Used for blockchain data and RPC calls
  - Supports Ethereum mainnet and Base network
- **WalletConnect Project ID**: Get from [cloud.walletconnect.com](https://cloud.walletconnect.com)
  - Required for wallet connections via RainbowKit

### Optional (Enhanced Features)
- **CoinGecko API Key**: Get from [coingecko.com](https://coingecko.com)
  - For enhanced price data and historical charts
- **CoinMarketCap API Key**: Get from [coinmarketcap.com/api](https://coinmarketcap.com/api)
  - Alternative/backup price data source

## Database Setup

### 1. Create PostgreSQL Database

Choose one of these providers:
- **Vercel Postgres** (Recommended): Integrated with Vercel deployment
- **Supabase**: Free tier available with good performance
- **Railway**: Simple setup with PostgreSQL
- **AWS RDS**: Enterprise-grade with full control

### 2. Get Database Connection URL

Your DATABASE_URL should follow this format:
```
postgresql://username:password@hostname:port/database
```

Example:
```
postgresql://user:password123@db.example.com:5432/cryptovision_prod
```

## Deployment Steps

### 1. Prepare Environment Variables

Create a `.env.production` file with:

```env
# Database
DATABASE_URL=your_postgresql_connection_string

# Blockchain APIs (Required)
ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Price Data APIs (Optional)
COINGECKO_API_KEY=your_coingecko_api_key
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key

# Authentication
NEXTAUTH_SECRET=your_secure_random_string_32_chars_min
NEXTAUTH_URL=https://your-app.vercel.app

# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=CryptoVision
NEXT_PUBLIC_DEFAULT_CHAIN=ethereum
```

### 2. Deploy to Vercel

#### Option A: GitHub Integration (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Production ready deployment"
   git push origin main
   ```

2. **Connect Vercel to GitHub**:
   - Visit [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js configuration

3. **Configure Environment Variables**:
   - In Vercel dashboard → Project Settings → Environment Variables
   - Add all variables from `.env.production`
   - Set Environment to "Production"

#### Option B: Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

### 3. Database Migration

After successful deployment:

1. **Run Prisma Migration**:
   ```bash
   npx prisma db push
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

### 4. Verify Deployment

1. **Check Application**:
   - Visit your Vercel deployment URL
   - Connect a wallet to test functionality
   - Verify all charts and data display correctly

2. **Monitor Logs**:
   - Check Vercel function logs for any errors
   - Verify database connections are working
   - Test API endpoints respond correctly

## Configuration Scripts

### Interactive API Key Setup

Run the configuration script to set up API keys:
```bash
node configure-keys.js
```

This will guide you through setting up all required keys.

### Manual Configuration

Copy and configure environment files:
```bash
cp .env.example .env.local
# Edit .env.local with your keys
```

## Performance Optimizations

### 1. Vercel Function Configuration

Add to `vercel.json`:
```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/cron/update-prices",
      "schedule": "0 */1 * * *"
    }
  ]
}
```

### 2. Database Connection Pooling

For production, consider connection pooling:
```typescript
// In src/lib/db.ts
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?connection_limit=5"
    }
  }
});
```

## Security Considerations

### 1. Environment Variables

- Never commit API keys to version control
- Use Vercel's environment variable encryption
- Rotate keys regularly

### 2. Database Security

- Use SSL connections for database
- Implement proper database user permissions
- Regular backups and monitoring

### 3. API Rate Limiting

- Implement caching for API responses
- Use appropriate rate limiting for external APIs
- Monitor API usage and costs

## Monitoring & Maintenance

### 1. Application Monitoring

- Set up Vercel Analytics for performance tracking
- Monitor API response times and error rates
- Track user wallet connections and usage patterns

### 2. Database Maintenance

- Regular database backups
- Monitor database performance and query efficiency
- Clean up old price data and transaction history as needed

### 3. API Key Management

- Monitor API usage limits
- Set up alerts for approaching limits
- Upgrade API plans as usage grows

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify DATABASE_URL format
   - Check database server status
   - Ensure SSL settings match provider requirements

2. **API Rate Limits**:
   - Implement proper caching
   - Use multiple API providers as fallbacks
   - Monitor usage dashboards

3. **Wallet Connection Issues**:
   - Verify WalletConnect Project ID
   - Check NEXTAUTH_URL matches deployment URL
   - Test with multiple wallet providers

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=cryptovision:*
LOG_LEVEL=debug
```

## Support & Updates

- **Documentation**: Keep this deployment guide updated
- **Security Updates**: Regularly update dependencies
- **Feature Releases**: Follow semantic versioning for releases
- **Backup Strategy**: Implement automated database backups

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Configure API keys
node configure-keys.js

# Run database migrations (production)
npx prisma db push

# Deploy to Vercel
vercel --prod

# View deployment logs
vercel logs
```

For support, check the troubleshooting section or create an issue in the GitHub repository.