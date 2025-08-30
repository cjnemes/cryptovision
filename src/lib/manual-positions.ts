import { ManualPosition, DeFiPosition, TokenBalance } from '@/types';
import { priceService } from './prices';

/**
 * Manual Positions Service
 * 
 * Allows users to manually add DeFi positions that aren't automatically detected,
 * similar to how Rotki handles manual balances. This is useful for:
 * - Staking positions in protocols without proper APIs
 * - Positions in new/unsupported protocols
 * - Positions that require manual tracking due to technical limitations
 */

export class ManualPositionsService {
  private positions: Map<string, ManualPosition> = new Map();
  private readonly STORAGE_KEY = 'cryptovision_manual_positions';

  constructor() {
    this.loadFromLocalStorage();
  }

  /**
   * Add a new manual position
   */
  async addPosition(position: Omit<ManualPosition, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = this.generateId();
    const now = Date.now();
    
    const manualPosition: ManualPosition = {
      ...position,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.positions.set(id, manualPosition);
    this.saveToLocalStorage();
    
    return id;
  }

  /**
   * Update an existing manual position
   */
  async updatePosition(id: string, updates: Partial<ManualPosition>): Promise<boolean> {
    const position = this.positions.get(id);
    if (!position) {
      return false;
    }

    const updatedPosition: ManualPosition = {
      ...position,
      ...updates,
      id, // Ensure ID doesn't change
      createdAt: position.createdAt, // Ensure createdAt doesn't change
      updatedAt: Date.now(),
    };

    this.positions.set(id, updatedPosition);
    this.saveToLocalStorage();
    
    return true;
  }

  /**
   * Remove a manual position
   */
  async removePosition(id: string): Promise<boolean> {
    const deleted = this.positions.delete(id);
    if (deleted) {
      this.saveToLocalStorage();
    }
    return deleted;
  }

  /**
   * Get all manual positions for a wallet
   */
  getPositionsForWallet(walletAddress: string): ManualPosition[] {
    return Array.from(this.positions.values())
      .filter(position => 
        position.walletAddress.toLowerCase() === walletAddress.toLowerCase() && 
        position.isActive
      );
  }

  /**
   * Get a specific manual position
   */
  getPosition(id: string): ManualPosition | undefined {
    return this.positions.get(id);
  }

  /**
   * Get all manual positions
   */
  getAllPositions(): ManualPosition[] {
    return Array.from(this.positions.values());
  }

  /**
   * Convert manual positions to DeFi positions with current prices
   */
  async convertToDeFiPositions(walletAddress: string): Promise<DeFiPosition[]> {
    const manualPositions = this.getPositionsForWallet(walletAddress);
    const defiPositions: DeFiPosition[] = [];

    for (const manualPos of manualPositions) {
      const tokens: TokenBalance[] = [];
      let totalValue = 0;
      let claimableValue = 0;

      // Convert tokens with current prices
      for (const token of manualPos.tokens) {
        const price = await priceService.getPrice(token.symbol) || 0;
        const amount = parseFloat(token.amount);
        const value = amount * price;
        totalValue += value;

        tokens.push({
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          balance: token.amount,
          decimals: token.decimals,
          price,
          value,
        });
      }

      // Calculate claimable value if specified
      if (manualPos.claimableAmount && manualPos.tokens.length > 0) {
        // Assume claimable is in the same token as the first token for simplicity
        const firstToken = manualPos.tokens[0];
        const price = await priceService.getPrice(firstToken.symbol) || 0;
        const claimableAmount = parseFloat(manualPos.claimableAmount);
        claimableValue = claimableAmount * price;
      }

      const defiPosition: DeFiPosition = {
        id: `manual-${manualPos.id}`,
        protocol: 'manual',
        type: manualPos.type,
        tokens,
        apy: manualPos.apy || 0,
        value: totalValue,
        claimable: claimableValue,
        metadata: {
          manualPositionId: manualPos.id,
          protocol: manualPos.protocol,
          description: manualPos.description,
          notes: manualPos.notes,
          isManualPosition: true,
          createdAt: manualPos.createdAt,
          updatedAt: manualPos.updatedAt,
        }
      };

      defiPositions.push(defiPosition);
    }

    return defiPositions;
  }

  /**
   * Create a GammaSwap staking position template
   */
  createGammaSwapStakingTemplate(walletAddress: string): Omit<ManualPosition, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      walletAddress,
      protocol: 'GammaSwap',
      type: 'staking',
      description: 'GammaSwap Staked GS Tokens',
      tokens: [{
        address: '0xc4d44c155f95fd4e94600d191a4a01bb571df7df', // GS token on Base
        symbol: 'GS',
        name: 'GammaSwap',
        amount: '0', // User will fill this in
        decimals: 18,
      }],
      apy: 0,
      claimableAmount: '0', // esGS rewards amount
      notes: 'Manually tracked GammaSwap staking position. Update amounts based on your staking dashboard.',
      isActive: true,
    };
  }

  /**
   * Generate a unique ID for manual positions
   */
  private generateId(): string {
    return `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save positions to localStorage (in a real app, this would be a database)
   */
  private saveToLocalStorage(): void {
    if (typeof window !== 'undefined') {
      const serialized = JSON.stringify(Array.from(this.positions.entries()));
      localStorage.setItem(this.STORAGE_KEY, serialized);
    }
  }

  /**
   * Load positions from localStorage
   */
  private loadFromLocalStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const entries = JSON.parse(stored);
          this.positions = new Map(entries);
        }
      } catch (error) {
        console.warn('Failed to load manual positions from localStorage:', error);
        this.positions = new Map();
      }
    }
  }

  /**
   * Export manual positions as JSON
   */
  exportPositions(): string {
    return JSON.stringify(Array.from(this.positions.values()), null, 2);
  }

  /**
   * Import manual positions from JSON
   */
  importPositions(jsonData: string): { success: boolean; imported: number; errors: string[] } {
    const errors: string[] = [];
    let imported = 0;

    try {
      const positions = JSON.parse(jsonData) as ManualPosition[];
      
      if (!Array.isArray(positions)) {
        throw new Error('Invalid format: expected array of positions');
      }

      for (const position of positions) {
        try {
          // Validate required fields
          if (!position.walletAddress || !position.protocol || !position.type || !position.tokens) {
            errors.push(`Invalid position: missing required fields`);
            continue;
          }

          // Generate new ID to avoid conflicts
          const id = this.generateId();
          const now = Date.now();
          
          const manualPosition: ManualPosition = {
            ...position,
            id,
            createdAt: now,
            updatedAt: now,
            isActive: true, // Ensure imported positions are active
          };

          this.positions.set(id, manualPosition);
          imported++;
        } catch (error) {
          errors.push(`Failed to import position: ${error.message}`);
        }
      }

      if (imported > 0) {
        this.saveToLocalStorage();
      }

      return { success: errors.length === 0, imported, errors };
    } catch (error) {
      return { success: false, imported: 0, errors: [`Failed to parse JSON: ${error.message}`] };
    }
  }
}

// Export singleton instance
export const manualPositionsService = new ManualPositionsService();