import { NextRequest, NextResponse } from 'next/server';
import { defiAggregator } from '@/lib/defi/aggregator';
import { isValidAddress } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // Validate address format
    if (!isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    // For development, return mock data. In production, use real API calls
    const useMockData = process.env.NODE_ENV === 'development' || !process.env.ALCHEMY_API_KEY;

    let positions;
    if (useMockData) {
      console.log('Using mock DeFi data for development');
      positions = await defiAggregator.getMockPositions(address);
    } else {
      positions = await defiAggregator.getAllPositions(address);
    }

    // Calculate summary statistics
    const totalValue = positions.reduce((sum, position) => sum + position.value, 0);
    const totalClaimable = positions.reduce((sum, position) => sum + (position.claimable || 0), 0);
    const averageAPY = positions.length > 0 
      ? positions.reduce((sum, position) => sum + position.apy, 0) / positions.length
      : 0;

    const protocolBreakdown = positions.reduce((acc, position) => {
      if (!acc[position.protocol]) {
        acc[position.protocol] = {
          count: 0,
          totalValue: 0,
          positions: []
        };
      }
      acc[position.protocol].count++;
      acc[position.protocol].totalValue += position.value;
      acc[position.protocol].positions.push(position);
      return acc;
    }, {} as any);

    return NextResponse.json({
      address,
      summary: {
        totalValue,
        totalClaimable,
        averageAPY,
        positionCount: positions.length,
        protocolCount: Object.keys(protocolBreakdown).length,
      },
      positions,
      protocolBreakdown,
      timestamp: new Date().toISOString(),
      ...(useMockData && { note: 'Using mock data for development' })
    });

  } catch (error) {
    console.error('Error fetching DeFi positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DeFi positions' },
      { status: 500 }
    );
  }
}

// Optional: Add support for specific protocol queries
export async function POST(request: NextRequest) {
  try {
    const { address, protocol } = await request.json();

    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Valid address is required' },
        { status: 400 }
      );
    }

    let positions;
    if (protocol) {
      positions = await defiAggregator.getPositionsByProtocol(address, protocol);
    } else {
      positions = await defiAggregator.getAllPositions(address);
    }

    return NextResponse.json({
      address,
      protocol: protocol || 'all',
      positions,
      count: positions.length,
      totalValue: positions.reduce((sum, pos) => sum + pos.value, 0),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in DeFi positions POST:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}