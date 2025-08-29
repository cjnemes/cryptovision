import { NextRequest, NextResponse } from 'next/server';
import { defiAggregator } from '@/lib/defi/aggregator';
import { isValidAddress, serializeBigInt } from '@/lib/utils';

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

    // Use real data if Alchemy API key is configured, otherwise use mock data
    const useMockData = !process.env.ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY === 'demo' || process.env.ALCHEMY_API_KEY === 'your_alchemy_api_key_here';

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

    // Serialize the response data to convert BigInt values to strings
    const responseData = serializeBigInt({
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

    return NextResponse.json(responseData);

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

    // Serialize the response data to convert BigInt values to strings
    const responseData = serializeBigInt({
      address,
      protocol: protocol || 'all',
      positions,
      count: positions.length,
      totalValue: positions.reduce((sum, pos) => sum + pos.value, 0),
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error in DeFi positions POST:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}