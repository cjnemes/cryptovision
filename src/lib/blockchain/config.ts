import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
} from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'CryptoVision',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: true, // If your dApp uses server side rendering (SSR)
})

// Supported chains for the application
export const supportedChains = [mainnet, polygon, optimism, arbitrum, base]

// Default chain (Ethereum mainnet)
export const defaultChain = mainnet