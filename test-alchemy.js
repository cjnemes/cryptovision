#!/usr/bin/env node

// Simple test script to verify Alchemy API key
const { Alchemy, Network } = require('alchemy-sdk');

const apiKey = process.env.ALCHEMY_API_KEY || 'AQZmxJ7OT9EiX--W_Ht75';

console.log('🧪 Testing Alchemy API Key');
console.log('📝 API Key:', apiKey.substring(0, 6) + '...' + apiKey.substring(apiKey.length - 4));
console.log('📏 Key Length:', apiKey.length);

if (apiKey.length < 20) {
  console.log('⚠️  Warning: API key seems too short. Alchemy keys are typically 32+ characters.');
  console.log('🔍 Please verify you have the complete API key.');
  process.exit(1);
}

const alchemy = new Alchemy({
  apiKey: apiKey,
  network: Network.ETH_MAINNET,
});

async function testConnection() {
  try {
    console.log('🔗 Testing connection to Alchemy...');
    
    // Test with Vitalik's wallet (public address)
    const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    
    // Simple balance check
    const balance = await alchemy.core.getBalance(address, 'latest');
    
    console.log('✅ Success! Connected to Alchemy');
    console.log(`💰 ETH Balance: ${balance.toString()} wei`);
    console.log(`💵 ETH Balance: ${(parseFloat(balance.toString()) / 1e18).toFixed(4)} ETH`);
    
    // Test token balances
    console.log('🪙 Testing token balance fetch...');
    const tokenBalances = await alchemy.core.getTokenBalances(address);
    console.log(`📊 Found ${tokenBalances.tokenBalances.length} token contracts`);
    
    const nonZeroTokens = tokenBalances.tokenBalances.filter(
      token => token.tokenBalance !== '0x0' && parseInt(token.tokenBalance || '0', 16) > 0
    );
    console.log(`💎 Non-zero tokens: ${nonZeroTokens.length}`);
    
    if (nonZeroTokens.length > 0) {
      console.log('📈 Sample tokens:');
      for (let i = 0; i < Math.min(3, nonZeroTokens.length); i++) {
        const token = nonZeroTokens[i];
        try {
          const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);
          console.log(`   ${metadata.symbol || 'UNKNOWN'}: ${token.contractAddress}`);
        } catch (e) {
          console.log(`   Unknown Token: ${token.contractAddress}`);
        }
      }
    }
    
    console.log('\n🎉 Alchemy API is working perfectly!');
    console.log('🚀 Your CryptoVision app is now ready for real blockchain data!');
    
  } catch (error) {
    console.log('\n❌ Connection failed:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Verify your API key is correct and complete');
    console.log('2. Check that the key is active in your Alchemy dashboard');
    console.log('3. Ensure you have sufficient API credits');
    console.log('4. Check your internet connection');
    
    if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
      console.log('\n🔑 API Key Issue: The key may be invalid or expired');
    }
  }
}

testConnection();