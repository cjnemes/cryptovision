import { NextRequest, NextResponse } from 'next/server';
import { manualPositionsService } from '@/lib/manual-positions';

// GET /api/manual-positions/templates - Get position templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const templateType = searchParams.get('type');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    let template;

    switch (templateType) {
      case 'gammaswap-staking':
        template = manualPositionsService.createGammaSwapStakingTemplate(walletAddress);
        break;
      case 'extra-finance-staking':
        template = manualPositionsService.createExtraFinanceStakingTemplate(walletAddress);
        break;
      default:
        // Return a generic template
        template = {
          walletAddress,
          protocol: 'Custom',
          type: 'staking',
          description: 'Custom DeFi Position',
          tokens: [{
            address: '',
            symbol: '',
            name: '',
            amount: '0',
            decimals: 18,
          }],
          apy: 0,
          claimableAmount: '0',
          notes: '',
          isActive: true,
        };
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}