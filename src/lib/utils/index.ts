import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ethers } from "ethers"

// Utility function for combining Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format wallet address for display
export function formatAddress(address: string, chars = 4): string {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

// Validate Ethereum address
export function isValidAddress(address: string): boolean {
  try {
    return ethers.isAddress(address)
  } catch {
    return false
  }
}

// Format token amounts with proper decimals
export function formatTokenAmount(
  amount: string | number,
  decimals: number = 18,
  displayDecimals: number = 4
): string {
  try {
    const bigAmount = ethers.parseUnits(amount.toString(), decimals)
    const formatted = ethers.formatUnits(bigAmount, decimals)
    const num = parseFloat(formatted)
    
    if (num === 0) return '0'
    if (num < 0.0001) return '<0.0001'
    
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: displayDecimals
    })
  } catch {
    return '0'
  }
}

// Format USD currency
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Format percentage
export function formatPercent(value: number, decimals = 2): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

// Calculate percentage change
export function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Recursively convert BigInt values to strings for JSON serialization
export function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString()
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigInt(item))
  }
  
  if (typeof obj === 'object') {
    const serialized: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        serialized[key] = serializeBigInt(obj[key])
      }
    }
    return serialized
  }
  
  return obj
}