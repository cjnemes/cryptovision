#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// This script sets up test API keys for development
// Replace these with real API keys for production use

const testKeys = {
  // Using Alchemy's public demo key for testing
  ALCHEMY_API_KEY: 'demo',
  
  // Using CoinGecko's free tier (no key required, but we'll use demo)
  COINGECKO_API_KEY: '',
  
  // CoinMarketCap demo key (not functional, just for testing)
  COINMARKETCAP_API_KEY: '',
  
  // Demo WalletConnect project ID
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: 'demo-project-id'
};

const envPath = path.join(__dirname, '.env.local');

// Read existing .env.local or create from example
let envContent = '';
const examplePath = path.join(__dirname, '.env.example');

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('📝 Updating existing .env.local');
} else if (fs.existsSync(examplePath)) {
  envContent = fs.readFileSync(examplePath, 'utf8');
  console.log('📄 Creating .env.local from .env.example');
} else {
  console.log('❌ No .env.example found. Creating basic configuration.');
  envContent = `# Database
DATABASE_URL=postgresql://username:password@localhost:5432/cryptovision_dev

# Blockchain APIs
ALCHEMY_API_KEY=demo

# Price Data APIs
COINGECKO_API_KEY=
COINMARKETCAP_API_KEY=

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3001

# App Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_NAME=CryptoVision
NEXT_PUBLIC_DEFAULT_CHAIN=ethereum

# WalletConnect Project ID (for RainbowKit) 
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=demo-project-id
`;
}

// Update the environment variables
function updateEnvValue(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`);
  } else {
    return content + `\n${key}=${value}`;
  }
}

// Apply test keys
for (const [key, value] of Object.entries(testKeys)) {
  envContent = updateEnvValue(envContent, key, value);
}

// Write the updated file
fs.writeFileSync(envPath, envContent);

console.log('✅ Test configuration complete!');
console.log('📁 Configuration saved to:', envPath);
console.log('');
console.log('🧪 Test Keys Set Up:');
console.log('- Alchemy API: Using public demo endpoint');
console.log('- CoinGecko: Using free tier (no key required)');
console.log('- WalletConnect: Using demo project ID');
console.log('');
console.log('⚠️  Note: These are test keys with limitations:');
console.log('- Alchemy demo key has rate limits');
console.log('- Some features may not work without real API keys');
console.log('- For production, replace with real API keys');
console.log('');
console.log('🚀 Next steps:');
console.log('1. Restart your dev server: npm run dev');
console.log('2. Connect a wallet to test real blockchain data');
console.log('3. Replace demo keys with real ones for full functionality');