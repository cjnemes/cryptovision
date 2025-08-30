import { NextRequest, NextResponse } from 'next/server';
import { manualPositionsService } from '@/lib/manual-positions';

// GET /api/manual-positions - Get all manual positions or positions for a specific wallet
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (walletAddress) {
      // Get positions for a specific wallet
      const positions = manualPositionsService.getPositionsForWallet(walletAddress);
      return NextResponse.json({ positions });
    } else {
      // Get all positions
      const positions = manualPositionsService.getAllPositions();
      return NextResponse.json({ positions });
    }
  } catch (error) {
    console.error('Error fetching manual positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manual positions' },
      { status: 500 }
    );
  }
}

// POST /api/manual-positions - Create a new manual position
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['walletAddress', 'protocol', 'type', 'description', 'tokens'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate tokens array
    if (!Array.isArray(body.tokens) || body.tokens.length === 0) {
      return NextResponse.json(
        { error: 'At least one token is required' },
        { status: 400 }
      );
    }

    // Validate each token
    for (const token of body.tokens) {
      if (!token.symbol || !token.name || !token.amount) {
        return NextResponse.json(
          { error: 'Each token must have symbol, name, and amount' },
          { status: 400 }
        );
      }
    }

    const positionId = await manualPositionsService.addPosition({
      walletAddress: body.walletAddress,
      protocol: body.protocol,
      type: body.type,
      description: body.description,
      tokens: body.tokens,
      apy: body.apy || 0,
      claimableAmount: body.claimableAmount || '0',
      notes: body.notes || '',
      isActive: true,
    });

    return NextResponse.json({ 
      success: true, 
      id: positionId,
      message: 'Manual position created successfully' 
    });
  } catch (error) {
    console.error('Error creating manual position:', error);
    return NextResponse.json(
      { error: 'Failed to create manual position' },
      { status: 500 }
    );
  }
}

// PUT /api/manual-positions - Update a manual position
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Position ID is required' },
        { status: 400 }
      );
    }

    const updated = await manualPositionsService.updatePosition(body.id, body);
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Manual position updated successfully' 
    });
  } catch (error) {
    console.error('Error updating manual position:', error);
    return NextResponse.json(
      { error: 'Failed to update manual position' },
      { status: 500 }
    );
  }
}

// DELETE /api/manual-positions - Delete a manual position
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const positionId = searchParams.get('id');

    if (!positionId) {
      return NextResponse.json(
        { error: 'Position ID is required' },
        { status: 400 }
      );
    }

    const deleted = await manualPositionsService.removePosition(positionId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Manual position deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting manual position:', error);
    return NextResponse.json(
      { error: 'Failed to delete manual position' },
      { status: 500 }
    );
  }
}