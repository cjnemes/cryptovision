#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('🔑 CryptoVision API Key Configuration\n');
  console.log('This script will help you configure your API keys for CryptoVision.');
  console.log('Press Enter to skip any key you don\'t have yet.\n');

  const envPath = path.join(__dirname, '.env.local');
  let envContent = '';

  // Check if .env.local exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('Found existing .env.local file. We\'ll update it.\n');
  } else {
    console.log('Creating new .env.local file.\n');
    envContent = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8');
  }

  // API Keys to configure
  const apiKeys = [
    {
      key: 'ALCHEMY_API_KEY',
      name: 'Alchemy API Key',
      description: 'Get from https://alchemy.com/ - Required for blockchain data',
      required: true
    },
    {
      key: 'COINGECKO_API_KEY', 
      name: 'CoinGecko API Key',
      description: 'Get from https://coingecko.com/ - For price data (optional)',
      required: false
    },
    {
      key: 'COINMARKETCAP_API_KEY',
      name: 'CoinMarketCap API Key', 
      description: 'Get from https://coinmarketcap.com/api/ - Price data API (optional)',
      required: false
    },
    {
      key: 'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
      name: 'WalletConnect Project ID',
      description: 'Get from https://cloud.walletconnect.com/ - For wallet connections',
      required: true
    }
  ];

  for (const apiKey of apiKeys) {
    console.log(`\n📝 ${apiKey.name}`);
    console.log(`   ${apiKey.description}`);
    
    const currentValue = getCurrentEnvValue(envContent, apiKey.key);
    if (currentValue && currentValue !== 'your_' + apiKey.key.toLowerCase() + '_here' && currentValue !== 'demo-project-id') {
      console.log(`   Current: ${currentValue.substring(0, 10)}...${currentValue.substring(currentValue.length - 4)}`);
    }
    
    const newValue = await promptUser(`   Enter ${apiKey.name} (or press Enter to skip): `);
    
    if (newValue) {
      envContent = updateEnvValue(envContent, apiKey.key, newValue);
      console.log(`   ✅ ${apiKey.name} configured`);
    } else if (apiKey.required) {
      console.log(`   ⚠️  Skipped ${apiKey.name} (required for full functionality)`);
    } else {
      console.log(`   ⏭️  Skipped ${apiKey.name}`);
    }
  }

  // Write the updated .env.local file
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n🎉 Configuration complete!');
  console.log(`📁 Configuration saved to: ${envPath}`);
  console.log('\n🚀 Next steps:');
  console.log('1. Restart your development server: npm run dev');
  console.log('2. Visit http://localhost:3001 to test your configuration');
  console.log('3. Connect your wallet to see real data instead of mock data\n');

  rl.close();
}

function getCurrentEnvValue(envContent, key) {
  const regex = new RegExp(`^${key}=(.*)$`, 'm');
  const match = envContent.match(regex);
  return match ? match[1] : null;
}

function updateEnvValue(envContent, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(envContent)) {
    return envContent.replace(regex, `${key}=${value}`);
  } else {
    return envContent + `\n${key}=${value}`;
  }
}

main().catch(console.error);