import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { PnLData } from '@/lib/pnl-calculator';

async function fetchPnLData(address: string): Promise<PnLData> {
  const response = await fetch(`/api/pnl/${address}`);
  if (!response.ok) {
    throw new Error('Failed to fetch P&L data');
  }
  return response.json();
}

export function usePnLData() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['pnl', address],
    queryFn: () => fetchPnLData(address!),
    enabled: !!address,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
}