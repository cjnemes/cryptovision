'use client';

import React, { useState, useEffect } from 'react';
import { ManualPosition } from '@/types';

interface ManualPositionsProps {
  walletAddress?: string;
}

export const ManualPositions: React.FC<ManualPositionsProps> = ({ walletAddress }) => {
  const [positions, setPositions] = useState<ManualPosition[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for adding/editing positions
  const [formData, setFormData] = useState({
    id: '',
    walletAddress: walletAddress || '',
    protocol: '',
    type: 'staking' as const,
    description: '',
    tokens: [{
      address: '',
      symbol: '',
      name: '',
      amount: '',
      decimals: 18,
    }],
    apy: 0,
    claimableAmount: '',
    notes: '',
  });

  // Load positions on component mount
  useEffect(() => {
    if (walletAddress) {
      loadPositions();
    }
  }, [walletAddress]);

  const loadPositions = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/manual-positions?wallet=${walletAddress}`);
      const data = await response.json();
      
      if (response.ok) {
        setPositions(data.positions || []);
      } else {
        setError(data.error || 'Failed to load positions');
      }
    } catch (err) {
      setError('Failed to load positions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const method = formData.id ? 'PUT' : 'POST';
      const response = await fetch('/api/manual-positions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          walletAddress,
          apy: Number(formData.apy),
          isActive: true,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        await loadPositions(); // Reload positions
        resetForm();
        setShowAddForm(false);
      } else {
        setError(data.error || 'Failed to save position');
      }
    } catch (err) {
      setError('Failed to save position');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePosition = async (id: string) => {
    if (!confirm('Are you sure you want to delete this position?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/manual-positions?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadPositions(); // Reload positions
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete position');
      }
    } catch (err) {
      setError('Failed to delete position');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPosition = (position: ManualPosition) => {
    setFormData({
      id: position.id,
      walletAddress: position.walletAddress,
      protocol: position.protocol,
      type: position.type,
      description: position.description,
      tokens: position.tokens,
      apy: position.apy || 0,
      claimableAmount: position.claimableAmount || '',
      notes: position.notes || '',
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      id: '',
      walletAddress: walletAddress || '',
      protocol: '',
      type: 'staking',
      description: '',
      tokens: [{
        address: '',
        symbol: '',
        name: '',
        amount: '',
        decimals: 18,
      }],
      apy: 0,
      claimableAmount: '',
      notes: '',
    });
  };

  const loadTemplate = async (templateType: string) => {
    try {
      const response = await fetch(`/api/manual-positions/templates?wallet=${walletAddress}&type=${templateType}`);
      const data = await response.json();
      
      if (response.ok && data.template) {
        setFormData({
          ...data.template,
          id: '',
        });
        setShowAddForm(true);
      }
    } catch (err) {
      setError('Failed to load template');
    }
  };

  if (!walletAddress) {
    return (
      <div className="p-4 text-gray-600">
        Please connect a wallet to manage manual positions.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manual DeFi Positions</h2>
        <div className="flex gap-2">
          <button
            onClick={() => loadTemplate('gammaswap-staking')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            Add GammaSwap Position
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            disabled={loading}
          >
            Add Custom Position
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
          Loading...
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-8 p-6 bg-gray-50 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            {formData.id ? 'Edit Position' : 'Add New Position'}
          </h3>
          
          <form onSubmit={handleAddPosition} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Protocol
                </label>
                <input
                  type="text"
                  value={formData.protocol}
                  onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., GammaSwap"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="staking">Staking</option>
                  <option value="lending">Lending</option>
                  <option value="liquidity">Liquidity</option>
                  <option value="farming">Farming</option>
                  <option value="yield-farming">Yield Farming</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Staked GS tokens"
                required
              />
            </div>

            {/* Token Information */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Token Information</h4>
              
              {formData.tokens.map((token, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 mb-4 p-4 bg-white border rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Symbol
                    </label>
                    <input
                      type="text"
                      value={token.symbol}
                      onChange={(e) => {
                        const newTokens = [...formData.tokens];
                        newTokens[index].symbol = e.target.value;
                        setFormData({ ...formData, tokens: newTokens });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="GS"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={token.name}
                      onChange={(e) => {
                        const newTokens = [...formData.tokens];
                        newTokens[index].name = e.target.value;
                        setFormData({ ...formData, tokens: newTokens });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="GammaSwap"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={token.amount}
                      onChange={(e) => {
                        const newTokens = [...formData.tokens];
                        newTokens[index].amount = e.target.value;
                        setFormData({ ...formData, tokens: newTokens });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="72267.71"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contract Address
                    </label>
                    <input
                      type="text"
                      value={token.address}
                      onChange={(e) => {
                        const newTokens = [...formData.tokens];
                        newTokens[index].address = e.target.value;
                        setFormData({ ...formData, tokens: newTokens });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0x..."
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  APY (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.apy}
                  onChange={(e) => setFormData({ ...formData, apy: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Claimable Amount
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.claimableAmount}
                  onChange={(e) => setFormData({ ...formData, claimableAmount: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="401.85"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Additional notes about this position..."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (formData.id ? 'Update Position' : 'Add Position')}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Positions List */}
      <div className="space-y-4">
        {positions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            No manual positions found. Add one using the buttons above.
          </div>
        ) : (
          positions.map((position) => (
            <div key={position.id} className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {position.description}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {position.protocol} • {position.type}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditPosition(position)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePosition(position.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                {position.tokens.map((token, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">
                      {Number(token.amount).toLocaleString()} {token.symbol}
                    </div>
                    <div className="text-sm text-gray-600">{token.name}</div>
                  </div>
                ))}
              </div>
              
              {(position.apy && position.apy > 0) && (
                <div className="text-sm text-gray-600 mb-2">
                  APY: {position.apy}%
                </div>
              )}
              
              {position.claimableAmount && Number(position.claimableAmount) > 0 && (
                <div className="text-sm text-gray-600 mb-2">
                  Claimable: {Number(position.claimableAmount).toLocaleString()}
                </div>
              )}
              
              {position.notes && (
                <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                  {position.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};