import { NextRequest, NextResponse } from 'next/server';
import { globalCircuitBreaker } from '@/lib/utils/error-handler';

export async function POST(request: NextRequest) {
  try {
    // Get current status
    const beforeReset = globalCircuitBreaker.getCircuitBreakerStatus('moonwell');
    
    // Reset circuit breaker for Moonwell
    globalCircuitBreaker.resetCircuitBreaker('moonwell');
    
    // Get status after reset
    const afterReset = globalCircuitBreaker.getCircuitBreakerStatus('moonwell');
    
    return NextResponse.json({
      success: true,
      beforeReset,
      afterReset,
      message: 'Moonwell circuit breaker has been reset'
    });
  } catch (error) {
    console.error('Error resetting Moonwell circuit breaker:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset circuit breaker'
      },
      { status: 500 }
    );
  }
}