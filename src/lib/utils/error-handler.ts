import { ethers } from 'ethers';

export interface ErrorHandlingOptions {
  maxRetries?: number;
  retryDelay?: number;
  silent?: boolean;
  fallbackValue?: any;
  logContext?: string;
}

export class ProtocolError extends Error {
  constructor(
    message: string,
    public protocol: string,
    public operation: string,
    public address?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'ProtocolError';
  }
}

// Common blockchain error types that should be handled gracefully
const EXPECTED_ERRORS = [
  'CALL_EXCEPTION',
  'missing revert data',
  'could not decode result data',
  'invalid opcode',
  'execution reverted',
  'network error',
  'timeout',
  'rate limited',
  'over rate limit',
  'insufficient funds',
  'too many requests',
  '429'
];

export function isRateLimitError(error: any): boolean {
  if (!error) return false;
  
  const errorString = error.toString().toLowerCase();
  const errorMessage = error.message?.toLowerCase() || '';
  const errorInfo = error.info?.error?.message?.toLowerCase() || '';
  
  return (
    errorString.includes('over rate limit') ||
    errorString.includes('rate limit') ||
    errorString.includes('too many requests') ||
    errorMessage.includes('over rate limit') ||
    errorMessage.includes('rate limit') ||
    errorInfo.includes('over rate limit') ||
    errorInfo.includes('rate limit') ||
    error.code === 429
  );
}

export function isExpectedError(error: any): boolean {
  if (!error) return false;
  
  const errorString = error.toString().toLowerCase();
  const errorCode = error.code?.toLowerCase();
  const errorReason = error.reason?.toLowerCase();
  const errorMessage = error.message?.toLowerCase() || '';
  
  // Check for rate limiting in error info
  const errorInfo = error.info?.error?.message?.toLowerCase() || '';
  
  return EXPECTED_ERRORS.some(expectedError => 
    errorString.includes(expectedError.toLowerCase()) ||
    errorCode === expectedError.toLowerCase() ||
    errorReason === expectedError.toLowerCase() ||
    errorMessage.includes(expectedError.toLowerCase()) ||
    errorInfo.includes(expectedError.toLowerCase())
  );
}

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options: ErrorHandlingOptions = {}
): Promise<T | typeof options.fallbackValue> {
  const {
    maxRetries = 1,
    retryDelay = 100,
    silent = false,
    fallbackValue = null,
    logContext = 'Unknown operation'
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Handle rate limiting with exponential backoff
      if (isRateLimitError(error)) {
        if (attempt < maxRetries) {
          const backoffDelay = retryDelay * Math.pow(2, attempt) + Math.random() * 1000;
          if (!silent) {
            console.debug(`${logContext}: Rate limited, retrying in ${Math.round(backoffDelay)}ms`);
          }
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          continue;
        } else {
          if (!silent) {
            console.debug(`${logContext}: Rate limit exceeded, returning fallback`);
          }
          return fallbackValue;
        }
      }
      
      // If this is an expected blockchain error, don't retry and fail gracefully
      if (isExpectedError(error)) {
        if (!silent) {
          console.debug(`${logContext}: Expected error (${error.code || 'Unknown'})`);
        }
        return fallbackValue;
      }
      
      // For unexpected errors, retry if we have attempts left
      if (attempt < maxRetries) {
        if (!silent) {
          console.warn(`${logContext}: Attempt ${attempt + 1} failed, retrying in ${retryDelay}ms`);
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      
      // Log unexpected errors
      if (!silent) {
        console.error(`${logContext}: Operation failed after ${maxRetries + 1} attempts:`, error);
      }
    }
  }
  
  return fallbackValue;
}

// Specialized wrapper for contract calls
export async function safeContractCall<T>(
  contractCall: () => Promise<T>,
  protocol: string,
  operation: string,
  address?: string,
  options: Omit<ErrorHandlingOptions, 'logContext'> = {}
): Promise<T | null> {
  return withErrorHandling(contractCall, {
    ...options,
    logContext: `${protocol}:${operation}${address ? `:${address}` : ''}`,
    silent: true, // Contract call errors are expected and should be silent
  });
}

// Batch multiple operations with individual error handling
export async function batchWithErrorHandling<T>(
  operations: Array<() => Promise<T>>,
  options: ErrorHandlingOptions = {}
): Promise<Array<T | null>> {
  const results = await Promise.allSettled(
    operations.map((op, index) => 
      withErrorHandling(op, { 
        ...options, 
        silent: options.silent ?? false, // Don't force silent mode
        logContext: options.logContext || `Operation ${index}`
      })
    )
  );
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      // The withErrorHandling function might return fallbackValue even on success
      // We need to distinguish between actual success and fallback
      const value = result.value;
      if (value === null && options.fallbackValue === null) {
        // This might be a legitimate null return or a fallback - can't distinguish
        console.debug(`Operation ${index}: fulfilled with null value`);
      }
      return value;
    } else {
      // This should rarely happen since withErrorHandling catches errors
      console.warn(`Operation ${index}: rejected with error:`, result.reason);
      return options.fallbackValue ?? null;
    }
  });
}

// Performance monitoring wrapper
export async function withPerformanceMonitoring<T>(
  operation: () => Promise<T>,
  operationName: string,
  warnThreshold = 1000
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    if (duration > warnThreshold) {
      console.warn(`${operationName} took ${duration}ms (threshold: ${warnThreshold}ms)`);
    } else {
      console.debug(`${operationName} completed in ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`${operationName} failed after ${duration}ms:`, error);
    throw error;
  }
}

// Circuit breaker pattern for failed protocols
export class ProtocolCircuitBreaker {
  private failureCount = new Map<string, number>();
  private lastFailureTime = new Map<string, number>();
  private readonly maxFailures: number;
  private readonly resetTimeMs: number;
  
  constructor(maxFailures = 5, resetTimeMs = 300000) { // 5 failures, 5 min reset
    this.maxFailures = maxFailures;
    this.resetTimeMs = resetTimeMs;
  }
  
  async execute<T>(
    protocolName: string,
    operation: () => Promise<T>,
    fallbackValue: T
  ): Promise<T> {
    if (this.isCircuitOpen(protocolName)) {
      console.debug(`Circuit breaker OPEN for ${protocolName}, returning fallback`);
      return fallbackValue;
    }
    
    try {
      console.debug(`Executing operation for ${protocolName}...`);
      const result = await operation();
      this.recordSuccess(protocolName);
      console.debug(`${protocolName} operation completed successfully. Result type:`, Array.isArray(result) ? `array[${result.length}]` : typeof result);
      return result;
    } catch (error) {
      console.warn(`${protocolName} operation failed:`, error.message || error);
      
      // Don't count rate limit errors as circuit breaker failures
      // They are temporary and should not trigger circuit breaker
      if (!isRateLimitError(error)) {
        this.recordFailure(protocolName);
      }
      
      if (isExpectedError(error) || isRateLimitError(error)) {
        console.debug(`${protocolName}: Using fallback value due to expected error`);
        return fallbackValue;
      }
      
      throw error;
    }
  }
  
  private isCircuitOpen(protocolName: string): boolean {
    const failures = this.failureCount.get(protocolName) || 0;
    const lastFailure = this.lastFailureTime.get(protocolName) || 0;
    
    if (failures < this.maxFailures) return false;
    
    // Check if reset time has passed
    if (Date.now() - lastFailure > this.resetTimeMs) {
      this.failureCount.set(protocolName, 0);
      return false;
    }
    
    return true;
  }
  
  private recordFailure(protocolName: string): void {
    const currentFailures = this.failureCount.get(protocolName) || 0;
    this.failureCount.set(protocolName, currentFailures + 1);
    this.lastFailureTime.set(protocolName, Date.now());
  }
  
  private recordSuccess(protocolName: string): void {
    this.failureCount.set(protocolName, 0);
  }
  
  // Method to manually reset circuit breaker for a protocol
  resetCircuitBreaker(protocolName: string): void {
    this.failureCount.set(protocolName, 0);
    this.lastFailureTime.delete(protocolName);
    console.log(`Circuit breaker reset for ${protocolName}`);
  }
  
  // Method to get circuit breaker status
  getCircuitBreakerStatus(protocolName: string): { isOpen: boolean, failures: number, lastFailure?: number } {
    return {
      isOpen: this.isCircuitOpen(protocolName),
      failures: this.failureCount.get(protocolName) || 0,
      lastFailure: this.lastFailureTime.get(protocolName)
    };
  }
}

export const globalCircuitBreaker = new ProtocolCircuitBreaker();

// Timeout wrapper for protocol operations
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 10000,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    operation()
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}