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
    type: 'staking' as 'staking' | 'lending' | 'liquidity' | 'farming' | 'yield-farming' | 'token' | 'liquidity-pool',
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

  const calculateTotalValue = () => {
    return positions.reduce((total, position) => {
      const positionValue = position.tokens.reduce((tokenTotal, token) => {
        return tokenTotal + (Number(token.amount) * (token.price || 0));
      }, 0);
      return total + positionValue;
    }, 0);
  };

  const getPositionsByProtocol = () => {
    const protocolGroups = positions.reduce((groups, position) => {
      const protocol = position.protocol;
      if (!groups[protocol]) {
        groups[protocol] = [];
      }
      groups[protocol].push(position);
      return groups;
    }, {} as Record<string, ManualPosition[]>);
    
    return Object.entries(protocolGroups).map(([protocol, positions]) => ({
      protocol,
      count: positions.length,
      totalValue: positions.reduce((sum, pos) => {
        return sum + pos.tokens.reduce((tokenSum, token) => {
          return tokenSum + (Number(token.amount) * (token.price || 0));
        }, 0);
      }, 0)
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Manual DeFi Positions</h2>
          <p className="text-gray-600 mt-1">Track positions that can't be automatically detected</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => loadTemplate('gammaswap-staking')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
            disabled={loading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            GammaSwap Position
          </button>
          <button
            onClick={() => loadTemplate('extra-finance-staking')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
            disabled={loading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Extra Finance Position
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
            disabled={loading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Custom Position
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      {positions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
            <div className="text-sm font-medium text-blue-600 mb-1">Total Positions</div>
            <div className="text-2xl font-bold text-blue-900">{positions.length}</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
            <div className="text-sm font-medium text-green-600 mb-1">Total Value</div>
            <div className="text-2xl font-bold text-green-900">
              ${calculateTotalValue().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
            <div className="text-sm font-medium text-purple-600 mb-1">Protocols</div>
            <div className="text-2xl font-bold text-purple-900">{getPositionsByProtocol().length}</div>
          </div>
        </div>
      )}

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
        <div className="mb-8 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {formData.id ? 'Edit Position' : 'Add New Position'}
            </h3>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(false);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleAddPosition} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Protocol *
                </label>
                <input
                  type="text"
                  value={formData.protocol}
                  onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="e.g., GammaSwap, Aave, Compound"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Position Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="staking">🥩 Staking</option>
                  <option value="lending">🏦 Lending</option>
                  <option value="liquidity">💧 Liquidity Providing</option>
                  <option value="farming">🌾 Yield Farming</option>
                  <option value="yield-farming">🚜 Advanced Farming</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Position Description *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="e.g., Staked GS tokens on Base network"
                required
              />
            </div>

            {/* Token Information */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Token Information</h4>
                <div className="text-sm text-gray-500">Configure your position tokens</div>
              </div>
              
              {formData.tokens.map((token, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Token Symbol *
                    </label>
                    <input
                      type="text"
                      value={token.symbol}
                      onChange={(e) => {
                        const newTokens = [...formData.tokens];
                        newTokens[index].symbol = e.target.value.toUpperCase();
                        setFormData({ ...formData, tokens: newTokens });
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                      placeholder="GS"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Token Name *
                    </label>
                    <input
                      type="text"
                      value={token.name}
                      onChange={(e) => {
                        const newTokens = [...formData.tokens];
                        newTokens[index].name = e.target.value;
                        setFormData({ ...formData, tokens: newTokens });
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="GammaSwap Token"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount *
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                      placeholder="72,267.71"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contract Address
                      <span className="text-xs font-normal text-gray-500 ml-1">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={token.address}
                      onChange={(e) => {
                        const newTokens = [...formData.tokens];
                        newTokens[index].address = e.target.value;
                        setFormData({ ...formData, tokens: newTokens });
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                      placeholder="0x..."
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Annual Percentage Yield (APY)
                  <span className="text-xs font-normal text-gray-500 ml-1">%</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10000"
                  value={formData.apy}
                  onChange={(e) => setFormData({ ...formData, apy: Number(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                  placeholder="12.50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Claimable Rewards
                  <span className="text-xs font-normal text-gray-500 ml-1">(optional)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.claimableAmount}
                  onChange={(e) => setFormData({ ...formData, claimableAmount: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                  placeholder="401.85"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Notes
                <span className="text-xs font-normal text-gray-500 ml-1">(optional)</span>
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                rows={4}
                placeholder="e.g., Locked until December 2024, earning bonus rewards, etc."
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {formData.id ? 'Update Position' : 'Add Position'}
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Protocol Summary */}
      {positions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Positions by Protocol</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getPositionsByProtocol().map(({ protocol, count, totalValue }) => (
              <div key={protocol} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="font-semibold text-gray-900">{protocol}</div>
                <div className="text-sm text-gray-600">
                  {count} position{count !== 1 ? 's' : ''}
                </div>
                <div className="text-lg font-bold text-green-600">
                  ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positions List */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-6">All Positions</h3>
        <div className="space-y-6">
          {positions.length === 0 ? (
            <div className="p-12 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-xl">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-lg font-medium text-gray-900 mb-1">No manual positions yet</div>
              <div className="text-gray-500 mb-4">Track positions that can't be automatically detected</div>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Position
              </button>
            </div>
          ) : (
            positions.map((position) => {
              const positionValue = position.tokens.reduce((sum, token) => {
                return sum + (Number(token.amount) * (token.price || 0));
              }, 0);
              
              return (
                <div key={position.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {position.description}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {position.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="font-medium">{position.protocol}</span>
                          {position.apy && position.apy > 0 && (
                            <span className="text-green-600 font-medium">{position.apy}% APY</span>
                          )}
                          {positionValue > 0 && (
                            <span className="text-gray-900 font-semibold">
                              ${positionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditPosition(position)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit position"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeletePosition(position.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete position"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {position.tokens.map((token, index) => (
                        <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-bold text-lg text-gray-900">
                              {Number(token.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                            </div>
                            <div className="font-mono text-sm font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              {token.symbol}
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-700">{token.name}</div>
                          {token.price && (
                            <div className="text-sm text-gray-600 mt-1">
                              ${(Number(token.amount) * token.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                          {token.address && (
                            <div className="text-xs text-gray-500 font-mono mt-1 truncate" title={token.address}>
                              {token.address}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {(position.claimableAmount && Number(position.claimableAmount) > 0) && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span className="font-semibold text-green-800">
                            {Number(position.claimableAmount).toLocaleString()} available to claim
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {position.notes && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          <p className="text-blue-800 text-sm leading-relaxed">{position.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};