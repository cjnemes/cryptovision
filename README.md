# CryptoVision

**Comprehensive crypto portfolio management platform with DeFi integration and P&L analytics**

![CryptoVision](https://img.shields.io/badge/Status-In%20Development-yellow)
![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🚀 Overview

CryptoVision is a unified crypto portfolio management platform that aggregates holdings across all wallets and DeFi protocols, providing real-time visibility into assets, projected yields, profit/loss tracking, and comprehensive portfolio analytics.

### 🎯 Core Features (MVP)

- **Multi-Wallet Dashboard** - Connect multiple wallets and see all holdings in one place
- **DeFi Integration** - Track positions across major DeFi protocols (Uniswap, Aave, Compound, etc.)
- **P&L Analytics** - Comprehensive profit and loss tracking with tax reporting
- **Real-time Updates** - Live portfolio values and yield calculations
- **Professional UI** - Clean, responsive interface built with React and Tailwind CSS

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Next.js 15
- **Styling**: Tailwind CSS
- **Blockchain**: ethers.js + RainbowKit + Wagmi
- **Database**: PostgreSQL + Prisma ORM  
- **APIs**: Alchemy, Moralis, CoinGecko
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/cjnemes/cryptovision.git
cd cryptovision
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys:
- **Alchemy API Key** - Get from [Alchemy](https://alchemy.com/)
- **Moralis API Key** - Get from [Moralis](https://moralis.io/)
- **CoinGecko API Key** - Get from [CoinGecko](https://coingecko.com/)
- **WalletConnect Project ID** - Get from [WalletConnect Cloud](https://cloud.walletconnect.com/)

### 4. Database Setup (Coming Soon)
```bash
npm run db:generate
npm run db:push
```

### 5. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
cryptovision/
├── src/
│   ├── app/                    # Next.js app directory
│   ├── components/             # Reusable React components
│   │   ├── ui/                # Basic UI components
│   │   ├── wallet/            # Wallet-related components  
│   │   └── charts/            # Chart components
│   ├── lib/                   # Utility functions and configs
│   │   ├── blockchain/        # Blockchain interaction utilities
│   │   ├── api/               # API client functions
│   │   └── utils/             # General utilities
│   ├── types/                 # TypeScript type definitions
│   └── hooks/                 # Custom React hooks
├── prisma/                    # Database schema and migrations
├── public/                    # Static assets
└── docs/                      # Documentation
```

## 🧪 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
npm run test         # Run tests (coming soon)
```

## 🗺️ Development Roadmap

### Phase 1: MVP Foundation (Week 1-12) ✅
- [x] Project setup and dependencies
- [x] Basic UI components and styling
- [x] Landing page and project structure
- [ ] Wallet connection integration
- [ ] Basic portfolio dashboard
- [ ] Token balance fetching

### Phase 2: Core Features (Week 13-20)
- [ ] DeFi protocol integrations
- [ ] P&L tracking system
- [ ] Historical data and charts
- [ ] Database implementation

### Phase 3: Advanced Features (Week 21+)
- [ ] Direct protocol interactions
- [ ] Advanced analytics
- [ ] Mobile optimization
- [ ] Multi-chain support

## 📖 Documentation

- [Development Guide](./DEVELOPMENT.md) - Development workflows and standards
- [Testing Strategy](./TESTING.md) - Testing approaches and processes  
- [Claude Development Guide](./CLAUDE.md) - AI-assisted development standards
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
- [Product Requirements](./prd_template.md) - Detailed product specifications

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Follow our [development standards](./DEVELOPMENT.md)
4. Commit your changes (`git commit -m 'feat: Add AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

## 📊 Current Status

**Development Phase**: MVP Foundation  
**Live Demo**: http://localhost:3000 (development)  
**Repository**: https://github.com/cjnemes/cryptovision  

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/cjnemes/cryptovision/issues)
- **Discussions**: [GitHub Discussions](https://github.com/cjnemes/cryptovision/discussions)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the crypto community**